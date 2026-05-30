# Metadados para as Lojas de Aplicativos (App Store & Google Play)

Este documento contém os metadados sugeridos para publicação do aplicativo **AntropoMobile** nas lojas oficiais.

## 📱 Google Play Store

### Textos
- **Nome do App:** AntropoMobile - Coleta de Dados
- **Descrição Curta:** Aplicativo offline-first para pesquisa e coleta de dados antropométricos em campo.
- **Descrição Completa:**
  O AntropoMobile é a ferramenta ideal para pesquisadores que realizam coletas de dados em campo. Com suporte nativo para funcionamento offline (offline-first), você pode registrar dados vitais e antropométricos sem se preocupar com a conexão à internet. Assim que o dispositivo estiver online, todos os dados são sincronizados automaticamente com o servidor central, garantindo segurança e integridade das suas pesquisas. 

  **Recursos principais:**
  - Funcionamento offline nativo com sincronização automática.
  - Formulários dinâmicos de pesquisa e coletas.
  - Gestão de múltiplos locais e pesquisadores.
  - Interface amigável e acessível, desenhada para tablets e smartphones.

### Assets Visuais (Necessários)
- **Ícone do App (Alta Resolução):** 512 x 512 px, formato PNG ou JPEG, até 1 MB. (Pode usar o `icon.png` em `mobile/assets/images/icon.png` e redimensionar se necessário).
- **Gráfico de Recursos (Feature Graphic):** 1024 x 500 px, formato PNG ou JPEG, sem transparência.
- **Capturas de Tela (Screenshots):** Pelo menos 2 capturas (sugestão: Tela de Login, Dashboard, e Tela de Coleta). Dimensão sugerida: 1080 x 1920 px (ou proporção de tela de celular).

---

## 🍏 Apple App Store

### Textos
- **Nome do App:** AntropoMobile: Pesquisa
- **Subtítulo:** Coleta de dados offline
- **Descrição:**
  O AntropoMobile é a ferramenta ideal para pesquisadores que realizam coletas de dados em campo. Com suporte nativo para funcionamento offline (offline-first), você pode registrar dados vitais e antropométricos sem se preocupar com a conexão à internet. Assim que o dispositivo estiver online, todos os dados são sincronizados automaticamente com o servidor central, garantindo segurança e integridade das suas pesquisas.
- **Palavras-chave:** pesquisa, dados, offline, antropometria, questionário, sincronização, campo, ciência.
- **URL de Suporte:** `https://antropoindicadores.vercel.app/suporte` *(Ajustar para a URL real)*
- **URL de Política de Privacidade:** `https://antropoindicadores.vercel.app/privacidade` *(Ajustar para a URL real)*

### Assets Visuais (Necessários)
- **Ícone do App:** 1024 x 1024 px, formato PNG, sem transparência e sem cantos arredondados (a Apple aplica a máscara automaticamente).
- **Capturas de Tela (Screenshots):**
  - **iPhone (6.5 e 5.5 polegadas):** 1242 x 2688 px e 1242 x 2208 px.
  - **iPad (12.9 polegadas - opcional mas recomendado):** 2048 x 2732 px.

---

## 🛠️ Configuração do EAS Submit (`eas.json`)
As credenciais e IDs dos aplicativos devem ser configurados no projeto. 
- **Google Play:** Certifique-se de configurar a service account do Google Cloud no painel do Expo para publicação automática.
- **App Store:** Verifique o `ascAppId` e o `appleTeamId` nas configurações de `submit.production.ios` no `eas.json` quando a conta da Apple Developer for validada.
