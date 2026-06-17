const appJson = require('./app.json');
const fs = require('fs');
const path = require('path');

const hasValue = (value) => typeof value === 'string' && value.trim().length > 0;
const hasLocalPlugin = (pluginPath) =>
  [pluginPath, `${pluginPath}.js`].some((candidatePath) => fs.existsSync(path.join(__dirname, candidatePath)));
const hasDependency = (dependencyName) => {
  const packageJson = require('./package.json');
  return Boolean(packageJson.dependencies?.[dependencyName] || packageJson.devDependencies?.[dependencyName]);
};

const easBuildProfile = process.env.EAS_BUILD_PROFILE;
const nativeSmsResearchBuildEnabled =
  process.env.EXPO_PUBLIC_NATIVE_SMS_RESEARCH_BUILD !== 'false' &&
  easBuildProfile !== 'preview' &&
  easBuildProfile !== 'production';
const devClientBuildEnabled =
  hasDependency('expo-dev-client') &&
  (process.env.EXPO_PUBLIC_DEV_CLIENT_BUILD === 'true' ||
    process.env.EAS_BUILD_PROFILE === 'development');
const devClientLaunchURL =
  process.env.EXPO_PUBLIC_DEV_CLIENT_LAUNCH_URL ||
  process.env.EXPO_DEV_CLIENT_LAUNCH_URL ||
  (process.env.REACT_NATIVE_PACKAGER_HOSTNAME
    ? `http://${process.env.REACT_NATIVE_PACKAGER_HOSTNAME}:8081`
    : undefined);

const baseExpoConfig = appJson.expo ?? {};
const config = {
  name: appJson.displayName ?? appJson.name ?? 'MoneyKai',
  slug: 'moneykai-mobile',
  version: '1.0.1',
  scheme: 'moneykai-mobile',
  orientation: 'portrait',
  ...baseExpoConfig,
};

config.plugins = [...(config.plugins ?? [])];

if (hasLocalPlugin('./plugins/withMoneyKaiReleaseAutolinking')) {
  config.plugins = [...config.plugins, './plugins/withMoneyKaiReleaseAutolinking'];
}

if (hasDependency('@sentry/react-native') && hasValue(process.env.SENTRY_ORG) && hasValue(process.env.SENTRY_PROJECT)) {
  config.plugins = [
    ...config.plugins,
    [
      '@sentry/react-native/expo',
      {
        url: process.env.SENTRY_URL || 'https://sentry.io/',
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT,
        disableAutoUpload:
          process.env.SENTRY_DISABLE_AUTO_UPLOAD === 'true' ||
          !hasValue(process.env.SENTRY_AUTH_TOKEN),
      },
    ],
  ];
}

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
  const devClientPluginOptions = {
    launchMode: devClientLaunchURL ? 'most-recent' : 'launcher',
    skipOnboarding: true,
    showMenuAtLaunch: !devClientLaunchURL,
  };

  if (devClientLaunchURL) {
    devClientPluginOptions.defaultLaunchURL = devClientLaunchURL;
    devClientPluginOptions.android = {
      defaultLaunchURL: devClientLaunchURL,
    };
  }

  config.plugins = [
    ...config.plugins,
    [
      'expo-dev-client',
      devClientPluginOptions,
    ],
  ];
}

if (nativeSmsResearchBuildEnabled && hasLocalPlugin('./plugins/withMoneyKaiSmsResearch')) {
  config.plugins = [...config.plugins, './plugins/withMoneyKaiSmsResearch'];
}

module.exports = config;
