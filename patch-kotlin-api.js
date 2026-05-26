const fs = require('fs');
const files = [
  'mobile/node_modules/@react-native/gradle-plugin/shared/build.gradle.kts',
  'mobile/node_modules/@react-native/gradle-plugin/settings-plugin/build.gradle.kts',
  'mobile/node_modules/@react-native/gradle-plugin/react-native-gradle-plugin/build.gradle.kts',
  'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin-shared/build.gradle.kts',
  'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/build.gradle.kts',
  'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/build.gradle.kts'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/KOTLIN_1_8/g, 'KOTLIN_1_9');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched KOTLIN_1_8 in ' + file);
  }
}
