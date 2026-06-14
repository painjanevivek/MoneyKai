const appJson = require('./app.json');

const easBuildProfile = process.env.EAS_BUILD_PROFILE;
const nativeSmsResearchBuildEnabled =
  process.env.EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD !== 'false' &&
  easBuildProfile !== 'preview' &&
  easBuildProfile !== 'production';
const devClientBuildEnabled =
  process.env.EXPO_PUBLIC_DEV_CLIENT_BUILD === 'true' ||
  process.env.EAS_BUILD_PROFILE === 'development';

const config = {
  ...appJson.expo,
};

config.plugins = [...config.plugins, './plugins/withMoneyKaiReleaseAutolinking'];

if (nativeSmsResearchBuildEnabled && config.android?.blockedPermissions) {
  const smsPermissions = new Set([
    'android.permission.READ_SMS',
    'android.permission.RECEIVE_MMS',
    'android.permission.RECEIVE_SMS',
    'android.permission.RECEIVE_WAP_PUSH',
    'android.permission.SEND_SMS',
    'android.permission.WRITE_SMS',
  ]);

  config.android = {
    ...config.android,
    blockedPermissions: config.android.blockedPermissions.filter((permission) => !smsPermissions.has(permission)),
  };
}

if (devClientBuildEnabled) {
  config.plugins = [
    ...config.plugins,
    [
      'expo-dev-client',
      {
        launchMode: 'most-recent',
        defaultLaunchURL: 'http://localhost:8081',
        android: {
          defaultLaunchURL: 'http://10.0.2.2:8081',
        },
        skipOnboarding: true,
        showMenuAtLaunch: false,
      },
    ],
  ];
}

if (nativeSmsResearchBuildEnabled) {
  config.plugins = [...config.plugins, './plugins/withMoneyKaiSmsResearch'];
}

module.exports = config;
