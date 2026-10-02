import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, View } from 'react-native';
import { AppText as Text } from '@/components/ui/AppText';
import { AppDatePicker as DateTimePicker, type AppDatePickerEvent as DateTimePickerEvent } from '@/components/calendar/AppDatePicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppIcon } from '@/components/ui/AppIcon';
import { PressableScale } from '@/components/ui/PressableScale';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { CenteredPageHeader } from '@/components/ui/CenteredPageHeader';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { isFirebaseConfigured } from '@/firebase/firebaseConfig';
import { getCurrentFirebaseUser, updateFirebaseUserProfile } from '@/services/authService';
import { useAuthStore, type User } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { pickAvatarImage } from '@/services/profileMediaPicker';
import { createAppScreenStyles } from './screenStyles';
import { PhoneNumberField } from '@/components/transactions/PhoneNumberField';
import { useTransactionPreferencesStore } from '@/stores/useTransactionPreferencesStore';
import { normalizedPhone } from '@/utils/transactionPreferences';

const GENDER_OPTIONS: Array<{ value: NonNullable<User['gender']>; label: string }> = [
  { value: 'female', label: 'Female' },
  { value: 'male', label: 'Male' },
  { value: 'non_binary', label: 'Non-binary' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
  { value: 'self_describe', label: 'Self describe' },
];

const parseDob = (dob?: string) => {
  const [year, month, day] = dob?.split('-') ?? [];
  const parsedYear = year && /^\d{4}$/.test(year) ? Number(year) : 2000;
  const parsedMonth = month && /^\d{2}$/.test(month) ? Number(month) - 1 : 0;
  const parsedDay = day && /^\d{2}$/.test(day) ? Number(day) : 1;
  const parsedDate = new Date(parsedYear, parsedMonth, parsedDay);

  return Number.isNaN(parsedDate.getTime()) ? new Date(2000, 0, 1) : parsedDate;
};

const padDatePart = (value: number) => String(value).padStart(2, '0');

const formatDob = (date: Date) =>
  `${date.getFullYear()}-${padDatePart(date.getMonth() + 1)}-${padDatePart(date.getDate())}`;

const formatDisplayDob = (date: Date) =>
  new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);

const minimumDob = new Date(1900, 0, 1);

export function ProfileEditScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const storedPhone = useTransactionPreferencesStore(state => user ? state.phones[user.id] : undefined);
  const [phoneCode, setPhoneCode] = useState(storedPhone?.countryCode ?? '+91');
  const [phoneNumber, setPhoneNumber] = useState(storedPhone?.nationalNumber ?? '');
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [name, setName] = useState(user?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobChosen, setDobChosen] = useState(Boolean(user?.dob));
  const [dobDate, setDobDate] = useState(() => parseDob(user?.dob));
  const [gender, setGender] = useState<User['gender']>(user?.gender);
  const firebaseReady = isFirebaseConfigured();
  const maximumDob = new Date();

  useEffect(() => {
    setName(user?.full_name ?? '');
    setAvatarUrl(user?.avatar_url ?? '');
    setDobDate(parseDob(user?.dob));
    setDobChosen(Boolean(user?.dob));
    setGender(user?.gender);
  }, [user?.avatar_url, user?.dob, user?.full_name, user?.gender]);

  const selectedGenderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? 'Not set';

  const handleDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowDobPicker(false);

    if (event.type === 'set' && selectedDate) {
      setDobDate(selectedDate);
      setDobChosen(true);
    }
  };

  const save = async () => {
    if (!user || !normalizedPhone(phoneCode, phoneNumber)) { Alert.alert('Phone number required', 'Enter a valid country code and phone number.'); return; }
    const trimmedName = name.trim();
    if (!trimmedName) {
      Alert.alert('Name required', 'Enter a display name.');
      return;
    }

    setIsSavingProfile(true);
    try {
      if (firebaseReady) {
        const firebaseUser = getCurrentFirebaseUser();
        if (firebaseUser) {
          await updateFirebaseUserProfile(firebaseUser, {
            displayName: trimmedName,
            photoURL: avatarUrl.trim() || undefined,
          });
        }
      }

      if (!useTransactionPreferencesStore.getState().setPhone(user.id, phoneCode, phoneNumber)) throw new Error('Your session changed. Reopen your profile.');
      updateProfile({
        full_name: trimmedName,
        avatar_url: avatarUrl.trim() || undefined,
        dob: dobChosen ? formatDob(dobDate) : undefined,
        gender,
      });
      Alert.alert('Profile updated', 'Your profile was updated and queued for backup.');
    } catch (error) {
      Alert.alert('Profile save failed', error instanceof Error ? error.message : 'Could not save your profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const uploadAvatar = async () => {
    setIsPickingAvatar(true);
    try {
      const pickedImage = await pickAvatarImage();
      if (pickedImage?.uri) {
        setAvatarUrl(pickedImage.uri);
      }
    } catch (error) {
      Alert.alert('Avatar upload unavailable', error instanceof Error ? error.message : 'Choose another image source.');
    } finally {
      setIsPickingAvatar(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <CenteredPageHeader title="Profile details" leftAction={<ScreenBackButton compact />} />
        <View style={styles.panel}>
          <View style={{ alignItems: 'center', marginBottom: Spacing.xl }}>
            <PressableScale accessibilityRole="button" accessibilityLabel={isPickingAvatar ? 'Opening photo picker' : 'Change profile photo'} disabled={isPickingAvatar} onPress={() => void uploadAvatar()} style={{ alignItems: 'center', gap: Spacing.sm }}>
              <UserAvatar name={name} email={user?.email} avatarUrl={avatarUrl.trim()} size={80} />
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.sm }}>{isPickingAvatar ? 'Opening…' : 'Change photo'}</Text>
            </PressableScale>
          </View>
          <Text accessibilityRole="header" style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md, marginBottom: Spacing.base }}>Personal details</Text>
          <Input variant="outlined" label="Display name" placeholder="Your name" value={name} onChangeText={setName} maxLength={100} autoComplete="name" textContentType="name" autoCapitalize="words" autoCorrect={false} />
          <PhoneNumberField outlined code={phoneCode} number={phoneNumber} onCode={setPhoneCode} onNumber={setPhoneNumber} />
          <View style={{ borderTopWidth: 1, borderTopColor: colors.borderLight, marginTop: Spacing.sm, paddingTop: Spacing.lg, marginBottom: Spacing.md }}>
            <Text accessibilityRole="header" style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.semiBold, fontSize: Typography.fontSize.md }}>About you <Text style={{ color: colors.textSecondary, fontFamily: Typography.fontFamily.regular, fontSize: Typography.fontSize.sm }}>· Optional</Text></Text>
          </View>
          <ProfileChoice label="Date of birth" value={dobChosen ? formatDisplayDob(dobDate) : 'Not set'} icon="calendar-month-outline" onPress={() => setShowDobPicker(true)} />
          {showDobPicker ? <DateTimePicker title="Date of birth" value={dobDate} mode="date" display={Platform.OS === 'android' ? 'calendar' : 'inline'} minimumDate={minimumDob} maximumDate={maximumDob} onChange={handleDobChange} /> : null}
          <ProfileChoice label="Gender" value={selectedGenderLabel} icon="account-outline" onPress={() => setShowGenderSheet(true)} />
          <Button title="Save profile" onPress={save} loading={isSavingProfile} />
        </View>
      </ScrollView>

      <ModalSheet
        visible={showGenderSheet}
        title="Gender"
        onClose={() => setShowGenderSheet(false)}
      >
        <View style={{ gap: Spacing.sm }}>
          {GENDER_OPTIONS.map((option) => {
            const active = option.value === gender;
            return (
              <PressableScale
                key={option.value}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                onPress={() => {
                  setGender(option.value);
                  setShowGenderSheet(false);
                }}
                style={{
                  alignItems: 'center',
                  backgroundColor: active ? colors.primaryBg : colors.surface,
                  borderColor: active ? colors.primary : colors.borderLight,
                  borderRadius: BorderRadius.sm,
                  borderWidth: 1,
                  flexDirection: 'row',
                  minHeight: 52,
                  paddingHorizontal: Spacing.md,
                }}
              >
                <Text style={{ flex: 1, color: colors.textPrimary, fontFamily: Typography.fontFamily.medium }}>
                  {option.label}
                </Text>
                {active ? <AppIcon name="check" size={20} color={colors.textPrimary} /> : null}
              </PressableScale>
            );
          })}
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}

function ProfileChoice({ label, value, icon, onPress }: { label: string; value: string; icon: string; onPress: () => void }) {
  const { colors } = useTheme();
  return <PressableScale accessibilityRole="button" accessibilityLabel={`${label}, ${value}`} onPress={onPress} style={{ alignItems: 'center', flexDirection: 'row', borderColor: colors.border, borderWidth: 1, borderRadius: BorderRadius.md, backgroundColor: colors.surface, minHeight: 64, paddingHorizontal: Spacing.md, marginBottom: Spacing.md, gap: Spacing.md }}>
    <AppIcon name={icon} size={20} color={colors.textSecondary} />
    <View style={{ flex: 1, minWidth: 0 }}>
      <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs, marginBottom: Spacing.xs }}>{label}</Text>
      <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base }}>{value}</Text>
    </View>
    <AppIcon name="chevron-right" size={20} color={colors.textSecondary} />
  </PressableScale>;
}
