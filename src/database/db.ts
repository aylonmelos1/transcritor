import sqlite3 from 'sqlite3';
import { open, Database } from 'sqlite';
import path from 'path';
import bcrypt from 'bcrypt';

let db: Database | null = null;

export const initDb = async () => {
    if (db) return db;

    const dbPath = path.resolve(__dirname, '../../database.sqlite');

    db = await open({
        filename: dbPath,
        driver: sqlite3.Database
    });

    // Tabela de Usuários
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE,
            password TEXT,
            role TEXT DEFAULT 'USER'
        )
    `);

    // Tabela de Transcrições (com user_id)
    await db.exec(`
        CREATE TABLE IF NOT EXISTS transcriptions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            filename TEXT,
            title TEXT,
            text TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY(user_id) REFERENCES users(id)
        )
    `);

    // Seed de Usuários
    try {
        const adminExists = await db.get('SELECT * FROM users WHERE username = ?', 'admin');
        if (!adminExists) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 'admin', hashedPassword, 'ADMIN');
            console.log('SEED: Usuário ADMIN criado (admin:admin123)');
        }

        const masterExists = await db.get('SELECT * FROM users WHERE username = ?', 'master');
        if (!masterExists) {
            const hashedPassword = await bcrypt.hash('master123', 10);
            await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 'master', hashedPassword, 'MASTER');
            console.log('SEED: Usuário MASTER criado (master:master123)');
        }

        const userExists = await db.get('SELECT * FROM users WHERE username = ?', 'user');
        if (!userExists) {
            const hashedPassword = await bcrypt.hash('user123', 10);
            await db.run('INSERT INTO users (username, password, role) VALUES (?, ?, ?)', 'user', hashedPassword, 'USER');
            console.log('SEED: Usuário USER criado (user:user123)');
        }
    } catch (err) {
        console.error("Erro no seed:", err);
    }

    // Migração simplificada (se tabela já existia sem user_id)
    try {
        await db.exec(`ALTER TABLE transcriptions ADD COLUMN user_id INTEGER`);
    } catch (e) {
        // Ignora erro se coluna já existir
    }

    console.log('Banco de dados SQLite inicializado.');
    return db;
};

export const getDb = async () => {
    if (!db) {
        return await initDb();
    }
    return db;
};
