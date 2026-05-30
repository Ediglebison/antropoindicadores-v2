# Jornada de Testes: Aplicativo Antropoindicadores

Este documento serve como o roteiro principal para a nossa jornada de implementação de testes unitários. Seguiremos este checklist, marcando as etapas concluídas e registrando quaisquer problemas encontrados e suas respectivas soluções.

## Fase 1: Preparação e Configuração das Ferramentas
- [x] **Backend (NestJS)**: Verificar se o Jest está configurado corretamente e rodando com `npm run test`.
  - *Problemas/Soluções:* Teste inicial falhava por string incorreta no app.controller.spec.ts. Resolvido ajustando a expectativa para "API Antropoindicadores Online!".
- [x] **Web (React/Vite)**: Instalar e configurar Vitest, React Testing Library e MSW (se necessário).
  - *Problemas/Soluções:* Instaladas dependências de testes, adicionada configuração no vite.config.ts e criado script "test": "vitest run" no package.json.
- [x] **Mobile (React Native/Expo)**: Revisar/Instalar Jest, React Native Testing Library e mocks essenciais (como `@react-native-async-storage/async-storage`, `expo-router`).
  - *Problemas/Soluções:* Conflito de versão entre jest 30 e jest-expo. Resolvido instalando versões adequadas para o Expo SDK 54 ("jest-expo": "~54.0.0", "jest": "^29.0.0").

## Fase 2: Backend (NestJS) - Foco em Lógica de Negócio
- [x] Testes do `AuthService` (Validação de credenciais, geração de token).
  - *Problemas/Soluções:* Testes criados com sucesso fazendo o mock do `UsersService` e `bcrypt.compare`.
- [x] Testes do `UsersService` (Criação de usuário, busca, etc).
  - *Problemas/Soluções:* Testes criados fazendo mock do `Repository<User>` do TypeORM. Validamos com sucesso a lógica de tratamento de erro (conflito de chave única) e hash de senhas com bcrypt.
- [x] Testes dos demais Services (`LocationsService`, `SurveysService`, `ResponsesService`).
  - *Problemas/Soluções:* Criados testes para os 3 serviços mockando seus respectivos repositórios TypeORM. Foram testadas a criação (com geração de ID baseada em data), listagem (verificando os parâmetros de ordenação/relations) e o restante do CRUD, além de tratativas de erro (ex: `ConflictException` no `LocationsService`).
- [x] Testes do `SyncService` (Garantir que a lógica de sincronização esteja correta).
  - *Problemas/Soluções:* Mockados os 4 repositórios (`Survey`, `Location`, `Response` e `User`). Testado o envio de dados do servidor (`pullChanges`), garantindo as conversões corretas de datas para timestamps; e o recebimento de dados do mobile (`pushChanges`), validando salvar, atualizar e deletar.
- [x] Testes de Controllers (Garantir que chamam os services e retornam as respostas certas).
  - *Problemas/Soluções:* Criados testes para AuthController, UsersController, LocationsController, SurveysController, ResponsesController e SyncController. Realizado mock de serviços e overrides de guards necessários. Todos os testes passam com sucesso.

## Fase 3: Frontend Web (React) - Componentes e Integração
- [x] Testes de Componentes Base de UI (ex: Botões, Inputs, Layouts).
  - *Problemas/Soluções:* Criados testes para componentes de roteamento e layout da dashboard. Todos validam os comportamentos de menu adequados e lógicas de direcionamento.
- [x] Testes de Páginas Principais (ex: Login, Dashboard, Listagens) com mock da API (`services/api.ts`).
  - *Problemas/Soluções:* Houve problemas de timeout e de não encontrar elementos pelo 'role' na tela de Coleta e de Login. A solução foi refatorar a marcação das `tags` adicionando `id` e `htmlFor` nos selects/labels da Coleta e substituir o uso de `userEvent` por `fireEvent` para contornar problemas de compatibilidade e otimizar a rapidez dos testes.
- [x] Testes de rotas protegidas (AdminRoute).
  - *Problemas/Soluções:* Rotas testadas mockando os perfis (Role=ADMIN vs RESEARCHER), redirecionando adequadamente para a tela principal quando há acessos indevidos.

## Fase 4: Mobile (React Native) - Telas e Fluxo Offline
- [x] Testes de Componentes Reutilizáveis (ex: `Header`, `ScaleCircle`).
  - *Problemas/Soluções:* Criados com sucesso e passando. Não houve problemas complexos.
- [x] Testes de Lógica de Banco de Dados Local (`database/index.ts` e models).
  - *Problemas/Soluções:* Lógica testada adequadamente através de `schema.spec.ts`.
- [x] Testes do Fluxo de Sincronização (`database/sync.ts`).
  - *Problemas/Soluções:* Sincronização offline-online verificada por `sync.spec.ts`. Mock das funções `synchronize` e `global.fetch` funcionando.
- [x] Testes de Telas (ex: `login`, `coleta-pesquisa`, `dashboard`).
  - *Problemas/Soluções:* Adicionados `testID`s na tela de Dashboard para facilitar testes do RTL. Para evitar o erro do "SafeAreaProvider", foi realizado o mock do `react-native-safe-area-context` e `MenuContext`. Telas testadas mockando a API com sucesso.
## Fase 5: Relatórios e CI
- [x] Gerar relatório geral de cobertura de testes (Coverage Report).
  - *Problemas/Soluções:* Rodado com sucesso o script nas 3 aplicações. Cobertura ok para a fase atual (Backend 73%, Web 87%, Mobile 64%).
- [x] Criar scripts globais na raiz (ex: `npm run test:all`) para rodar os testes de todos os ambientes.
  - *Problemas/Soluções:* Scripts `test:all` e `test:cov:all` já estavam presentes no root e funcionaram perfeitamente usando `--prefix`.

## 🚀 Próximos Passos (Ações Futuras)

Esta seção define o roadmap após a estabilização dos testes unitários e de integração.

### Fase 6: Aprimoramento da Pipeline (CI/CD Avançado)
- [x] **Passo 1: Integrar verificações de Linting e Formatação na CI.** Adicionar etapas no Github Actions para rodar o linting do backend, web e mobile.
- [x] **Passo 2: Configurar Continuous Deployment (CD) para o Backend.** Implementar deploy automático (ex: Fly.io) quando a branch main for atualizada.
- [x] **Passo 3: Configurar Continuous Deployment (CD) para o Web.** Implementar deploy automatizado (ex: Vercel) para a interface do administrador.

### Fase 7: Testes End-to-End (E2E)
- [x] **Passo 1: E2E no Frontend Web (Cypress ou Playwright).** Testar o fluxo de administrador (Login -> Criação de questionário -> Associação a local).
- [ ] **Passo 2: E2E no Mobile (Maestro ou Detox).** (Postergado/Adiado) Testar o fluxo crítico offline do pesquisador (Login -> Offline -> Preencher pesquisa -> Reconectar -> Sincronizar).

### Fase 8: Build e Distribuição Mobile (Expo EAS)
- [x] **Passo 1: Configuração do EAS Build.** Configurar perfis e credenciais (Keystore Android / Certificados iOS).
- [x] **Passo 2: Criação de Builds Internos.** Gerar APK para testes em equipe interna (`eas build -p android --profile preview`).
- [x] **Passo 3: Configuração do EAS Submit.** Preparar assets visuais e descrições para a Play Store e App Store.

### Fase 9: Evoluções Funcionais do Domínio
- [x] **Passo 1: Geolocalização de Precisão Móvel.** Integrar o `expo-location` para gravar as coordenadas exatas da coleta.
- [x] **Passo 2: Exportação de Relatórios Web.** Permitir a exportação de respostas consolidadas (CSV/XLSX) no painel Admin.
- [x] **Passo 3: Mapas Visuais.** Integrar mapa (Leaflet/Google Maps) no Dashboard Web para visualizar os pontos geográficos de cada coleta.
