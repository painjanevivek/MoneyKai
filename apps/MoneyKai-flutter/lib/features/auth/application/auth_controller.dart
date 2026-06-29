import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/storage/local_storage_provider.dart';
import '../data/local_auth_repository.dart';
import '../domain/auth_session_state.dart';

final localAuthRepositoryProvider = FutureProvider<LocalAuthRepository>((
  ref,
) async {
  final storage = await ref.watch(localStorageServiceProvider.future);
  return LocalAuthRepository(storage);
});

final authControllerProvider =
    AsyncNotifierProvider<AuthController, AuthSessionState>(AuthController.new);

class AuthController extends AsyncNotifier<AuthSessionState> {
  @override
  Future<AuthSessionState> build() async {
    final repository = await ref.watch(localAuthRepositoryProvider.future);
    return repository.readSession();
  }

  Future<void> signIn({
    required String email,
    required String displayName,
  }) async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(localAuthRepositoryProvider.future);
      return repository.saveSession(
        email: email.trim(),
        displayName: displayName.trim(),
      );
    });
  }

  Future<void> signOut() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() async {
      final repository = await ref.read(localAuthRepositoryProvider.future);
      return repository.clearSession();
    });
  }
}
