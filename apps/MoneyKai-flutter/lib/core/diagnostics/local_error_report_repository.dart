import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../storage/local_storage_service.dart';
import 'local_error_report.dart';

class LocalErrorReportRepository {
  LocalErrorReportRepository(this._storage, {DateTime Function()? now})
    : _now = now ?? DateTime.now;

  final LocalStorageService _storage;
  final DateTime Function() _now;

  static const reportsKey = 'moneykai.errorReports';
  static const maxReports = 20;

  List<LocalErrorReport> readReports() {
    final rawReports = _storage.readString(reportsKey);
    if (rawReports == null) {
      return const [];
    }

    try {
      final decoded = jsonDecode(rawReports);
      if (decoded is! List<Object?>) {
        return const [];
      }

      final reports = <LocalErrorReport>[];
      for (final item in decoded) {
        if (item is! Map<String, Object?>) {
          continue;
        }

        final report = LocalErrorReport.fromJson(item);
        if (report != null) {
          reports.add(report);
          if (reports.length == maxReports) {
            break;
          }
        }
      }
      return reports;
    } catch (_) {
      return const [];
    }
  }

  Future<void> recordFlutterError(FlutterErrorDetails details) {
    return recordError(
      details.exception,
      details.stack,
      source: details.library ?? 'flutter',
    );
  }

  Future<void> recordError(
    Object error,
    StackTrace? stackTrace, {
    required String source,
  }) async {
    try {
      final occurredAt = _now().toUtc();
      final trimmedSource = source.trim();
      if (trimmedSource.isEmpty) {
        throw const FormatException('Local error source cannot be blank.');
      }
      final report = LocalErrorReport(
        id: '${occurredAt.microsecondsSinceEpoch}-$trimmedSource',
        source: trimmedSource,
        errorType: error.runtimeType.toString(),
        message: error.toString(),
        stackTrace: stackTrace?.toString() ?? '',
        occurredAt: occurredAt,
      );
      final reports = [report, ...readReports()].take(maxReports).toList();
      await _writeReports(reports);
    } catch (_) {
      // Error reporting must never make the original failure worse.
    }
  }

  Future<void> clearReports() => _storage.remove(reportsKey);

  Future<void> _writeReports(List<LocalErrorReport> reports) {
    return _storage.writeString(
      reportsKey,
      jsonEncode([for (final report in reports) report.toJson()]),
    );
  }
}
