
// Classe StorageManager para manipulação de dados no localStorage
export class StorageManager {
    constructor(key = 'serPlenoAppState') {
        this.key = key;
    }

    load(defaults = {}) {
        try {
            const data = localStorage.getItem(this.key);
            if (!data) return { success: true, data: defaults };
            return { success: true, data: JSON.parse(data) };
        } catch (error) {
            return { success: false, error };
        }
    }

    save(data) {
        try {
            localStorage.setItem(this.key, JSON.stringify(data));
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    clear() {
        try {
            localStorage.removeItem(this.key);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }

    exportData() {
        try {
            const data = localStorage.getItem(this.key);
            return data ? data : '';
        } catch {
            return '';
        }
    }

    async importData(file) {
        try {
            const text = await file.text();
            localStorage.setItem(this.key, text);
            return { success: true };
        } catch (error) {
            return { success: false, error };
        }
    }
}