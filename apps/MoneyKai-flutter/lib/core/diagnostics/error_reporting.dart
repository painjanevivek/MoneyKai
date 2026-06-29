import 'dart:async';

import 'package:flutter/foundation.dart';

import 'local_error_report_repository.dart';

void configureLocalErrorReporting(LocalErrorReportRepository repository) {
  FlutterError.onError = (details) {
    FlutterError.presentError(details);
    unawaited(repository.recordFlutterError(details));
  };

  PlatformDispatcher.instance.onError = (error, stackTrace) {
    unawaited(
      repository.recordError(error, stackTrace, source: 'platform-dispatcher'),
    );
    return false;
  };
}
