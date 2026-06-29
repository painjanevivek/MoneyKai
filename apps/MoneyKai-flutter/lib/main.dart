import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app/moneykai_app.dart';
import 'core/diagnostics/error_reporting.dart';
import 'core/diagnostics/local_error_report_repository.dart';
import 'core/storage/local_storage_service.dart';

void main() {
  LocalErrorReportRepository? errorRepository;

  runZonedGuarded(
    () async {
      WidgetsFlutterBinding.ensureInitialized();
      final storage = await LocalStorageService.create();
      final repository = LocalErrorReportRepository(storage);
      errorRepository = repository;
      configureLocalErrorReporting(repository);

      runApp(const ProviderScope(child: MoneyKaiApp()));
    },
    (error, stackTrace) {
      unawaited(
        errorRepository?.recordError(error, stackTrace, source: 'root-zone') ??
            Future<void>.value(),
      );
    },
  );
}
