import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';

import '../../../core/diagnostics/local_error_report.dart';
import '../../../core/diagnostics/local_error_report_provider.dart';
import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/screen_scaffold.dart';
import '../../../theme/app_tokens.dart';

class LocalDiagnosticsScreen extends ConsumerWidget {
  LocalDiagnosticsScreen({super.key});

  final DateFormat _dateFormat = DateFormat('dd MMM yyyy, HH:mm');

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final reports = ref.watch(localErrorReportsProvider);

    return ScreenScaffold(
      title: 'Local diagnostics',
      subtitle:
          'Review recent on-device app errors. Reports are not sent to a remote dashboard.',
      actions: [
        IconButton(
          tooltip: 'Close',
          onPressed: () => Navigator.of(context).pop(),
          icon: const Icon(Icons.close),
        ),
      ],
      body: reports.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => EmptyState(
          title: 'Diagnostics unavailable',
          body: 'Local error reports could not be loaded.',
          icon: Icons.error_outline,
          action: OutlinedButton(
            onPressed: () => ref.invalidate(localErrorReportsProvider),
            child: const Text('Retry'),
          ),
        ),
        data: (items) {
          if (items.isEmpty) {
            return const EmptyState(
              title: 'No local error reports',
              body: 'MoneyKai has not captured any recent local app failures.',
              icon: Icons.check_circle_outline,
            );
          }

          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              for (final report in items) ...[
                _ErrorReportCard(report: report, dateFormat: _dateFormat),
                const SizedBox(height: AppSpacing.md),
              ],
              OutlinedButton.icon(
                onPressed: () => _clearReports(context, ref),
                icon: const Icon(Icons.delete_outline),
                label: const Text('Clear local diagnostics'),
              ),
            ],
          );
        },
      ),
    );
  }

  Future<void> _clearReports(BuildContext context, WidgetRef ref) async {
    final repository = await ref.read(
      localErrorReportRepositoryProvider.future,
    );
    await repository.clearReports();
    ref.invalidate(localErrorReportsProvider);

    if (context.mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Local diagnostics cleared.')),
      );
    }
  }
}

class _ErrorReportCard extends StatelessWidget {
  const _ErrorReportCard({required this.report, required this.dateFormat});

  final LocalErrorReport report;
  final DateFormat dateFormat;

  @override
  Widget build(BuildContext context) {
    final textTheme = Theme.of(context).textTheme;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(report.errorType, style: textTheme.titleMedium),
            const SizedBox(height: AppSpacing.xs),
            Text(
              '${report.source} - ${dateFormat.format(report.occurredAt.toLocal())}',
              style: textTheme.bodySmall,
            ),
            const SizedBox(height: AppSpacing.md),
            Text(report.message),
            if (report.stackTrace.isNotEmpty) ...[
              const SizedBox(height: AppSpacing.md),
              Text(
                report.stackTrace,
                maxLines: 4,
                overflow: TextOverflow.ellipsis,
                style: textTheme.bodySmall,
              ),
            ],
          ],
        ),
      ),
    );
  }
}
