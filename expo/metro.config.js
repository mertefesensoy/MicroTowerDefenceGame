// expo/metro.config.js
const path = require("path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Monorepo safety: never climb to repo root node_modules
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [path.resolve(__dirname, "node_modules")];

// Keep watch scope tight
config.watchFolders = [__dirname];

module.exports = config;
