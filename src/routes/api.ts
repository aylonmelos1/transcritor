import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { transcribeAudio } from '../controllers/transcriptionController';
import { login } from '../controllers/authController';
import { getHistory, getTranscription, updateTranscription } from '../controllers/historyController';
import { authenticateToken } from '../middlewares/authMiddleware';

const router = Router();

// Configuração do Multer
const uploadDir = 'uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Rota Pública
router.get('/config', (req, res) => {
    res.json({
        authDisabled: process.env.DISABLE_AUTH === 'true'
    });
});

router.post('/login', login);

// Rotas Protegidas
router.use(authenticateToken); // Aplica autenticação em tudo abaixo

router.post('/transcribe', upload.single('audio'), transcribeAudio);
router.get('/history', getHistory);
router.get('/history/:id', getTranscription);
router.patch('/history/:id', updateTranscription);

// Gestão de Usuários
import { changePassword, createUser } from '../controllers/authController';
import { authorizeRole } from '../middlewares/authMiddleware';

router.post('/change-password', changePassword);
router.post('/users', authorizeRole(['ADMIN']), createUser);

export default router;
