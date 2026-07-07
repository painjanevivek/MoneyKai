import React, { useMemo, useRef, useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { AIInsights } from '@/components/dashboard/AIInsights';
import { getCategoryById } from '@/constants/categories';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/dateUtils';
import {
  isLikelyDuplicate,
  processStatementFile,
  summarizeStatementDrafts,
  type StatementDraftTransaction,
  type StatementImportResult,
} from '@/services/statementImportService';

const ACCEPTED_FILE_TYPES = '.pdf,.doc,.docx,.xls,.xlsx,.csv,.tsv,.txt,application/pdf,text/csv,text/plain';

const createDraftKey = (draft: StatementDraftTransaction) =>
  `${draft.source_file}:${draft.transaction_date}:${draft.type}:${draft.amount}:${draft.description}`;

const getConfidenceTone = (confidence: number) => {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.7) return 'Review';
  return 'Low';
};

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? 'local');
  const transactions = useTransactionStore((state) => state.transactions);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const fileInputRef = useRef<any>(null);
  const dragDepthRef = useRef(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [results, setResults] = useState<StatementImportResult[]>([]);
  const [selectedDrafts, setSelectedDrafts] = useState<Record<string, boolean>>({});

  const isWide = width >= 980;
  const allDrafts = useMemo(() => results.flatMap((result) => result.drafts), [results]);
  const duplicateKeys = useMemo(() => {
    const keys = new Set<string>();
    allDrafts.forEach((draft) => {
      if (isLikelyDuplicate(draft, transactions)) {
        keys.add(createDraftKey(draft));
      }
    });
    return keys;
  }, [allDrafts, transactions]);

  const selectedImportDrafts = useMemo(
    () => allDrafts.filter((draft) => selectedDrafts[createDraftKey(draft)] && !duplicateKeys.has(createDraftKey(draft))),
    [allDrafts, duplicateKeys, selectedDrafts]
  );

  const pendingSummary = useMemo(() => summarizeStatementDrafts(allDrafts), [allDrafts]);
  const importedSummary = useMemo(
    () => summarizeStatementDrafts(
      transactions.map((transaction) => ({
        ...transaction,
        source_file: 'MoneyKai history',
        source_account: 'Synced account',
        raw_description: transaction.description,
        confidence: 1,
        import_note: 'Already in MoneyKai history',
      }))
    ),
    [transactions]
  );

  const topCategories = useMemo(() => {
    const combined = { ...importedSummary.categoryTotals };
    Object.entries(pendingSummary.categoryTotals).forEach(([category, total]) => {
      combined[category] = (combined[category] ?? 0) + total;
    });

    return Object.entries(combined)
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 5);
  }, [importedSummary.categoryTotals, pendingSummary.categoryTotals]);
  const completedReports = useMemo(() => [
    {
      title: 'Monthly money digest',
      body: transactions.length > 0
        ? `${transactions.length} synced records summarize ${formatCurrency(importedSummary.expense)} spending and ${formatCurrency(importedSummary.income)} income.`
        : 'No finalized transaction history yet. Import or add records before saving a digest.',
      meta: transactions.length > 0 ? 'Ready record' : 'Waiting for records',
      icon: 'calendar-month-outline' as const,
      tone: transactions.length > 0 ? 'primary' as const : 'neutral' as const,
    },
    {
      title: 'Statement import review',
      body: allDrafts.length > 0
        ? `${selectedImportDrafts.length} selected rows, ${duplicateKeys.size} duplicates locked, ${allDrafts.length} total rows reviewed.`
        : 'Upload a statement to create an import review summary.',
      meta: allDrafts.length > 0 ? 'Review history' : 'No upload yet',
      icon: 'text-box-search-outline' as const,
      tone: allDrafts.length > 0 ? 'warning' as const : 'neutral' as const,
    },
    {
      title: 'Export history',
      body: 'Reports keep finalized summaries separate from AI drafts so exports have a clear source trail.',
      meta: 'Export ready',
      icon: 'tray-arrow-up' as const,
      tone: 'primary' as const,
    },
  ], [allDrafts.length, duplicateKeys.size, importedSummary.expense, importedSummary.income, selectedImportDrafts.length, transactions.length]);

  const handleFiles = async (files: any[]) => {
    if (files.length === 0) return;
    setIsProcessing(true);
    dragDepthRef.current = 0;
    setIsDragActive(false);

    try {
      const nextResults = await Promise.all(files.map((file) => processStatementFile(file, userId)));
      setResults(nextResults);

      const nextSelected: Record<string, boolean> = {};
      nextResults.flatMap((result) => result.drafts).forEach((draft) => {
        const key = createDraftKey(draft);
        nextSelected[key] = !isLikelyDuplicate(draft, transactions);
      });
      setSelectedDrafts(nextSelected);
    } catch (error) {
      Alert.alert('Statement import failed', error instanceof Error ? error.message : 'Could not read the selected document.');
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handlePickFiles = () => {
    if (Platform.OS !== 'web') {
      Alert.alert('Web upload only', 'Statement upload is available in MoneyKai Web.');
      return;
    }
    fileInputRef.current?.click?.();
  };

  const resetDragState = () => {
    dragDepthRef.current = 0;
    setIsDragActive(false);
  };

  const hasDraggedFiles = (event: any) => {
    const types = Array.from(event?.dataTransfer?.types ?? []);
    return types.includes('Files');
  };

  const handleDragEnter = (event: any) => {
    if (Platform.OS !== 'web' || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (isProcessing) return;
    dragDepthRef.current += 1;
    setIsDragActive(true);
  };

  const handleDragOver = (event: any) => {
    if (Platform.OS !== 'web' || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = isProcessing ? 'none' : 'copy';
    }
  };

  const handleDragLeave = (event: any) => {
    if (Platform.OS !== 'web' || !hasDraggedFiles(event)) return;
    event.preventDefault();
    event.stopPropagation();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDragActive(false);
    }
  };

  const handleDrop = (event: any) => {
    if (Platform.OS !== 'web') return;
    event.preventDefault();
    event.stopPropagation();
    const files = Array.from(event.dataTransfer?.files ?? []);
    resetDragState();
    if (isProcessing || files.length === 0) return;
    void handleFiles(files);
  };

  const uploadDropZoneProps = Platform.OS === 'web'
    ? ({
        onDragEnter: handleDragEnter,
        onDragOver: handleDragOver,
        onDragLeave: handleDragLeave,
        onDragEnd: resetDragState,
        onDrop: handleDrop,
      } as any)
    : {};

  const toggleDraft = (draft: StatementDraftTransaction) => {
    const key = createDraftKey(draft);
    if (duplicateKeys.has(key)) return;
    setSelectedDrafts((current) => ({ ...current, [key]: !current[key] }));
  };

  const handleImportSelected = () => {
    if (selectedImportDrafts.length === 0) {
      Alert.alert('Nothing to import', 'Select at least one new transaction from the statement review.');
      return;
    }

    selectedImportDrafts.forEach((draft) => {
      addTransaction({
        user_id: userId,
        type: draft.type,
        amount: draft.amount,
        category: draft.category,
        description: draft.description,
        payment_method: draft.payment_method,
        transaction_date: draft.transaction_date,
      });
    });

    Alert.alert(
      'Statement imported',
      `${selectedImportDrafts.length} transactions were added to your MoneyKai history and will sync through the same Firebase collection used by mobile.`
    );
    setSelectedDrafts({});
  };

  const renderMetric = (
    label: string,
    value: string,
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    tone: 'primary' | 'accent' | 'warning' | 'neutral' = 'neutral'
  ) => {
    const toneColor = tone === 'primary' ? colors.primary : tone === 'accent' ? colors.accent : tone === 'warning' ? colors.warning : colors.textPrimary;
    const toneBg = tone === 'neutral' ? colors.card : `${toneColor}14`;

    return (
      <View
        style={{
          flex: 1,
          minWidth: 180,
          backgroundColor: 'transparent',
          borderRightWidth: isWide ? 1 : 0,
          borderBottomWidth: isWide ? 0 : 1,
          borderColor: colors.borderLight,
          paddingVertical: Spacing.md,
          paddingHorizontal: isWide ? Spacing.base : 0,
          gap: Spacing.sm,
        }}
      >
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: BorderRadius.md,
            backgroundColor: toneBg,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name={icon} size={20} color={toneColor} />
        </View>
        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
          {label}
        </Text>
        <Text selectable style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary, fontVariant: ['tabular-nums'] }}>
          {value}
        </Text>
      </View>
    );
  };

  const renderFileResult = (result: StatementImportResult) => {
    const statusColor = result.status === 'ready' ? colors.accent : result.status === 'review' ? colors.warning : colors.emergency;
    return (
      <View
        key={result.fileName}
        style={{
          backgroundColor: 'transparent',
          borderRadius: 0,
          borderBottomWidth: 1,
          borderColor: colors.borderLight,
          paddingVertical: Spacing.base,
          gap: Spacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: BorderRadius.md,
              backgroundColor: `${statusColor}14`,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="file-document-outline" size={22} color={statusColor} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable numberOfLines={1} style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              {result.fileName}
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              {result.fileType} - {result.accountLabel}
            </Text>
          </View>
          <View style={{ borderRadius: BorderRadius.full, backgroundColor: `${statusColor}14`, paddingHorizontal: 10, paddingVertical: 5 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: statusColor }}>
              {result.status.toUpperCase()}
            </Text>
          </View>
        </View>
        <Text selectable style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
          {result.message}
        </Text>
      </View>
    );
  };

  const renderDraft = (draft: StatementDraftTransaction) => {
    const key = createDraftKey(draft);
    const category = getCategoryById(draft.category);
    const selected = Boolean(selectedDrafts[key]);
    const duplicate = duplicateKeys.has(key);
    const confidenceTone = getConfidenceTone(draft.confidence);
    const confidenceColor = confidenceTone === 'High' ? colors.accent : confidenceTone === 'Review' ? colors.warning : colors.emergency;

    return (
      <Pressable
        key={key}
        onPress={() => toggleDraft(draft)}
        style={({ hovered, pressed }: any) => ({
          flexDirection: isWide ? 'row' : 'column',
          alignItems: isWide ? 'center' : 'stretch',
          gap: Spacing.md,
          backgroundColor: selected && !duplicate ? `${colors.primary}0A` : 'transparent',
          borderRadius: BorderRadius.sm,
          borderBottomWidth: 1,
          borderColor: duplicate ? `${colors.warning}55` : colors.borderLight,
          paddingVertical: Spacing.base,
          paddingHorizontal: selected && !duplicate ? Spacing.sm : 0,
          opacity: duplicate ? 0.72 : 1,
          transform: hovered && !pressed && !duplicate ? [{ translateY: -1 }] : [{ translateY: 0 }],
        })}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 }}>
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: duplicate ? `${colors.warning}16` : selected ? colors.primary : colors.surface,
              borderWidth: 1,
              borderColor: duplicate ? `${colors.warning}55` : selected ? colors.primary : colors.border,
            }}
          >
            <MaterialCommunityIcons
              name={duplicate ? 'alert-circle-outline' : selected ? 'check' : 'plus'}
              size={18}
              color={duplicate ? colors.warning : selected ? colors.textInverse : colors.textSecondary}
            />
          </View>

          <View style={{ flex: 1, minWidth: 0 }}>
            <Text selectable numberOfLines={1} style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              {draft.description}
            </Text>
            <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              {formatDate(draft.transaction_date, 'dd MMM yyyy')} - {draft.source_account} - {draft.payment_method.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flexWrap: 'wrap', justifyContent: isWide ? 'flex-end' : 'flex-start' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: BorderRadius.full, backgroundColor: category?.colorLight ?? colors.surface, paddingHorizontal: 10, paddingVertical: 6 }}>
            <MaterialCommunityIcons name={(category?.icon ?? 'shape-outline') as any} size={15} color={category?.color ?? colors.textSecondary} />
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
              {category?.name ?? draft.category}
            </Text>
          </View>

          <View style={{ borderRadius: BorderRadius.full, backgroundColor: `${confidenceColor}14`, paddingHorizontal: 10, paddingVertical: 6 }}>
            <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: confidenceColor }}>
              {confidenceTone}
            </Text>
          </View>

          {duplicate ? (
            <View style={{ borderRadius: BorderRadius.full, backgroundColor: `${colors.warning}14`, paddingHorizontal: 10, paddingVertical: 6 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.warning }}>
                Already in history
              </Text>
            </View>
          ) : null}

          <Text
            selectable
            style={{
              minWidth: 112,
              textAlign: isWide ? 'right' : 'left',
              fontSize: Typography.fontSize.md,
              fontFamily: Typography.fontFamily.bold,
              color: draft.type === 'income' ? colors.accent : colors.emergency,
              fontVariant: ['tabular-nums'],
            }}
          >
            {draft.type === 'income' ? '+' : '-'}{formatCurrency(draft.amount)}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingBottom: 160 }} showsVerticalScrollIndicator={true}>
        <View
          style={{
            backgroundColor: 'transparent',
            borderBottomWidth: 1,
            borderBottomColor: colors.borderLight,
            paddingVertical: Spacing.xl,
            gap: Spacing.lg,
          }}
        >
          <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.lg, alignItems: isWide ? 'center' : 'stretch' }}>
            <View style={{ flex: 1, gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <View
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: BorderRadius.md,
                    backgroundColor: colors.primaryBg,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <MaterialCommunityIcons name="text-box-search-outline" size={22} color={colors.primary} />
                </View>
                <View>
                  <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.display, color: colors.textPrimary }}>
                    Statement intelligence
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                    Import bank statements, categorize rows, and fold them into your MoneyKai reports.
                  </Text>
                </View>
              </View>

              <Text selectable style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 22 }}>
                MoneyKai Web reads selectable statement text locally, marks rows that need review, skips duplicates already synced from MoneyKai Mobile, and imports approved rows into the same transaction history.
              </Text>
            </View>

            <Pressable
              {...uploadDropZoneProps}
              onPress={handlePickFiles}
              disabled={isProcessing}
              accessibilityRole="button"
              accessibilityLabel="Upload bank statement by browsing or dragging files here"
              style={({ hovered, pressed }: any) => ({
                minHeight: 112,
                minWidth: isWide ? 300 : '100%',
                borderRadius: BorderRadius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: isDragActive ? colors.primary : hovered ? colors.primary : colors.border,
                backgroundColor: isDragActive ? colors.primaryBg : hovered ? `${colors.primary}0D` : colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                padding: Spacing.lg,
                gap: Spacing.sm,
                transform: (hovered || isDragActive) && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                opacity: isProcessing ? 0.65 : 1,
              })}
            >
              <MaterialCommunityIcons name={isProcessing ? 'progress-clock' : isDragActive ? 'tray-arrow-down' : 'cloud-upload-outline'} size={28} color={colors.primary} />
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                {isProcessing ? 'Reading statement...' : isDragActive ? 'Drop statement here' : 'Upload statement'}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, textAlign: 'center' }}>
                {isDragActive ? 'Release to parse PDF, Word, Excel, CSV, or text files' : 'Drag files here or click to browse'}
              </Text>
            </Pressable>

            {Platform.OS === 'web' ? (
              <input
                ref={fileInputRef}
                type="file"
                accept={ACCEPTED_FILE_TYPES}
                multiple
                aria-label="Upload bank statement"
                onChange={(event: any) => handleFiles(Array.from(event.currentTarget.files ?? []))}
                style={{ display: 'none' }}
              />
            ) : null}
          </View>
        </View>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md }}>
          {renderMetric('Synced mobile/web history', String(transactions.length), 'database-sync-outline', 'primary')}
          {renderMetric('Rows awaiting import', String(allDrafts.length), 'file-search-outline', 'warning')}
          {renderMetric('Statement expenses', formatCurrency(pendingSummary.expense), 'arrow-up-circle-outline', 'neutral')}
          {renderMetric('Statement income', formatCurrency(pendingSummary.income), 'arrow-down-circle-outline', 'accent')}
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <AIInsights showFooterLink={false} surface="reports" />
        </View>

        <View style={{ marginTop: Spacing.md, gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Finished reports
          </Text>
          <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight }}>
            {completedReports.map((report, index) => {
              const toneColor = report.tone === 'warning' ? colors.warning : report.tone === 'primary' ? colors.primary : colors.textTertiary;
              return (
                <View
                  key={report.title}
                  style={{
                    flexDirection: isWide ? 'row' : 'column',
                    alignItems: isWide ? 'center' : 'stretch',
                    gap: Spacing.md,
                    borderBottomWidth: 1,
                    borderBottomColor: colors.borderLight,
                    paddingVertical: Spacing.md,
                    paddingTop: index === 0 ? Spacing.md : Spacing.md,
                  }}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, flex: 1, minWidth: 0 }}>
                    <View style={{ width: 38, height: 38, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: `${toneColor}14` }}>
                      <MaterialCommunityIcons name={report.icon} size={19} color={toneColor} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {report.title}
                      </Text>
                      <Text style={{ marginTop: 3, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                        {report.body}
                      </Text>
                    </View>
                  </View>
                  <View style={{ alignSelf: isWide ? 'center' : 'flex-start', borderRadius: BorderRadius.full, backgroundColor: `${toneColor}14`, paddingHorizontal: 10, paddingVertical: 6 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: toneColor }}>
                      {report.meta}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {results.length > 0 ? (
          <View style={{ marginTop: Spacing.md, gap: Spacing.md }}>
            <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md }}>
              <View style={{ flex: 1, gap: Spacing.md }}>
                {results.map(renderFileResult)}
              </View>

              <View
                style={{
                  width: isWide ? 360 : '100%',
                  backgroundColor: colors.surface,
                  borderRadius: BorderRadius.sm,
                  borderWidth: 1,
                  borderColor: colors.borderLight,
                  padding: Spacing.base,
                  gap: Spacing.md,
                }}
              >
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Import control
                </Text>
                <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                  {selectedImportDrafts.length} new rows selected. Duplicate rows are locked to protect the mobile history you already have.
                </Text>
                <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
                  <Pressable
                    onPress={() => {
                      const next: Record<string, boolean> = {};
                      allDrafts.forEach((draft) => {
                        const key = createDraftKey(draft);
                        next[key] = !duplicateKeys.has(key);
                      });
                      setSelectedDrafts(next);
                    }}
                    style={({ hovered }: any) => ({
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: hovered ? colors.surfaceElevated : colors.surface,
                      minHeight: 44,
                      paddingHorizontal: Spacing.md,
                    })}
                  >
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Select new
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setSelectedDrafts({})}
                    style={({ hovered }: any) => ({
                      flex: 1,
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: hovered ? colors.surfaceElevated : colors.surface,
                      minHeight: 44,
                      paddingHorizontal: Spacing.md,
                    })}
                  >
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      Clear
                    </Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={handleImportSelected}
                  style={({ hovered, pressed }: any) => ({
                    minHeight: 48,
                    borderRadius: BorderRadius.md,
                    backgroundColor: hovered ? colors.primaryLight : colors.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'row',
                    gap: Spacing.sm,
                    opacity: selectedImportDrafts.length === 0 ? 0.52 : 1,
                    transform: hovered && !pressed ? [{ translateY: -1 }] : [{ translateY: 0 }],
                  })}
                >
                  <MaterialCommunityIcons name="database-import-outline" size={18} color={colors.textInverse} />
                  <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textInverse }}>
                    Import selected
                  </Text>
                </Pressable>
              </View>
            </View>

            {allDrafts.length > 0 ? (
              <View style={{ gap: Spacing.sm }}>
                <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  Review extracted transactions
                </Text>
                {allDrafts.map(renderDraft)}
              </View>
            ) : null}
          </View>
        ) : null}

        <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.md, marginTop: Spacing.md }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: colors.borderLight,
              padding: Spacing.base,
              gap: Spacing.md,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Category report
            </Text>
            {topCategories.length > 0 ? topCategories.map((item) => {
              const category = getCategoryById(item.category);
              const max = Math.max(...topCategories.map((categoryItem) => categoryItem.total), 1);
              return (
                <View key={item.category} style={{ gap: Spacing.xs }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, flex: 1, minWidth: 0 }}>
                      <MaterialCommunityIcons name={(category?.icon ?? 'shape-outline') as any} size={18} color={category?.color ?? colors.textSecondary} />
                      <Text numberOfLines={1} style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                        {category?.name ?? item.category}
                      </Text>
                    </View>
                    <Text selectable style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, fontVariant: ['tabular-nums'] }}>
                      {formatCurrency(item.total)}
                    </Text>
                  </View>
                  <View style={{ height: 8, borderRadius: 4, backgroundColor: colors.surface, overflow: 'hidden' }}>
                    <View style={{ width: `${Math.max(8, (item.total / max) * 100)}%`, height: 8, borderRadius: 4, backgroundColor: colors.primary }} />
                  </View>
                </View>
              );
            }) : (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary }}>
                Upload a statement or sync transactions from mobile to see category intelligence.
              </Text>
            )}
          </View>

          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: BorderRadius.md,
              borderWidth: 1,
              borderColor: colors.borderLight,
              padding: Spacing.base,
              gap: Spacing.md,
            }}
          >
            <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Latest synced history
            </Text>
            {transactions.slice(0, 5).map((transaction) => {
              const category = getCategoryById(transaction.category);
              return (
                <View key={transaction.id} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
                  <View
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: BorderRadius.md,
                      backgroundColor: category?.colorLight ?? colors.surface,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <MaterialCommunityIcons name={(category?.icon ?? 'receipt') as any} size={18} color={category?.color ?? colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text selectable numberOfLines={1} style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                      {transaction.description}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                      {formatDate(transaction.transaction_date, 'dd MMM yyyy')}
                    </Text>
                  </View>
                  <Text selectable style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: transaction.type === 'income' ? colors.accent : colors.emergency }}>
                    {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                  </Text>
                </View>
              );
            })}
            {transactions.length === 0 ? (
              <Text style={{ fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                Sign in with the same account used on MoneyKai Mobile, then your mobile history appears here through the shared Firebase sync.
              </Text>
            ) : null}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
