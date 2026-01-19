import { Request, Response } from 'express';
import fs from 'fs';
import { openai } from '../config/openai';
import { deleteFile } from '../utils/fileHandler';
import { getDb } from '../database/db';

export const transcribeAudio = async (req: Request, res: Response): Promise<void> => {
    const filePath = req.file?.path;

    try {
        if (!process.env.OPENAI_API_KEY) {
            res.status(500).json({ error: 'Chave de API da OpenAI não configurada no servidor.' });
            return;
        }

        if (!req.file || !filePath) {
            res.status(400).json({ error: 'Nenhum arquivo de áudio enviado.' });
            return;
        }

        // Recupera campos opcionais
        const prompt = req.body.prompt || undefined;
        // O título vem do front (FormData). Se não vier, usa o nome do arquivo original.
        const title = req.body.title || req.file.originalname;

        console.log(`Arquivo recebido: ${filePath}`);
        if (prompt) console.log(`Prompt: ${prompt}`);
        console.log(`Título: ${title}`);

        try {
            const systemPrompt = req.body.systemPrompt || undefined;
            const transcription = await openai.audio.transcriptions.create({
                file: fs.createReadStream(filePath),
                model: "whisper-1",
                prompt: systemPrompt ? `${systemPrompt} ${prompt || ''}`.trim() : prompt
            });

            // Limpeza do arquivo temporário
            deleteFile(filePath);

            const text = transcription.text;

            // Salvar no Banco de Dados (SQLite)
            const db = await getDb();
            const userId = req.user?.id; // Obtido do middleware authenticateToken

            await db.run(
                'INSERT INTO transcriptions (user_id, filename, title, text) VALUES (?, ?, ?, ?)',
                userId,
                req.file.originalname,
                title,
                text
            );

            // Retorna o resultado + título confirmado
            res.json({ text: transcription.text, title: title });
        } catch (openaiError: any) {
            console.error("Erro na OpenAI:", openaiError);
            if (fs.existsSync(filePath)) deleteFile(filePath);
            res.status(500).json({ error: 'Erro ao processar o áudio na OpenAI.' });
        }

    } catch (error) {
        console.error("Erro no servidor:", error);
        if (filePath) deleteFile(filePath);
        res.status(500).json({ error: 'Erro interno do servidor.' });
    }
};
