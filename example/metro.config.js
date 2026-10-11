const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

module.exports = mergeConfig(getDefaultConfig(__dirname), {
  watchFolders: [path.resolve(__dirname, '..')],
  resolver: {
    platforms: ['ios', 'android', 'macos'],
    nodeModulesPaths: [path.join(__dirname, 'node_modules')],
    disableHierarchicalLookup: true,
    resolveRequest(context, name, platform) {
      if (platform === 'macos' && (name === 'react-native' || name.startsWith('react-native/'))) {
        name = name.replace(/^react-native/, 'react-native-macos');
      }
      return context.resolveRequest(context, name, platform);
    },
  },
});
