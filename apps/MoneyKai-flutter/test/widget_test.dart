// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter/widgets.dart';
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
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Export local data'));
    await tester.pumpAndSettle();
    expect(find.text('Local data export is coming soon.'), findsOneWidget);

    await tester.tap(find.text('Reset local data'));
    await tester.pumpAndSettle();
    expect(find.text('Reset local data?'), findsOneWidget);

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('Reset local data?'), findsNothing);
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
