const fs = require('fs');
const files = [
  'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin/build.gradle.kts',
  'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/build.gradle.kts',
  'mobile/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin-shared/build.gradle.kts'
];
for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    content = content.replace(/kotlinOptions\s*\{\s*jvmTarget\s*=\s*JavaVersion\.VERSION_11\.toString\(\)\s*\}/g, 'compilerOptions { jvmTarget.set(org.jetbrains.kotlin.gradle.dsl.JvmTarget.JVM_11) }');
    fs.writeFileSync(file, content, 'utf8');
    console.log('Patched kotlinOptions in ' + file);
  }
}
