// src/database/index.ts
import { Platform } from 'react-native'

let database: any = null

// WatermelonDB só funciona em plataformas nativas (iOS/Android)
// Em web, o JSI não está disponível, então pulamos a inicialização
if (Platform.OS !== 'web') {
  try {
    const { Database } = require('@nozbe/watermelondb')
    const SQLiteAdapter = require('@nozbe/watermelondb/adapters/sqlite').default
    const { mySchema } = require('./schema')
    const Survey = require('./models/Survey').default
    const Location = require('./models/Locations').default
    const Response = require('./models/Response').default
    
    // Configura o "Adaptador" que vai escrever fisicamente no celular
    const adapter = new SQLiteAdapter({
      schema: mySchema,
      // JSI (JavaScript Interface) é o segredo da velocidade absurda do WatermelonDB
      jsi: true, 
      onSetUpError: (error: any) => {
        console.error("Falha ao inicializar o banco de dados offline", error)
      }
    })

    // Cria o Banco de Dados para plataformas nativas
    database = new Database({
      adapter,
      modelClasses: [
        Survey,
        Location, 
        Response,
      ],
    })
    
    console.log('✅ WatermelonDB initialized successfully (native only)')
  } catch (error) {
    console.warn('⚠️ Failed to initialize WatermelonDB:', error)
    database = null
  }
} else {
  console.log('⚠️ WatermelonDB skipped on web platform (JSI not available)')
}

// Exporta o database (pode ser null em web)
export { database }