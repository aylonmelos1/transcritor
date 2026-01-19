import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { getDb } from '../database/db';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_prod';

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password } = req.body;
        const db = await getDb();

        const user = await db.get('SELECT * FROM users WHERE username = ?', username);

        if (!user) {
            res.status(401).json({ error: 'Usuário não encontrado.' });
            return;
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            res.status(401).json({ error: 'Senha incorreta.' });
            return;
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({ token, role: user.role, username: user.username });
    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ error: 'Erro interno no servidor.' });
    }
};

export const changePassword = async (req: Request, res: Response): Promise<void> => {
    try {
        const { oldPassword, newPassword } = req.body;
        const userId = req.user?.id;
        const db = await getDb();

        const user = await db.get('SELECT * FROM users WHERE id = ?', userId);
        if (!user) {
            res.status(404).json({ error: 'Usuário não encontrado.' });
            return;
        }

        const validPassword = await bcrypt.compare(oldPassword, user.password);
        if (!validPassword) {
            res.status(401).json({ error: 'Senha atual incorreta.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.run('UPDATE users SET password = ? WHERE id = ?', hashedPassword, userId);

        res.json({ message: 'Senha alterada com sucesso.' });
    } catch (error) {
        console.error("Erro ao alterar senha:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};

export const createUser = async (req: Request, res: Response): Promise<void> => {
    try {
        const { username, password, role } = req.body;
        const db = await getDb();

        // Validar role
        if (!['USER', 'MASTER', 'ADMIN'].includes(role)) {
            res.status(400).json({ error: 'Role inválida. Use USER, MASTER ou ADMIN.' });
            return;
        }

        const userExists = await db.get('SELECT * FROM users WHERE username = ?', username);
        if (userExists) {
            res.status(400).json({ error: 'Nome de usuário já existe.' });
            return;
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await db.run(
            'INSERT INTO users (username, password, role) VALUES (?, ?, ?)',
            username,
            hashedPassword,
            role
        );

        res.status(201).json({ message: 'Usuário criado com sucesso.' });
    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ error: 'Erro interno.' });
    }
};
