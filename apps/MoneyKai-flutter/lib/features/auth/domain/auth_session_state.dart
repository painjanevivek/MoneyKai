import 'local_user.dart';

class AuthSessionState {
  const AuthSessionState({this.user});

  final LocalUser? user;

  bool get isAuthenticated => user != null;
}
