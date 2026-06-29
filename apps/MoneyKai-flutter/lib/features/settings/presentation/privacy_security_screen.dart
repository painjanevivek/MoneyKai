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
            'Local export copies a plaintext JSON snapshot of profile, transactions, budget, and theme settings to the clipboard. Encrypted backup creates and restores password-protected JSON files through device file flows. Local diagnostics stay on this device and can be cleared from Settings. Backend sync and real auth are future integration boundaries.',
          ),
        ),
      ),
    );
  }
}
