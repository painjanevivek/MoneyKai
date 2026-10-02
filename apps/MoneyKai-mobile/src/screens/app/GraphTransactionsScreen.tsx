import React from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { TransactionsScreen } from './TransactionsScreen';

export function GraphTransactionsScreen({ route }: NativeStackScreenProps<RootStackParamList, 'GraphTransactions'>) {
  return <TransactionsScreen graphContext={route.params} />;
}
