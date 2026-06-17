const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Watch the shared directory at the workspace root (outside mobile/)
config.watchFolders = [path.resolve(__dirname, '..', 'shared')];

config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve("react-native-svg-transformer/expo"),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== "svg"),
  sourceExts: [...config.resolver.sourceExts, "svg"],
  extraNodeModules: {
    '@': path.resolve(__dirname, 'src'),
    '@shared': path.resolve(__dirname, '..', 'shared'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
