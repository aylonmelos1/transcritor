import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';
import { initDb } from './database/db';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Arquivos estáticos - funciona em dev (src/) e prod (dist/)
// Em produção, o app roda de ~/transcritor com dist/app.js
// process.cwd() retorna o diretório de trabalho (onde o comando foi executado)
const publicPath = path.join(process.cwd(), 'src', 'public');
app.use(express.static(publicPath));

// Rotas
app.use('/api', apiRoutes);

// Fallback para SPA (redireciona para index.html)
app.use((req, res, next) => {
    // Se não for uma rota de API e não for um arquivo existente, serve o index.html
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicPath, 'index.html'));
    } else {
        next();
    }
});

// Inicializar DB e então iniciar servidor
initDb().then(() => {
    app.listen(port, () => {
        console.log(`Servidor rodando na porta ${port}`);
        console.log(`Acesse http://localhost:${port}`);
    });
}).catch(err => {
    console.error('Erro ao inicializar banco de dados:', err);
    process.exit(1);
});
