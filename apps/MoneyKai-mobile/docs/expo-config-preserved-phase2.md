# Expo Config Preserved During Phase 2

The active `app.json` was converted to the React Native CLI registry format:

```json
{
  "name": "MoneyKai",
  "displayName": "MoneyKai"
}
```

Important values preserved from the previous Expo config for later native migration:

- App display name: `MoneyKai`
- Previous Expo slug: `moneykai-mobile`
- Version: `1.0.1`
- Orientation: portrait
- Android package: `com.moneykai.mobile`
- iOS bundle identifier: `com.moneykai.mobile`
- URL scheme: `moneykai-mobile`
- Android backup: disabled
- Android predictive back gesture: enabled
- Restricted permissions intentionally blocked in release:
  - `android.permission.RECORD_AUDIO`
  - `android.permission.READ_SMS`
  - `android.permission.RECEIVE_MMS`
  - `android.permission.RECEIVE_SMS`
  - `android.permission.RECEIVE_WAP_PUSH`
  - `android.permission.SEND_SMS`
  - `android.permission.SYSTEM_ALERT_WINDOW`
  - `android.permission.WRITE_SMS`
  - `android.permission.WRITE_CONTACTS`
- Icon: `./assets/images/icon.png`
- Android adaptive icon foreground/background/monochrome assets under `assets/images/`
- Splash background: `#0D8C4C`
- Splash image: `./assets/images/splash-icon.png`

Temporarily retained Expo files:

- `app.config.js`
- `eas.json`
- `expo-env.d.ts`
- `src/app/**`
- `plugins/**`
- `modules/moneykai-native-capture/**`

These are retained only as migration source material and should not be used by the CLI app runtime.
