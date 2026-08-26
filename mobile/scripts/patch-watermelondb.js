const fs = require('fs');
const path = require('path');

const WMDB_DIR = path.join(__dirname, '..', 'node_modules', '@nozbe', 'watermelondb');
const ANDROID_SRC = path.join(WMDB_DIR, 'native', 'android', 'src', 'main', 'java', 'com', 'nozbe', 'watermelondb');

const databaseKtPath = path.join(ANDROID_SRC, 'Database.kt');
const databaseBridgeKtPath = path.join(ANDROID_SRC, 'DatabaseBridge.kt');

if (!fs.existsSync(databaseKtPath)) {
  console.log('patch-watermelondb: Database.kt not found, skipping');
  process.exit(0);
}

// Patch Database.kt: fix compileSdk 36 null safety issues
let dbContent = fs.readFileSync(databaseKtPath, 'utf8');

if (dbContent.includes('editTable: String,')) {
  console.log('patch-watermelondb: Database.kt already patched, skipping');
} else {
  // rawArgs stays as Array<String> — it's a dummy, actual binding happens in the lambda
  dbContent = dbContent.replace(
    '{ _, driver: SQLiteCursorDriver?, editTable: String?, query: SQLiteQuery ->',
    '{ _, driver: SQLiteCursorDriver?, editTable: String, query: SQLiteQuery ->'
  );

  dbContent = dbContent.replace(
    '}, sql, rawArgs, null, null',
    '}, sql, rawArgs, "", null'
  );

  fs.writeFileSync(databaseKtPath, dbContent, 'utf8');
  console.log('patch-watermelondb: Database.kt patched successfully');
}

// Patch DatabaseBridge.kt: remove reactContext.catalystInstance.reactQueueConfiguration.jsQueueThread reference
if (!fs.existsSync(databaseBridgeKtPath)) {
  console.log('patch-watermelondb: DatabaseBridge.kt not found, skipping');
  process.exit(0);
}

let bridgeContent = fs.readFileSync(databaseBridgeKtPath, 'utf8');

if (!bridgeContent.includes('jsQueueThread.runOnQueue')) {
  console.log('patch-watermelondb: DatabaseBridge.kt already patched, skipping');
} else {
  bridgeContent = bridgeContent.replace(
    `reactContext.catalystInstance.reactQueueConfiguration.jsQueueThread.runOnQueue {
            try {
                val clazz = Class.forName("com.nozbe.watermelondb.jsi.WatermelonJSI")
                val method = clazz.getDeclaredMethod("onCatalystInstanceDestroy")
                method.invoke(null)
            } catch (e: Exception) {
                if (BuildConfig.DEBUG) {
                    Logger.getLogger("DB_Bridge").info("Could not find JSI onCatalystInstanceDestroy")
                }
            }
        }`,
    `try {
            val clazz = Class.forName("com.nozbe.watermelondb.jsi.WatermelonJSI")
            val method = clazz.getDeclaredMethod("onCatalystInstanceDestroy")
            method.invoke(null)
        } catch (e: Exception) {
            if (BuildConfig.DEBUG) {
                Logger.getLogger("DB_Bridge").info("Could not find JSI onCatalystInstanceDestroy")
            }
        }`
  );

  fs.writeFileSync(databaseBridgeKtPath, bridgeContent, 'utf8');
  console.log('patch-watermelondb: DatabaseBridge.kt patched successfully');
}
