import React, { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalSheet } from '@/components/ui/ModalSheet';
import { ScreenBackButton } from '@/components/ui/ScreenBackButton';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { isFirebaseConfigured } from '@/firebase/firebaseConfig';
import { getCurrentFirebaseUser, updateFirebaseUserProfile } from '@/services/authService';
import { useAuthStore, type User } from '@/stores/useAuthStore';
import { useTheme } from '@/hooks/useTheme';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { pickAvatarImage } from '@/services/profileMediaPicker';
import { createAppScreenStyles } from './screenStyles';

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

const minimumDob = new Date(1940, 0, 1);

export function ProfileEditScreen() {
  const { colors } = useTheme();
  const styles = createAppScreenStyles(colors);
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const [name, setName] = useState(user?.full_name ?? '');
  const [avatarUrl, setAvatarUrl] = useState(user?.avatar_url ?? '');
  const [isPickingAvatar, setIsPickingAvatar] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showGenderSheet, setShowGenderSheet] = useState(false);
  const [showDobPicker, setShowDobPicker] = useState(false);
  const [dobDate, setDobDate] = useState(() => parseDob(user?.dob));
  const [gender, setGender] = useState<User['gender']>(user?.gender);
  const firebaseReady = isFirebaseConfigured();
  const maximumDob = new Date();

  useEffect(() => {
    setName(user?.full_name ?? '');
    setAvatarUrl(user?.avatar_url ?? '');
    setDobDate(parseDob(user?.dob));
    setGender(user?.gender);
  }, [user?.avatar_url, user?.dob, user?.full_name, user?.gender]);

  const selectedGenderLabel = GENDER_OPTIONS.find((option) => option.value === gender)?.label ?? 'Choose gender';

  const handleDobChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (Platform.OS === 'android') {
      setShowDobPicker(false);
    }

    if (event.type === 'set' && selectedDate) {
      setDobDate(selectedDate);
    }
  };

  const save = async () => {
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

      updateProfile({
        full_name: trimmedName,
        avatar_url: avatarUrl.trim() || undefined,
        dob: formatDob(dobDate),
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
        <View style={styles.header}>
          <ScreenBackButton />
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>{user?.email ?? 'Signed-in account'}</Text>
        </View>
        <View style={styles.panel}>
          <View style={{ alignItems: 'center', marginBottom: Spacing.lg }}>
            <UserAvatar name={name} email={user?.email} avatarUrl={avatarUrl.trim()} size={88} />
            <Text
              style={{
                color: colors.textSecondary,
                fontFamily: Typography.fontFamily.medium,
                fontSize: Typography.fontSize.sm,
                marginTop: Spacing.sm,
              }}
            >
              Avatar preview
            </Text>
          </View>
          <View style={{ marginBottom: Spacing.base }}>
            <Button
              title={isPickingAvatar ? 'Opening...' : 'Upload'}
              onPress={uploadAvatar}
              icon="image-plus"
              disabled={isPickingAvatar}
            />
          </View>
          <Input label="Display name" value={name} onChangeText={setName} icon="account-outline" />
          <Text style={[styles.muted, { marginBottom: Spacing.sm }]}>Date of birth</Text>
          <TouchableOpacity
            accessibilityRole="button"
            activeOpacity={0.84}
            onPress={() => setShowDobPicker(true)}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: BorderRadius.md,
              borderWidth: 1.5,
              flexDirection: 'row',
              marginBottom: Spacing.md,
              minHeight: 52,
              paddingHorizontal: Spacing.md,
            }}
          >
            <MaterialCommunityIcons name="calendar-month-outline" size={20} color={colors.textTertiary} />
            <Text
              style={{
                color: colors.textPrimary,
                flex: 1,
                fontFamily: Typography.fontFamily.medium,
                fontSize: Typography.fontSize.base,
                marginLeft: Spacing.sm,
              }}
            >
              {formatDisplayDob(dobDate)}
            </Text>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
          {showDobPicker ? (
            <DateTimePicker
              value={dobDate}
              mode="date"
              display={Platform.OS === 'android' ? 'calendar' : 'inline'}
              minimumDate={minimumDob}
              maximumDate={maximumDob}
              onChange={handleDobChange}
            />
          ) : null}
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setShowGenderSheet(true)}
            style={{
              alignItems: 'center',
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderRadius: BorderRadius.md,
              borderWidth: 1.5,
              flexDirection: 'row',
              marginBottom: Spacing.md,
              minHeight: 52,
              paddingHorizontal: Spacing.md,
            }}
          >
            <MaterialCommunityIcons name="account-heart-outline" size={20} color={colors.textTertiary} />
            <View style={{ flex: 1, marginLeft: Spacing.sm }}>
              <Text style={{ color: colors.textSecondary, fontSize: Typography.fontSize.xs }}>Gender</Text>
              <Text style={{ color: colors.textPrimary, fontFamily: Typography.fontFamily.medium, fontSize: Typography.fontSize.base }}>
                {selectedGenderLabel}
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-down" size={22} color={colors.textTertiary} />
          </TouchableOpacity>
          <Button title="Save profile" onPress={save} loading={isSavingProfile} />
        </View>
      </ScrollView>

      <ModalSheet
        visible={showGenderSheet}
        title="Gender"
        subtitle="Choose the option you want stored in your profile."
        onClose={() => setShowGenderSheet(false)}
      >
        <View style={{ gap: Spacing.sm }}>
          {GENDER_OPTIONS.map((option) => {
            const active = option.value === gender;
            return (
              <TouchableOpacity
                key={option.value}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                activeOpacity={0.84}
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
                {active && <MaterialCommunityIcons name="check-circle" size={20} color={colors.primary} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </ModalSheet>
    </SafeAreaView>
  );
}
