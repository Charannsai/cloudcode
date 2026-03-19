const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Prefer CJS over ESM for lucide-react-native to avoid .js extension resolution issues
config.resolver.resolverMainFields = ['main', 'browser', 'react-native'];
config.resolver.sourceExts.push('mjs');

module.exports = config;
