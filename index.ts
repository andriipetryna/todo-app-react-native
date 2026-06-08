// Custom entry: load expo-router, then register the Android widget task handler in the
// global scope so it is available to the headless widget task (react-native-android-widget
// requirement). Keep this file minimal — app logic lives under app/ and src/.
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';

import { widgetTaskHandler } from './src/widget/handler';

registerWidgetTaskHandler(widgetTaskHandler);
