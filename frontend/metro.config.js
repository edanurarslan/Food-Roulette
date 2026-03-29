const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Asset extensions
config.resolver.assetExts.push('db', 'mp3', 'ttf', 'otf');

// Optimize file watching - reduce number of files being watched
config.watchFolders = [];
config.resolver.blockList = [
  /node_modules\/.*\/node_modules/,
];

// Watchman settings
config.resolver.useWatchman = true;

module.exports = config;
