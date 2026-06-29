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

  test('ignores malformed stored report payloads', () async {
    SharedPreferences.setMockInitialValues({
      LocalErrorReportRepository.reportsKey: '{not-json',
    });
    final storage = LocalStorageService(await SharedPreferences.getInstance());
    final repository = LocalErrorReportRepository(storage);

    expect(repository.readReports(), isEmpty);
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
