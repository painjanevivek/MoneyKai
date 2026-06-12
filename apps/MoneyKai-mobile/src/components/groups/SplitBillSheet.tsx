import React, { useMemo, useState } from 'react';
import { Alert, Linking, Share, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '@/hooks/useTheme';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { formatCurrency } from '@/utils/formatCurrency';
import { Typography, BorderRadius, Spacing } from '@/constants/theme';

type Recipient = {
  id: string;
  name?: string;
  email: string;
  source: 'manual' | 'contact';
};

interface SplitBillSheetProps {
  visible: boolean;
  groupName: string;
  payerName: string;
  onClose: () => void;
}

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

export const SplitBillSheet: React.FC<SplitBillSheetProps> = ({ visible, groupName, payerName, onClose }) => {
  const { colors } = useTheme();
  const [billTitle, setBillTitle] = useState(() => `${groupName} split bill`);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [pendingEmail, setPendingEmail] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [sending, setSending] = useState(false);
  const [pickingContact, setPickingContact] = useState(false);

  const amountValue = useMemo(() => {
    const parsed = Number(amount.replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amount]);

  const perPerson = recipients.length > 0 ? amountValue / recipients.length : 0;

  const addRecipient = (recipient: Recipient) => {
    const normalizedEmail = recipient.email.trim().toLowerCase();
    if (!isValidEmail(normalizedEmail)) {
      Alert.alert('Invalid email', 'Enter a valid email address.');
      return;
    }

    setRecipients((current) => {
      if (current.some((item) => item.email.toLowerCase() === normalizedEmail)) {
        return current;
      }
      return [...current, { ...recipient, email: normalizedEmail }];
    });
    setPendingEmail('');
  };

  const handleAddManualRecipient = () => {
    const email = pendingEmail.trim();
    if (!email) {
      return;
    }

    addRecipient({
      id: `manual_${Date.now()}`,
      email,
      source: 'manual',
    });
  };

  const handlePickContact = () => {
    setPickingContact(false);
    Alert.alert(
      'Contacts picker not configured',
      'The Expo contacts picker was removed for the CLI build. Add recipients manually by email for now.'
    );
  };

  const handleSend = async () => {
    if (recipients.length === 0) {
      Alert.alert('Add recipients', 'Add one person, two people, or a group before sending.');
      return;
    }

    if (!amountValue || amountValue <= 0) {
      Alert.alert('Add an amount', 'Enter the bill total first.');
      return;
    }

    setSending(true);
    try {
      const subject = `MoneyKai split bill: ${billTitle.trim() || groupName}`;
      const recipientList = recipients.map((recipient) => recipient.email).join(',');
      const summaryLines = [
        `MoneyKai split bill`,
        `Group: ${groupName}`,
        `Bill: ${billTitle.trim() || groupName}`,
        `Total: ${formatCurrency(amountValue)}`,
        `Recipients: ${recipients.length}`,
        `Share per person: ${formatCurrency(perPerson)}`,
        note.trim() ? `Note: ${note.trim()}` : null,
        '',
        `Sent by: ${payerName}`,
        '',
        'Recipients:',
        ...recipients.map((recipient, index) => `${index + 1}. ${recipient.name ? `${recipient.name} <${recipient.email}>` : recipient.email}`),
      ].filter(Boolean) as string[];

      const body = summaryLines.join('\n');
      const mailtoUrl = `mailto:${recipientList}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      const canOpenMail = await Linking.canOpenURL(mailtoUrl).catch(() => false);
      if (canOpenMail) {
        await Linking.openURL(mailtoUrl);
      } else {
        await Share.share({
          title: subject,
          message: body,
        });
      }

      onClose();
    } catch (error) {
      Alert.alert('Unable to share', error instanceof Error ? error.message : 'Could not open the email composer.');
    } finally {
      setSending(false);
    }
  };

  return (
    <ModalSheet
      visible={visible}
      title="Share split bill"
      subtitle="Add one person, two people, or a group. Manual email entry stays available in the CLI build."
      onClose={onClose}
      maxHeight={760}
      footer={
        <View style={{ gap: Spacing.sm, marginTop: Spacing.md }}>
          <Button title="Send email" onPress={handleSend} loading={sending} fullWidth />
          <Button title="Cancel" onPress={onClose} variant="outline" fullWidth disabled={sending || pickingContact} />
        </View>
      }
    >
      <View style={{ gap: Spacing.md }}>
        <View
          style={{
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            backgroundColor: colors.primaryBg,
            borderWidth: 1,
            borderColor: `${colors.primary}20`,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textPrimary, marginBottom: 4 }}>
            {groupName}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            Add recipients one by one. The email composer will open with a ready-to-send split summary.
          </Text>
        </View>

        <Input label="Bill name" placeholder="Dinner, trip fuel, groceries..." value={billTitle} onChangeText={setBillTitle} icon="receipt-text-outline" />
        <Input
          label="Total amount"
          placeholder="0"
          value={amount}
          onChangeText={(value) => setAmount(value.replace(/[^0-9.]/g, ''))}
          keyboardType="numeric"
          prefix={'\u20b9'}
          icon="currency-inr"
        />
        <Input label="Note" placeholder="Optional note for the people you're sharing with" value={note} onChangeText={setNote} icon="note-text-outline" />

        <View style={{ gap: Spacing.sm }}>
          <Input
            label="Add an email"
            placeholder="name@example.com"
            value={pendingEmail}
            onChangeText={setPendingEmail}
            keyboardType="email-address"
            icon="email-outline"
          />
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Button title="Add email" onPress={handleAddManualRecipient} variant="outline" style={{ flex: 1 }} />
            <Button
              title={pickingContact ? 'Opening...' : 'Use contacts'}
              onPress={handlePickContact}
              variant="outline"
              style={{ flex: 1 }}
              disabled={pickingContact}
              icon="account-search-outline"
            />
          </View>
        </View>

        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.medium, color: colors.textSecondary }}>
            Recipients
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm }}>
            {recipients.length > 0 ? (
              recipients.map((recipient) => (
                <View
                  key={recipient.email}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 6,
                    paddingHorizontal: Spacing.md,
                    paddingVertical: 6,
                    borderRadius: BorderRadius.full,
                    backgroundColor: colors.surface,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <MaterialCommunityIcons name={recipient.source === 'contact' ? 'account' : 'email-outline'} size={14} color={colors.textTertiary} />
                  <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textPrimary }}>
                    {recipient.name ? `${recipient.name} · ${recipient.email}` : recipient.email}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setRecipients((current) => current.filter((item) => item.email !== recipient.email))}
                    hitSlop={10}
                  >
                    <MaterialCommunityIcons name="close-circle" size={16} color={colors.textTertiary} />
                  </TouchableOpacity>
                </View>
              ))
            ) : (
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18 }}>
                Add one person for a single split, two people for a duo, or keep adding recipients for a group share.
              </Text>
            )}
          </View>
        </View>

        <View
          style={{
            padding: Spacing.md,
            borderRadius: BorderRadius.md,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary, marginBottom: 4 }}>
            Preview
          </Text>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary, lineHeight: 18 }}>
            {recipients.length > 0
              ? `${recipients.length} recipient${recipients.length > 1 ? 's' : ''} will receive an email with a per-person share of ${formatCurrency(perPerson)}.`
              : 'Your split summary will appear here once recipients are added.'}
          </Text>
          {note.trim() ? (
            <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary, lineHeight: 18, marginTop: 8 }}>
              Note: {note.trim()}
            </Text>
          ) : null}
        </View>
      </View>
    </ModalSheet>
  );
};

export default SplitBillSheet;
