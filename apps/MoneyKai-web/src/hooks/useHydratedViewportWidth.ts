import React from 'react';
import { useWindowDimensions } from 'react-native';

const DEFAULT_SSR_VIEWPORT_WIDTH = 1024;
const subscribeToHydration = () => () => undefined;
const getHydratedSnapshot = () => true;
const getServerSnapshot = () => false;

export function useHydratedViewportWidth(defaultWidth = DEFAULT_SSR_VIEWPORT_WIDTH): number {
  const { width } = useWindowDimensions();
  const hydrated = React.useSyncExternalStore(subscribeToHydration, getHydratedSnapshot, getServerSnapshot);

  return hydrated && width > 0 ? width : defaultWidth;
}
