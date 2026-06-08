// Jest setup. Keep this lightweight — most logic tests use plain TS modules and an
// in-memory better-sqlite3 DB, not the native expo-sqlite module.

// Silence the reanimated warning in tests if reanimated gets imported transitively.
global.__reanimatedWorkletInit = () => {};
