const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');
const path = require('path');

const workspaceRoot = path.resolve(__dirname, '../..');

const config = {
  watchFolders: [workspaceRoot],
  resolver: {
    blockList: [new RegExp(`${workspaceRoot.replace(/[/\\]/g, '[/\\\\]')}[/\\\\]\\.pytest_cache([/\\\\].*)?$`)],
    nodeModulesPaths: [
      path.resolve(__dirname, 'node_modules'),
      path.resolve(workspaceRoot, 'node_modules'),
    ],
  },
};

module.exports = withSentryConfig(mergeConfig(getDefaultConfig(__dirname), config), {
  annotateReactComponents: true,
});
