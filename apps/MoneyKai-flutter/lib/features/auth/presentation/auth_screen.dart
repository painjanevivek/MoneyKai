import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../routing/app_routes.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';
import '../application/auth_controller.dart';

class AuthScreen extends ConsumerStatefulWidget {
  const AuthScreen({super.key});

  @override
  ConsumerState<AuthScreen> createState() => _AuthScreenState();
}

class _AuthScreenState extends ConsumerState<AuthScreen> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  final _displayNameController = TextEditingController();

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    _displayNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final authState = ref.watch(authControllerProvider);

    return ScreenScaffold(
      title: 'Local sign in',
      subtitle:
          'This Flutter MVP starts with a local session boundary. Backend auth will plug in behind this flow later.',
      body: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            TextFormField(
              controller: _displayNameController,
              decoration: const InputDecoration(labelText: 'Name'),
              textInputAction: TextInputAction.next,
              validator: (value) => _required(value, fieldName: 'Name'),
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _emailController,
              decoration: const InputDecoration(labelText: 'Email'),
              keyboardType: TextInputType.emailAddress,
              textInputAction: TextInputAction.next,
              validator: _emailValidator,
            ),
            const SizedBox(height: AppSpacing.md),
            TextFormField(
              controller: _passwordController,
              decoration: const InputDecoration(labelText: 'Local password'),
              obscureText: true,
              textInputAction: TextInputAction.done,
              validator: _passwordValidator,
            ),
            const SizedBox(height: AppSpacing.xl),
            FilledButton(
              onPressed: authState.isLoading ? null : _submit,
              child: authState.isLoading
                  ? const Text('Opening MoneyKai...')
                  : const Text('Enter MoneyKai'),
            ),
            if (authState.hasError) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                'Could not save the local session. Try again.',
                style: TextStyle(color: Theme.of(context).colorScheme.error),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String? _required(String? value, {required String fieldName}) {
    return value == null || value.trim().isEmpty
        ? '$fieldName is required'
        : null;
  }

  String? _emailValidator(String? value) {
    final requiredError = _required(value, fieldName: 'Email');
    if (requiredError != null) {
      return requiredError;
    }

    return value!.contains('@') ? null : 'Enter a valid email';
  }

  String? _passwordValidator(String? value) {
    final requiredError = _required(value, fieldName: 'Password');
    if (requiredError != null) {
      return requiredError;
    }

    return value!.length >= 4 ? null : 'Use at least 4 characters';
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    await ref
        .read(authControllerProvider.notifier)
        .signIn(
          email: _emailController.text,
          displayName: _displayNameController.text,
        );

    if (!mounted) {
      return;
    }

    final session = ref.read(authControllerProvider).asData?.value;
    if (session?.isAuthenticated ?? false) {
      context.go(AppRoutes.dashboard);
    }
  }
}
