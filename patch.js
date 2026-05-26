const fs = require('fs');
const files = [
  { path: 'mobile/node_modules/@react-native/gradle-plugin/gradle/libs.versions.toml', match: /kotlin\s*=\s*"2\.1\.20"/g, replace: 'kotlin = "2.3.20"' },
  { path: 'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/build.gradle.kts', match: /kotlin\("jvm"\)\s*version\s*"2\.1\.20"/g, replace: 'kotlin("jvm") version "2.3.20"' },
  { path: 'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/build.gradle.kts', match: /kotlin\("jvm"\)\s*version\s*"2\.1\.20"/g, replace: 'kotlin("jvm") version "2.3.20"' },
  { path: 'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/build.gradle.kts', match: /kotlin\("jvm"\)\s*version\s*"2\.1\.20"/g, replace: 'kotlin("jvm") version "2.3.20"' }
];
for (const file of files) {
  if (fs.existsSync(file.path)) {
    let content = fs.readFileSync(file.path, 'utf8');
    content = content.replace(file.match, file.replace);
    fs.writeFileSync(file.path, content, 'utf8');
    console.log('Patched ' + file.path);
  }
}
