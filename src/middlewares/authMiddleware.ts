import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_dont_use_prod';

// Extensão da interface Request para incluir usuário
declare global {
    namespace Express {
        interface Request {
            user?: {
                id: number;
                username: string;
                role: string;
            };
        }
    }
}

export const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
    // Bypass se DISABLE_AUTH for true
    if (process.env.DISABLE_AUTH === 'true') {
        req.user = {
            id: 0,
            username: 'guest',
            role: 'ADMIN' // Acesso total se auth estiver desligada
        };
        return next();
    }

    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) return res.status(401).json({ error: 'Acesso negado. Token não fornecido.' });

    jwt.verify(token, JWT_SECRET, (err, user: any) => {
        if (err) return res.status(403).json({ error: 'Token inválido ou expirado.' });

        req.user = user;
        next();
    });
};

export const authorizeRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) return res.status(401).json({ error: 'Usuário não autenticado.' });

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Acesso proibido para este perfil.' });
        }
        next();
    };
};
