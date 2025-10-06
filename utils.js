// utils.js
// Utilitários melhorados e organizados
// ...lucide icons are now loaded and created globally in index.html...


export class DateUtils {
    /**
     * Formata data para exibição em português
     */
    static formatDate(date, options = {}) {
        const defaultOptions = {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            ...options
        };
        return new Date(date).toLocaleDateString('pt-BR', defaultOptions);
    }

    /**
     * Formata data e hora
     */
    static formatDateTime(date) {
        return new Date(date).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Calcula diferença em dias entre duas datas
     */
    static daysDifference(date1, date2) {
        const d1 = new Date(date1);
        const d2 = new Date(date2);
        const diffTime = Math.abs(d2 - d1);
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    }

    /**
     * Verifica se é hoje
     */
    static isToday(date) {
        const today = this.getCurrentDate();
        const checkDate = new Date(date).toISOString().split('T')[0];
        return today === checkDate;
    }

    /**
     * Obtém dia da semana em português
     */
    static getDayOfWeek(date) {
        const days = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        return days[new Date(date).getDay()];
    }

    /**
     * Retorna data relativa (ex: "há 2 dias")
     */
    static getRelativeTime(date) {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now - then;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'agora mesmo';
        if (diffMins < 60) return `há ${diffMins} minuto${diffMins > 1 ? 's' : ''}`;
        if (diffHours < 24) return `há ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
        if (diffDays < 30) return `há ${diffDays} dia${diffDays > 1 ? 's' : ''}`;
        
        return this.formatDate(date);
    }
}

export class FileUtils {
    /**
     * Exporta dados como CSV
     */
    static exportToCSV(data, filename, headers) {
        try {
            if (!data || data.length === 0) {
                throw new Error('Nenhum dado para exportar');
            }

            const csvRows = [];
            csvRows.push(headers.join(','));

            data.forEach(row => {
                const values = headers.map(header => {
                    const key = header.toLowerCase().replace(/\s/g, '');
                    const value = row[key] || '';
                    const escaped = ('' + value).replace(/"/g, '""');
                    return `"${escaped}"`;
                });
                csvRows.push(values.join(','));
            });

            const csvContent = csvRows.join('\n');
            const BOM = '\uFEFF'; // UTF-8 BOM para Excel
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            this.downloadBlob(blob, `${filename}_${DateUtils.getCurrentDate()}.csv`);
            
            return { success: true };
        } catch (error) {
            console.error('Erro ao exportar CSV:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Exporta diário como CSV
     */
    static exportJournalToCSV(entries) {
        const data = entries.map(entry => ({
            data: entry.date,
            conteudo: entry.content,
            humor: entry.mood || 'N/A'
        }));

        return this.exportToCSV(data, 'diario', ['Data', 'Conteúdo', 'Humor']);
    }

    /**
     * Exporta relatório como TXT
     */
    static exportTextFile(content, filename) {
        try {
            const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' });
            this.downloadBlob(blob, `${filename}_${DateUtils.getCurrentDate()}.txt`);
            return { success: true };
        } catch (error) {
            console.error('Erro ao exportar texto:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Faz download de um blob
     */
    static downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * Lê arquivo como texto
     */
    static async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    /**
     * Lê arquivo como JSON
     */
    static async readFileAsJSON(file) {
        try {
            const text = await this.readFileAsText(file);
            return JSON.parse(text);
        } catch (error) {
            throw new Error('Arquivo JSON inválido');
        }
    }
}

export class StringUtils {
    /**
     * Escapa HTML para prevenir XSS
     */
    static escapeHTML(str) {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    /**
     * Trunca texto
     */
    static truncate(str, maxLength, suffix = '...') {
        if (!str || str.length <= maxLength) return str;
        return str.substring(0, maxLength - suffix.length) + suffix;
    }

    /**
     * Converte para slug (URL-friendly)
     */
    static toSlug(str) {
        return str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^\w\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/--+/g, '-')
            .trim();
    }

    /**
     * Capitaliza primeira letra
     */
    static capitalize(str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    /**
     * Capitaliza cada palavra
     */
    static titleCase(str) {
        if (!str) return '';
        return str
            .toLowerCase()
            .split(' ')
            .map(word => this.capitalize(word))
            .join(' ');
    }

    /**
     * Conta palavras
     */
    static wordCount(str) {
        if (!str) return 0;
        return str.trim().split(/\s+/).length;
    }

    /**
     * Tempo estimado de leitura
     */
    static readingTime(str, wordsPerMinute = 200) {
        const words = this.wordCount(str);
        const minutes = Math.ceil(words / wordsPerMinute);
        return minutes;
    }
}

export class UIUtils {
    /**
     * Cria ícones Lucide com segurança
     */
    static createIcons() {
        try {
            if (window.lucide && typeof lucide.createIcons === 'function') {
                lucide.createIcons();
            }
        } catch (error) {
            console.warn('Erro ao criar ícones:', error);
        }
    }

    /**
     * Scroll suave para elemento
     */
    static scrollToElement(selector, offset = 0) {
        const element = document.querySelector(selector);
        if (element) {
            const top = element.offsetTop - offset;
            window.scrollTo({ top, behavior: 'smooth' });
        }
    }

    /**
     * Copia texto para clipboard
     */
    static async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return { success: true };
        } catch (error) {
            // Fallback para navegadores mais antigos
            const textarea = document.createElement('textarea');
            textarea.value = text;
            textarea.style.position = 'fixed';
            textarea.style.opacity = '0';
            document.body.appendChild(textarea);
            textarea.select();
            
            try {
                document.execCommand('copy');
                document.body.removeChild(textarea);
                return { success: true };
            } catch (err) {
                document.body.removeChild(textarea);
                return { success: false, error: 'Não foi possível copiar' };
            }
        }
    }

    /**
     * Detecta se é mobile
     */
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    /**
     * Detecta tema preferido do sistema
     */
    static getPreferredTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        }
        return 'light';
    }

    /**
     * Adiciona classe com animação
     */
    static animateClass(element, className, duration = 1000) {
        element.classList.add(className);
        setTimeout(() => {
            element.classList.remove(className);
        }, duration);
    }
}

// Funções utilitárias exportadas diretamente
export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function throttle(func, limit) {
    let inThrottle;
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

export class ArrayUtils {
    /**
     * Remove duplicatas de array
     */
    static unique(arr) {
        return [...new Set(arr)];
    }

    /**
     * Agrupa array por propriedade
     */
    static groupBy(arr, key) {
        return arr.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    /**
     * Embaralha array
     */
    static shuffle(arr) {
        const shuffled = [...arr];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }

    /**
     * Pega elementos aleatórios
     */
    static sample(arr, count = 1) {
        const shuffled = this.shuffle(arr);
        return shuffled.slice(0, count);
    }

    /**
     * Divide array em chunks
     */
    static chunk(arr, size) {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
            chunks.push(arr.slice(i, i + size));
        }
        return chunks;
    }
}

export class NumberUtils {
    /**
     * Formata número com separadores
     */
    static format(num, decimals = 0) {
        return num.toLocaleString('pt-BR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }

    /**
     * Formata como moeda
     */
    static formatCurrency(num) {
        return num.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });
    }

    /**
     * Formata como porcentagem
     */
    static formatPercentage(num, decimals = 0) {
        return `${num.toFixed(decimals)}%`;
    }

    /**
     * Clamp (limita valor entre min e max)
     */
    static clamp(num, min, max) {
        return Math.min(Math.max(num, min), max);
    }

    /**
     * Gera número aleatório entre min e max
     */
    static random(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

/**
 * Classe principal de utilitários (mantém compatibilidade)
 */
export class Utils {
    static date = DateUtils;
    static file = FileUtils;
    static string = StringUtils;
    static ui = UIUtils;
    static array = ArrayUtils;
    static number = NumberUtils;

    // Métodos legados para compatibilidade
    static getCurrentDate = DateUtils.getCurrentDate;
    static exportJournalToCSV = FileUtils.exportJournalToCSV;
    static escapeHTML = StringUtils.escapeHTML;
    // static safeCreateIcons = UIUtils.createIcons; // removido, lucide agora é global
}