// This is a basic Flutter widget test.
//
// To perform an interaction with a widget in your test, use the WidgetTester
// utility in the flutter_test package. For example, you can send tap and scroll
// gestures. You can also use WidgetTester to find child widgets in the widget
// tree, read text, and verify that the values of widget properties are correct.

import 'package:flutter_test/flutter_test.dart';

import 'package:moneykai/app/moneykai_app.dart';

void main() {
  testWidgets('MoneyKai app shows splash and enters auth flow', (tester) async {
    await tester.pumpWidget(const MoneyKaiApp());

    expect(find.text('MoneyKai'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Local sign in'), findsOneWidget);
  });
}
