import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    console.warn("ATENÇÃO: OPENAI_API_KEY não definida no arquivo .env");
}

export const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});
