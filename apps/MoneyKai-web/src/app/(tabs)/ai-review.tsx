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
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
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
    detail: 'Sending the selected file to the backend AI route.',
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
  const [task, setTask] = React.useState<AiAttachmentAnalyzeTask>('receipt_extract');
  const [prompt, setPrompt] = React.useState(() => buildDefaultAttachmentPrompt('receipt_extract'));
  const [selectedAsset, setSelectedAsset] = React.useState<SelectedAsset | null>(null);
  const [receiptDraft, setReceiptDraft] = React.useState<ReceiptReviewDraft | null>(null);
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
  const isWide = width >= 1120;

  React.useEffect(() => {
    return () => {
      if (selectedAsset?.previewUri) {
        URL.revokeObjectURL(selectedAsset.previewUri);
      }
    };
  }, [selectedAsset]);

  const resetReviewState = React.useCallback((nextTask?: AiAttachmentAnalyzeTask) => {
    setReceiptDraft(null);
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
      setReceiptDraft(task === 'receipt_extract' ? createReceiptReviewDraft(response) : null);
      analysisProgress.succeed();
    } catch {
      setReceiptDraft(null);
      analysisProgress.fail();
    }
  };

  const handleSaveTransaction = () => {
    if (!receiptDraft) {
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

    setSaveMessage('Reviewed receipt added to your transaction history.');
  };

  const updateReceiptDraft = <K extends keyof ReceiptReviewDraft>(key: K, value: ReceiptReviewDraft[K]) => {
    setReceiptDraft((current) => (current ? { ...current, [key]: value } : current));
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

      <Card style={{ gap: Spacing.md, padding: Spacing.md }}>
        <View style={{ flexDirection: isWide ? 'row' : 'column', alignItems: isWide ? 'center' : 'stretch', justifyContent: 'space-between', gap: Spacing.md }}>
          <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              AI review workspace
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Ask a question, upload an image, then review every AI result before using it.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg, borderWidth: 1, borderColor: colors.glassBorder }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                {loadingProviderStatus
                  ? 'Checking AI status'
                  : attachmentsReady
                    ? 'Analysis ready'
                    : 'Analysis unavailable'}
              </Text>
            </View>
            {providerStatus?.defaultVisionModelConfigured ? (
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.borderLight }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  Vision ready
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        {providerError ? (
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            {providerError}
          </Text>
        ) : providerStatus?.error ? (
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            {providerStatus.error}
          </Text>
        ) : !providerStatus?.defaultVisionModelConfigured ? (
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            Vision analysis stays capability-gated. If the backend has no vision model configured, image analysis will remain unavailable.
          </Text>
        ) : null}
      </Card>

      <View style={{ flexDirection: isWide ? 'row' : 'column', gap: Spacing.xl, alignItems: 'stretch' }}>
        <AiModelConsole
          providerStatus={providerStatus}
          requiresSignIn={requiresSignIn}
          containerStyle={{ flex: isWide ? 0.86 : undefined, minWidth: 0 }}
        />

        <Card style={{ flex: isWide ? 1.14 : undefined, minWidth: 0, gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.md }}>
            <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Image review
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                Add an image, choose a review mode, adjust the prompt, then analyse.
              </Text>
            </View>
            <Button title={selectedAsset ? 'Replace' : 'Pick image'} icon="image-plus" size="sm" variant="outline" onPress={handlePickImage} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {TASK_OPTIONS.map((option) => {
              const active = task === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.85}
                  onPress={() => handleSelectTask(option.id)}
                  style={{
                    flex: 1,
                    minWidth: 180,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.sm,
                    borderRadius: BorderRadius.md,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.glassBorder,
                    backgroundColor: active ? colors.primaryBg : colors.surface,
                    padding: Spacing.sm,
                  }}
                >
                  <View style={{ width: 34, height: 34, borderRadius: BorderRadius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={option.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                      {option.title}
                    </Text>
                    <Text style={{ marginTop: 1, fontSize: 11, lineHeight: 15, color: colors.textSecondary }} numberOfLines={2}>
                      {option.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedAsset ? (
            <View style={{ gap: Spacing.sm }}>
              <Image
                source={selectedAsset.previewUri}
                contentFit="cover"
                style={{ width: '100%', height: isWide ? 220 : 260, borderRadius: BorderRadius.lg, backgroundColor: colors.surface }}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: Spacing.sm }}>
                <Text style={{ flex: 1, minWidth: 180, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }} numberOfLines={1}>
                  {selectedAsset.filename}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  {selectedAsset.mimeType} | {formatBytes(selectedAsset.sizeBytes)}
                </Text>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              activeOpacity={0.86}
              onPress={handlePickImage}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: isWide ? 220 : 260,
                borderRadius: BorderRadius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.glassBorder,
                backgroundColor: colors.surface,
                padding: Spacing.xl,
                gap: Spacing.sm,
              }}
            >
              <View style={{ width: 52, height: 52, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg, alignItems: 'center', justifyContent: 'center' }}>
                <MaterialCommunityIcons name="image-plus" size={24} color={colors.primary} />
              </View>
              <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Add image
              </Text>
              <Text style={{ maxWidth: 320, textAlign: 'center', fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                Choose a receipt or screenshot. Results stay review-only until you save them.
              </Text>
            </TouchableOpacity>
          )}

          {pickerError ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              {pickerError}
            </Text>
          ) : null}

          <Input
            label="Prompt"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={3}
            autoCapitalize="sentences"
            placeholder={buildDefaultAttachmentPrompt(task)}
            style={{ marginBottom: 0 }}
          />

          <Button
            title="Analyse"
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
            successMessage="Analysis is ready for human review."
            title="Analysing attachment"
          />
          {!attachmentsReady ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Analyse will run through the backend vision provider. If credentials are missing, MoneyKai will show the setup issue instead of silently doing nothing.
            </Text>
          ) : null}
        </Card>
      </View>

      {analyzeState.data ? (
        <Card style={{ gap: Spacing.md }}>
          <View style={{ gap: 4 }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              AI review
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
              Review the result before using it.
            </Text>
          </View>

          <View style={{ borderRadius: BorderRadius.lg, backgroundColor: colors.surface, padding: Spacing.md, gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 22, color: colors.textPrimary }}>
              {formatAiResponseText(analyzeState.data.message)}
            </Text>
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Review required before using any of these details.
            </Text>
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

              <Button title="Add reviewed transaction" icon="check" onPress={handleSaveTransaction} />
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
