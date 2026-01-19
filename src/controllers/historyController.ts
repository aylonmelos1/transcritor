import { Request, Response } from 'express';
import { getDb } from '../database/db';

export const getHistory = async (req: Request, res: Response): Promise<void> => {
    try {
        const db = await getDb();
        const user = req.user;

        if (!user) {
            res.status(401).json({ error: 'Não autorizado.' });
            return;
        }

        let query = 'SELECT id, filename, title, created_at, user_id FROM transcriptions';
        let params: any[] = [];

        // RBAC: MASTER e ADMIN veem tudo. USER vê apenas o seu.
        if (user.role !== 'MASTER' && user.role !== 'ADMIN') {
            query += ' WHERE user_id = ?';
            params.push(user.id);
        }

        query += ' ORDER BY created_at DESC';

        const history = await db.all(query, params);
        res.json(history);
    } catch (error) {
        console.error("Erro ao buscar histórico:", error);
        res.status(500).json({ error: 'Erro ao buscar histórico.' });
    }
};

export const getTranscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const user = req.user;
        const db = await getDb();

        const transcription = await db.get('SELECT * FROM transcriptions WHERE id = ?', id);

        if (!transcription) {
            res.status(404).json({ error: 'Transcrição não encontrada.' });
            return;
        }

        // RBAC: Verificar se pertence ao usuário (se não for MASTER/ADMIN)
        if (user && user.role !== 'MASTER' && user.role !== 'ADMIN' && transcription.user_id !== user.id) {
            res.status(403).json({ error: 'Acesso negado a esta transcrição.' });
            return;
        }

        // Parse segments se existir
        let segments = [];
        if (transcription.segments) {
            try {
                segments = JSON.parse(transcription.segments);
            } catch (e) {
                segments = [];
            }
        }

        res.json({ ...transcription, segments });
    } catch (error) {
        console.error("Erro ao buscar transcrição:", error);
        res.status(500).json({ error: 'Erro ao buscar transcrição.' });
    }
}

export const updateTranscription = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const { title } = req.body;
        const user = req.user;
        const db = await getDb();

        const transcription = await db.get('SELECT * FROM transcriptions WHERE id = ?', id);

        if (!transcription) {
            res.status(404).json({ error: 'Transcrição não encontrada.' });
            return;
        }

        // RBAC: Verificar se pertence ao usuário (se não for MASTER/ADMIN)
        if (user && user.role !== 'MASTER' && user.role !== 'ADMIN' && transcription.user_id !== user.id) {
            res.status(403).json({ error: 'Acesso negado a esta transcrição.' });
            return;
        }

        await db.run('UPDATE transcriptions SET title = ? WHERE id = ?', title, id);

        res.json({ message: 'Título atualizado com sucesso.', title });
    } catch (error) {
        console.error("Erro ao atualizar transcrição:", error);
        res.status(500).json({ error: 'Erro ao atualizar transcrição.' });
    }
}
