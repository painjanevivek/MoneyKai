import type { LinkingOptions } from '@react-navigation/native';

import type { RootStackParamList } from './types';

// These URLs belong to the sign-in and Gmail listeners, not to navigation.
export const shouldHandleNavigationLink = (url: string) =>
  !/^moneykai-mobile:\/\/(?:auth\/google|more)(?:[/?#]|$)/i.test(url);

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['moneykai-mobile://'],
  filter: shouldHandleNavigationLink,
  config: {
    screens: {
      NotFound: '*',
    },
  },
};
