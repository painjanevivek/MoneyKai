import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Image } from 'expo-image';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { ProgressFlow } from '@/components/ui/ProgressFlow';
import { AiModelConsole } from '@/components/ai/AiModelConsole';
import { EXPENSE_CATEGORIES, PAYMENT_METHODS } from '@/constants/categories';
import { BorderRadius, Colors, Spacing, Typography } from '@/constants/theme';
import {
  buildDefaultAttachmentPrompt,
  createReceiptReviewDraft,
  normalizeReceiptAmountInput,
  validateReceiptReviewDraft,
  type ReceiptReviewDraft,
} from '@/features/ai/attachmentReview';
import {
  useAiAttachmentFileAnalysis,
  useAiProviderStatus,
} from '@/features/ai/hooks';
import { formatAiResponseText, withPlainTextAiStyle } from '@/features/ai/responseText';
import type { AiAttachmentAnalyzeTask } from '@/features/ai/types';
import { useStagedProgress, type ProgressFlowStep } from '@/hooks/useStagedProgress';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useTransactionStore } from '@/stores/useTransactionStore';

type SelectedAsset = {
  file: File;
  previewUri: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

type ReviewDecision = 'new' | 'needs_review' | 'suggested' | 'approved' | 'edited' | 'dismissed';
type ReviewQueueId = 'source' | 'budget' | 'digest' | 'privacy' | 'result' | 'receipt-draft';

type ReviewQueueItem = {
  id: ReviewQueueId;
  title: string;
  body: string;
  meta: string;
  status: ReviewDecision;
  active: boolean;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const MAX_ATTACHMENT_BYTES = 4 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

const TASK_OPTIONS: { id: AiAttachmentAnalyzeTask; title: string; subtitle: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  {
    id: 'receipt_extract',
    title: 'Receipt extract',
    subtitle: 'Review merchant, amount, date, and category before saving.',
    icon: 'receipt-text-outline',
  },
  {
    id: 'image_analysis',
    title: 'General image',
    subtitle: 'Ask AI to describe what is visible without creating a transaction.',
    icon: 'image-search-outline',
  },
];

const AI_REVIEW_PROGRESS_STEPS: ProgressFlowStep[] = [
  {
    id: 'prepare',
    label: 'Preparing image safely',
    detail: 'Checking file type, size, and review mode before upload.',
    targetProgress: 24,
  },
  {
    id: 'upload',
    label: 'Uploading for analysis',
    detail: 'Sending the selected file for analysis.',
    targetProgress: 48,
  },
  {
    id: 'analyse',
    label: 'Reading visual details',
    detail: 'Waiting for the configured vision model to return structured findings.',
    targetProgress: 76,
  },
  {
    id: 'review',
    label: 'Preparing review result',
    detail: 'Holding final completion until the server response is confirmed.',
    targetProgress: 88,
  },
];

export default function AiReviewScreen() {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();
  const userId = useAuthStore((state) => state.user?.id ?? 'local');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const transactions = useTransactionStore((state) => state.transactions);
  const [task, setTask] = React.useState<AiAttachmentAnalyzeTask>('receipt_extract');
  const [prompt, setPrompt] = React.useState(() => buildDefaultAttachmentPrompt('receipt_extract'));
  const [selectedAsset, setSelectedAsset] = React.useState<SelectedAsset | null>(null);
  const [receiptDraft, setReceiptDraft] = React.useState<ReceiptReviewDraft | null>(null);
  const [selectedReviewId, setSelectedReviewId] = React.useState<ReviewQueueId>('source');
  const [reviewDecision, setReviewDecision] = React.useState<ReviewDecision>('new');
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const [pickerError, setPickerError] = React.useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);
  const requiresSignIn = !isHydratingSession && !isAuthenticated;
  const canLoadAiStatus = !isHydratingSession && isAuthenticated;
  const { data: providerStatus, error: providerError, loading: loadingProviderStatus } = useAiProviderStatus(canLoadAiStatus);
  const analyzeState = useAiAttachmentFileAnalysis();
  const analysisProgress = useStagedProgress({ steps: AI_REVIEW_PROGRESS_STEPS });

  const attachmentsReady = Boolean(
    providerStatus?.enabled &&
    providerStatus.configured &&
    providerStatus.attachmentsEnabled &&
    providerStatus.defaultVisionModelConfigured
  );
  const analysisPending = analyzeState.loading;
  const analysisError = analyzeState.error;
  const canAnalyze = Boolean(selectedAsset) && attachmentsReady && !requiresSignIn && !analysisPending;
  const deskWide = width >= 1180;
  const deskCompact = width < 760;
  const deskColors = Colors.jetLuxuryDark;
  const deskBorder = 'rgba(164, 244, 253, 0.16)';
  const selectedTaskOption = TASK_OPTIONS.find((option) => option.id === task) ?? TASK_OPTIONS[0];
  const decisionMeta: Record<ReviewDecision, { label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap; color: string }> = {
    new: { label: 'New', icon: 'circle-outline', color: deskColors.textTertiary },
    needs_review: { label: 'Needs review', icon: 'alert-circle-outline', color: deskColors.warning },
    suggested: { label: 'Suggested', icon: 'brain', color: deskColors.primary },
    approved: { label: 'Approved', icon: 'check-circle-outline', color: deskColors.success },
    edited: { label: 'Edited', icon: 'pencil-circle-outline', color: deskColors.info },
    dismissed: { label: 'Dismissed', icon: 'close-circle-outline', color: deskColors.error },
  };
  const orchestrationItems = [
    {
      label: 'Capture',
      value: selectedAsset ? 'Ready' : 'Waiting',
      icon: 'tray-arrow-down',
      active: Boolean(selectedAsset),
    },
    {
      label: 'Classify',
      value: receiptDraft ? 'Drafted' : analysisPending ? 'Reading' : 'Review',
      icon: 'shape-outline',
      active: Boolean(receiptDraft) || analysisPending,
    },
    {
      label: 'Budget',
      value: transactions.length ? 'Signals' : 'No data',
      icon: 'target',
      active: transactions.length > 0,
    },
    {
      label: 'Approve',
      value: receiptDraft ? 'Needed' : 'Human gate',
      icon: 'account-check-outline',
      active: Boolean(receiptDraft),
    },
  ] as const;
  const reviewQueueItems = React.useMemo<ReviewQueueItem[]>(() => {
    const items: ReviewQueueItem[] = [
      {
        id: 'source',
        title: selectedTaskOption.title,
        body: selectedAsset ? selectedAsset.filename : 'Add a receipt or screenshot to begin.',
        meta: selectedAsset ? 'Ready for analysis' : 'Waiting for file',
        status: selectedAsset ? 'needs_review' : 'new',
        active: true,
        icon: selectedTaskOption.icon,
      },
    ];

    if (analyzeState.data) {
      items.push({
        id: 'result',
        title: 'AI finding',
        body: 'Review the model explanation, warnings, and source context before using it.',
        meta: 'Draft only',
        status: reviewDecision,
        active: true,
        icon: 'brain',
      });
    }

    if (receiptDraft) {
      items.push({
        id: 'receipt-draft',
        title: 'Receipt draft',
        body: `${receiptDraft.description || 'Receipt purchase'} - Rs ${receiptDraft.amount || '0'}`,
        meta: 'Human gate',
        status: reviewDecision,
        active: true,
        icon: 'receipt-text-check-outline',
      });
    }

    items.push(
      {
        id: 'budget',
        title: 'Budget pressure',
        body: transactions.length ? 'MoneyKai can compare this month against your allowance.' : 'Add transactions before budget signals appear.',
        meta: transactions.length ? 'Signals available' : 'No records',
        status: transactions.length ? 'suggested' : 'new',
        active: false,
        icon: 'chart-timeline-variant',
      },
      {
        id: 'digest',
        title: 'Monthly digest',
        body: 'Reports should summarize what changed, why it matters, and what needs review.',
        meta: 'Report agent',
        status: 'new',
        active: false,
        icon: 'file-chart-outline',
      },
      {
        id: 'privacy',
        title: 'Privacy check',
        body: 'Show source data and privacy mode for every review.',
        meta: 'Trust layer',
        status: 'needs_review',
        active: false,
        icon: 'shield-check-outline',
      }
    );

    return items;
  }, [analyzeState.data, receiptDraft, reviewDecision, selectedAsset, selectedTaskOption.icon, selectedTaskOption.title, transactions.length]);
  const selectedReviewItem = reviewQueueItems.find((item) => item.id === selectedReviewId) ?? reviewQueueItems[0];
  const canSaveReceiptDraft = reviewDecision === 'approved';
  const orchestrationEvidence = [
    {
      label: 'Source',
      value: selectedAsset?.filename ?? 'No attachment selected',
      icon: 'file-eye-outline',
    },
    {
      label: 'Workflow',
      value: selectedTaskOption.title,
      icon: selectedTaskOption.icon,
    },
    {
      label: 'Model state',
      value: attachmentsReady ? 'Vision provider ready' : 'Setup required',
      icon: attachmentsReady ? 'cloud-check-outline' : 'cloud-alert-outline',
    },
    {
      label: 'Uncertainty',
      value: analyzeState.data?.warnings.length
        ? `${analyzeState.data.warnings.length} warning${analyzeState.data.warnings.length === 1 ? '' : 's'}`
        : 'No warnings returned',
      icon: analyzeState.data?.warnings.length ? 'alert-circle-outline' : 'shield-check-outline',
    },
  ] as const;

  React.useEffect(() => {
    return () => {
      if (selectedAsset?.previewUri) {
        URL.revokeObjectURL(selectedAsset.previewUri);
      }
    };
  }, [selectedAsset]);

  const resetReviewState = React.useCallback((nextTask?: AiAttachmentAnalyzeTask) => {
    setReceiptDraft(null);
    setReviewDecision('new');
    setSaveMessage(null);
    setPickerError(null);
    analyzeState.reset();
    analysisProgress.reset();
    if (nextTask) {
      setPrompt(buildDefaultAttachmentPrompt(nextTask));
    }
  }, [analysisProgress, analyzeState]);

  const handleSelectTask = (nextTask: AiAttachmentAnalyzeTask) => {
    setTask(nextTask);
    resetReviewState(nextTask);
  };

  const handlePickImage = () => {
    if (requiresSignIn) {
      setPickerError('Sign in before uploading an attachment for AI review.');
      return;
    }
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const mimeType = file.type || 'image/jpeg';

    if (!mimeType.startsWith('image/') || !SUPPORTED_IMAGE_TYPES.has(mimeType)) {
      setPickerError('Choose a PNG, JPEG, WebP, or another supported image file.');
      event.currentTarget.value = '';
      return;
    }

    if (file.size > MAX_ATTACHMENT_BYTES) {
      setPickerError(`Choose an image under ${formatBytes(MAX_ATTACHMENT_BYTES)}.`);
      event.currentTarget.value = '';
      return;
    }

    if (selectedAsset?.previewUri) {
      URL.revokeObjectURL(selectedAsset.previewUri);
    }

    setSelectedAsset({
      file,
      previewUri: URL.createObjectURL(file),
      filename: file.name,
      mimeType,
      sizeBytes: file.size,
    });
    event.currentTarget.value = '';
    resetReviewState();
  };

  const analyzeSelectedAsset = async () => {
    if (!selectedAsset) {
      return;
    }

    if (requiresSignIn) {
      setPickerError('Sign in before uploading an attachment for AI review.');
      return;
    }

    analysisProgress.start();
    try {
      const response = await analyzeState.analyzeFile({
        file: selectedAsset.file,
        filename: selectedAsset.filename,
        mimeType: selectedAsset.mimeType,
        request: {
          task,
          message: withPlainTextAiStyle(prompt.trim() || buildDefaultAttachmentPrompt(task)),
          context: {
            surface: 'web_ai_review',
            filename: selectedAsset.filename,
          },
        },
      });

      setSaveMessage(null);
      const nextReceiptDraft = task === 'receipt_extract' ? createReceiptReviewDraft(response) : null;
      setReceiptDraft(nextReceiptDraft);
      setReviewDecision(nextReceiptDraft ? 'suggested' : 'needs_review');
      setSelectedReviewId(nextReceiptDraft ? 'receipt-draft' : 'result');
      analysisProgress.succeed();
    } catch {
      setReceiptDraft(null);
      setReviewDecision('needs_review');
      analysisProgress.fail();
    }
  };

  const handleApproveReview = () => {
    if (!receiptDraft) {
      return;
    }

    const validationError = validateReceiptReviewDraft(receiptDraft);
    if (validationError) {
      setSaveMessage(validationError);
      return;
    }

    setReviewDecision('approved');
    setSaveMessage('Receipt draft approved. Save it when you are ready to add the record.');
  };

  const handleDismissReview = () => {
    setReviewDecision('dismissed');
    setSaveMessage('Suggestion dismissed. No transaction was saved.');
  };

  const handleSaveTransaction = () => {
    if (!receiptDraft) {
      return;
    }

    if (!canSaveReceiptDraft) {
      setSaveMessage('Approve the reviewed draft before saving it to your transaction history.');
      return;
    }

    const validationError = validateReceiptReviewDraft(receiptDraft);
    if (validationError) {
      setSaveMessage(validationError);
      return;
    }

    addTransaction({
      user_id: userId,
      type: 'expense',
      amount: Number(receiptDraft.amount),
      category: receiptDraft.categoryId,
      description: receiptDraft.description.trim(),
      payment_method: receiptDraft.paymentMethod,
      transaction_date: receiptDraft.transactionDate,
    });

    setReviewDecision('approved');
    setSaveMessage('Reviewed receipt added to your transaction history.');
  };

  const updateReceiptDraft = <K extends keyof ReceiptReviewDraft>(key: K, value: ReceiptReviewDraft[K]) => {
    setReceiptDraft((current) => (current ? { ...current, [key]: value } : current));
    setReviewDecision('edited');
    setSaveMessage(null);
  };

  return (
    <ScrollView showsVerticalScrollIndicator={true} contentContainerStyle={{ gap: Spacing.xl, paddingBottom: Spacing['4xl'] }}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        style={{ display: 'none' }}
      />

      <View
        style={{
          backgroundColor: deskColors.background,
          borderColor: deskBorder,
          borderRadius: deskCompact ? 0 : BorderRadius.lg,
          borderWidth: 1,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            borderBottomWidth: 1,
            borderBottomColor: deskColors.borderLight,
            padding: deskCompact ? Spacing.md : Spacing.lg,
            gap: Spacing.sm,
          }}
        >
          <View style={{ flexDirection: deskWide ? 'row' : 'column', justifyContent: 'space-between', gap: Spacing.md }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textTertiary }}>
                FINANCIAL REVIEW DESK
              </Text>
              <Text style={{ marginTop: 4, fontSize: deskCompact ? 24 : deskWide ? 34 : 28, lineHeight: deskCompact ? 30 : deskWide ? 40 : 34, fontFamily: Typography.fontFamily.display, color: deskColors.textPrimary }}>
                Financial review desk
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: attachmentsReady ? 'rgba(110, 231, 183, 0.12)' : 'rgba(248, 215, 116, 0.12)', borderWidth: 1, borderColor: attachmentsReady ? 'rgba(110, 231, 183, 0.28)' : 'rgba(248, 215, 116, 0.28)' }}>
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: attachmentsReady ? deskColors.success : deskColors.warning }}>
                  {loadingProviderStatus ? 'Checking AI' : attachmentsReady ? 'AI ready' : 'Setup needed'}
                </Text>
              </View>
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: 'rgba(164, 244, 253, 0.08)', borderWidth: 1, borderColor: deskBorder }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: deskColors.textSecondary }}>
                  {transactions.length} records in scope
                </Text>
              </View>
            </View>
          </View>
          <Text style={{ maxWidth: 820, fontSize: Typography.fontSize.sm, lineHeight: 22, color: deskColors.textSecondary }}>
            Capture, classify, summarize, then approve.
          </Text>
          {providerError || providerStatus?.error || !providerStatus?.defaultVisionModelConfigured ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: deskColors.textTertiary }}>
              {providerError || providerStatus?.error || 'Vision analysis is not configured yet.'}
            </Text>
          ) : null}
        </View>

        <View style={{ flexDirection: deskWide ? 'row' : 'column', minHeight: deskWide ? 680 : undefined }}>
          <View style={{ width: deskWide ? 260 : '100%', borderRightWidth: deskWide ? 1 : 0, borderBottomWidth: deskWide ? 0 : 1, borderColor: deskColors.borderLight, padding: deskCompact ? Spacing.md : Spacing.lg, gap: deskCompact ? Spacing.md : Spacing.lg }}>
            <Button title={selectedAsset ? 'Replace image' : 'Add image'} icon="image-plus" onPress={handlePickImage} />

            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textTertiary }}>
                WORKFLOWS
              </Text>
              {TASK_OPTIONS.map((option) => {
                const active = task === option.id;
                return (
                  <TouchableOpacity
                    key={option.id}
                    activeOpacity={0.86}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    onPress={() => handleSelectTask(option.id)}
                    style={{
                      borderRadius: BorderRadius.md,
                      borderWidth: 1,
                      borderColor: active ? 'rgba(164, 244, 253, 0.42)' : 'transparent',
                      backgroundColor: active ? 'rgba(164, 244, 253, 0.1)' : 'transparent',
                      padding: deskCompact ? Spacing.sm : Spacing.md,
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                      <MaterialCommunityIcons name={option.icon} size={18} color={active ? deskColors.primary : deskColors.textTertiary} />
                      <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: active ? deskColors.textPrimary : deskColors.textSecondary }}>
                        {option.title}
                      </Text>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: Typography.fontSize.xs, lineHeight: 17, color: deskColors.textTertiary }}>
                      {option.subtitle}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textTertiary }}>
                ORCHESTRATION
              </Text>
              {orchestrationItems.map((item) => (
                <View key={item.label} style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                  <View style={{ width: 30, height: 30, borderRadius: BorderRadius.full, alignItems: 'center', justifyContent: 'center', backgroundColor: item.active ? 'rgba(164, 244, 253, 0.12)' : deskColors.surface }}>
                    <MaterialCommunityIcons name={item.icon} size={15} color={item.active ? deskColors.primary : deskColors.textTertiary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textSecondary }}>
                      {item.label}
                    </Text>
                    <Text style={{ fontSize: 11, color: deskColors.textTertiary }} numberOfLines={1}>
                      {item.value}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={{ flex: 1, minWidth: 0, borderRightWidth: deskWide ? 1 : 0, borderBottomWidth: deskWide ? 0 : 1, borderColor: deskColors.borderLight }}>
            <View style={{ minHeight: deskCompact ? 56 : 70, borderBottomWidth: 1, borderBottomColor: deskColors.borderLight, paddingHorizontal: deskCompact ? Spacing.md : Spacing.lg, justifyContent: 'center' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <MaterialCommunityIcons name="magnify" size={18} color={deskColors.textTertiary} />
                <Text style={{ fontSize: Typography.fontSize.md, color: deskColors.textTertiary }}>
                  Search review queue
                </Text>
              </View>
            </View>

            {reviewQueueItems.map((item) => {
              const selected = selectedReviewItem.id === item.id;
              const status = decisionMeta[item.status];
              return (
              <TouchableOpacity
                key={item.title}
                activeOpacity={0.86}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Review ${item.title}, ${status.label}`}
                onPress={() => setSelectedReviewId(item.id)}
                style={{
                  borderBottomWidth: 1,
                  borderBottomColor: deskColors.borderLight,
                  backgroundColor: selected ? 'rgba(255, 255, 255, 0.08)' : item.active ? 'rgba(255, 255, 255, 0.035)' : 'transparent',
                  padding: deskCompact ? Spacing.md : Spacing.lg,
                }}
              >
                <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
                  <View style={{ width: 34, height: 34, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center', backgroundColor: selected ? 'rgba(164, 244, 253, 0.12)' : deskColors.surface }}>
                    <MaterialCommunityIcons name={item.icon} size={19} color={selected || item.active ? deskColors.primary : deskColors.textTertiary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: deskCompact ? 'column' : 'row', justifyContent: 'space-between', gap: deskCompact ? 6 : Spacing.sm }}>
                      <Text style={{ flex: 1, fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textPrimary }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                        <MaterialCommunityIcons name={status.icon} size={13} color={status.color} />
                        <Text style={{ fontSize: Typography.fontSize.xs, color: status.color }} numberOfLines={1}>
                          {status.label}
                        </Text>
                      </View>
                    </View>
                    <Text style={{ marginTop: 6, fontSize: Typography.fontSize.sm, lineHeight: 21, color: deskColors.textSecondary }} numberOfLines={2}>
                      {item.body}
                    </Text>
                    <Text style={{ marginTop: 5, fontSize: 11, color: deskColors.textTertiary }} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
              );
            })}
          </View>

          <View style={{ width: deskWide ? 460 : '100%', padding: deskCompact ? Spacing.md : Spacing.lg, gap: Spacing.md }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: deskCompact ? Typography.fontSize.xl : Typography.fontSize['2xl'], lineHeight: deskCompact ? Typography.lineHeight.xl : Typography.lineHeight['2xl'], fontFamily: Typography.fontFamily.display, color: deskColors.textPrimary }}>
                {selectedReviewItem.title}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: deskColors.textSecondary }}>
                {selectedReviewItem.body}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: `${decisionMeta[selectedReviewItem.status].color}44`, backgroundColor: `${decisionMeta[selectedReviewItem.status].color}18` }}>
                <MaterialCommunityIcons name={decisionMeta[selectedReviewItem.status].icon} size={14} color={decisionMeta[selectedReviewItem.status].color} />
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: decisionMeta[selectedReviewItem.status].color }}>
                  {decisionMeta[selectedReviewItem.status].label}
                </Text>
              </View>
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, borderWidth: 1, borderColor: deskBorder, backgroundColor: 'rgba(255, 255, 255, 0.035)' }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: deskColors.textSecondary }}>
                  {selectedReviewItem.meta}
                </Text>
              </View>
            </View>

            {selectedAsset ? (
              <View style={{ gap: Spacing.sm }}>
                <Image
                  source={selectedAsset.previewUri}
                  contentFit="cover"
                  style={{ width: '100%', height: deskCompact ? 180 : 220, borderRadius: BorderRadius.md, backgroundColor: deskColors.surface }}
                />
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm }}>
                  <Text style={{ flex: 1, minWidth: 180, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textPrimary }} numberOfLines={1}>
                    {selectedAsset.filename}
                  </Text>
                  <Text style={{ fontSize: Typography.fontSize.xs, color: deskColors.textTertiary }}>
                    {formatBytes(selectedAsset.sizeBytes)}
                  </Text>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                activeOpacity={0.86}
                accessibilityRole="button"
                onPress={handlePickImage}
                style={{
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: deskCompact ? 180 : 220,
                  borderRadius: BorderRadius.md,
                  borderWidth: 1,
                  borderStyle: 'dashed',
                  borderColor: deskBorder,
                  backgroundColor: 'rgba(255, 255, 255, 0.035)',
                  padding: Spacing.xl,
                  gap: Spacing.sm,
                }}
              >
                <MaterialCommunityIcons name="image-plus" size={28} color={deskColors.primary} />
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: deskColors.textPrimary }}>
                  Add review source
                </Text>
                <Text style={{ textAlign: 'center', fontSize: Typography.fontSize.xs, lineHeight: 18, color: deskColors.textTertiary }}>
                  Choose a receipt or screenshot. Results stay draft-only until approved.
                </Text>
              </TouchableOpacity>
            )}

            {pickerError ? (
              <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: deskColors.warning }}>
                {pickerError}
              </Text>
            ) : null}

            <Input
              label="Review prompt"
              value={prompt}
              onChangeText={setPrompt}
              multiline
              numberOfLines={3}
              autoCapitalize="sentences"
              placeholder={buildDefaultAttachmentPrompt(task)}
              style={{ marginBottom: 0 }}
            />

            <Button
              title="Analyze for review"
              icon="brain"
              loading={analysisPending}
              disabled={!canAnalyze}
              onPress={analyzeSelectedAsset}
            />
            <ProgressFlow
              activeStepIndex={analysisProgress.activeStepIndex}
              errorMessage={analysisError}
              onRetry={selectedAsset && attachmentsReady && !requiresSignIn ? analyzeSelectedAsset : undefined}
              progress={analysisProgress.progress}
              retryLabel="Try analysis again"
              status={analysisProgress.status}
              steps={analysisProgress.steps}
              successMessage="Analysis is ready for approval."
              title="Review pipeline"
            />
            <AiModelConsole
              providerStatus={providerStatus}
              requiresSignIn={requiresSignIn}
              containerStyle={{ minWidth: 0 }}
            />
          </View>
        </View>
      </View>

      {analyzeState.data ? (
        <Card style={{ gap: Spacing.md }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              AI review
            </Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                Review the result before using it.
              </Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: Spacing.sm, paddingVertical: 4, borderRadius: BorderRadius.full, backgroundColor: `${decisionMeta[reviewDecision].color}18` }}>
                <MaterialCommunityIcons name={decisionMeta[reviewDecision].icon} size={13} color={decisionMeta[reviewDecision].color} />
                <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: decisionMeta[reviewDecision].color }}>
                  {decisionMeta[reviewDecision].label}
                </Text>
              </View>
            </View>
          </View>

          <View style={{ borderRadius: BorderRadius.lg, backgroundColor: colors.surface, padding: Spacing.md, gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textPrimary }}>
              {formatAiResponseText(analyzeState.data.message)}
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Review required before using any of these details.
            </Text>
          </View>

          <View style={{ borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' }}>
            {orchestrationEvidence.map((item, index) => (
              <View
                key={item.label}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: Spacing.sm,
                  padding: Spacing.md,
                  borderTopWidth: index > 0 ? 1 : 0,
                  borderTopColor: colors.borderLight,
                }}
              >
                <MaterialCommunityIcons name={item.icon} size={17} color={colors.textSecondary} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textTertiary }}>
                    {item.label}
                  </Text>
                  <Text style={{ marginTop: 2, fontSize: Typography.fontSize.sm, color: colors.textPrimary }} numberOfLines={1}>
                    {item.value}
                  </Text>
                </View>
              </View>
            ))}
          </View>

          {analyzeState.data.warnings.length > 0 ? (
            <View style={{ gap: Spacing.xs }}>
              {analyzeState.data.warnings.map((warning) => (
                <View key={warning} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
                  <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.textSecondary} style={{ marginTop: 1 }} />
                  <Text style={{ flex: 1, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                    {warning}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}

          {task === 'receipt_extract' && receiptDraft ? (
            <View style={{ gap: Spacing.sm }}>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Receipt review
              </Text>
              <View style={{ borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: colors.borderLight, overflow: 'hidden' }}>
                {[
                  {
                    label: 'Draft prepared',
                    done: Boolean(receiptDraft),
                    detail: 'AI extracted fields for review.',
                  },
                  {
                    label: 'Human approved',
                    done: canSaveReceiptDraft,
                    detail: canSaveReceiptDraft ? 'Ready to save.' : 'Approve after checking the fields.',
                  },
                  {
                    label: 'Saved record',
                    done: saveMessage === 'Reviewed receipt added to your transaction history.',
                    detail: 'Only saved records enter the ledger.',
                  },
                ].map((item, index) => (
                  <View
                    key={item.label}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      gap: Spacing.sm,
                      padding: Spacing.md,
                      borderTopWidth: index > 0 ? 1 : 0,
                      borderTopColor: colors.borderLight,
                    }}
                  >
                    <MaterialCommunityIcons
                      name={item.done ? 'check-circle-outline' : 'circle-outline'}
                      size={17}
                      color={item.done ? colors.success : colors.textTertiary}
                    />
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                        {item.label}
                      </Text>
                      <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                        {item.detail}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
              <Input
                label="Description"
                value={receiptDraft.description}
                onChangeText={(value) => updateReceiptDraft('description', value)}
                placeholder="Receipt purchase"
              />
              <Input
                label="Amount"
                value={receiptDraft.amount}
                onChangeText={(value) => updateReceiptDraft('amount', normalizeReceiptAmountInput(value))}
                keyboardType="number-pad"
                inputMode="numeric"
                prefix="Rs"
                placeholder="0"
              />
              <Input
                label="Transaction date"
                value={receiptDraft.transactionDate}
                onChangeText={(value) => updateReceiptDraft('transactionDate', value)}
                autoCapitalize="none"
                placeholder="YYYY-MM-DD"
              />

              <View style={{ gap: Spacing.xs }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  Category
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                  {EXPENSE_CATEGORIES.map((category) => {
                    const active = receiptDraft.categoryId === category.id;
                    return (
                      <TouchableOpacity
                        key={category.id}
                        activeOpacity={0.85}
                        onPress={() => updateReceiptDraft('categoryId', category.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: Spacing.md,
                          paddingVertical: Spacing.sm,
                          borderRadius: BorderRadius.full,
                          backgroundColor: active ? `${category.color}18` : colors.surface,
                          borderWidth: 1,
                          borderColor: active ? category.color : colors.borderLight,
                        }}
                      >
                        <MaterialCommunityIcons name={category.icon as never} size={16} color={active ? category.color : colors.textTertiary} />
                        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? category.color : colors.textSecondary }}>
                          {category.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ gap: Spacing.xs }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
                  Payment method
                </Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                  {PAYMENT_METHODS.map((method) => {
                    const active = receiptDraft.paymentMethod === method.id;
                    return (
                      <TouchableOpacity
                        key={method.id}
                        activeOpacity={0.85}
                        onPress={() => updateReceiptDraft('paymentMethod', method.id)}
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 6,
                          paddingHorizontal: Spacing.md,
                          paddingVertical: Spacing.sm,
                          borderRadius: BorderRadius.full,
                          backgroundColor: active ? colors.primaryBg : colors.surface,
                          borderWidth: 1,
                          borderColor: active ? colors.primary : colors.borderLight,
                        }}
                      >
                        <MaterialCommunityIcons name={method.icon as never} size={16} color={active ? colors.primary : colors.textTertiary} />
                        <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: active ? colors.primary : colors.textSecondary }}>
                          {method.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
                <Button
                  title={reviewDecision === 'approved' ? 'Approved' : 'Approve'}
                  icon="check-circle-outline"
                  variant={reviewDecision === 'approved' ? 'secondary' : 'primary'}
                  onPress={handleApproveReview}
                  style={{ flexGrow: 1, flexShrink: 1, flexBasis: 140 }}
                />
                <Button
                  title="Dismiss"
                  icon="close-circle-outline"
                  variant="outline"
                  disabled={reviewDecision === 'dismissed'}
                  onPress={handleDismissReview}
                  style={{ flexGrow: 1, flexShrink: 1, flexBasis: 120 }}
                />
                <Button
                  title="Save record"
                  icon="content-save-check-outline"
                  variant="secondary"
                  disabled={reviewDecision === 'dismissed'}
                  onPress={handleSaveTransaction}
                  style={{ flexGrow: 1, flexShrink: 1, flexBasis: 150 }}
                />
              </View>
              {saveMessage ? (
                <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                  {saveMessage}
                </Text>
              ) : null}
            </View>
          ) : task === 'receipt_extract' ? (
            <EmptyState
              icon="clipboard-alert-outline"
              title="Structured receipt fields were not found"
              message="MoneyKai still returned a review summary, but you will need to create the transaction details manually."
              style={{ paddingVertical: Spacing.lg, paddingHorizontal: 0 }}
            />
          ) : (
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
              General image analysis is advisory only. Review the summary above before using it anywhere else in MoneyKai.
            </Text>
          )}
        </Card>
      ) : null}

      {analysisError ? (
        <Card style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Analysis unavailable
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textSecondary }}>
            {analysisError}
          </Text>
        </Card>
      ) : null}
    </ScrollView>
  );
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
