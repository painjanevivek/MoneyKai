import 'dart:convert';

import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/diagnostics/local_error_report_repository.dart';
import 'package:moneykai/core/storage/local_storage_service.dart';
import 'package:shared_preferences/shared_preferences.dart';

void main() {
  test('records local errors newest first', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(
      storage,
      now: () => DateTime.utc(2026, 6, 29, 9, 30),
    );

    await repository.recordError(
      StateError('first failure'),
      StackTrace.fromString('first stack'),
      source: 'test',
    );
    final laterRepository = LocalErrorReportRepository(
      storage,
      now: () => DateTime.utc(2026, 6, 29, 9, 31),
    );
    await laterRepository.recordError(
      ArgumentError('second failure'),
      StackTrace.fromString('second stack'),
      source: 'test',
    );

    final reports = repository.readReports();

    expect(reports, hasLength(2));
    expect(reports.first.message, contains('second failure'));
    expect(reports.first.stackTrace, 'second stack');
    expect(reports.last.message, contains('first failure'));
    expect(reports.last.occurredAt, DateTime.utc(2026, 6, 29, 9, 30));
  });

  test('trims source before recording local errors', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(
      storage,
      now: () => DateTime.utc(2026, 6, 29, 9, 30),
    );

    await repository.recordError(
      StateError('failure'),
      StackTrace.fromString('stack'),
      source: ' test ',
    );

    final reports = repository.readReports();

    expect(reports, hasLength(1));
    expect(reports.single.source, 'test');
    expect(reports.single.id, '1782725400000000-test');
  });

  test('does not store local errors with blank sources', () async {
    SharedPreferences.setMockInitialValues({});
    final preferences = await SharedPreferences.getInstance();
    final storage = LocalStorageService(preferences);
    final repository = LocalErrorReportRepository(storage);

    await repository.recordError(
      StateError('failure'),
      StackTrace.fromString('stack'),
      source: ' ',
    );

    expect(repository.readReports(), isEmpty);
    expect(
      preferences.getString(LocalErrorReportRepository.reportsKey),
      isNull,
    );
  });

  test('keeps a bounded local error history', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());

    for (
      var index = 0;
      index < LocalErrorReportRepository.maxReports + 2;
      index++
    ) {
      final repository = LocalErrorReportRepository(
        storage,
        now: () => DateTime.utc(2026, 6, 29, 10, index),
      );
      await repository.recordError(
        StateError('failure $index'),
        StackTrace.fromString('stack $index'),
        source: 'test',
      );
    }

    final reports = LocalErrorReportRepository(storage).readReports();

    expect(reports, hasLength(LocalErrorReportRepository.maxReports));
    expect(reports.first.message, contains('failure 21'));
    expect(reports.last.message, contains('failure 2'));
  });

  test('caps oversized stored local error history on read', () async {
    SharedPreferences.setMockInitialValues({
      LocalErrorReportRepository.reportsKey: jsonEncode([
        for (
          var index = 0;
          index < LocalErrorReportRepository.maxReports + 2;
          index++
        )
          {
            'id': 'report-$index',
            'source': 'test',
            'errorType': 'StateError',
            'message': 'failure $index',
            'stackTrace': 'stack $index',
            'occurredAt': DateTime.utc(
              2026,
              6,
              29,
              10,
              index,
            ).toIso8601String(),
          },
      ]),
    });
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(storage);

    final reports = repository.readReports();

    expect(reports, hasLength(LocalErrorReportRepository.maxReports));
    expect(reports.first.id, 'report-0');
    expect(reports.last.id, 'report-19');
  });

  test('ignores malformed stored report payloads', () async {
    SharedPreferences.setMockInitialValues({
      LocalErrorReportRepository.reportsKey: '{not-json',
    });
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(storage);

    expect(repository.readReports(), isEmpty);
  });

  test('skips stored reports with blank required fields', () async {
    SharedPreferences.setMockInitialValues({
      LocalErrorReportRepository.reportsKey: jsonEncode([
        {
          'id': '',
          'source': 'test',
          'errorType': 'StateError',
          'message': 'blank id',
          'stackTrace': 'stack',
          'occurredAt': DateTime.utc(2026, 6, 29, 10).toIso8601String(),
        },
        {
          'id': 'valid',
          'source': 'test',
          'errorType': 'StateError',
          'message': 'valid report',
          'stackTrace': 'stack',
          'occurredAt': DateTime.utc(2026, 6, 29, 11).toIso8601String(),
        },
      ]),
    });
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(storage);

    final reports = repository.readReports();

    expect(reports, hasLength(1));
    expect(reports.single.id, 'valid');
  });

  test('clears recorded local errors', () async {
    SharedPreferences.setMockInitialValues({});
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(storage);

    await repository.recordError(
      StateError('failure'),
      StackTrace.fromString('stack'),
      source: 'test',
    );
    expect(repository.readReports(), hasLength(1));

    await repository.clearReports();

    expect(repository.readReports(), isEmpty);
  });
}
