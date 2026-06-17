module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: "nativewind" }],
    ],
    plugins: [
      // Use the NativeWind CSS interop babel plugin directly from its compiled
      // dist output, bypassing react-native-css-interop/babel.js which
      // unconditionally requires react-native-worklets/plugin (Reanimated v4
      // only). This avoids the worklets requirement while still compiling
      // className props at build time. The JSX factory is handled by
      // jsxImportSource: "nativewind" above.
      require('react-native-css-interop/dist/babel-plugin').default,
      'react-native-reanimated/plugin',
    ],
  };
};
