import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/ui/AppText';
import { PressableScale } from '@/components/ui/PressableScale';
import { useTheme } from '@/hooks/useTheme';
import { Spacing } from '@/constants/theme';

export function LedgerPaging({busy,error,previous,next,onPrevious,onNext,onFirst}: {
  busy:boolean; error?:string; previous:boolean; next:boolean;
  onPrevious():void; onNext():void; onFirst():void;
}) {
  const {colors}=useTheme();
  return <View style={{gap:Spacing.sm,padding:Spacing.md}}>
    <AppText accessibilityRole={error?'alert':undefined} style={{color:colors.textSecondary}}>
      {error || (busy?'Loading records…':'50 records per page · search by merchant prefix · sorting applies to this page')}
    </AppText>
    <View style={{flexDirection:'row',flexWrap:'wrap',gap:Spacing.md}}>
      {[['First',true,onFirst],['Previous',previous,onPrevious],['Next',next,onNext]].map(([label,enabled,action]) =>
        <PressableScale key={label as string} accessibilityRole="button" accessibilityLabel={`${label} transaction page`}
          disabled={busy || !enabled} onPress={action as ()=>void} style={{minHeight:44,justifyContent:'center'}}>
          <AppText style={{color:enabled && !busy?colors.primary:colors.textTertiary}}>{label as string}</AppText>
        </PressableScale>)}
    </View>
  </View>;
}
