import express from 'express';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import apiRoutes from './routes/api';

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
// Express 5+ usa sintaxe diferente para wildcard
app.use((req, res, next) => {
    // Se não for uma rota de API e não for um arquivo existente, serve o index.html
    if (!req.path.startsWith('/api')) {
        res.sendFile(path.join(publicPath, 'index.html'));
    } else {
        next();
    }
});

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
    console.log(`Acesse http://localhost:${port}`);
});
