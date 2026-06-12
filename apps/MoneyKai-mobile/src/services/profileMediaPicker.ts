import { NativeModules } from 'react-native';

interface PickedAvatarImage {
  uri: string;
  name?: string;
}

interface MoneyKaiProfileMediaModule {
  pickAvatarImage: () => Promise<PickedAvatarImage | null>;
}

const profileMedia = NativeModules.MoneyKaiProfileMedia as MoneyKaiProfileMediaModule | undefined;

export const pickAvatarImage = async (): Promise<PickedAvatarImage | null> => {
  if (!profileMedia?.pickAvatarImage) {
    throw new Error('Avatar upload is not available on this build.');
  }

  return profileMedia.pickAvatarImage();
};
