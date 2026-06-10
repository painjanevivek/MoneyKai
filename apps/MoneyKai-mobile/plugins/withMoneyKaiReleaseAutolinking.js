const { withDangerousMod } = require('@expo/config-plugins');
const fs = require('fs');
const path = require('path');

const START_MARKER = '// @moneykai-release-autolinking-start';
const END_MARKER = '// @moneykai-release-autolinking-end';

const releaseAutolinkingBlock = `${START_MARKER}
if (System.getenv('EXPO_PUBLIC_DEV_CLIENT_BUILD') != 'true' && System.getenv('EAS_BUILD_PROFILE') != 'development') {
  expoAutolinking.exclude = [
    'expo-dev-client',
    'expo-dev-launcher',
    'expo-dev-menu',
    'expo-dev-menu-interface',
    'expo-json-utils',
    'expo-log-box',
    'expo-manifests'
  ]
}
${END_MARKER}`;

const withMoneyKaiReleaseAutolinking = (config) =>
  withDangerousMod(config, [
    'android',
    async (modConfig) => {
      const settingsPath = path.join(modConfig.modRequest.platformProjectRoot, 'settings.gradle');
      let settings = fs.readFileSync(settingsPath, 'utf8');

      const existingBlock = new RegExp(`${START_MARKER}[\\s\\S]*?${END_MARKER}\\n?`);
      if (existingBlock.test(settings)) {
        settings = settings.replace(existingBlock, `${releaseAutolinkingBlock}\n`);
      } else {
        settings = settings.replace(
          'expoAutolinking.useExpoModules()',
          `${releaseAutolinkingBlock}\nexpoAutolinking.useExpoModules()`
        );
      }

      fs.writeFileSync(settingsPath, settings);
      return modConfig;
    },
  ]);

module.exports = withMoneyKaiReleaseAutolinking;
