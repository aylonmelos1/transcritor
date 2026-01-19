<p align="center">
  <img src="src/public/marca.png" alt="Transcritor Studio" width="200">
</p>

<h1 align="center">🎙️ Transcritor Studio</h1>

<p align="center">
  <strong>Transcrição de áudio com IA usando OpenAI Whisper</strong>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white" alt="Node.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0+-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript">
  <img src="https://img.shields.io/badge/Express-5.0-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express">
  <img src="https://img.shields.io/badge/SQLite-3-003B57?style=for-the-badge&logo=sqlite&logoColor=white" alt="SQLite">
  <img src="https://img.shields.io/badge/OpenAI-Whisper-412991?style=for-the-badge&logo=openai&logoColor=white" alt="OpenAI">
</p>

<p align="center">
  <img src="https://img.shields.io/github/license/seu-usuario/transcritor?style=flat-square" alt="License">
  <img src="https://img.shields.io/github/last-commit/seu-usuario/transcritor?style=flat-square" alt="Last Commit">
</p>

---

## ✨ Features

| Feature | Descrição |
|---------|-----------|
| 🤖 **Transcrição com IA** | Powered by OpenAI Whisper para transcrição precisa |
| ⏱️ **Timestamps** | Cada segmento vem com marcação de tempo exata |
| 📚 **Histórico Completo** | Todas as transcrições salvas e pesquisáveis |
| ✏️ **Edição de Títulos** | Renomeie transcrições a qualquer momento |
| 📥 **Export Markdown** | Baixe transcrições formatadas com timestamps |
| 🔐 **Autenticação JWT** | Sistema seguro com tokens de 8 horas |
| 👥 **Multi-usuários** | Controle de acesso com 3 níveis (User, Master, Admin) |
| 🎨 **UI Moderna** | Interface dark mode elegante e responsiva |
| 📝 **System Prompt** | Customize a transcrição com contexto adicional |

---

## 🖥️ Screenshots

<p align="center">
  <img src="docs/screenshot-login.png" alt="Tela de Login" width="400">
  <img src="docs/screenshot-main.png" alt="Tela Principal" width="400">
</p>

---

## 🚀 Início Rápido

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Chave de API da OpenAI

### Instalação

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/transcritor.git
cd transcritor

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
# Edite o .env com suas configurações
```

### Configuração do `.env`

```env
OPENAI_API_KEY=sk-sua-chave-aqui
JWT_SECRET=sua-chave-secreta-muito-forte
PORT=3000
DISABLE_AUTH=false
```

### Executando

```bash
# Desenvolvimento (com hot-reload)
npm run dev

# Produção
npm run build
npm start
```

---

## 🔑 Sistema de Usuários

O sistema possui 3 níveis de acesso:

| Role | Permissões |
|------|------------|
| **USER** | Visualiza apenas suas próprias transcrições |
| **MASTER** | Visualiza todas as transcrições (somente leitura) |
| **ADMIN** | Gestão completa: cria usuários, visualiza tudo |

### Usuário Padrão

Na primeira execução, o sistema cria automaticamente:

```
Usuário: admin
Senha: Aba@202512#
Role: ADMIN
```

> ⚠️ **Importante**: Altere a senha padrão imediatamente após o primeiro login!

---

## 🏗️ Arquitetura

```
transcritor/
├── src/
│   ├── controllers/      # Lógica de negócio
│   │   ├── authController.ts
│   │   ├── historyController.ts
│   │   └── transcriptionController.ts
│   ├── database/         # Configuração SQLite
│   │   └── db.ts
│   ├── middlewares/      # Auth & RBAC
│   │   └── authMiddleware.ts
│   ├── public/           # Frontend estático
│   │   ├── index.html
│   │   ├── style.css
│   │   └── script.js
│   ├── routes/           # Rotas da API
│   │   └── api.ts
│   └── app.ts            # Entry point
├── uploads/              # Arquivos temporários de áudio
├── database.sqlite       # Banco de dados local
└── ecosystem.config.js   # Configuração PM2
```

---

## 📡 API Endpoints

### Autenticação

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/login` | Autenticar usuário |
| POST | `/api/change-password` | Alterar senha própria |
| POST | `/api/change-username` | Alterar username próprio |
| GET | `/api/check-username/:username` | Verificar disponibilidade |
| POST | `/api/users` | Criar usuário (Admin only) |

### Transcrição

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| POST | `/api/transcribe` | Enviar áudio para transcrição |
| GET | `/api/history` | Listar transcrições |
| GET | `/api/history/:id` | Obter transcrição específica |
| PATCH | `/api/history/:id` | Atualizar título |

---

## 🐳 Deploy com PM2

```bash
# Build do projeto
npm run build

# Iniciar com PM2
pm2 start ecosystem.config.js --env production

# Verificar status
pm2 status

# Ver logs
pm2 logs transcritor
```

---

## 🔧 Modo Público (Sem Autenticação)

Para ambientes internos/confiáveis, você pode desabilitar a autenticação:

```env
DISABLE_AUTH=true
```

> ⚠️ **Atenção**: Use apenas em redes internas seguras!

---

## 📄 Licença

Este projeto é privado e de uso exclusivo.

---

## 🤝 Desenvolvido por

<p align="center">
  <strong>AbaIncêndio</strong><br>
  <a href="https://abaincendio.com.br">abaincendio.com.br</a>
</p>

---

<p align="center">
  Feito com ❤️ e ☕ usando <a href="https://openai.com/research/whisper">OpenAI Whisper</a>
</p>
