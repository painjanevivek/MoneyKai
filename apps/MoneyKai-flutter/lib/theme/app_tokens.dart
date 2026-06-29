import 'package:flutter/widgets.dart';

class AppSpacing {
  const AppSpacing._();

  static const xs = 4.0;
  static const sm = 8.0;
  static const md = 12.0;
  static const lg = 16.0;
  static const xl = 20.0;
  static const xxl = 24.0;
  static const screen = 20.0;
}

class AppRadii {
  const AppRadii._();

  static const sm = 8.0;
  static const md = 12.0;
}

class AppBreakpoints {
  const AppBreakpoints._();

  static const compact = 360.0;
  static const tablet = 600.0;
  static const maxContentWidth = 760.0;
}

class AppInsets {
  const AppInsets._();

  static const screen = EdgeInsets.fromLTRB(
    AppSpacing.screen,
    AppSpacing.sm,
    AppSpacing.screen,
    AppSpacing.xxl,
  );
}
