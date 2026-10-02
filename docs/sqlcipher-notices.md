# Encrypted ledger dependencies

MoneyKai uses SQLCipher Community Edition for Android (`net.zetetic:sqlcipher-android:4.19.1`) and AndroidX SQLite (`2.7.0`). No commercial edition or subscription is used. SQLCipher for Android is licensed under the BSD-style license distributed in its AAR; AndroidX is Apache 2.0. Preserve the bundled third-party notices when distributing the application.

Source and license: https://github.com/sqlcipher/sqlcipher-android/blob/master/LICENSE

The ledger is stored in Android's no-backup directory. A random 256-bit key is encrypted using the existing Android Keystore wrapper. Missing keys and unreadable legacy ciphertext stop migration; no plaintext database or replacement key is used for an existing database. Legacy ciphertext remains available after verified migration.
