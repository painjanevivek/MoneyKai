import React from 'react';
import { Alert, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { PdfPasswordPromptSheet } from './PdfPasswordPromptSheet';
import { ParsedStatementReviewSheet } from './ParsedStatementReviewSheet';
import { PDF_PASSWORD_SAFETY_NOTICE } from '@/constants/financialEmailRules';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { isPdfStatementParsingEnabled } from '@/config/environment';
import { useTheme } from '@/hooks/useTheme';
import { financialDocumentApi } from '@/services/financialDocumentApi';
import { portfolioApi } from '@/services/portfolioApi';
import { reconciliationApi } from '@/services/reconciliationApi';
import { useFinancialDocumentStore } from '@/stores/useFinancialDocumentStore';
import { usePortfolioStore } from '@/stores/usePortfolioStore';
import { useReconciliationStore } from '@/stores/useReconciliationStore';
import type { FinancialDocument } from '@/types/financialDocument';

export const FinancialDocumentReviewCard: React.FC = () => {
  const { colors } = useTheme();
  const enabled = isPdfStatementParsingEnabled();
  const [showConsent, setShowConsent] = React.useState(false);
  const [showDocuments, setShowDocuments] = React.useState(false);
  const [showProfiles, setShowProfiles] = React.useState(false);
  const [passwordDocument, setPasswordDocument] = React.useState<FinancialDocument | undefined>();
  const [reviewDocument, setReviewDocument] = React.useState<FinancialDocument | undefined>();
  const [busy, setBusy] = React.useState<
    'refresh' | 'parse' | 'ai_summary' | 'password' | 'import' | 'reconcile' | 'approve' | 'ignore' | 'import_review' | 'delete_profile' | null
  >(null);
  const [busyProfileId, setBusyProfileId] = React.useState<string | undefined>();
  const documents = useFinancialDocumentStore((state) => state.documents);
  const reviewsByDocumentId = useFinancialDocumentStore((state) => state.reviewsByDocumentId);
  const aiSummariesByDocumentId = useFinancialDocumentStore((state) => state.aiSummariesByDocumentId);
  const passwordProfiles = useFinancialDocumentStore((state) => state.passwordProfiles);
  const status = useFinancialDocumentStore((state) => state.status);
  const consentAcceptedAt = useFinancialDocumentStore((state) => state.parsingConsentAcceptedAt);
  const acceptParsingConsent = useFinancialDocumentStore((state) => state.acceptParsingConsent);
  const setStatus = useFinancialDocumentStore((state) => state.setStatus);
  const setDocuments = useFinancialDocumentStore((state) => state.setDocuments);
  const addOrUpdateDocument = useFinancialDocumentStore((state) => state.addOrUpdateDocument);
  const setReview = useFinancialDocumentStore((state) => state.setReview);
  const setAiSummary = useFinancialDocumentStore((state) => state.setAiSummary);
  const setPasswordProfiles = useFinancialDocumentStore((state) => state.setPasswordProfiles);
  const removePasswordProfile = useFinancialDocumentStore((state) => state.removePasswordProfile);
  const upsertHolding = usePortfolioStore((state) => state.upsertHolding);
  const setPortfolioState = usePortfolioStore((state) => state.setPortfolioState);
  const upsertReviews = useReconciliationStore((state) => state.upsertReviews);

  const hydrateDocuments = React.useCallback(async () => {
    if (!enabled) {
      return;
    }
    try {
      const [nextStatus, nextDocuments, nextProfiles] = await Promise.all([
        financialDocumentApi.getStatus(),
        financialDocumentApi.listDocuments(),
        financialDocumentApi.listPasswordProfiles(),
      ]);
      setStatus(nextStatus);
      setDocuments(nextDocuments);
      setPasswordProfiles(nextProfiles);
    } catch (error) {
      Alert.alert('Document refresh failed', error instanceof Error ? error.message : 'Could not refresh documents.');
    }
  }, [enabled, setDocuments, setPasswordProfiles, setStatus]);

  const refreshDocuments = React.useCallback(async () => {
    setBusy('refresh');
    try {
      await hydrateDocuments();
    } finally {
      setBusy(null);
    }
  }, [hydrateDocuments]);

  React.useEffect(() => {
    if (enabled && consentAcceptedAt) {
      void hydrateDocuments();
    }
  }, [consentAcceptedAt, enabled, hydrateDocuments]);

  const handleAccept = () => {
    acceptParsingConsent();
    setShowConsent(false);
  };

  const handleParse = async (document: FinancialDocument) => {
    if (!consentAcceptedAt) {
      setShowConsent(true);
      return;
    }
    if (document.status === 'needs_password') {
      setPasswordDocument(document);
      return;
    }
    setBusy('parse');
    try {
      const response = await financialDocumentApi.parseDocument(document.id, { parsingConsentAcceptedAt: consentAcceptedAt });
      addOrUpdateDocument(response.document);
      if (response.review) {
        setReview(response.review);
        setReviewDocument(response.document);
      }
      await hydrateDocuments();
    } catch (error) {
      Alert.alert('Parse failed', error instanceof Error ? error.message : 'Could not parse this statement.');
    } finally {
      setBusy(null);
    }
  };

  const handleSubmitPassword = async (password: string, saveForProvider: boolean) => {
    if (!passwordDocument || !consentAcceptedAt) {
      return;
    }
    setBusy('password');
    try {
      const response = await financialDocumentApi.submitPassword(passwordDocument.id, {
        parsingConsentAcceptedAt: consentAcceptedAt,
        password,
        saveForProvider,
      });
      addOrUpdateDocument(response.document);
      if (response.review) {
        setReview(response.review);
        setReviewDocument(response.document);
      }
      setPasswordDocument(undefined);
      await hydrateDocuments();
    } catch (error) {
      Alert.alert('Password failed', error instanceof Error ? error.message : 'Could not unlock this statement.');
    } finally {
      setBusy(null);
    }
  };

  const handleOpenReview = async (document: FinancialDocument) => {
    setBusy('refresh');
    try {
      const response = await financialDocumentApi.getReview(document.id);
      addOrUpdateDocument(response.document);
      if (response.review) {
        setReview(response.review);
      }
      setReviewDocument(response.document);
    } catch (error) {
      Alert.alert('Review unavailable', error instanceof Error ? error.message : 'Could not load parsed review.');
    } finally {
      setBusy(null);
    }
  };

  const handleGenerateAiSummary = async () => {
    if (!reviewDocument || !consentAcceptedAt) {
      return;
    }
    setBusy('ai_summary');
    try {
      const response = await financialDocumentApi.summarizeDocumentAi(reviewDocument.id, {
        userConsentAcceptedAt: consentAcceptedAt,
      });
      addOrUpdateDocument(response.document);
      setAiSummary(response.document.id, response.aiSummary);
      setReviewDocument(response.document);
    } catch (error) {
      Alert.alert('AI summary failed', error instanceof Error ? error.message : 'Could not summarize this financial document.');
    } finally {
      setBusy(null);
    }
  };

  const handleImportHoldings = async () => {
    if (!reviewDocument) {
      return;
    }
    setBusy('import');
    try {
      const response = await portfolioApi.importParsedDocumentHoldings(reviewDocument.id);
      response.items.forEach(upsertHolding);
      setPortfolioState(await portfolioApi.getState());
      Alert.alert('Holdings imported', `${response.importedCount} holding rows were added to Wealth.`);
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Could not import parsed holdings.');
    } finally {
      setBusy(null);
    }
  };

  const handleReconcileTransactions = async () => {
    if (!reviewDocument) {
      return;
    }
    setBusy('reconcile');
    try {
      const response = await reconciliationApi.reconcileParsedDocument(reviewDocument.id);
      upsertReviews(response.items);
      Alert.alert(
        'Reconciliation queued',
        `${response.newCount} new, ${response.enrichCount} enrichments, ${response.duplicateCount} duplicates, ${response.conflictCount} conflicts.`
      );
    } catch (error) {
      Alert.alert('Reconciliation failed', error instanceof Error ? error.message : 'Could not reconcile parsed transactions.');
    } finally {
      setBusy(null);
    }
  };

  const handleApproveReview = async () => {
    if (!reviewDocument) {
      return;
    }
    setBusy('approve');
    try {
      const response = await financialDocumentApi.approveReview(reviewDocument.id);
      addOrUpdateDocument(response.document);
      setReview(response.review);
      Alert.alert('Review approved', 'The parsed statement review was approved without importing rows.');
      await hydrateDocuments();
    } catch (error) {
      Alert.alert('Approval failed', error instanceof Error ? error.message : 'Could not approve this statement review.');
    } finally {
      setBusy(null);
    }
  };

  const handleIgnoreReview = async () => {
    if (!reviewDocument) {
      return;
    }
    setBusy('ignore');
    try {
      const response = await financialDocumentApi.ignoreReview(reviewDocument.id);
      addOrUpdateDocument(response.document);
      setReview(response.review);
      Alert.alert('Review ignored', 'This parsed statement review was marked ignored.');
      await hydrateDocuments();
    } catch (error) {
      Alert.alert('Ignore failed', error instanceof Error ? error.message : 'Could not ignore this statement review.');
    } finally {
      setBusy(null);
    }
  };

  const handleImportReview = async () => {
    if (!reviewDocument) {
      return;
    }
    setBusy('import_review');
    try {
      const response = await financialDocumentApi.importReview(reviewDocument.id, {
        approveTransactions: true,
        approveHoldings: true,
      });
      addOrUpdateDocument(response.document);
      setReview(response.review);
      setPortfolioState(await portfolioApi.getState());
      Alert.alert(
        'Rows imported',
        `${response.importedTransactionCount} transactions and ${response.importedHoldingCount} holdings were imported.`
      );
      await hydrateDocuments();
    } catch (error) {
      Alert.alert('Import failed', error instanceof Error ? error.message : 'Could not import this statement review.');
    } finally {
      setBusy(null);
    }
  };

  const handleDeletePasswordProfile = async (profileId: string) => {
    setBusy('delete_profile');
    setBusyProfileId(profileId);
    try {
      await financialDocumentApi.deletePasswordProfile(profileId);
      removePasswordProfile(profileId);
    } catch (error) {
      Alert.alert('Delete failed', error instanceof Error ? error.message : 'Could not delete this password profile.');
    } finally {
      setBusy(null);
      setBusyProfileId(undefined);
    }
  };

  return (
    <>
      <Card style={{ marginBottom: Spacing.md }} variant="outlined">
        <View style={{ flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' }}>
          <View
            style={{
              width: 42,
              height: 42,
              borderRadius: BorderRadius.sm,
              backgroundColor: enabled ? colors.primaryBg : colors.accentLight,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <MaterialCommunityIcons name="file-document-check-outline" size={22} color={enabled ? colors.primary : colors.textTertiary} />
          </View>
          <View style={{ flex: 1, gap: Spacing.xs }}>
            <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
              Financial documents
            </Text>
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              {enabled
                ? consentAcceptedAt
                  ? `${status.reviewRequiredCount} reviews, ${status.needsPasswordCount} need password`
                  : 'Consent required before statement parsing.'
                : PDF_PASSWORD_SAFETY_NOTICE}
            </Text>
          </View>
        </View>
        <Button
          title={consentAcceptedAt ? 'Review Rules' : 'Accept Rules'}
          icon="file-lock-outline"
          onPress={() => setShowConsent(true)}
          variant={enabled ? 'outline' : 'ghost'}
          disabled={!enabled}
          style={{ marginTop: Spacing.md }}
        />
        <View style={{ flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap', marginTop: Spacing.sm }}>
          <Button
            title="Refresh"
            icon="refresh"
            onPress={refreshDocuments}
            loading={busy === 'refresh'}
            disabled={!enabled}
            variant="outline"
            style={{ flexGrow: 1 }}
          />
          <Button
            title="Documents"
            icon="file-search-outline"
            onPress={() => setShowDocuments(true)}
            disabled={documents.length === 0}
            style={{ flexGrow: 1 }}
          />
          <Button
            title="Saved Passwords"
            icon="lock-check-outline"
            onPress={() => setShowProfiles(true)}
            disabled={!enabled}
            variant="outline"
            style={{ flexGrow: 1 }}
          />
        </View>
      </Card>

      <ModalSheet
        visible={showConsent}
        title="Statement parsing"
        subtitle="MoneyKai can parse your own financial statements only after explicit approval."
        onClose={() => setShowConsent(false)}
        footer={
          <View style={{ gap: Spacing.sm }}>
            <Button title="Accept Parsing Rules" icon="shield-check-outline" onPress={handleAccept} />
            <Button title="Not Now" onPress={() => setShowConsent(false)} variant="outline" />
          </View>
        }
      >
        <View style={{ gap: Spacing.md }}>
          {[
            'Password-protected PDFs require a user-entered password or a saved user-approved pattern.',
            'MoneyKai will not brute force, crack, or silently unlock arbitrary PDFs.',
            'Parsed rows must be reviewed before import in early versions.',
            'Raw source documents should be temporary unless retention is explicitly enabled later.',
          ].map((item) => (
            <View key={item} style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' }}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={colors.primary} />
              <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, color: colors.textSecondary, lineHeight: 20 }}>
                {item}
              </Text>
            </View>
          ))}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showDocuments}
        title="Document queue"
        subtitle="Review queued statements, unlock password-protected PDFs, and inspect parsed rows."
        onClose={() => setShowDocuments(false)}
        footer={<Button title="Close" onPress={() => setShowDocuments(false)} variant="outline" />}
      >
        <View style={{ gap: Spacing.sm }}>
          {documents.length === 0 ? (
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              No financial documents have been queued yet.
            </Text>
          ) : (
            documents.map((document) => (
              <DocumentRow
                key={document.id}
                document={document}
                busy={busy !== null}
                onParse={handleParse}
                onPassword={setPasswordDocument}
                onReview={handleOpenReview}
              />
            ))
          )}
        </View>
      </ModalSheet>

      <ModalSheet
        visible={showProfiles}
        title="Saved PDF passwords"
        subtitle="Provider-linked password profiles are encrypted server-side and can be removed here."
        onClose={() => setShowProfiles(false)}
        footer={<Button title="Close" onPress={() => setShowProfiles(false)} variant="outline" />}
      >
        <View style={{ gap: Spacing.sm }}>
          {passwordProfiles.length === 0 ? (
            <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
              No saved provider password profiles yet.
            </Text>
          ) : (
            passwordProfiles.map((profile) => (
              <View key={profile.id} style={{ paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: Spacing.sm }}>
                <View style={{ flexDirection: 'row', gap: Spacing.sm, alignItems: 'center' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                      {profile.label}
                    </Text>
                    <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                      {profile.providerKey} | {profile.mode}
                    </Text>
                  </View>
                  <Button
                    title="Delete"
                    icon="trash-can-outline"
                    size="sm"
                    variant="outline"
                    loading={busy === 'delete_profile' && busyProfileId === profile.id}
                    onPress={() => handleDeletePasswordProfile(profile.id)}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ModalSheet>

      {passwordDocument ? (
        <PdfPasswordPromptSheet
          visible
          document={passwordDocument}
          loading={busy === 'password'}
          onClose={() => setPasswordDocument(undefined)}
          onSubmit={handleSubmitPassword}
        />
      ) : null}

      <ParsedStatementReviewSheet
        visible={Boolean(reviewDocument)}
        document={reviewDocument}
        review={reviewDocument ? reviewsByDocumentId[reviewDocument.id] : undefined}
        aiSummary={reviewDocument ? aiSummariesByDocumentId[reviewDocument.id] : undefined}
        summarizingAiSummary={busy === 'ai_summary'}
        importingHoldings={busy === 'import'}
        reconcilingTransactions={busy === 'reconcile'}
        approvingReview={busy === 'approve'}
        ignoringReview={busy === 'ignore'}
        importingReview={busy === 'import_review'}
        onImportHoldings={handleImportHoldings}
        onReconcileTransactions={handleReconcileTransactions}
        onApproveReview={handleApproveReview}
        onIgnoreReview={handleIgnoreReview}
        onImportReview={handleImportReview}
        onGenerateAiSummary={handleGenerateAiSummary}
        onClose={() => setReviewDocument(undefined)}
      />
    </>
  );
};

const DocumentRow = ({
  document,
  busy,
  onParse,
  onPassword,
  onReview,
}: {
  document: FinancialDocument;
  busy: boolean;
  onParse: (document: FinancialDocument) => void;
  onPassword: (document: FinancialDocument) => void;
  onReview: (document: FinancialDocument) => void;
}) => {
  const { colors } = useTheme();
  const action =
    document.status === 'needs_password'
      ? { title: 'Password', icon: 'lock-outline' as const, onPress: () => onPassword(document) }
      : document.status === 'review_required'
        ? { title: 'Review', icon: 'file-search-outline' as const, onPress: () => onReview(document) }
        : { title: 'Parse', icon: 'file-cog-outline' as const, onPress: () => onParse(document) };

  return (
    <View style={{ paddingVertical: Spacing.md, borderBottomWidth: 1, borderBottomColor: colors.borderLight, gap: Spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            {document.filename}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
            {document.documentType} | {document.status} | {document.pageCount ?? 0} pages
          </Text>
        </View>
        <Button
          title={action.title}
          icon={action.icon}
          onPress={action.onPress}
          disabled={busy}
          size="sm"
          variant="outline"
        />
      </View>
      {document.parsedSummary ? (
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          {document.parsedSummary.transactionCount} rows extracted
        </Text>
      ) : null}
    </View>
  );
};
