import fs from 'fs';

export const deleteFile = (filePath: string) => {
    try {
        if (filePath && fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    } catch (error) {
        console.error(`Erro ao deletar arquivo ${filePath}:`, error);
    }
};
