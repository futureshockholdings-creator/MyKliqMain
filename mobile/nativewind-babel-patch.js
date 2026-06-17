/**
 * Patched NativeWind Babel Plugin
 *
 * Uses react-native-css-interop's class-name compiler directly,
 * skipping the worklets plugin (not needed with Reanimated 3.x).
 * The JSX transform is handled by babel-preset-expo with
 * jsxImportSource: "nativewind".
 */
module.exports = function () {
  return {
    plugins: [
      require('react-native-css-interop/dist/babel-plugin').default,
    ],
  };
};
