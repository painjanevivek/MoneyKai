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
            'Backend sync, real auth, export, and encrypted backup are future integration boundaries.',
          ),
        ),
      ),
    );
  }
}
