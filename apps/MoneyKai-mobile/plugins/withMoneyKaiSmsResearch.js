const { AndroidConfig, withAndroidManifest } = require('@expo/config-plugins');

const RECEIVE_SMS_PERMISSION = 'android.permission.RECEIVE_SMS';
const SMS_RECEIVER_NAME = 'com.moneykai.nativecapture.MoneyKaiSmsReceiver';

const ensureArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const withMoneyKaiSmsResearch = (config) =>
  withAndroidManifest(config, (manifestConfig) => {
    const manifest = manifestConfig.modResults;
    AndroidConfig.Permissions.addPermission(manifest, RECEIVE_SMS_PERMISSION);

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    const receivers = ensureArray(mainApplication.receiver);
    const hasSmsReceiver = receivers.some((receiver) => receiver?.$?.['android:name'] === SMS_RECEIVER_NAME);

    if (!hasSmsReceiver) {
      mainApplication.receiver = [
        ...receivers,
        {
          $: {
            'android:name': SMS_RECEIVER_NAME,
            'android:exported': 'true',
            'android:permission': 'android.permission.BROADCAST_SMS',
          },
          'intent-filter': [
            {
              action: [{ $: { 'android:name': 'android.provider.Telephony.SMS_RECEIVED' } }],
            },
          ],
        },
      ];
    }

    return manifestConfig;
  });

module.exports = withMoneyKaiSmsResearch;
