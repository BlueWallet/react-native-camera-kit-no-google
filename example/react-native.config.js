const macos = process.env.RN_PLATFORM === 'macos';

module.exports = {
  // Native autolinking/codegen must use the same RN distribution as the target.
  // Metro selects its JS distribution per request, so one server serves all three.
  reactNativePath: macos ? './node_modules/react-native-macos' : './node_modules/react-native',
  dependencies: {
    'react-native-macos': { platforms: { ios: null, android: null } },
    'react-native-image-picker': {
      platforms: macos ? { ios: null, android: null, macos: null } : { macos: null },
    },
  },
};
