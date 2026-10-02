package com.moneykai.nativecapture

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.AtomicFile
import android.util.Base64
import java.io.File
import java.security.KeyStore
import java.security.MessageDigest
import javax.crypto.Cipher
import javax.crypto.KeyGenerator
import javax.crypto.SecretKey
import javax.crypto.spec.GCMParameterSpec

/** Device-only authenticated encryption. No exported key or plaintext fallback. */
internal object MoneyKaiPrivateStorage {
  private const val ALIAS = "moneykai.private-storage.v1"
  private const val PREFIX = "v1"

  private fun key(create: Boolean = true): SecretKey {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    if (store.containsAlias(ALIAS)) return store.getKey(ALIAS, null) as SecretKey
    check(create) { "Existing device key is unavailable" }
    val generator = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore")
    generator.init(KeyGenParameterSpec.Builder(ALIAS, KeyProperties.PURPOSE_ENCRYPT or KeyProperties.PURPOSE_DECRYPT)
      .setKeySize(256)
      .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
      .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
      .setRandomizedEncryptionRequired(true)
      .build())
    return generator.generateKey()
  }

  private fun file(context: Context, name: String): AtomicFile {
    require(name.startsWith("moneykai-") && name.length <= 128)
    val digest = MessageDigest.getInstance("SHA-256").digest(name.toByteArray(Charsets.UTF_8))
      .joinToString("") { "%02x".format(it) }
    val directory = File(context.noBackupFilesDir, "private-state-v1")
    check(directory.isDirectory || directory.mkdirs())
    return AtomicFile(File(directory, digest))
  }

  @Synchronized fun get(context: Context, name: String): String? {
    val file = file(context, name)
    val raw = try { file.readFully().toString(Charsets.UTF_8) } catch (error: java.io.FileNotFoundException) {
      if (!file.baseFile.exists()) return null
      throw error
    }
    val parts = raw.split('.')
    require(parts.size == 3 && parts[0] == PREFIX)
    val iv = Base64.decode(parts[1], Base64.NO_WRAP)
    require(iv.size == 12)
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.DECRYPT_MODE, key(create = false), GCMParameterSpec(128, iv))
    cipher.updateAAD(name.toByteArray(Charsets.UTF_8))
    return cipher.doFinal(Base64.decode(parts[2], Base64.NO_WRAP)).toString(Charsets.UTF_8)
  }

  @Synchronized fun set(context: Context, name: String, value: String) {
    val cipher = Cipher.getInstance("AES/GCM/NoPadding")
    cipher.init(Cipher.ENCRYPT_MODE, key())
    cipher.updateAAD(name.toByteArray(Charsets.UTF_8))
    val ciphertext = cipher.doFinal(value.toByteArray(Charsets.UTF_8))
    val raw = "$PREFIX.${Base64.encodeToString(cipher.iv, Base64.NO_WRAP)}.${Base64.encodeToString(ciphertext, Base64.NO_WRAP)}"
    val file = file(context, name)
    val stream = file.startWrite()
    try {
      stream.write(raw.toByteArray(Charsets.UTF_8))
      file.finishWrite(stream)
    } catch (error: Exception) {
      file.failWrite(stream)
      throw error
    }
  }

  @Synchronized fun remove(context: Context, name: String) { file(context, name).delete() }
}
