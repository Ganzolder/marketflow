import fs from 'fs/promises';
import path from 'path';
import type { Campaign } from './types';

// NOTE: Every time you change the structure of the data, you need to update the db.json file
type DB = {
    campaigns: Campaign[];
};

const DB_FILE = path.join(process.cwd(), 'db.json');

class Database {
    private data: DB | null = null;
    private writePromise: Promise<void> | null = null;

    async read(): Promise<DB> {
        if (this.data) {
            return this.data;
        }
        try {
            const fileContent = await fs.readFile(DB_FILE, 'utf-8');
            this.data = JSON.parse(fileContent);
            return this.data!;
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                // File doesn't exist, create it with default structure
                const defaultData: DB = { campaigns: [] };
                await this.write(defaultData);
                return defaultData;
            }
            throw error;
        }
    }

    async write(data: DB): Promise<void> {
        this.data = data;
        // Debounce write operations to avoid race conditions
        if (!this.writePromise) {
            this.writePromise = new Promise(async (resolve, reject) => {
                try {
                    // Use a temporary file and rename to avoid corruption
                    const tempFile = DB_FILE + '.tmp';
                    await fs.writeFile(tempFile, JSON.stringify(this.data, null, 2), 'utf-8');
                    await fs.rename(tempFile, DB_FILE);
                    this.writePromise = null;
                    resolve();
                } catch (err) {
                    this.writePromise = null;
                    reject(err);
                }
            });
        }
        return this.writePromise;
    }
}

export const db = new Database();
