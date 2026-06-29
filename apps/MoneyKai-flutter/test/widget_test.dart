import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:moneykai/app/moneykai_app.dart';

void main() {
  testWidgets('MoneyKai app shows splash and enters auth flow', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _pumpApp(tester);
    await tester.pumpAndSettle();

    expect(find.text('MoneyKai'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Local sign in'), findsOneWidget);
  });

  testWidgets('MoneyKai shell renders on a compact Android viewport', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(320, 700));
    await _enterDashboard(tester);

    expect(find.text('Dashboard'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('MoneyKai shell renders on a larger iOS-style viewport', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(834, 1112));
    await _enterDashboard(tester);

    expect(find.text('Dashboard'), findsWidgets);
    expect(tester.takeException(), isNull);
  });

  testWidgets('adds and deletes a local transaction', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add transaction'));
    await tester.pumpAndSettle();

    await tester.enterText(find.bySemanticsLabel('Amount'), '499');
    await tester.enterText(find.bySemanticsLabel('Description'), 'Grocery run');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.ensureVisible(find.text('Save transaction'));
    await tester.tap(find.text('Save transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Grocery run'), findsOneWidget);

    await tester.tap(find.byTooltip('Delete transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Grocery run'), findsNothing);
    expect(find.text('No local transactions yet'), findsOneWidget);
  });

  testWidgets('settings export and reset actions respond', (tester) async {
    SharedPreferences.setMockInitialValues({});
    String? exportedText;
    tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
      SystemChannels.platform,
      (call) async {
        if (call.method == 'Clipboard.setData') {
          exportedText =
              (call.arguments as Map<Object?, Object?>)['text'] as String?;
        }
        return null;
      },
    );
    addTearDown(
      () => tester.binding.defaultBinaryMessenger.setMockMethodCallHandler(
        SystemChannels.platform,
        null,
      ),
    );

    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Restore encrypted backup'), findsOneWidget);

    await tester.tap(find.text('Export local data'));
    await tester.pumpAndSettle();
    expect(find.text('Local data copied to clipboard.'), findsOneWidget);
    final exported = jsonDecode(exportedText!) as Map<String, Object?>;
    expect(exported['source'], 'moneykai-local-device');
    expect(exported['user'], {
      'email': 'akshay@example.com',
      'displayName': 'Akshay',
    });

    await tester.ensureVisible(find.text('Reset local data'));
    await tester.tap(find.text('Reset local data'));
    await tester.pumpAndSettle();
    expect(find.text('Reset local data?'), findsOneWidget);

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('Reset local data?'), findsNothing);

    await tester.tap(find.text('Reset local data'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Reset'));
    await tester.pumpAndSettle();

    expect(find.text('Local sign in'), findsOneWidget);
  });

  testWidgets('encrypted backup requires a strong password', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Create encrypted backup'));
    await tester.pumpAndSettle();

    await tester.enterText(find.bySemanticsLabel('Backup password'), 'short');
    await tester.tap(find.widgetWithText(FilledButton, 'Create'));
    await tester.pumpAndSettle();

    expect(
      find.text('Backup password must be at least 8 characters.'),
      findsOneWidget,
    );
  });

  testWidgets('privacy screen explains local export boundary', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Privacy and security'));
    await tester.pumpAndSettle();

    expect(
      find.text(
        'Local export copies a plaintext JSON snapshot to the clipboard. Encrypted backup creates and restores password-protected JSON files through device file flows. Backend sync and real auth are future integration boundaries.',
      ),
      findsOneWidget,
    );
  });
}

Future<void> _setViewport(WidgetTester tester, Size size) async {
  tester.view.devicePixelRatio = 1;
  tester.view.physicalSize = size;
  addTearDown(tester.view.resetPhysicalSize);
  addTearDown(tester.view.resetDevicePixelRatio);
}

Future<void> _enterDashboard(WidgetTester tester) async {
  await _pumpApp(tester);
  await tester.pumpAndSettle();
  await tester.tap(find.text('Continue'));
  await tester.pumpAndSettle();
  await tester.enterText(find.bySemanticsLabel('Name'), 'Akshay');
  await tester.enterText(find.bySemanticsLabel('Email'), 'akshay@example.com');
  await tester.enterText(find.bySemanticsLabel('Local password'), 'test1234');
  await tester.tap(find.text('Enter MoneyKai'));
  await tester.pumpAndSettle();
}

Future<void> _pumpApp(WidgetTester tester) async {
  await tester.pumpWidget(const ProviderScope(child: MoneyKaiApp()));
}
