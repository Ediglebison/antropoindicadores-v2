# 🌿 Antropoindicadores - Plataforma de Pesquisa

Sistema de gestão de dados e pesquisas de campo, desenvolvido para apoiar atividades de coleta e análise de indicadores antrópicos na Amazônia.

O projeto visa modernizar a aplicação de questionários socioeconômicos e ambientais, permitindo maior controle, segurança e integridade dos dados coletados por pesquisadores em campo.

## 🏛 Contexto Institucional
Projeto alinhado às linhas de pesquisa do **PPGEAA (Programa de Pós-Graduação em Estudos Antrópicos na Amazônia)** da **Universidade Federal do Pará (UFPA) - Campus Castanhal**.

A ferramenta serve como suporte tecnológico para investigar as diferentes formas de antropismo na região, auxiliando na sistematização de saberes locais e análises interdisciplinares sobre ambientes, saúde e práticas culturais.

---

## 🚀 Funcionalidades Principais

### 🔐 Controle de Acesso e Segurança
- **Administrador:** Acesso total ao sistema (Gestão de Usuários, Locais, Criação de Formulários).
- **Pesquisador:** Acesso restrito (Visualização de Dashboard e Aplicação de Pesquisas).
- **Autenticação e Criptografia:** Autenticação via JWT (JSON Web Token) e senhas criptografadas com Bcrypt.
- **Proteção contra Força Bruta:** Rate Limiting configurado (Throttler) para bloquear múltiplas tentativas de acesso.
- **Proteção de Dados (Mobile):** Uso do `expo-secure-store` para armazenamento nativo criptografado de tokens e dados sensíveis em dispositivos móveis (iOS Keychain / Android Keystore).
- **Segurança de API e Redes:** Implementação do Helmet (proteção contra XSS e Clickjacking), CORS restrito e Validação Estrita de Entradas (ValidationPipe e DTOs) em todos os endpoints.

### 📝 Gestão de Questionários Dinâmicos
- Criação de formulários personalizados (Survey Builder).
- Suporte a múltiplos tipos de perguntas (Texto, Numérico, Múltipla Escolha, Booleano).
- Armazenamento flexível usando JSONB no PostgreSQL.

### 📍 Gestão de Território
- Cadastro de Localidades e Comunidades.
- Vinculação de pesquisas a locais específicos por Código Único.

---

## 🛠 Tecnologias Utilizadas

O projeto utiliza uma arquitetura moderna baseada em microserviços e containers.

### Backend (API)
- **NestJS:** Framework Node.js progressivo e modular.
- **TypeORM:** ORM para interação com o banco de dados.
- **PostgreSQL:** Banco de dados relacional robusto.
- **Passport/JWT:** Estratégias de autenticação segura.

### Frontend (Web)
- **React + Vite:** Interface rápida e responsiva.
- **TypeScript:** Tipagem estática para maior segurança no código.
- **Lucide React:** Biblioteca de ícones moderna.
- **CSS Modules:** Estilização modular e "Clean UI".

### Infraestrutura
- **Docker & Docker Compose:** Orquestração de containers (API + Banco + Admin).
- **PgAdmin:** Interface web para gestão do banco de dados.

---

## ⚙️ Como Rodar o Projeto

### Pré-requisitos
- Docker e Docker Compose instalados.
- Node.js (opcional, caso queira rodar fora do container).

### 1. Clonar e Configurar
```bash
git clone [https://github.com/Ediglebison/antropoindicadores-v2.git](https://github.com/Ediglebison/antropoindicadores-v2.git)
cd antropoindicadores-v2
```

### 2. Como rodar tudo ao mesmo tempo?
No VS Code, você pode abrir vários terminais clicando no botão + ou no ícone de divisão de terminal.

- Terminal 1 (Backend):

```Bash
cd backend
npm run start:dev
```
- Terminal 2 (Web):

```Bash
cd web
npm run dev
```
- Terminal 3 (Mobile):

```Bash
cd mobile
npx expo start
```