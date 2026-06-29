import 'dart:convert';
import 'dart:math';

import 'package:cryptography/cryptography.dart';

import 'local_data_export_service.dart';

class EncryptedBackupPackage {
  const EncryptedBackupPackage({
    required this.fileName,
    required this.content,
    required this.exportedAt,
  });

  final String fileName;
  final String content;
  final DateTime exportedAt;
}

class EncryptedBackupService {
  EncryptedBackupService({
    required this.exportService,
    DateTime Function()? now,
    List<int> Function(int length)? randomBytes,
  }) : _now = now ?? DateTime.now,
       _randomBytes = randomBytes ?? _secureRandomBytes;

  final LocalDataExportService exportService;
  final DateTime Function() _now;
  final List<int> Function(int length) _randomBytes;

  static const backupFormatVersion = 1;
  static const minimumPasswordLength = 8;
  static const kdfIterations = 210000;
  static const saltLength = 16;
  static const nonceLength = 12;
  static const macLength = 16;

  static final _cipher = AesGcm.with256bits();
  static final _kdf = Pbkdf2(
    macAlgorithm: Hmac.sha256(),
    iterations: kdfIterations,
    bits: 256,
  );

  Future<EncryptedBackupPackage> buildEncryptedBackup({
    required String password,
  }) async {
    final trimmedPassword = password.trim();
    if (trimmedPassword.length < minimumPasswordLength) {
      throw const FormatException(
        'Backup password must be at least 8 characters.',
      );
    }

    final exportedAt = _now().toUtc();
    final salt = _randomBytes(16);
    final nonce = _randomBytes(12);
    final secretKey = await _deriveKey(trimmedPassword, salt);
    final secretBox = await _cipher.encrypt(
      utf8.encode(exportService.buildExportJson()),
      secretKey: secretKey,
      nonce: nonce,
    );

    final payload = {
      'formatVersion': backupFormatVersion,
      'kind': 'moneykai-encrypted-backup',
      'exportedAt': exportedAt.toIso8601String(),
      'encryption': {
        'algorithm': 'AES-256-GCM',
        'kdf': 'PBKDF2-HMAC-SHA256',
        'iterations': kdfIterations,
        'salt': base64Encode(salt),
        'nonce': base64Encode(secretBox.nonce),
        'mac': base64Encode(secretBox.mac.bytes),
      },
      'payload': base64Encode(secretBox.cipherText),
    };

    return EncryptedBackupPackage(
      fileName: 'moneykai-encrypted-backup-${_timestamp(exportedAt)}.json',
      content: const JsonEncoder.withIndent('  ').convert(payload),
      exportedAt: exportedAt,
    );
  }

  Future<String> decryptBackup({
    required String backupJson,
    required String password,
  }) async {
    final decoded = jsonDecode(backupJson);
    if (decoded is! Map<String, Object?> ||
        decoded['kind'] != 'moneykai-encrypted-backup') {
      throw const FormatException('Unsupported MoneyKai backup payload.');
    }

    final encryption = decoded['encryption'];
    final payload = decoded['payload'];
    if (encryption is! Map<String, Object?> || payload is! String) {
      throw const FormatException('Malformed MoneyKai backup payload.');
    }

    _validateBackupMetadata(decoded, encryption);

    final salt = _readBase64Field(encryption, 'salt', length: saltLength);
    final nonce = _readBase64Field(encryption, 'nonce', length: nonceLength);
    final mac = _readBase64Field(encryption, 'mac', length: macLength);
    final cipherText = _decodeBase64(payload);
    final secretKey = await _deriveKey(password.trim(), salt);
    final clearBytes = await _cipher.decrypt(
      SecretBox(cipherText, nonce: nonce, mac: Mac(mac)),
      secretKey: secretKey,
    );

    return utf8.decode(clearBytes);
  }

  static void _validateBackupMetadata(
    Map<String, Object?> root,
    Map<String, Object?> encryption,
  ) {
    if (root['formatVersion'] != backupFormatVersion ||
        encryption['algorithm'] != 'AES-256-GCM' ||
        encryption['kdf'] != 'PBKDF2-HMAC-SHA256' ||
        encryption['iterations'] != kdfIterations) {
      throw const FormatException('Unsupported MoneyKai backup payload.');
    }
  }

  Future<SecretKey> _deriveKey(String password, List<int> salt) {
    return _kdf.deriveKey(
      secretKey: SecretKey(utf8.encode(password)),
      nonce: salt,
    );
  }

  static List<int> _readBase64Field(
    Map<String, Object?> json,
    String key, {
    required int length,
  }) {
    final value = json[key];
    if (value is! String) {
      throw const FormatException('Malformed MoneyKai backup payload.');
    }

    final decoded = _decodeBase64(value);
    if (decoded.length != length) {
      throw const FormatException('Malformed MoneyKai backup payload.');
    }

    return decoded;
  }

  static List<int> _decodeBase64(String value) {
    try {
      return base64Decode(value);
    } on FormatException {
      throw const FormatException('Malformed MoneyKai backup payload.');
    }
  }

  static List<int> _secureRandomBytes(int length) {
    final random = Random.secure();
    return List<int>.generate(length, (_) => random.nextInt(256));
  }

  static String _timestamp(DateTime dateTime) {
    return dateTime
        .toUtc()
        .toIso8601String()
        .replaceAll('-', '')
        .replaceAll(':', '')
        .replaceAll('.000', '');
  }
}
