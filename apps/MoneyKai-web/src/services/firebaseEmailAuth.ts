import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updatePassword,
  updateProfile,
  type UserCredential,
} from 'firebase/auth';
import { firebaseAuth } from '@/services/firebase';

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const signInWithEmailFirebase = (
  email: string,
  password: string,
): Promise<UserCredential> =>
  signInWithEmailAndPassword(firebaseAuth, normalizeEmail(email), password);

export const createUserWithEmailFirebase = async (
  email: string,
  password: string,
  displayName: string,
): Promise<UserCredential> => {
  const credentials = await createUserWithEmailAndPassword(
    firebaseAuth,
    normalizeEmail(email),
    password,
  );

  await updateProfile(credentials.user, { displayName: displayName.trim() });
  return credentials;
};

export const requestPasswordResetEmailFirebase = (email: string): Promise<void> =>
  sendPasswordResetEmail(firebaseAuth, normalizeEmail(email));

export const changeEmailPasswordFirebase = async (
  email: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  const user = firebaseAuth.currentUser;
  if (!user?.email) {
    throw new Error('Sign in with your email account before changing your password.');
  }

  const normalizedEmail = normalizeEmail(email);
  if (user.email.toLowerCase() !== normalizedEmail) {
    throw new Error('Enter the email address for your signed-in MoneyKai account.');
  }

  const credential = EmailAuthProvider.credential(normalizedEmail, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};
