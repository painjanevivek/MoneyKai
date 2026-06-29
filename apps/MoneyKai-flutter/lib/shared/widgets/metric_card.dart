import 'package:flutter/material.dart';

class MetricCard extends StatelessWidget {
  const MetricCard({
    required this.label,
    required this.value,
    this.icon,
    super.key,
  });

  final String label;
  final String value;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;
    final colorScheme = Theme.of(context).colorScheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (icon != null) Icon(icon, color: colorScheme.primary),
            if (icon != null) const SizedBox(height: 12),
            Text(label, style: textTheme.labelLarge),
            const SizedBox(height: 8),
            Text(value, style: textTheme.headlineSmall),
          ],
        ),
      ),
    );
  }
}
