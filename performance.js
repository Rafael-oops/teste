/**
 * Sistema de gerenciamento de performance
 * Lazy loading, caching, debounce, throttle e otimizações
 */

/**
 * Cache Manager para armazenamento em memória
 */
export class CacheManager {
    constructor(maxSize = 50) {
        this.cache = new Map();
        this.maxSize = maxSize;
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Armazena valor no cache
     */
    set(key, value, ttl = 300000) { // TTL padrão: 5 minutos
        // Remove item mais antigo se atingir limite
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            timestamp: Date.now(),
            ttl
        });
    }

    /**
     * Recupera valor do cache
     */
    get(key) {
        const item = this.cache.get(key);

        if (!item) {
            this.misses++;
            return null;
        }

        // Verifica se expirou
        if (Date.now() - item.timestamp > item.ttl) {
            this.cache.delete(key);
            this.misses++;
            return null;
        }

        this.hits++;
        return item.value;
    }

    /**
     * Remove item do cache
     */
    delete(key) {
        return this.cache.delete(key);
    }

    /**
     * Limpa todo o cache
     */
    clear() {
        this.cache.clear();
        this.hits = 0;
        this.misses = 0;
    }

    /**
     * Obtém estatísticas do cache
     */
    getStats() {
        const total = this.hits + this.misses;
        return {
            size: this.cache.size,
            hits: this.hits,
            misses: this.misses,
            hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%'
        };
    }
}

/**
 * Debounce - executa função após delay sem novas chamadas
 */
export function debounce(func, wait = 300) {
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

/**
 * Throttle - limita execução de função a uma vez por período
 */
export function throttle(func, limit = 300) {
    let inThrottle;
    let lastFunc;
    let lastRan;
    
    return function(...args) {
        if (!inThrottle) {
            func.apply(this, args);
            lastRan = Date.now();
            inThrottle = true;
        } else {
            clearTimeout(lastFunc);
            lastFunc = setTimeout(() => {
                if ((Date.now() - lastRan) >= limit) {
                    func.apply(this, args);
                    lastRan = Date.now();
                }
            }, Math.max(limit - (Date.now() - lastRan), 0));
        }
    };
}

/**
 * Lazy Loading para imagens
 */
export class LazyLoader {
    constructor(options = {}) {
        this.options = {
            root: null,
            rootMargin: '50px',
            threshold: 0.01,
            ...options
        };
        
        this.observer = null;
        this.images = new Set();
        
        this.init();
    }

    init() {
        if ('IntersectionObserver' in window) {
            this.observer = new IntersectionObserver(
                this.handleIntersection.bind(this),
                this.options
            );
        }
    }

    handleIntersection(entries) {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                this.loadImage(img);
                this.observer.unobserve(img);
                this.images.delete(img);
            }
        });
    }

    loadImage(img) {
        const src = img.dataset.src;
        if (!src) return;

        img.src = src;
        img.classList.add('loaded');
        img.removeAttribute('data-src');
    }

    observe(element) {
        if (this.observer) {
            this.observer.observe(element);
            this.images.add(element);
        } else {
            // Fallback para navegadores antigos
            this.loadImage(element);
        }
    }

    disconnect() {
        if (this.observer) {
            this.observer.disconnect();
            this.images.clear();
        }
    }
}

/**
 * Request Animation Frame Throttle
 * Limita execução ao ciclo de animação do navegador
 */
export function rafThrottle(func) {
    let rafId = null;
    
    return function(...args) {
        if (rafId === null) {
            rafId = requestAnimationFrame(() => {
                func.apply(this, args);
                rafId = null;
            });
        }
    };
}

/**
 * Idle Callback para tarefas não urgentes
 */
export function runWhenIdle(func, options = {}) {
    if ('requestIdleCallback' in window) {
        return requestIdleCallback(func, options);
    } else {
        // Fallback
        return setTimeout(func, 1);
    }
}

/**
 * Batch processor para processar itens em lotes
 */
export class BatchProcessor {
    constructor(batchSize = 10, delay = 50) {
        this.batchSize = batchSize;
        this.delay = delay;
        this.queue = [];
        this.processing = false;
    }

    /**
     * Adiciona item à fila
     */
    add(item) {
        this.queue.push(item);
        
        if (!this.processing) {
            this.process();
        }
    }

    /**
     * Processa lote
     */
    async process() {
        this.processing = true;

        while (this.queue.length > 0) {
            const batch = this.queue.splice(0, this.batchSize);
            
            // Processa lote
            await this.processBatch(batch);
            
            // Delay entre lotes para não bloquear UI
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        this.processing = false;
    }

    /**
     * Processa um lote (deve ser sobrescrito)
     */
    async processBatch(batch) {
        // Implementação específica
        console.log('Processing batch:', batch);
    }
}

/**
 * Virtual Scroller para listas grandes
 */
export class VirtualScroller {
    constructor(container, items, renderItem, itemHeight = 50) {
        this.container = container;
        this.items = items;
        this.renderItem = renderItem;
        this.itemHeight = itemHeight;
        
        this.scrollTop = 0;
        this.visibleStart = 0;
        this.visibleEnd = 0;
        
        this.init();
    }

    init() {
        this.container.style.position = 'relative';
        this.container.style.overflow = 'auto';
        
        // Cria container interno
        this.innerContainer = document.createElement('div');
        this.innerContainer.style.height = `${this.items.length * this.itemHeight}px`;
        this.innerContainer.style.position = 'relative';
        this.container.appendChild(this.innerContainer);
        
        // Event listener para scroll
        this.container.addEventListener('scroll', rafThrottle(() => {
            this.handleScroll();
        }));
        
        this.render();
    }

    handleScroll() {
        this.scrollTop = this.container.scrollTop;
        this.render();
    }

    render() {
        const containerHeight = this.container.clientHeight;
        const startIndex = Math.floor(this.scrollTop / this.itemHeight);
        const endIndex = Math.ceil((this.scrollTop + containerHeight) / this.itemHeight);
        
        // Buffer para suavizar scroll
        const buffer = 3;
        this.visibleStart = Math.max(0, startIndex - buffer);
        this.visibleEnd = Math.min(this.items.length, endIndex + buffer);
        
        // Limpa container
        this.innerContainer.innerHTML = '';
        
        // Renderiza itens visíveis
        for (let i = this.visibleStart; i < this.visibleEnd; i++) {
            const item = this.items[i];
            const element = this.renderItem(item, i);
            
            element.style.position = 'absolute';
            element.style.top = `${i * this.itemHeight}px`;
            element.style.height = `${this.itemHeight}px`;
            element.style.width = '100%';
            
            this.innerContainer.appendChild(element);
        }
    }

    update(newItems) {
        this.items = newItems;
        this.innerContainer.style.height = `${this.items.length * this.itemHeight}px`;
        this.render();
    }
}

/**
 * Memoização para funções puras
 */
export function memoize(func, resolver) {
    const cache = new Map();
    
    return function(...args) {
        const key = resolver ? resolver(...args) : JSON.stringify(args);
        
        if (cache.has(key)) {
            return cache.get(key);
        }
        
        const result = func.apply(this, args);
        cache.set(key, result);
        
        return result;
    };
}

/**
 * Monitor de performance
 */
export class PerformanceMonitor {
    constructor() {
        this.marks = new Map();
        this.measures = [];
    }

    /**
     * Marca início de medição
     */
    mark(name) {
        const mark = {
            name,
            startTime: performance.now()
        };
        
        this.marks.set(name, mark);
        
        if (performance.mark) {
            performance.mark(name);
        }
    }

    /**
     * Mede tempo desde marca
     */
    measure(name, startMark) {
        const endTime = performance.now();
        const startMarkData = this.marks.get(startMark);
        
        if (!startMarkData) {
            console.warn(`Mark ${startMark} not found`);
            return null;
        }
        
        const duration = endTime - startMarkData.startTime;
        
        const measure = {
            name,
            duration,
            startTime: startMarkData.startTime,
            endTime
        };
        
        this.measures.push(measure);
        
        if (performance.measure) {
            try {
                performance.measure(name, startMark);
            } catch (e) {
                // Ignore errors
            }
        }
        
        return measure;
    }

    /**
     * Obtém todas as medições
     */
    getMeasures() {
        return this.measures;
    }

    /**
     * Limpa medições
     */
    clear() {
        this.marks.clear();
        this.measures = [];
        
        if (performance.clearMarks) {
            performance.clearMarks();
        }
        if (performance.clearMeasures) {
            performance.clearMeasures();
        }
    }

    /**
     * Log de performance
     */
    logPerformance() {
        console.group('📊 Performance Report');
        
        this.measures.forEach(measure => {
            const color = measure.duration < 16 ? 'green' : 
                        measure.duration < 50 ? 'orange' : 'red';
            console.log(
                `%c${measure.name}: ${measure.duration.toFixed(2)}ms`,
                `color: ${color}; font-weight: bold;`
            );
        });
        
        console.groupEnd();
    }
}

/**
 * Web Worker Helper
 */
export class WorkerPool {
    constructor(workerScript, poolSize = 4) {
        this.workerScript = workerScript;
        this.poolSize = poolSize;
        this.workers = [];
        this.taskQueue = [];
        this.activeWorkers = 0;
        
        this.init();
    }

    init() {
        for (let i = 0; i < this.poolSize; i++) {
            const worker = new Worker(this.workerScript);
            this.workers.push({
                worker,
                busy: false
            });
        }
    }

    async execute(data) {
        return new Promise((resolve, reject) => {
            const task = { data, resolve, reject };
            
            const availableWorker = this.workers.find(w => !w.busy);
            
            if (availableWorker) {
                this.runTask(availableWorker, task);
            } else {
                this.taskQueue.push(task);
            }
        });
    }

    runTask(workerObj, task) {
        workerObj.busy = true;
        this.activeWorkers++;
        
        const handleMessage = (e) => {
            workerObj.busy = false;
            this.activeWorkers--;
            workerObj.worker.removeEventListener('message', handleMessage);
            workerObj.worker.removeEventListener('error', handleError);
            
            task.resolve(e.data);
            
            // Processa próxima tarefa da fila
            if (this.taskQueue.length > 0) {
                const nextTask = this.taskQueue.shift();
                this.runTask(workerObj, nextTask);
            }
        };
        
        const handleError = (error) => {
            workerObj.busy = false;
            this.activeWorkers--;
            workerObj.worker.removeEventListener('message', handleMessage);
            workerObj.worker.removeEventListener('error', handleError);
            
            task.reject(error);
        };
        
        workerObj.worker.addEventListener('message', handleMessage);
        workerObj.worker.addEventListener('error', handleError);
        workerObj.worker.postMessage(task.data);
    }

    terminate() {
        this.workers.forEach(w => w.worker.terminate());
        this.workers = [];
        this.taskQueue = [];
    }
}

/**
 * Resource Hints Helper
 */
export const ResourceHints = {
    /**
     * Preconnect a domínio
     */
    preconnect(url) {
        const link = document.createElement('link');
        link.rel = 'preconnect';
        link.href = url;
        document.head.appendChild(link);
    },

    /**
     * Prefetch de recurso
     */
    prefetch(url) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = url;
        document.head.appendChild(link);
    },

    /**
     * Preload de recurso crítico
     */
    preload(url, as = 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.href = url;
        link.as = as;
        document.head.appendChild(link);
    }
};

/**
 * Exporta instâncias globais
 */
export const globalCache = new CacheManager();
export const performanceMonitor = new PerformanceMonitor();