const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets', 'images');
const INPUT_IMAGE = path.join(ASSETS_DIR, 'icon.png');

const backgroundColor = '#E6F4FE'; // Mesma cor configurada no app.json

async function generateAssets() {
  console.log('Iniciando a geração de ícones a partir de:', INPUT_IMAGE);

  if (!fs.existsSync(INPUT_IMAGE)) {
    console.error('Erro: A imagem base "icon.png" não foi encontrada em:', INPUT_IMAGE);
    process.exit(1);
  }

  try {
    // 1. Gerar Favicon (Web) - 64x64
    await sharp(INPUT_IMAGE)
      .resize(64, 64, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(ASSETS_DIR, 'favicon.png'));
    console.log('✅ favicon.png gerado com sucesso (64x64)');

    // 2. Gerar Splash Icon (Tela de Abertura) - 400x400 centralizado
    await sharp(INPUT_IMAGE)
      .resize(400, 400, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .toFile(path.join(ASSETS_DIR, 'splash-icon.png'));
    console.log('✅ splash-icon.png gerado com sucesso (400x400)');

    // 3. Gerar Android Foreground Icon (Plano de frente transparente) - 432x432, com ícone ligeiramente menor para caber na margem segura
    await sharp(INPUT_IMAGE)
      .resize(288, 288, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(ASSETS_DIR, 'android-icon-foreground.png'));
    console.log('✅ android-icon-foreground.png gerado com sucesso (432x432)');

    // 4. Gerar Android Background Icon (Fundo sólido) - 432x432
    await sharp({
      create: {
        width: 432,
        height: 432,
        channels: 4,
        background: backgroundColor
      }
    })
    .png()
    .toFile(path.join(ASSETS_DIR, 'android-icon-background.png'));
    console.log(`✅ android-icon-background.png gerado com sucesso (432x432, Cor: ${backgroundColor})`);

    // 5. Gerar Android Monochrome Icon (Silhueta preta/transparente para temas dinâmicos) - Opcional, mas útil.
    // Converte para escala de cinza e aplica um limiar para garantir que seja uma silhueta contínua.
    await sharp(INPUT_IMAGE)
      .resize(288, 288, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 0 } })
      .extend({
        top: 72,
        bottom: 72,
        left: 72,
        right: 72,
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .greyscale()
      .threshold(128) // Transforma em preto e branco absolutos
      .toFile(path.join(ASSETS_DIR, 'android-icon-monochrome.png'));
    console.log('✅ android-icon-monochrome.png gerado com sucesso (432x432, Escala de Cinza)');

    console.log('\n🎉 Todas as imagens foram atualizadas com sucesso para manter a mesma identidade visual!');
  } catch (error) {
    console.error('❌ Ocorreu um erro ao processar as imagens:', error);
  }
}

generateAssets();
