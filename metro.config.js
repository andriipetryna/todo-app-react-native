// Metro config. Extends Expo's defaults and adds `.sql` to source extensions so
// Drizzle migrations (generated as `import m from './xxxx.sql'`) bundle correctly.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.sourceExts.push('sql');

module.exports = config;
