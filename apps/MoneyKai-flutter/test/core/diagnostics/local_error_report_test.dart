import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/core/diagnostics/local_error_report.dart';

void main() {
  test('trims required fields before serializing local error reports', () {
    final report = LocalErrorReport(
      id: ' report-1 ',
      source: ' flutter ',
      errorType: ' StateError ',
      message: 'Bad state',
      stackTrace: 'stack',
      occurredAt: DateTime.utc(2026, 6, 29, 10),
    );

    final json = report.toJson();

    expect(json['id'], 'report-1');
    expect(json['source'], 'flutter');
    expect(json['errorType'], 'StateError');
  });

  test(
    'rejects blank required fields before serializing local error reports',
    () {
      final report = LocalErrorReport(
        id: 'report-1',
        source: ' ',
        errorType: 'StateError',
        message: 'Bad state',
        stackTrace: 'stack',
        occurredAt: DateTime.utc(2026, 6, 29, 10),
      );

      expect(report.toJson, throwsFormatException);
    },
  );
}
