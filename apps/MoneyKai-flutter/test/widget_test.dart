import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:moneykai/app/moneykai_app.dart';
import 'package:moneykai/core/diagnostics/local_error_report_repository.dart';

void main() {
  testWidgets('MoneyKai app shows splash and enters auth flow', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _pumpApp(tester);
    await tester.pumpAndSettle();

    expect(find.text('MoneyKai'), findsOneWidget);

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();

    expect(find.text('Local profile'), findsOneWidget);
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

  testWidgets('local profile rejects invalid email', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();

    await tester.tap(find.text('Continue'));
    await tester.pumpAndSettle();
    await tester.enterText(find.bySemanticsLabel('Name'), 'Akshay');
    await tester.enterText(find.bySemanticsLabel('Email'), '@');
    await tester.tap(find.text('Create local profile'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid email'), findsOneWidget);
    expect(find.text('Dashboard'), findsNothing);

    await tester.enterText(
      find.bySemanticsLabel('Email'),
      'akshay@ example.com',
    );
    await tester.tap(find.text('Create local profile'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid email'), findsOneWidget);
    expect(
      find.text('Could not save the local session. Try again.'),
      findsNothing,
    );
    expect(find.text('Dashboard'), findsNothing);
  });

  testWidgets('adds, edits, and deletes a local transaction', (tester) async {
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

    await tester.tap(find.byTooltip('Edit transaction'));
    await tester.pumpAndSettle();
    expect(find.text('Edit transaction'), findsOneWidget);

    await tester.enterText(find.bySemanticsLabel('Amount'), '625');
    await tester.enterText(
      find.bySemanticsLabel('Description'),
      'Monthly groceries',
    );
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.ensureVisible(find.text('Update transaction'));
    await tester.tap(find.text('Update transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Monthly groceries'), findsOneWidget);
    expect(find.text('Grocery run'), findsNothing);

    await tester.tap(find.byTooltip('Delete transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Monthly groceries'), findsNothing);
    expect(find.text('No local transactions yet'), findsOneWidget);
  });

  testWidgets('edits restored transaction with custom metadata', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'custom',
          'type': 'expense',
          'amount': 1200,
          'date': DateTime(2026, 6, 20).toIso8601String(),
          'category': 'Education',
          'paymentMethod': 'Wallet',
          'description': 'Course fee',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Edit transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Edit transaction'), findsOneWidget);
    expect(find.text('Education'), findsOneWidget);
    expect(find.text('Wallet'), findsOneWidget);

    await tester.enterText(
      find.bySemanticsLabel('Description'),
      'Course fee updated',
    );
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.ensureVisible(find.text('Update transaction'));
    await tester.tap(find.text('Update transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Course fee updated'), findsOneWidget);
  });

  testWidgets('opens date picker for restored transaction before 2020', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'old',
          'type': 'expense',
          'amount': 1200,
          'date': DateTime(2019, 1, 15).toIso8601String(),
          'category': 'Education',
          'paymentMethod': 'Wallet',
          'description': 'Old course fee',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Edit transaction'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('15 Jan 2019'));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.byType(DatePickerDialog), findsOneWidget);
  });

  testWidgets('opens date picker for restored future transaction', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'future',
          'type': 'income',
          'amount': 5000,
          'date': DateTime(2030, 1, 15).toIso8601String(),
          'category': 'Freelance',
          'paymentMethod': 'Bank transfer',
          'description': 'Future invoice',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();
    await tester.tap(find.byTooltip('Edit transaction'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('15 Jan 2030'));
    await tester.pumpAndSettle();

    expect(tester.takeException(), isNull);
    expect(find.byType(DatePickerDialog), findsOneWidget);
  });

  testWidgets('transaction form rejects non-finite numeric input', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Add transaction'));
    await tester.pumpAndSettle();

    await tester.enterText(find.bySemanticsLabel('Amount'), 'Infinity');
    await tester.enterText(find.bySemanticsLabel('Description'), 'Bad amount');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.ensureVisible(find.text('Save transaction'));
    await tester.tap(find.text('Save transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a valid amount'), findsOneWidget);
  });

  testWidgets('budget form rejects non-finite numeric input', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Budget'));
    await tester.pumpAndSettle();

    await tester.enterText(
      find.widgetWithText(TextField, 'Monthly limit'),
      'Infinity',
    );
    await tester.tap(find.byTooltip('Save Monthly limit'));
    await tester.pumpAndSettle();

    expect(find.text('Enter a budget greater than zero.'), findsOneWidget);
  });

  testWidgets('groups transactions by month and filters by category', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'salary',
          'type': 'income',
          'amount': 45000,
          'date': DateTime(2026, 6, 3).toIso8601String(),
          'category': 'Salary',
          'paymentMethod': 'Bank transfer',
          'description': 'Salary deposit',
        },
        {
          'id': 'groceries',
          'type': 'expense',
          'amount': 625,
          'date': DateTime(2026, 5, 20).toIso8601String(),
          'category': 'Food',
          'paymentMethod': 'UPI',
          'description': 'Grocery run',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();

    expect(find.text('June 2026'), findsOneWidget);
    expect(find.text('May 2026'), findsOneWidget);
    expect(find.text('Salary deposit'), findsOneWidget);
    expect(find.text('Grocery run'), findsOneWidget);

    await tester.tap(find.text('All categories'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Food').last);
    await tester.pumpAndSettle();

    expect(find.text('Grocery run'), findsOneWidget);
    expect(find.text('Salary deposit'), findsNothing);
    expect(find.text('May 2026'), findsOneWidget);
    expect(find.text('June 2026'), findsNothing);
  });

  testWidgets('category filter falls back after deleting last category match', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'food',
          'type': 'expense',
          'amount': 625,
          'date': DateTime(2026, 6, 20).toIso8601String(),
          'category': 'Food',
          'paymentMethod': 'UPI',
          'description': 'Lunch',
        },
        {
          'id': 'bills',
          'type': 'expense',
          'amount': 1200,
          'date': DateTime(2026, 6, 21).toIso8601String(),
          'category': 'Bills',
          'paymentMethod': 'Card',
          'description': 'Internet bill',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Transactions'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('All categories'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Food').last);
    await tester.pumpAndSettle();

    expect(find.text('Lunch'), findsOneWidget);
    expect(find.text('Internet bill'), findsNothing);

    await tester.tap(find.byTooltip('Delete transaction'));
    await tester.pumpAndSettle();

    expect(find.text('No matching transactions'), findsNothing);
    expect(find.text('Internet bill'), findsOneWidget);

    await tester.tap(find.text('Add transaction'));
    await tester.pumpAndSettle();
    await tester.enterText(find.bySemanticsLabel('Amount'), '350');
    await tester.enterText(find.bySemanticsLabel('Description'), 'Dinner');
    await tester.testTextInput.receiveAction(TextInputAction.done);
    await tester.pump();
    await tester.ensureVisible(find.text('Save transaction'));
    await tester.tap(find.text('Save transaction'));
    await tester.pumpAndSettle();

    expect(find.text('Dinner'), findsOneWidget);
    expect(find.text('Internet bill'), findsOneWidget);
  });

  testWidgets('dashboard shows category breakdown preview', (tester) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'food',
          'type': 'expense',
          'amount': 900,
          'date': DateTime(2026, 6, 8).toIso8601String(),
          'category': 'Food',
          'paymentMethod': 'UPI',
          'description': 'Dinner',
        },
        {
          'id': 'bills',
          'type': 'expense',
          'amount': 500,
          'date': DateTime(2026, 6, 7).toIso8601String(),
          'category': 'Bills',
          'paymentMethod': 'Card',
          'description': 'Internet bill',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    expect(find.text('Category breakdown'), findsOneWidget);
    expect(find.text('Food'), findsWidgets);
    expect(find.text('Bills'), findsWidgets);

    final viewInsightsButton = find.widgetWithText(
      OutlinedButton,
      'View insights',
    );
    await tester.drag(find.byType(ListView), const Offset(0, -600));
    await tester.pumpAndSettle();
    await tester.tap(viewInsightsButton);
    await tester.pumpAndSettle();

    expect(find.text('Insights'), findsWidgets);
    expect(find.text('Top spending categories'), findsOneWidget);
  });

  testWidgets('insights show savings rate and monthly trend', (tester) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'june-income',
          'type': 'income',
          'amount': 1000,
          'date': DateTime(2026, 6, 5).toIso8601String(),
          'category': 'Salary',
          'paymentMethod': 'Bank transfer',
          'description': 'June income',
        },
        {
          'id': 'june-food',
          'type': 'expense',
          'amount': 400,
          'date': DateTime(2026, 6, 6).toIso8601String(),
          'category': 'Food',
          'paymentMethod': 'UPI',
          'description': 'June food',
        },
        {
          'id': 'may-income',
          'type': 'income',
          'amount': 700,
          'date': DateTime(2026, 5, 5).toIso8601String(),
          'category': 'Salary',
          'paymentMethod': 'Bank transfer',
          'description': 'May income',
        },
        {
          'id': 'may-bills',
          'type': 'expense',
          'amount': 350,
          'date': DateTime(2026, 5, 6).toIso8601String(),
          'category': 'Bills',
          'paymentMethod': 'Card',
          'description': 'May bills',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Insights'));
    await tester.pumpAndSettle();

    expect(find.text('Savings rate'), findsOneWidget);
    expect(find.text('56%'), findsOneWidget);
    expect(find.text('Net savings'), findsOneWidget);
    expect(find.text('Monthly trend'), findsOneWidget);
    expect(find.text('Jun 2026'), findsOneWidget);
    expect(find.text('May 2026'), findsOneWidget);
    expect(find.text('Net Rs 600'), findsOneWidget);
    expect(find.text('Net Rs 350'), findsOneWidget);
  });

  testWidgets('budget shows category over-budget state', (tester) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      'moneykai.budget': jsonEncode({
        'monthlyLimit': 2000,
        'categoryLimits': {'Food': 600, 'Bills': 900},
      }),
      'moneykai.transactions': jsonEncode([
        {
          'id': 'food-overage',
          'type': 'expense',
          'amount': 750,
          'date': DateTime.now().toIso8601String(),
          'category': 'Food',
          'paymentMethod': 'UPI',
          'description': 'Groceries',
        },
        {
          'id': 'bills-under',
          'type': 'expense',
          'amount': 200,
          'date': DateTime.now().toIso8601String(),
          'category': 'Bills',
          'paymentMethod': 'Card',
          'description': 'Utilities',
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Budget'));
    await tester.pumpAndSettle();

    expect(find.text('Food'), findsOneWidget);
    expect(find.text('Over by Rs 150'), findsOneWidget);
    expect(find.text('Bills'), findsOneWidget);
    expect(find.text('Rs 200 used'), findsOneWidget);
  });

  testWidgets('settings persists theme preference', (tester) async {
    SharedPreferences.setMockInitialValues({});
    await _setViewport(tester, const Size(420, 900));
    await _enterDashboard(tester);

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    expect(find.text('Theme'), findsOneWidget);

    await tester.tap(find.text('Dark'));
    await tester.pumpAndSettle();

    final preferences = await SharedPreferences.getInstance();
    expect(preferences.getString('moneykai.themeMode'), 'dark');
    expect(find.text('Theme set to dark.'), findsOneWidget);
  });

  testWidgets('settings shows and clears local diagnostics', (tester) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      LocalErrorReportRepository.reportsKey: jsonEncode([
        {
          'id': 'diagnostic-1',
          'source': 'flutter',
          'errorType': 'StateError',
          'message': 'Bad state: test failure',
          'stackTrace': 'stack line 1\nstack line 2',
          'occurredAt': DateTime.utc(2026, 6, 29, 9, 45).toIso8601String(),
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Local diagnostics'));
    await tester.pumpAndSettle();

    expect(find.text('StateError'), findsOneWidget);
    expect(find.text('Bad state: test failure'), findsOneWidget);

    await tester.tap(find.text('Clear local diagnostics'));
    await tester.pumpAndSettle();

    final preferences = await SharedPreferences.getInstance();
    expect(
      preferences.getString(LocalErrorReportRepository.reportsKey),
      isNull,
    );
    expect(find.text('Local diagnostics cleared.'), findsOneWidget);
  });

  testWidgets('reset local data clears cached diagnostics view', (
    tester,
  ) async {
    SharedPreferences.setMockInitialValues({
      'moneykai.localSession': jsonEncode({
        'email': 'akshay@example.com',
        'displayName': 'Akshay',
      }),
      LocalErrorReportRepository.reportsKey: jsonEncode([
        {
          'id': 'diagnostic-1',
          'source': 'flutter',
          'errorType': 'StateError',
          'message': 'Bad state: stale failure',
          'stackTrace': 'stack line 1',
          'occurredAt': DateTime.utc(2026, 6, 29, 9, 45).toIso8601String(),
        },
      ]),
    });
    await _setViewport(tester, const Size(420, 900));
    await _pumpApp(tester);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Open dashboard'));
    await tester.pumpAndSettle();

    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Local diagnostics'));
    await tester.pumpAndSettle();
    expect(find.text('StateError'), findsOneWidget);

    await tester.tap(find.byTooltip('Close'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -520));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ListTile, 'Reset local data'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Reset'));
    await tester.pumpAndSettle();

    await tester.enterText(find.bySemanticsLabel('Name'), 'Priya');
    await tester.enterText(find.bySemanticsLabel('Email'), 'priya@example.com');
    await tester.tap(find.text('Create local profile'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Settings'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Local diagnostics'));
    await tester.pumpAndSettle();

    expect(find.text('No local error reports'), findsOneWidget);
    expect(find.text('StateError'), findsNothing);
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
    expect(exported['settings'], {'themeMode': 'system'});

    await tester.pump(const Duration(seconds: 4));
    await tester.drag(find.byType(ListView), const Offset(0, -520));
    await tester.pumpAndSettle();
    final resetTile = find.widgetWithText(ListTile, 'Reset local data');
    await tester.tap(resetTile);
    await tester.pumpAndSettle();
    expect(find.text('Reset local data?'), findsOneWidget);

    await tester.tap(find.text('Cancel'));
    await tester.pumpAndSettle();
    expect(find.text('Reset local data?'), findsNothing);

    await tester.tap(resetTile);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Reset'));
    await tester.pumpAndSettle();

    expect(find.text('Local profile'), findsOneWidget);
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
        'Local export copies a plaintext JSON snapshot of profile, transactions, budget, and theme settings to the clipboard. Encrypted backup creates and restores password-protected JSON files through device file flows. Local diagnostics stay on this device and can be cleared from Settings. Backend sync and real auth are future integration boundaries.',
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
  await tester.tap(find.text('Create local profile'));
  await tester.pumpAndSettle();
}

Future<void> _pumpApp(WidgetTester tester) async {
  await tester.pumpWidget(const ProviderScope(child: MoneyKaiApp()));
}
