import 'package:flutter/material.dart';

import '../../../shared/widgets/screen_scaffold.dart';

class PrivacySecurityScreen extends StatelessWidget {
  const PrivacySecurityScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return const ScreenScaffold(
      title: 'Privacy and security',
      subtitle:
          'The Flutter MVP stores data locally and does not request SMS, notification listener, contacts, or banking permissions.',
      body: Card(
        child: Padding(
          padding: EdgeInsets.all(20),
          child: Text(
            'Local export copies a plaintext JSON snapshot to the clipboard. Encrypted backup creates a password-protected JSON file through the device share sheet. Backend sync, real auth, and restore/import are future integration boundaries.',
          ),
        ),
      ),
    );
  }
}
