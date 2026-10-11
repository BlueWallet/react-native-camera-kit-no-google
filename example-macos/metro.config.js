const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');
const root = __dirname;
const libraryRoot = path.resolve(root, '..');

module.exports = mergeConfig(getDefaultConfig(root), {
  watchFolders: [libraryRoot],
  resolver: {
    // Resolve the linked library against this app's dependencies, never the
    // library's RN 0.79 development install.
    nodeModulesPaths: [path.join(root, 'node_modules')],
    disableHierarchicalLookup: true,
    resolveRequest(context, name, platform) {
      if (name === 'react-native' || name.startsWith('react-native/')) {
        name = name.replace(/^react-native/, 'react-native-macos');
      }
      return context.resolveRequest(context, name, platform);
    },
  },
});
