import React from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
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
import { formatAiResponseText, withPlainTextAiStyle } from '@/features/ai/responseText';
import {
  useAiAttachmentAnalysis,
  useAiAttachmentUpload,
  useAiProviderStatus,
} from '@/features/ai/hooks';
import type { AiAttachmentAnalyzeTask } from '@/features/ai/types';
import { useTheme } from '@/hooks/useTheme';
import { useAuthStore } from '@/stores/useAuthStore';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';

type SelectedAsset = {
  uri: string;
  previewUri: string;
  file?: File;
  filename: string;
  mimeType: string;
  sizeBytes: number;
};

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

export default function AiReviewScreen() {
  const { colors } = useTheme();
  const userId = useAuthStore((state) => state.user?.id ?? 'local');
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isHydratingSession = useAuthStore((state) => state.isHydratingSession);
  const monthlyAllowance = useBudgetStore((state) => state.settings.monthly_allowance);
  const addTransaction = useTransactionStore((state) => state.addTransaction);
  const [task, setTask] = React.useState<AiAttachmentAnalyzeTask>('receipt_extract');
  const [prompt, setPrompt] = React.useState(() => buildDefaultAttachmentPrompt('receipt_extract'));
  const [selectedAsset, setSelectedAsset] = React.useState<SelectedAsset | null>(null);
  const [receiptDraft, setReceiptDraft] = React.useState<ReceiptReviewDraft | null>(null);
  const [saveMessage, setSaveMessage] = React.useState<string | null>(null);
  const { data: providerStatus, error: providerError, loading: loadingProviderStatus } = useAiProviderStatus();
  const uploadState = useAiAttachmentUpload();
  const analyzeState = useAiAttachmentAnalysis();

  const attachmentsReady = providerStatus?.enabled && providerStatus.attachmentsEnabled;
  const requiresSignIn = !isHydratingSession && !isAuthenticated;
  const analysisPending = uploadState.loading || analyzeState.loading;
  const analysisError = uploadState.error || analyzeState.error;
  const canAnalyze = Boolean(selectedAsset) && !analysisPending && attachmentsReady && isAuthenticated;

  const resetReviewState = React.useCallback((nextTask?: AiAttachmentAnalyzeTask) => {
    setReceiptDraft(null);
    setSaveMessage(null);
    uploadState.reset();
    analyzeState.reset();
    if (nextTask) {
      setPrompt(buildDefaultAttachmentPrompt(nextTask));
    }
  }, [analyzeState, uploadState]);

  const handleSelectTask = (nextTask: AiAttachmentAnalyzeTask) => {
    setTask(nextTask);
    resetReviewState(nextTask);
  };

  const pickImage = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Sign in before choosing a receipt or image for AI review.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    if (Platform.OS !== 'web') {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'MoneyKai needs photo library access to review a receipt or image.');
        return;
      }
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: false,
      quality: 0.85,
    });

    if (result.canceled || result.assets.length === 0) {
      return;
    }

    const asset = result.assets[0];
    setSelectedAsset({
      uri: asset.uri,
      previewUri: asset.uri,
      file: asset.file,
      filename: asset.fileName ?? `moneykai-${Date.now()}.jpg`,
      mimeType: asset.mimeType ?? 'image/jpeg',
      sizeBytes: asset.fileSize ?? 0,
    });
    resetReviewState();
  };

  const analyzeSelectedAsset = async () => {
    if (!selectedAsset) {
      return;
    }

    if (!isAuthenticated) {
      Alert.alert('Sign in required', 'Sign in before uploading an attachment for AI review.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    try {
      const formData = new FormData();
      appendSelectedAsset(formData, selectedAsset);

      const uploaded = await uploadState.upload(formData);
      const response = await analyzeState.analyze({
        task,
        message: withPlainTextAiStyle(prompt.trim() || buildDefaultAttachmentPrompt(task)),
        attachmentIds: [uploaded.attachmentId],
        context: {
          surface: 'mobile_ai_review',
          filename: selectedAsset.filename,
        },
      });

      setSaveMessage(null);
      setReceiptDraft(task === 'receipt_extract' ? createReceiptReviewDraft(response) : null);
    } catch {
      setReceiptDraft(null);
    }
  };

  const handleSaveTransaction = () => {
    if (!receiptDraft) {
      return;
    }

    const validationError = validateReceiptReviewDraft(receiptDraft);
    if (validationError) {
      Alert.alert('Review required', validationError);
      return;
    }

    if (monthlyAllowance <= 0) {
      Alert.alert('Monthly budget required', 'Set a monthly budget before adding a reviewed receipt transaction.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Set Budget', onPress: () => router.push('/(tabs)/budget') },
      ]);
      return;
    }

    const didAddTransaction = addTransaction({
      user_id: userId,
      type: 'expense',
      amount: Number(receiptDraft.amount),
      category: receiptDraft.categoryId,
      description: receiptDraft.description.trim(),
      payment_method: receiptDraft.paymentMethod,
      transaction_date: receiptDraft.transactionDate,
    });

    if (!didAddTransaction) {
      Alert.alert('Budget required', 'MoneyKai could not add this transaction until a monthly budget is set.');
      return;
    }

    setSaveMessage('Reviewed receipt added to your transaction history.');
  };

  const updateReceiptDraft = <K extends keyof ReceiptReviewDraft>(key: K, value: ReceiptReviewDraft[K]) => {
    setReceiptDraft((current) => (current ? { ...current, [key]: value } : current));
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={[]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: Spacing.base, paddingTop: Spacing.base, paddingBottom: Spacing['3xl'], gap: Spacing.base }}
      >
        <Card style={{ gap: Spacing.md }}>
          <View style={{ gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.xl, fontFamily: Typography.fontFamily.bold, color: colors.textPrimary }}>
              AI Attachment Review
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              Upload a receipt or image, review the AI output, and decide what happens next. MoneyKai never saves transaction data from AI automatically.
            </Text>
          </View>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.primaryBg }}>
              <Text style={{ fontSize: Typography.fontSize.xs, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary }}>
                {loadingProviderStatus
                  ? 'Checking AI status'
                  : attachmentsReady
                    ? 'Attachment analysis ready'
                    : 'Attachment analysis unavailable'}
              </Text>
            </View>
            {providerStatus?.defaultVisionModelConfigured ? (
              <View style={{ paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm, borderRadius: BorderRadius.full, backgroundColor: colors.surface }}>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  Vision model configured
                </Text>
              </View>
            ) : null}
          </View>
          {providerError ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              {providerError}
            </Text>
          ) : !providerStatus?.defaultVisionModelConfigured ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Vision analysis stays capability-gated. If the backend has no vision model configured, image analysis will remain unavailable.
            </Text>
          ) : null}
        </Card>

        {requiresSignIn ? (
          <Card style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Sign in to review attachments
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              AI review can inspect sensitive receipt and image content, so MoneyKai requires a signed-in session before selecting or uploading files.
            </Text>
            <Button title="Sign In" icon="login" variant="outline" onPress={() => router.push('/(auth)/login')} />
          </Card>
        ) : null}

        <AiModelConsole providerStatus={providerStatus} requiresSignIn={requiresSignIn} />

        <Card style={{ gap: Spacing.md }}>
          <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Review mode
          </Text>
          <View style={{ gap: Spacing.sm }}>
            {TASK_OPTIONS.map((option) => {
              const active = task === option.id;
              return (
                <TouchableOpacity
                  key={option.id}
                  activeOpacity={0.8}
                  onPress={() => handleSelectTask(option.id)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: Spacing.md,
                    borderRadius: BorderRadius.lg,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.borderLight,
                    backgroundColor: active ? colors.primaryBg : colors.surface,
                    padding: Spacing.md,
                  }}
                >
                  <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
                    <MaterialCommunityIcons name={option.icon} size={20} color={active ? colors.primary : colors.textSecondary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {option.title}
                    </Text>
                    <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                      {option.subtitle}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <Card style={{ gap: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.md }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                Attachment
              </Text>
              <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
                Receipts work best when the merchant, date, and amount are clearly visible.
              </Text>
            </View>
            <Button
              title={selectedAsset ? 'Replace' : 'Pick image'}
              icon="image-plus"
              size="sm"
              variant="outline"
              disabled={!isAuthenticated}
              onPress={pickImage}
            />
          </View>

          {selectedAsset ? (
            <View style={{ gap: Spacing.md }}>
              <Image
                source={selectedAsset.previewUri}
                contentFit="cover"
                style={{ width: '100%', height: 220, borderRadius: BorderRadius.lg, backgroundColor: colors.surface }}
              />
              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {selectedAsset.filename}
                </Text>
                <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                  {selectedAsset.mimeType} {selectedAsset.sizeBytes > 0 ? `| ${formatBytes(selectedAsset.sizeBytes)}` : ''}
                </Text>
              </View>
            </View>
          ) : (
            <EmptyState
              icon="file-image-outline"
              title="No image selected"
              message="Choose a receipt or screenshot to start a review-only AI analysis."
              style={{ paddingVertical: Spacing.xl, paddingHorizontal: 0 }}
            />
          )}

          <Input
            label="AI prompt"
            value={prompt}
            onChangeText={setPrompt}
            multiline
            numberOfLines={4}
            autoCapitalize="sentences"
            placeholder={buildDefaultAttachmentPrompt(task)}
          />

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button
              title="Analyse"
              icon="brain"
              fullWidth
              loading={analysisPending}
              disabled={!canAnalyze}
              onPress={analyzeSelectedAsset}
              style={{ flex: 1 }}
            />
          </View>
          {requiresSignIn ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Sign in before choosing or uploading a receipt or image.
            </Text>
          ) : !attachmentsReady ? (
            <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
              Configure AI attachments and a vision-capable model on the backend before using this workspace.
            </Text>
          ) : null}
        </Card>

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
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textPrimary }}>
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
                          activeOpacity={0.8}
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
                          activeOpacity={0.8}
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
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
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
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              {analysisError}
            </Text>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
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

function appendSelectedAsset(formData: FormData, asset: SelectedAsset): void {
  if (Platform.OS === 'web' && asset.file) {
    formData.append('file', asset.file, asset.filename);
    return;
  }

  formData.append('file', {
    uri: asset.uri,
    name: asset.filename,
    type: asset.mimeType,
  } as never);
}
