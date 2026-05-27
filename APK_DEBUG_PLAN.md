# 🔍 Plano de Diagnóstico: Tela Preta no APK

**Data:** 26/05/2026

**Problema:** APK exibindo apenas tela preta após build EAS.

**Objetivo:** Verificar e validar todos os arquivos críticos antes de gerar novo APK.

---

## 🔴 Status Atual

### Backend
- **Infraestrutura:** Fly, Docker, PostgreSQL configurados corretamente.
- **Endpoints:** Todos funcionando, exceto `/sync` que retorna erro 500 (investigar).
- **Conexão:** Backend conectado ao banco de dados local.
- **Conclusão:** Backend está operacional.

### Mobile
- **eas.json:** `env.EXPO_PUBLIC_API_URL` configurado para `http://192.168.1.4:3000` (IP local).
- **.env:** aponta para o mesmo endpoint (verificar se está correto).
- **Estrutura:** `_layout.tsx`, `index.tsx`, `api.ts` e banco local (WatermelonDB) estão presentes.
- **Problemas Identificados:** Nenhum crítico encontrado após correção de `eas.json`.

---

## 📋 Próximas Ações

1. **Investigar o endpoint `/sync`**
   - Testar localmente com `curl -X POST http://localhost:3000/sync`.
   - Analisar logs do backend para identificar a causa do erro 500.

2. **Verificar conectividade do dispositivo**
   - Garantir que o dispositivo/emulador consegue alcançar `192.168.1.4:3000`.
   - Se necessário, usar `10.0.2.2` (Android) ou `localhost` (iOS) durante testes locais.

3. **Testar inicialização do app**
   - Rodar `expo start --dev-client` e abrir no dispositivo para verificar se a tela preta persiste.
   - Adicionar `console.log` nos pontos críticos (`App.tsx`, `_layout.tsx`, `index.tsx`, context providers).

4. **Build local**
   - `npm run build` ou `expo build:android`.
   - Verificar logs e garantir que não há erros de compilação.

5. **Build via EAS**
   - `eas build -p android --profile preview`.
   - Monitorar logs na plataforma EAS.

6. **Testar APK**
   - Instalar no emulador/dispositivo (`adb install app.apk`).
   - Verificar logs com `adb logcat | grep -i "error\|exception\|anthropo"`.

---

## ✅ Checklist Final Antes do Build

- [ ] Backend rodando e respondendo.
- [ ] Endpoint `/sync` testado (erro 500 investigado).
- [ ] `EXPO_PUBLIC_API_URL` configurado em `eas.json` e `.env`.
- [ ] Estrutura de rotas e contextos no mobile está correta.
- [ ] Banco local inicializa sem erros.
- [ ] Build local (`expo build`) sem erros.
- [ ] Build EAS (`preview` profile) concluído com sucesso.
- [ ] APK instalado e funcional (sem tela preta).

---

## 🚨 Se a Tela Preta Persistir

1. **Adicionar logs detalhados** nos arquivos principais.
2. **Habilitar Sentry ou Firebase Crashlytics** para capturar erros remotos.
3. **Criar build de debug** com React DevTools habilitado.
4. **Revisar listeners e efeitos** que possam bloquear o render.

---

**Status:** ⏳ Em execução. Próximas etapas: investigar `/sync` e testar conectividade do dispositivo.
