// components.js
// Componentes UI reutilizáveis

export class ComponentFactory {
    /**
     * Cria um botão padronizado
     */
    static button({ 
        label, 
        icon, 
        variant = 'primary', 
        size = 'md', 
        action,
        disabled = false,
        fullWidth = false,
        ariaLabel
    }) {
        const variants = {
            primary: 'bg-blue-500 hover:bg-blue-600 text-white',
            secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
            success: 'bg-green-500 hover:bg-green-600 text-white',
            danger: 'bg-red-500 hover:bg-red-600 text-white',
            outline: 'border-2 border-blue-500 text-blue-500 hover:bg-blue-50'
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm',
            md: 'px-4 py-2',
            lg: 'px-6 py-3 text-lg'
        };

        const classes = [
            variants[variant],
            sizes[size],
            'rounded-xl font-semibold transition-all duration-200',
            fullWidth ? 'w-full' : '',
            disabled ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md active:scale-95'
        ].filter(Boolean).join(' ');

        return `
            <button 
                class="${classes}"
                ${action ? `data-action="${action}"` : ''}
                ${disabled ? 'disabled' : ''}
                ${ariaLabel ? `aria-label="${ariaLabel}"` : ''}>
                ${icon ? `<i data-lucide="${icon}" class="inline-block w-5 h-5 mr-2"></i>` : ''}
                ${label}
            </button>
        `;
    }

    /**
     * Cria um card padronizado
     */
    static card({ title, subtitle, content, actions, icon, variant = 'default' }) {
        const variants = {
            default: 'bg-white border-gray-200',
            primary: 'bg-blue-50 border-blue-200',
            success: 'bg-green-50 border-green-200',
            warning: 'bg-amber-50 border-amber-200',
            danger: 'bg-red-50 border-red-200'
        };

        return `
            <div class="${variants[variant]} border rounded-2xl shadow-sm hover:shadow-md transition-shadow p-6">
                ${title ? `
                    <div class="flex items-start justify-between mb-4">
                        <div class="flex items-center gap-3">
                            ${icon ? `<i data-lucide="${icon}" class="w-6 h-6 text-gray-600"></i>` : ''}
                            <div>
                                <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                                ${subtitle ? `<p class="text-sm text-gray-600 mt-1">${subtitle}</p>` : ''}
                            </div>
                        </div>
                    </div>
                ` : ''}
                
                ${content ? `<div class="text-gray-700">${content}</div>` : ''}
                
                ${actions ? `
                    <div class="flex gap-2 mt-4 flex-wrap">
                        ${actions}
                    </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Cria um badge/tag
     */
    static badge({ label, variant = 'default', size = 'md', icon }) {
        const variants = {
            default: 'bg-gray-100 text-gray-800',
            primary: 'bg-blue-100 text-blue-800',
            success: 'bg-green-100 text-green-800',
            warning: 'bg-amber-100 text-amber-800',
            danger: 'bg-red-100 text-red-800'
        };

        const sizes = {
            sm: 'text-xs px-2 py-0.5',
            md: 'text-sm px-3 py-1',
            lg: 'text-base px-4 py-2'
        };

        return `
            <span class="${variants[variant]} ${sizes[size]} rounded-full font-semibold inline-flex items-center gap-1">
                ${icon ? `<i data-lucide="${icon}" class="w-3 h-3"></i>` : ''}
                ${label}
            </span>
        `;
    }

    /**
     * Cria uma barra de progresso
     */
    static progressBar({ current, max, label, showPercentage = true, color = 'blue' }) {
        const percentage = Math.min(100, Math.max(0, (current / max) * 100));
        
        const colors = {
            blue: 'bg-blue-500',
            green: 'bg-green-500',
            amber: 'bg-amber-500',
            red: 'bg-red-500'
        };

        return `
            <div class="w-full">
                ${label ? `
                    <div class="flex justify-between items-center mb-2">
                        <span class="text-sm font-medium text-gray-700">${label}</span>
                        ${showPercentage ? `<span class="text-sm text-gray-600">${current} / ${max}</span>` : ''}
                    </div>
                ` : ''}
                <div class="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                    <div 
                        class="${colors[color]} h-full rounded-full transition-all duration-500 ease-out"
                        style="width: ${percentage}%"
                        role="progressbar"
                        aria-valuenow="${current}"
                        aria-valuemin="0"
                        aria-valuemax="${max}">
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Cria um input com label
     */
    static input({ 
        name, 
        label, 
        type = 'text', 
        placeholder = '', 
        required = false,
        value = '',
        error = null,
        helper = null,
        icon = null
    }) {
        const inputId = `input-${name}`;
        
        return `
            <div class="space-y-2">
                ${label ? `
                    <label for="${inputId}" class="block text-sm font-medium text-gray-700">
                        ${label}
                        ${required ? '<span class="text-red-500">*</span>' : ''}
                    </label>
                ` : ''}
                
                <div class="relative">
                    ${icon ? `
                        <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <i data-lucide="${icon}" class="w-5 h-5 text-gray-400"></i>
                        </div>
                    ` : ''}
                    
                    <input
                        type="${type}"
                        id="${inputId}"
                        name="${name}"
                        value="${value}"
                        placeholder="${placeholder}"
                        ${required ? 'required' : ''}
                        class="${icon ? 'pl-10' : ''} w-full px-4 py-2 border ${error ? 'border-red-500' : 'border-gray-300'} rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
                        aria-describedby="${error ? `${inputId}-error` : helper ? `${inputId}-helper` : ''}"
                    />
                </div>
                
                ${error ? `
                    <p id="${inputId}-error" class="text-sm text-red-600" role="alert">
                        ${error}
                    </p>
                ` : ''}
                
                ${helper && !error ? `
                    <p id="${inputId}-helper" class="text-sm text-gray-500">
                        ${helper}
                    </p>
                ` : ''}
            </div>
        `;
    }

    /**
     * Cria um modal padronizado
     */
    static modal({ id, title, content, footer, size = 'md' }) {
        const sizes = {
            sm: 'max-w-sm',
            md: 'max-w-lg',
            lg: 'max-w-2xl',
            xl: 'max-w-4xl',
            full: 'max-w-full mx-4'
        };

        return `
            <div id="${id}" class="modal-overlay z-50 p-4">
                <div class="modal-content bg-white rounded-2xl shadow-2xl ${sizes[size]} w-full mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
                    <div class="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
                        <h3 class="text-xl font-bold text-gray-800">${title}</h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors" aria-label="Fechar">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    
                    <div class="px-6 py-4">
                        ${content}
                    </div>
                    
                    ${footer ? `
                        <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-end gap-2">
                            ${footer}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Cria uma lista vazia com ilustração
     */
    static emptyState({ icon, title, description, action }) {
        return `
            <div class="flex flex-col items-center justify-center py-12 px-4 text-center">
                <div class="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <i data-lucide="${icon}" class="w-12 h-12 text-gray-400"></i>
                </div>
                <h3 class="text-xl font-semibold text-gray-800 mb-2">${title}</h3>
                <p class="text-gray-600 mb-6 max-w-md">${description}</p>
                ${action ? action : ''}
            </div>
        `;
    }

    /**
     * Cria um skeleton loader
     */
    static skeleton({ type = 'text', count = 1 }) {
        const types = {
            text: 'h-4 bg-gray-200 rounded',
            title: 'h-8 bg-gray-200 rounded w-3/4',
            avatar: 'w-12 h-12 bg-gray-200 rounded-full',
            card: 'h-32 bg-gray-200 rounded-xl',
            button: 'h-10 bg-gray-200 rounded-xl w-24'
        };

        const elements = Array(count).fill(0).map(() => 
            `<div class="${types[type]} animate-pulse"></div>`
        ).join('');

        return `<div class="space-y-3">${elements}</div>`;
    }

    /**
     * Cria um tooltip
     */
    static tooltip(content, text) {
        return `
            <div class="group relative inline-block">
                ${content}
                <div class="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50">
                    ${text}
                    <div class="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                </div>
            </div>
        `;
    }
}

/**
 * Componente de gráfico usando Chart.js
 */
export class ChartComponent {
    constructor(canvasId) {
        this.canvasId = canvasId;
        this.chart = null;
    }

    /**
     * Cria gráfico de linha para humor
     */
    createMoodChart(data) {
        const canvas = document.getElementById(this.canvasId);
        if (!canvas || !window.Chart) return;

        const ctx = canvas.getContext('2d');
        
        // Destrói gráfico anterior se existir
        if (this.chart) {
            this.chart.destroy();
        }

        const moodMap = { 'pessimo': 1, 'ruim': 2, 'neutro': 3, 'bom': 4, 'feliz': 5, 'otimo': 5 };
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: data.map(d => new Date(d.date || d.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })),
                datasets: [{
                    label: 'Humor',
                    data: data.map(d => moodMap[d.emotion || d.mood] || 3),
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    tension: 0.4,
                    fill: true,
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    pointBackgroundColor: '#3b82f6',
                    pointBorderColor: '#fff',
                    pointBorderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: { size: 14 },
                        bodyFont: { size: 13 },
                        cornerRadius: 8
                    }
                },
                scales: {
                    y: {
                        min: 0,
                        max: 5,
                        ticks: {
                            stepSize: 1,
                            callback: function(value) {
                                const labels = ['', 'Péssimo', 'Ruim', 'Neutro', 'Bom', 'Ótimo'];
                                return labels[value] || '';
                            }
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'index'
                }
            }
        });
    }

    /**
     * Destrói o gráfico
     */
    destroy() {
        if (this.chart) {
            this.chart.destroy();
            this.chart = null;
        }
    }
}

// Exportação adicional para compatibilidade
export { ChartComponent as ChartFactory };