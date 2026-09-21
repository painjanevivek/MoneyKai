import React from 'react';
import type { StyleProp, TextStyle } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';

const ICON_MAP: Record<string, string> = {
  'account-circle-outline': 'user',
  'account-group-outline': 'users',
  'account-multiple-outline': 'users',
  'account-multiple-plus-outline': 'user-plus',
  'account-outline': 'user',
  'alert-circle-outline': 'alert-circle',
  'arrow-left': 'arrow-left',
  'arrow-bottom-left': 'arrow-down-left',
  'arrow-top-right': 'arrow-up-right',
  'bank-outline': 'briefcase',
  'bank-transfer': 'repeat',
  'bell-outline': 'bell',
  'calendar-month-outline': 'calendar',
  'cash': 'dollar-sign',
  'cash-multiple': 'layers',
  'cash-refund': 'rotate-ccw',
  'chart-bar': 'bar-chart-2',
  'chart-donut': 'pie-chart',
  'chart-timeline-variant': 'trending-up',
  'check': 'check',
  'check-circle': 'check-circle',
  'check-circle-outline': 'check-circle',
  'chevron-down': 'chevron-down',
  'chevron-right': 'chevron-right',
  'chevron-up': 'chevron-up',
  'close': 'x',
  'cloud-check-outline': 'cloud',
  'cloud-download-outline': 'download-cloud',
  'cloud-off-outline': 'cloud-off',
  'cloud-search-outline': 'cloud',
  'cloud-upload-outline': 'upload-cloud',
  'content-copy': 'copy',
  'credit-card-outline': 'credit-card',
  'dots-grid': 'more-horizontal',
  'dots-horizontal-circle-outline': 'more-horizontal',
  'email-outline': 'mail',
  'eye-off-outline': 'eye-off',
  'eye-outline': 'eye',
  'file-document-outline': 'file-text',
  'filter-variant': 'filter',
  'help-circle-outline': 'help-circle',
  'home-outline': 'home',
  'information-outline': 'info',
  'inbox-outline': 'inbox',
  'lock-reset': 'refresh-ccw',
  'logout': 'log-out',
  'magnify': 'search',
  'more-horizontal': 'more-horizontal',
  'pencil-outline': 'edit-3',
  'plus': 'plus',
  'plus-circle-outline': 'plus-circle',
  'receipt': 'file-text',
  'refresh': 'refresh-cw',
  'share-variant': 'share-2',
  'shield-check-outline': 'shield',
  'source-branch': 'git-branch',
  'swap-horizontal': 'repeat',
  'trash-can-outline': 'trash-2',
  'view-dashboard-outline': 'grid',
  'wallet-outline': 'credit-card',
};

export type AppIconProps = {
  accessibilityLabel?: string;
  color: string;
  name: string;
  size: number;
  style?: StyleProp<TextStyle>;
};

export function AppIcon({ accessibilityLabel, color, name, size, style }: AppIconProps) {
  const resolvedName = ICON_MAP[name] ?? name;

  return (
    <Feather
      accessibilityLabel={accessibilityLabel}
      accessible={Boolean(accessibilityLabel)}
      color={color}
      name={resolvedName as never}
      size={size}
      style={style}
    />
  );
}

export default AppIcon;
