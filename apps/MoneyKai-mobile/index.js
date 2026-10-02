/**
 * @format
 */

import 'react-native-gesture-handler';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';
import notifee from '@notifee/react-native';
import { handleShadeEvent } from './src/services/notificationActions';

// Background actions are encrypted and queued, never financial writes before unlock.
notifee.onBackgroundEvent(handleShadeEvent);

AppRegistry.registerComponent(appName, () => App);
