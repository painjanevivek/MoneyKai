import 'package:flutter_test/flutter_test.dart';
import 'package:moneykai/features/auth/domain/local_user.dart';

void main() {
  test('serializes a valid local user with trimmed fields', () {
    const user = LocalUser(
      email: '  akshay@example.com  ',
      displayName: '  Akshay  ',
    );

    expect(user.toJson(), {
      'email': 'akshay@example.com',
      'displayName': 'Akshay',
    });
  });

  test('rejects invalid fields during serialization', () {
    const invalidEmail = LocalUser(
      email: 'akshay@ example.com',
      displayName: 'Akshay',
    );
    const blankName = LocalUser(email: 'akshay@example.com', displayName: ' ');

    expect(invalidEmail.toJson, throwsA(isA<FormatException>()));
    expect(blankName.toJson, throwsA(isA<FormatException>()));
  });
}
