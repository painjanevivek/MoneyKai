import 'package:intl/intl.dart';

import '../constants/app_constants.dart';

class MoneyFormatter {
  MoneyFormatter()
    : _formatter = NumberFormat.currency(
        locale: 'en_IN',
        name: AppConstants.currencyCode,
        symbol: 'Rs ',
        decimalDigits: 0,
      );

  final NumberFormat _formatter;

  String format(num amount) => _formatter.format(amount);
}
