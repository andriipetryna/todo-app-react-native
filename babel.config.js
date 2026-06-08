module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Inline Drizzle's generated `.sql` migration files as string imports so Metro
      // can bundle them (used by src/db/migrations/migrations.js).
      ['inline-import', { extensions: ['.sql'] }],
      // Reanimated 4 uses the worklets Babel plugin; it must be listed last.
      'react-native-worklets/plugin',
    ],
  };
};
