# 📱 Antropoindicadores - Aplicativo Móvel

Este é o aplicativo móvel oficial do projeto **Antropoindicadores**, desenvolvido para permitir que pesquisadores realizem a coleta de dados e a aplicação de questionários socioeconômicos e ambientais diretamente em campo.

O aplicativo foi construído utilizando **React Native** e **Expo**, garantindo compatibilidade multiplataforma (Android e iOS) e uma experiência de uso fluida e responsiva.

---

## 🚀 Funcionalidades Principais

### 🔒 Segurança e Armazenamento (Security)
- **Armazenamento Nativo Seguro:** Utiliza a biblioteca `expo-secure-store` para armazenar tokens de autenticação e dados sensíveis de forma criptografada, utilizando os cofres de segurança nativos do dispositivo (iOS Keychain e Android Keystore). Isso previne o roubo de sessões em caso de comprometimento do aparelho.
- **Autenticação Segura:** Login baseado no código de acesso e senha fornecidos pelo administrador do sistema.

### 📝 Coleta de Dados em Campo (Survey Collection)
O aplicativo possui um fluxo completo e otimizado para a coleta de pesquisas:
1. **Autenticação:** O pesquisador faz login com suas credenciais.
2. **Seleção de Localidade:** Escolha do local/comunidade onde a pesquisa está sendo realizada.
3. **Seleção de Questionário:** Escolha do formulário que será aplicado.
4. **Aplicação do Questionário:** Suporte a múltiplos tipos de respostas (Texto, Numérico, Múltipla Escolha, Sim/Não, e Escala Likert de 1 a 5).
5. **Sincronização:** Envio estruturado e seguro das respostas coletadas para o servidor central (Backend).

### 🧭 Navegação Intuitiva
- **Aba de Pesquisas:** Ponto de entrada principal para iniciar uma nova coleta de dados.
- **Telas Modais e de Fluxo:** A interface de coleta abre de maneira sobreposta, focando a atenção do pesquisador no questionário.
- **Redirecionamento Automático:** Verificação de sessão ativa e redirecionamento automático para a tela de login caso necessário.

---

## 🛠 Tecnologias Utilizadas
- **React Native / Expo:** Framework principal para desenvolvimento do aplicativo.
- **Expo Router:** Roteamento baseado em arquivos (File-based routing) para uma navegação eficiente.
- **Expo Secure Store:** Para o armazenamento criptografado de dados.
- **TypeScript:** Para garantir tipagem estática e maior confiabilidade do código.

---

## ⚙️ Como Configurar e Rodar o Aplicativo

### Pré-requisitos
- [Node.js](https://nodejs.org/) instalado no seu computador.
- Aplicativo **Expo Go** instalado no seu smartphone (disponível na App Store e Google Play) ou um emulador/simulador configurado (Android Studio / Xcode).

### 1. Configuração do Ambiente
Crie um arquivo `.env.local` na raiz da pasta `mobile`:

```bash
# Substitua o IP abaixo pelo IP local da sua máquina onde o backend está rodando
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000
```
> **Aviso:** Se for testar num dispositivo físico via Wi-Fi, garanta que o celular e o computador estejam na mesma rede e que o IP esteja correto.

### 2. Instalação das Dependências
No terminal, dentro da pasta `mobile`, execute:
```bash
npm install
```

### 3. Iniciando o Aplicativo
Para rodar o servidor de desenvolvimento do Expo:
```bash
npx expo start
```

No terminal, você verá um **QR Code**. 
- **Android:** Abra o aplicativo Expo Go e escaneie o QR Code.
- **iOS:** Abra o aplicativo de Câmera nativo, escaneie o QR Code e clique na notificação para abrir no Expo Go.
- Para abrir em emuladores no computador, pressione `a` (para Android) ou `i` (para iOS) no terminal.

---

## 📚 Mais Informações
Para aprender mais sobre o desenvolvimento com Expo, consulte os seguintes recursos oficiais:
- [Documentação Oficial do Expo](https://docs.expo.dev/)
- [Guias de Desenvolvimento](https://docs.expo.dev/guides)
