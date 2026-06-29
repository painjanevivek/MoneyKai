import 'package:flutter/material.dart';

class ScreenScaffold extends StatelessWidget {
  const ScreenScaffold({
    required this.title,
    required this.body,
    this.subtitle,
    this.actions = const [],
    super.key,
  });

  final String title;
  final String? subtitle;
  final Widget body;
  final List<Widget> actions;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Scaffold(
      appBar: AppBar(actions: actions),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          Text(title, style: textTheme.headlineMedium),
          if (subtitle != null) ...[
            const SizedBox(height: 8),
            Text(subtitle!, style: textTheme.bodyLarge),
          ],
          const SizedBox(height: 24),
          body,
        ],
      ),
    );
  }
}
