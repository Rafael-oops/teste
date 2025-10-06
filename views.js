// views.js
// Responsável por gerar o conteúdo HTML para cada view da aplicação.

import { AppState } from './state.js';
import { Utils } from './utils.js';
import { AnalyticsEngine } from './analytics.js';
import { FileUtils } from './utils.js';

/*
 * CORREÇÃO DEFINITIVA:
 * Criado um mapa de humor padrão e unificado para ser usado em toda a aplicação.
 * Isso garante que a conversão de 'humor' para 'valor numérico' seja sempre consistente.
 */
const UNIFIED_MOOD_MAP = { 
    'pessimo': 1, 
    'ruim': 2, 
    'neutro': 3, 
    'bom': 4, 
    'otimo': 5, 
    'feliz': 5 
};

export const Views = {
    render(viewName) {
        const renderAsync = async () => {
            const viewFunction = this.mapViewNameToFunction(viewName);
            if (typeof viewFunction === 'function') {
                const html = await viewFunction.call(this); 
                document.getElementById('app-content').innerHTML = html;

                if (viewName === 'dashboard') {
                    this.renderFeelingsChart();
                }
            }
        };
        renderAsync();
    },

    mapViewNameToFunction(viewName) {
        const map = {
            dashboard: this.dashboard,
            progress: this.progress,
            journal: this.journal,
            assessment: this.assessment,
            infoWall: this.infoWall,
            scheduling: this.scheduling,
            history: this.history,
            messages: this.messages,
            guidance: this.guidance,
            analytics: this.analytics,
        };
        return map[viewName];
    },

    dashboard() {
        const { userName, userProfile } = AppState.data;
        const requiredXp = AppState.xpForNextLevel(userProfile.level);
        const xpPercent = (userProfile.xp / requiredXp) * 100;

    return `
    <div class="max-w-9xl mx-auto p-4 md:p-8 space-y-6">
            <div class="bg-red-500 text-white rounded-2xl shadow-md p-6 flex items-center justify-between flex-wrap gap-4">
                <div>
                    <h2 class="text-2xl font-bold">Precisa de ajuda imediata?</h2>
                    <p class="text-red-50">Se estiver em crise, clique aqui para ver recursos de apoio.</p>
                </div>
                <button data-action="crisis-help" class="bg-white text-red-500 font-bold p-3 rounded-xl hover:bg-red-100 transition-colors">
                    <i data-lucide="alert-triangle" class="inline-block mr-2"></i> Ajuda Agora
                </button>
            </div>

            <div class="bg-white rounded-2xl shadow-md p-6">
                <div class="flex items-start sm:items-center justify-between mb-4 flex-col sm:flex-row gap-4">
                    <div>
                        <h2 class="text-2xl font-bold text-gray-800">Olá, ${Utils.escapeHTML(userName)}!</h2>
                        <p class="text-gray-600">Seu progresso de bem-estar</p>
                    </div>
                    <div id="streak-display" class="text-left sm:text-right">
                        <div class="flex items-center justify-start sm:justify-end text-amber-500 font-bold text-lg">
                            <i data-lucide="flame" class="w-5 h-5 mr-1"></i>
                            <span>${userProfile.checkInStreak} dias</span>
                        </div>
                        <p class="text-sm text-gray-500">Sequência de check-in</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <div id="level-display" class="font-bold text-lg text-blue-600 bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center flex-shrink-0">Nvl ${userProfile.level}</div>
                    <div class="flex-1">
                        <p class="text-sm font-semibold text-gray-700 mb-1">XP: <span id="xp-display">${userProfile.xp} / ${requiredXp}</span></p>
                        <div class="bg-gray-200 rounded-full h-3"><div class="xp-bar bg-blue-500 h-3 rounded-full" style="width: ${xpPercent}%;"></div></div>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-2xl shadow-md p-6">
                <div id="dashboard-mood-block" class="flex flex-col items-center justify-center mt-2 mb-2">
                    <span class="text-3xl md:text-5xl">😐</span>
                    <p class="text-sm mt-2 text-gray-600">Neutro</p>
                </div>
                <h2 class="text-xl font-bold text-gray-800">Como você está se sentindo hoje?</h2>
                <p class="mt-1 text-gray-600">Registrar seu humor concede <span class="font-bold text-blue-600">+10 XP</span>!</p>
                <div class="mt-4 flex flex-wrap justify-center gap-4">
                    ${['Feliz', 'Ótimo', 'Neutro', 'Ruim', 'Péssimo'].map(mood => {
                        const emojiMap = { 'Feliz': '😀', 'Ótimo': '😊', 'Neutro': '😐', 'Ruim': '😥', 'Péssimo': '😢' };
                        const value = mood.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                        const openForm = ['neutro', 'ruim', 'pessimo'].includes(value);
                        return `<button class="emoji-btn p-4 md:p-6 bg-gray-100 rounded-xl hover:bg-gray-200 transition-transform" data-action="record-feeling" data-emotion="${value}" data-form="${openForm}">
                            <span class="text-3xl md:text-5xl">${emojiMap[mood]}</span>
                            <p class="text-sm mt-2 text-gray-600">${mood}</p>
                        </button>`;
                    }).join('')}
                </div>
            </div>
            
            <div class="flex flex-col lg:flex-row gap-6">
                <div class="bg-white rounded-2xl shadow-md p-6 flex-1 lg:w-1/2">
                    <h3 class="text-xl font-semibold text-gray-800">Histórico de Sentimentos (Últimos 7 dias)</h3>
                    <div class="mt-4 relative" style="height:320px; min-height:220px;">
                        <canvas id="feelings-line-graph" width="600" height="300" style="width:100%;height:100%;display:block;"></canvas>
                    </div>
                </div>
                <div class="bg-white rounded-2xl shadow-md p-6 flex-1 lg:w-1/2">
                    <h3 class="text-xl font-semibold text-gray-800">Recursos Rápidos</h3>
                    <p class="mt-2 text-gray-600">Acesse ferramentas e agende um horário com a equipe de apoio.</p>
                    <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button data-view="scheduling" class="nav-btn flex items-center justify-center p-4 bg-blue-100 text-blue-800 rounded-xl hover:bg-blue-200 transition-colors">
                            <i data-lucide="calendar" class="mr-2"></i> Agendar
                        </button>
                        <button data-view="infoWall" class="nav-btn flex items-center justify-center p-4 bg-purple-100 text-purple-800 rounded-xl hover:bg-purple-200 transition-colors">
                            <i data-lucide="clipboard-list" class="mr-2"></i> Exercícios
                        </button>
                    </div>
                </div>
            </div>
        </div>`;
    },

    // ... (as outras funções como progress, journal, etc. continuam iguais) ...
    progress() {
        const challenges = AppState.challenges;
        const completed = AppState.data.userProfile.completedChallenges || [];
        const goals = AppState.data.goals || [];
        const badges = AppState.badges;
        const unlocked = AppState.data.userProfile.badges || [];

        const challengesHtml = challenges.map(ch => {
            const isCompleted = completed.includes(ch.id);
            return `<div class="challenge-card bg-white p-4 rounded-lg shadow-sm flex items-center justify-between gap-4 ${isCompleted ? 'opacity-50' : ''} transition-transform duration-200 hover:scale-[1.01]">
                <div>
                    <h4 class="font-bold text-gray-800">${ch.title}</h4>
                    <p class="text-sm text-gray-600">${ch.description}</p>
                </div>
                <button data-challenge-id="${ch.id}" data-action="complete-challenge" ${isCompleted ? 'disabled' : ''}
                    class="complete-challenge-btn flex-shrink-0 font-semibold text-sm ${
                        isCompleted
                            ? 'bg-green-200 text-green-800 cursor-not-allowed'
                            : 'bg-blue-500 hover:bg-blue-600 text-white cursor-pointer'
                    } px-3 py-2 rounded-lg transition-colors"
                    aria-label="${isCompleted ? 'Desafio já completado' : 'Completar desafio'}: ${ch.title}">
                    ${isCompleted ? '✓ Feito!' : `+${ch.xp} XP`}
                </button>
            </div>`;
        }).join('');

        const goalsHtml = goals.map(goal => {
            return `<div class="flex items-center space-x-3 p-3 bg-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                <input type="checkbox" data-goal-id="${goal.id}" ${goal.completed ? 'checked' : ''} 
                    class="goal-checkbox h-5 w-5 accent-blue-500 cursor-pointer">
                <span class="text-gray-700 flex-1 ${goal.completed ? 'goal-completed' : ''}">${Utils.escapeHTML(goal.title)}</span>
            </div>`;
        }).join('');

        const badgesHtml = Object.values(badges).map(badge => {
            const isUnlocked = unlocked.includes(badge.id);
            return `<div class="badge ${isUnlocked ? 'unlocked' : ''} relative group" data-badge-id="${badge.id}" title="${badge.description}">
                    <div class="badge-icon ${isUnlocked ? 'unlocked' : ''} flex items-center justify-center">
                        <i data-lucide="${badge.icon}" class="w-8 h-8"></i>
                        ${isUnlocked ? '<span class="absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 flex items-center justify-center" style="font-size:10px;" title="Conquista desbloqueada"><i data-lucide="check"></i></span>' : ''}
                    </div>
                    <p class="badge-title text-xs mt-2 ${isUnlocked ? 'text-gray-800' : 'text-gray-500'}">${badge.title}</p>
                    ${isUnlocked ? '<span class="block text-green-600 text-[10px] font-semibold mt-1">Desbloqueada</span>' : '<span class="block text-gray-400 text-[10px] mt-1">Bloqueada</span>'}
                </div>`;
        }).join('');

    return `<div class="max-w-9xl mx-auto space-y-8 p-4 md:p-8">
            <div class="bg-white rounded-2xl shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Desafios de Bem-Estar</h2>
                <div class="space-y-4">${challengesHtml}</div>
            </div>
            <div class="bg-white rounded-2xl shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Suas Metas Pessoais (+50 XP por meta)</h2>
                <div id="goals-list" class="space-y-4">${goalsHtml}</div>
                <form id="goal-form" class="mt-6 flex gap-2">
                    <input type="text" id="goal-input" name="goal-title" placeholder="Adicionar nova meta..." required 
                        class="flex-1 p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <button type="submit" class="p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                        <i data-lucide="plus"></i>
                    </button>
                </form>
            </div>
            <div class="bg-white rounded-2xl shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-6">Conquistas Desbloqueadas</h2>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-4">${badgesHtml}</div>
            </div>
        </div>`;
    },

    history() {
        // Mapa de humor consistente para a página de histórico
        const moodMap = { 
            'pessimo': 1, 'ruim': 2, 'neutro': 3, 'bom': 4, 'otimo': 5, 'feliz': 6 
        };
        
        const moodColors = {
            pessimo: 'bg-red-500', ruim: 'bg-orange-400', neutro: 'bg-yellow-400',
            bom: 'bg-green-500', otimo: 'bg-blue-500', feliz: 'bg-cyan-400'
        };
        
        const moodHistory = AppState.data.moodHistory || [];
        const totalEntries = moodHistory.length;
        const avgMood = totalEntries > 0 ? (moodHistory.reduce((sum, entry) => sum + (moodMap[entry.mood] || 3), 0) / totalEntries) : 0;
        const moodCounts = moodHistory.reduce((counts, entry) => {
            counts[entry.mood] = (counts[entry.mood] || 0) + 1;
            return counts;
        }, {});

        const moodGraphHtml = moodHistory.map(entry => {
            // Usa uma escala de 6 pontos para a altura
            const height = ((moodMap[entry.mood] || 3) / 6) * 100;
            const color = moodColors[entry.mood] || 'bg-gray-400';
            const date = new Date(entry.date + 'T00:00:00');
            return `<div class="text-center flex-shrink-0 w-10">
                <div class="h-32 flex items-end justify-center">
                    <div class="${color} w-6 rounded-t-md hover:opacity-80 transition-all cursor-pointer" 
                        style="height: ${height}%" 
                        title="${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)} - ${date.toLocaleDateString('pt-BR')}">
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
            </div>`;
        }).join('');

        const moodDistHtml = Object.entries(moodCounts).map(([mood, count]) => {
            const percentage = totalEntries > 0 ? (count / totalEntries * 100).toFixed(1) : 0;
            return `<div class="flex items-center justify-between">
                <span class="capitalize font-medium text-gray-700">${mood}</span>
                <div class="flex items-center space-x-2">
                    <div class="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div class="${moodColors[mood] || 'bg-gray-400'} h-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                    <span class="text-sm text-gray-600 w-12 text-right">${percentage}%</span>
                </div>
            </div>`;
        }).join('');

    return `<div class="max-w-9xl mx-auto space-y-6 p-4 md:p-8">
            <div class="bg-white p-6 rounded-2xl shadow-md">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">Meu Histórico de Humor</h2>
                <p class="text-sm text-gray-600 mb-6">Veja seu registro de humor dos últimos dias. Reconhecer padrões é o primeiro passo para o bem-estar.</p>
                <div class="bg-slate-50 p-6 rounded-lg border overflow-x-auto custom-scrollbar">
                    <div class="flex items-end justify-start h-40 gap-4 min-w-max">${moodGraphHtml || '<p class="text-gray-500 text-center w-full">Nenhum registro de humor ainda.</p>'}</div>
                </div>
                <div class="mt-6 flex justify-center flex-wrap gap-4 text-xs">
                    <div class="flex items-center"><div class="w-3 h-3 bg-red-500 rounded mr-1"></div>Péssimo</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-orange-400 rounded mr-1"></div>Ruim</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-yellow-400 rounded mr-1"></div>Neutro</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-green-500 rounded mr-1"></div>Bom</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-blue-500 rounded mr-1"></div>Ótimo</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-cyan-400 rounded mr-1"></div>Feliz</div>
                </div>
            </div>
            <div class="grid md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-md text-center">
                    <i data-lucide="trending-up" class="w-8 h-8 mx-auto text-blue-500 mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-800">Humor Médio</h3>
                    <p class="text-2xl font-bold text-blue-600">${avgMood.toFixed(1)}/5</p>
                    <p class="text-sm text-gray-500">Últimos ${totalEntries} registros</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-md text-center">
                    <i data-lucide="calendar-days" class="w-8 h-8 mx-auto text-green-500 mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-800">Sequência Atual</h3>
                    <p class="text-2xl font-bold text-green-600">${AppState.data.userProfile.checkInStreak}</p>
                    <p class="text-sm text-gray-500">Dias consecutivos</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-md text-center">
                    <i data-lucide="book-open" class="w-8 h-8 mx-auto text-purple-500 mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-800">Entradas do Diário</h3>
                    <p class="text-2xl font-bold text-purple-600">${(AppState.data.journalEntries || []).length}</p>
                    <p class="text-sm text-gray-500">Total de registros</p>
                </div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-md">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Distribuição de Humor</h3>
                <div class="space-y-3">${moodDistHtml || '<p class="text-gray-500 text-center">Nenhum dado disponível.</p>'}</div>
            </div>
        </div>`;
    },

journal() {
    const entries = AppState.data.journalEntries || [];
    
    const journalListHtml = entries.length === 0
        ? '<p class="text-gray-500 text-center mt-8">Nenhum registro para exibir. Que tal escrever o primeiro?</p>'
        : entries.map(entry => {
            return `<div class="journal-entry-card bg-gray-100 p-4 rounded-xl shadow-sm relative hover:bg-gray-50 transition-colors" 
                        data-content="${Utils.escapeHTML(entry.content)}" 
                        data-date="${entry.date}">
                <h4 class="font-semibold text-gray-800">${entry.date}</h4>
                <p class="text-gray-600 mt-2 whitespace-pre-wrap line-clamp-3">${Utils.escapeHTML(entry.content)}</p>
                <div class="absolute top-2 right-2 flex space-x-1">
                    <button data-action="edit-journal" data-id="${entry.id}" class="text-gray-400 hover:text-blue-500 p-1 transition-colors" title="Editar entrada">
                        <i data-lucide="edit-3" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                    <button data-action="delete-journal" data-id="${entry.id}" class="text-gray-400 hover:text-red-500 p-1 transition-colors" title="Excluir entrada">
                        <i data-lucide="trash-2" class="w-4 h-4 pointer-events-none"></i>
                    </button>
                </div>
            </div>`;
        }).join('');

    return `<div class="max-w-9xl mx-auto p-4 md:p-8">
        <div class="bg-white rounded-2xl shadow-md p-6 max-w-9xl mx-auto">
            <div class="flex justify-between items-center mb-4 flex-wrap gap-4">
                <div>
                    <h2 class="text-2xl font-bold text-gray-800">Seu Diário Pessoal</h2>
                    <p class="text-gray-600">Escrever uma entrada concede <span class="font-bold text-blue-600">+25 XP</span>.</p>
                </div>
                <div class="flex gap-2">
                    <button data-action="add-journal" class="flex items-center space-x-2 p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-colors">
                        <i data-lucide="plus-circle" class="pointer-events-none"></i>
                        <span>Novo Registro</span>
                    </button>
                    <button data-action="export-journal" class="flex items-center space-x-2 p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors">
                        <i data-lucide="download" class="pointer-events-none"></i>
                        <span>Exportar CSV</span>
                    </button>
                </div>
            </div>
            <div class="mt-6 mb-4">
                <input type="search" id="journal-search-input" placeholder="Buscar por palavra ou data..." class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400">
            </div>
            <div id="journal-list-container" class="mt-6 space-y-4">${journalListHtml}</div>
        </div>
    </div>`;
},

    assessment() {
    return `<div class="max-w-9xl mx-auto p-4 md:p-8">
        <div class="bg-white rounded-2xl shadow-md p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-4">Autoavaliação e Reflexão</h2>
                <p class="text-gray-600 mb-6">Reserve um momento para refletir sobre seu desenvolvimento pessoal, acadêmico e emocional. Completar a autoavaliação concede <span class="font-bold text-blue-600">+30 XP</span>.</p>
            <form id="self-assessment-form" class="space-y-6" autocomplete="off" novalidate>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Bem-Estar Acadêmico</h3>
                    <p class="text-sm text-gray-600 mb-4">Como você avalia sua dedicação e satisfação com os estudos?</p>
                    <div class="space-y-3">
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="academic-rating" value="satisfatorio" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Satisfatório - me sinto bem com meu desempenho">
                            <span class="text-gray-700">Satisfatório - me sinto bem com meu desempenho</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="academic-rating" value="precisa-foco" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Preciso de mais foco - posso melhorar">
                            <span class="text-gray-700">Preciso de mais foco - posso melhorar</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="academic-rating" value="sobrecarregado" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Estou sobrecarregado(a) - preciso de apoio">
                            <span class="text-gray-700">Estou sobrecarregado(a) - preciso de apoio</span>
                        </label>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Bem-Estar Emocional</h3>
                    <p class="text-sm text-gray-600 mb-4">Como você tem lidado com suas emoções e relacionamentos?</p>
                    <div class="space-y-3">
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="emotional-rating" value="bem" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Sinto-me bem emocionalmente">
                            <span class="text-gray-700">Sinto-me bem emocionalmente</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="emotional-rating" value="altos-baixos" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Tenho altos e baixos, mas consigo lidar">
                            <span class="text-gray-700">Tenho altos e baixos, mas consigo lidar</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="emotional-rating" value="precisa-ajuda" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Preciso de ajuda para lidar com minhas emoções">
                            <span class="text-gray-700">Preciso de ajuda para lidar com minhas emoções</span>
                        </label>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Bem-Estar Social</h3>
                    <p class="text-sm text-gray-600 mb-4">Como você avalia seus relacionamentos e vida social?</p>
                    <div class="space-y-3">
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="social-rating" value="satisfatorio" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Tenho bons relacionamentos e me sinto conectado(a)">
                            <span class="text-gray-700">Tenho bons relacionamentos e me sinto conectado(a)</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="social-rating" value="melhorar" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Poderia melhorar meus relacionamentos">
                            <span class="text-gray-700">Poderia melhorar meus relacionamentos</span>
                        </label>
                        <label class="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors">
                            <input type="radio" name="social-rating" value="isolado" class="accent-blue-500 focus:ring-2 focus:ring-blue-400" aria-label="Me sinto isolado(a) ou com dificuldades sociais">
                            <span class="text-gray-700">Me sinto isolado(a) ou com dificuldades sociais</span>
                        </label>
                    </div>
                </div>
                <div class="bg-gray-50 p-4 rounded-xl border border-gray-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Reflexões Pessoais</h3>
                    <p class="text-sm text-gray-600 mb-4">Compartilhe algo que está em sua mente (opcional)</p>
                    <textarea name="additional-comments" rows="4" placeholder="Ex: Tenho me sentido mais ansioso com as provas finais..." class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none" aria-label="Comentários adicionais"></textarea>
                </div>
                <button type="submit" class="w-full flex items-center justify-center space-x-2 p-3 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors focus:outline-none focus:ring-2 focus:ring-green-400"><i data-lucide="save"></i><span>Salvar Autoavaliação</span></button>
            </form>
        </div>
    </div>`;
    },

    infoWall() {
        return `<div class="max-w-9xl mx-auto p-4 md:p-8">
            <div class="bg-white rounded-2xl shadow-md p-6">
            <h2 class="text-2xl font-bold text-gray-800 mb-4">Mural Informativo</h2>
            <p class="text-gray-600 mb-6">Fique por dentro de eventos, dicas e recursos de bem-estar para estudantes.</p>
            <div class="space-y-6">
                <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-xl border border-blue-200">
                    <div class="flex items-start justify-between flex-wrap gap-4">
                        <div class="flex-1 min-w-[250px]">
                            <h3 class="text-lg font-semibold text-gray-800 mb-2">
                                <i data-lucide="calendar-days" class="inline w-5 h-5 mr-2 text-blue-600"></i>
                                Oficina de Gestão de Estresse
                            </h3>
                            <p class="text-sm text-gray-700 mb-3">Junte-se a nós para aprender técnicas eficazes de relaxamento e manejo de estresse. Sessão prática com exercícios de respiração e mindfulness.</p>
                            <div class="flex flex-wrap items-center text-sm text-gray-600 gap-4">
                                <span class="flex items-center">
                                    <i data-lucide="clock" class="w-4 h-4 mr-1"></i>25 de Setembro, 14h
                                </span>
                                <span class="flex items-center">
                                    <i data-lucide="map-pin" class="w-4 h-4 mr-1"></i>Auditório Principal
                                </span>
                            </div>
                        </div>
                        <button class="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors shrink-0">Inscrever-se</button>
                    </div>
                </div>
                <div class="bg-green-50 p-6 rounded-xl border border-green-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">
                        <i data-lucide="wind" class="inline w-5 h-5 mr-2 text-green-600"></i>Exercício de Respiração: Box Breathing
                    </h3>
                    <p class="text-sm text-gray-700 mb-4">Técnica simples de respiração que pode ajudar a reduzir ansiedade e melhorar o foco. Pratique por 5 minutos quando se sentir sobrecarregado.</p>
                    <div class="bg-white p-4 rounded-lg mb-4">
                        <h4 class="font-semibold text-gray-800 mb-2">Como fazer:</h4>
                        <ol class="list-decimal list-inside space-y-1 text-sm text-gray-700">
                            <li>Inspire por 4 segundos</li>
                            <li>Segure a respiração por 4 segundos</li>
                            <li>Expire por 4 segundos</li>
                            <li>Segure vazio por 4 segundos</li>
                            <li>Repita o ciclo</li>
                        </ol>
                    </div>
                    <div class="aspect-video rounded-xl overflow-hidden">
                            <h2 class="text-2xl font-bold text-gray-800 mb-4">Autoavaliação e Reflexão</h2>
                            <p class="text-gray-600 mb-6">Reserve um momento para refletir sobre seu desenvolvimento pessoal, acadêmico e emocional. Completar a autoavaliação concede <span class="font-bold text-blue-600">+30 XP</span>.</p>
                </div>
                <div class="bg-amber-50 p-6 rounded-xl border border-amber-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">
                        <i data-lucide="book-open" class="inline w-5 h-5 mr-2 text-amber-600"></i>Dicas para Estudo Eficiente
                    </h3>
                    <div class="grid md:grid-cols-2 gap-4 mt-4">
                        <div class="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
                            <h4 class="font-semibold text-gray-800 mb-2">Técnica Pomodoro</h4>
                            <p class="text-sm text-gray-600">25 min de estudo + 5 min de pausa</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
                            <h4 class="font-semibold text-gray-800 mb-2">Ambiente Organizado</h4>
                            <p class="text-sm text-gray-600">Mesa limpa, boa iluminação</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
                            <h4 class="font-semibold text-gray-800 mb-2">Metas Claras</h4>
                            <p class="text-sm text-gray-600">Defina objetivos específicos</p>
                        </div>
                        <div class="bg-white p-4 rounded-lg hover:shadow-md transition-shadow">
                            <h4 class="font-semibold text-gray-800 mb-2">Pausas Regulares</h4>
                            <p class="text-sm text-gray-600">Descanse para manter o foco</p>
                        </div>
                    </div>
                </div>
                <div class="bg-purple-50 p-6 rounded-xl border border-purple-200">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">
                        <i data-lucide="heart" class="inline w-5 h-5 mr-2 text-purple-600"></i>Recursos de Apoio
                    </h3>
                    <div class="space-y-3">
                        <a href="#" class="flex items-center p-3 bg-white rounded-lg hover:bg-purple-100 transition-colors">
                            <i data-lucide="phone" class="w-5 h-5 mr-3 text-purple-600"></i>
                            <div>
                                <p class="font-semibold text-gray-800">CVV - Centro de Valorização da Vida</p>
                                <p class="text-sm text-gray-600">188 - Apoio emocional 24h</p>
                            </div>
                        </a>
                        <a href="#" class="flex items-center p-3 bg-white rounded-lg hover:bg-purple-100 transition-colors">
                            <i data-lucide="message-circle" class="w-5 h-5 mr-3 text-purple-600"></i>
                            <div>
                                <p class="font-semibold text-gray-800">Chat de Apoio Estudantil</p>
                                <p class="text-sm text-gray-600">Suporte online com nossa equipe</p>
                            </div>
                        </a>
                    </div>
                </div>
            </div>
        </div>`;
    },

    scheduling() {
        const currentDateStr = AppState.data.currentDate;
        const currentDate = new Date(currentDateStr + 'T00:00:00');
        
        const slotsToday = (AppState.data.availableSlots || []).filter(s => s.date === currentDateStr);
        const appointments = AppState.data.appointments || [];
        
        const scheduleGridHtml = slotsToday.length === 0 
            ? '<p class="col-span-full text-center text-gray-500 py-4">Nenhum horário disponível para esta data.</p>'
            : slotsToday.map(slot => {
                const appointment = appointments.find(a => a.date === `${slot.date} ${slot.time}`);
                
                if (appointment) {
                    return `<div class="p-4 rounded-lg bg-indigo-100 text-center border border-indigo-300 cursor-pointer hover:bg-indigo-200 transition-colors" 
                        data-action="manage-appointment" data-appointment-id="${appointment.id}">
                        <h5 class="font-bold text-indigo-800">${slot.time}</h5>
                        <p class="text-sm font-medium text-indigo-700">Meu Horário</p>
                        <span class="text-xs text-indigo-600 mt-1 block">Clique para gerenciar</span>
                    </div>`;
                } else if (!slot.available) {
                    return `<div class="p-4 rounded-lg bg-gray-200 text-center cursor-not-allowed opacity-70">
                        <h5 class="font-bold text-gray-600">${slot.time}</h5>
                        <p class="text-sm font-medium text-gray-500">Indisponível</p>
                    </div>`;
                } else {
                    return `<div class="p-4 rounded-lg bg-green-50 border border-green-200 text-center cursor-pointer hover:bg-green-100 transition-colors" 
                        data-action="open-schedule-modal" data-time="${slot.time}" data-date="${slot.date}">
                        <h5 class="font-bold text-green-800">${slot.time}</h5>
                        <p class="text-sm font-medium text-green-700">Disponível</p>
                    </div>`;
                }
            }).join('');

        const confirmedHtml = appointments.filter(a => new Date(a.date) >= new Date() && a.status === 'confirmed')
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(a => {
                const date = new Date(a.date);
                return `<li>${date.toLocaleDateString('pt-BR')} às ${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})} com ${Utils.escapeHTML(a.professional)}</li>`;
            }).join('') || '<li>Você não possui agendamentos futuros.</li>';

    return `<div class="max-w-9xl mx-auto p-4 md:p-8">
        <div class="bg-white p-6 rounded-2xl shadow-md">
            <div class="flex flex-col sm:flex-row items-center justify-between mb-6 gap-4">
                <h2 class="text-2xl font-bold text-gray-800">Meus Agendamentos</h2>
                <div class="flex items-center space-x-2">
                    <button data-action="schedule-prev-day" class="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors" aria-label="Dia anterior">
                        <i data-lucide="chevron-left" class="pointer-events-none"></i>
                    </button>
                    <h4 class="text-lg font-semibold w-52 text-center">${currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}</h4>
                    <button data-action="schedule-next-day" class="p-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors" aria-label="Próximo dia">
                        <i data-lucide="chevron-right" class="pointer-events-none"></i>
                    </button>
                </div>
            </div>
            <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">${scheduleGridHtml}</div>
            <div class="mt-8 border-t pt-4">
                <h3 class="text-lg font-semibold text-gray-700 mb-2">Seus próximos agendamentos confirmados:</h3>
                <ul class="list-disc list-inside text-gray-600">${confirmedHtml}</ul>
            </div>
        </div>`;
    },

    history() {
        // Mapa de humor consistente para a página de histórico
        const moodMap = { 
            'pessimo': 1, 'ruim': 2, 'neutro': 3, 'bom': 4, 'otimo': 5, 'feliz': 6 
        };
        
        const moodColors = {
            pessimo: 'bg-red-500', ruim: 'bg-orange-400', neutro: 'bg-yellow-400',
            bom: 'bg-green-500', otimo: 'bg-blue-500', feliz: 'bg-cyan-400'
        };
        
        const moodHistory = AppState.data.moodHistory || [];
        const totalEntries = moodHistory.length;
        const avgMood = totalEntries > 0 ? (moodHistory.reduce((sum, entry) => sum + (moodMap[entry.mood] || 3), 0) / totalEntries) : 0;
        const moodCounts = moodHistory.reduce((counts, entry) => {
            counts[entry.mood] = (counts[entry.mood] || 0) + 1;
            return counts;
        }, {});

        const moodGraphHtml = moodHistory.map(entry => {
            // Usa uma escala de 6 pontos para a altura
            const height = ((moodMap[entry.mood] || 3) / 6) * 100;
            const color = moodColors[entry.mood] || 'bg-gray-400';
            const date = new Date(entry.date + 'T00:00:00');
            return `<div class="text-center flex-shrink-0 w-10">
                <div class="h-32 flex items-end justify-center">
                    <div class="${color} w-6 rounded-t-md hover:opacity-80 transition-all cursor-pointer" 
                        style="height: ${height}%" 
                        title="${entry.mood.charAt(0).toUpperCase() + entry.mood.slice(1)} - ${date.toLocaleDateString('pt-BR')}">
                    </div>
                </div>
                <p class="text-xs text-gray-500 mt-2">${date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
            </div>`;
        }).join('');

        const moodDistHtml = Object.entries(moodCounts).map(([mood, count]) => {
            const percentage = totalEntries > 0 ? (count / totalEntries * 100).toFixed(1) : 0;
            return `<div class="flex items-center justify-between">
                <span class="capitalize font-medium text-gray-700">${mood}</span>
                <div class="flex items-center space-x-2">
                    <div class="w-24 h-3 bg-gray-200 rounded-full overflow-hidden">
                        <div class="${moodColors[mood] || 'bg-gray-400'} h-full transition-all duration-500" style="width: ${percentage}%"></div>
                    </div>
                    <span class="text-sm text-gray-600 w-12 text-right">${percentage}%</span>
                </div>
            </div>`;
        }).join('');

    return `<div class="max-w-9xl mx-auto space-y-6 p-4 md:p-8">
            <div class="bg-white p-6 rounded-2xl shadow-md">
                <h2 class="text-2xl font-bold mb-4 text-gray-800">Meu Histórico de Humor</h2>
                <p class="text-sm text-gray-600 mb-6">Veja seu registro de humor dos últimos dias. Reconhecer padrões é o primeiro passo para o bem-estar.</p>
                <div class="bg-slate-50 p-6 rounded-lg border overflow-x-auto custom-scrollbar">
                    <div class="flex items-end justify-start h-40 gap-4 min-w-max">${moodGraphHtml || '<p class="text-gray-500 text-center w-full">Nenhum registro de humor ainda.</p>'}</div>
                </div>
                <div class="mt-6 flex justify-center flex-wrap gap-4 text-xs">
                    <div class="flex items-center"><div class="w-3 h-3 bg-red-500 rounded mr-1"></div>Péssimo</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-orange-400 rounded mr-1"></div>Ruim</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-yellow-400 rounded mr-1"></div>Neutro</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-green-500 rounded mr-1"></div>Bom</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-blue-500 rounded mr-1"></div>Ótimo</div>
                    <div class="flex items-center"><div class="w-3 h-3 bg-cyan-400 rounded mr-1"></div>Feliz</div>
                </div>
            </div>
            <div class="grid md:grid-cols-3 gap-6">
                <div class="bg-white p-6 rounded-2xl shadow-md text-center">
                    <i data-lucide="trending-up" class="w-8 h-8 mx-auto text-blue-500 mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-800">Humor Médio</h3>
                    <p class="text-2xl font-bold text-blue-600">${avgMood.toFixed(1)}/5</p>
                    <p class="text-sm text-gray-500">Últimos ${totalEntries} registros</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-md text-center">
                    <i data-lucide="calendar-days" class="w-8 h-8 mx-auto text-green-500 mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-800">Sequência Atual</h3>
                    <p class="text-2xl font-bold text-green-600">${AppState.data.userProfile.checkInStreak}</p>
                    <p class="text-sm text-gray-500">Dias consecutivos</p>
                </div>
                <div class="bg-white p-6 rounded-2xl shadow-md text-center">
                    <i data-lucide="book-open" class="w-8 h-8 mx-auto text-purple-500 mb-2"></i>
                    <h3 class="text-lg font-semibold text-gray-800">Entradas do Diário</h3>
                    <p class="text-2xl font-bold text-purple-600">${(AppState.data.journalEntries || []).length}</p>
                    <p class="text-sm text-gray-500">Total de registros</p>
                </div>
            </div>
            <div class="bg-white p-6 rounded-2xl shadow-md">
                <h3 class="text-xl font-semibold text-gray-800 mb-4">Distribuição de Humor</h3>
                <div class="space-y-3">${moodDistHtml || '<p class="text-gray-500 text-center">Nenhum dado disponível.</p>'}</div>
            </div>
        </div>`;
    },

    messages() {
        const messages = AppState.data.messages || [];
        const messagesHtml = messages.length === 0
            ? '<p class="text-center text-gray-500 mt-8">Nenhuma mensagem no momento.</p>'
            : messages.map(msg => {
                return `<div class="border rounded-lg p-4 hover:bg-gray-50 transition-colors ${!msg.read ? 'bg-blue-50 border-blue-200' : ''}">
                    <div class="flex justify-between items-start mb-2">
                        <div class="flex-1">
                            <p class="font-semibold text-gray-800">${Utils.escapeHTML(msg.subject)}</p>
                            <p class="text-sm text-gray-500">De: ${Utils.escapeHTML(msg.from)}</p>
                        </div>
                        <span class="text-xs text-gray-400">${new Date(msg.date).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <div class="text-sm text-gray-700 mt-2 leading-relaxed">${msg.content}</div>
                </div>`;
            }).join('');

    return `<div class="max-w-9xl mx-auto p-4 md:p-8">
            <div class="bg-white p-6 rounded-2xl shadow-md">
                <h2 class="text-2xl font-bold mb-6 text-gray-800">Mural de Mensagens</h2>
                <p class="text-gray-600 mb-6">Mensagens da equipe de suporte psicológico e orientadores educacionais.</p>
                <div class="space-y-4">${messagesHtml}</div>
            </div>
        </div>`;
    },

    guidance() {
        return `<div class="max-w-9xl mx-auto p-4 md:p-8">
            <div class="bg-white rounded-2xl shadow-md p-6 max-w-9xl mx-auto animate__animated animate__fadeIn">
                <div class="flex items-center gap-3 mb-4">
                    <i data-lucide="heart" class="w-8 h-8 text-blue-600"></i>
                    <h2 class="text-2xl font-bold text-gray-800">Orientações da Psicóloga</h2>
                </div>
                
                <div class="mb-6 p-4 bg-gray-50 rounded-lg border">
                    <h3 class="text-lg font-semibold text-gray-800 mb-2">Instruções da Semana</h3>
                    <p class="mt-2 text-gray-600"><strong>Tema:</strong> Autoconhecimento e Gestão Emocional</p>
                    <p class="text-gray-500 text-sm"><strong>Data:</strong> 04 a 10 de Setembro de 2025</p>
                    <ul class="mt-4 space-y-2 list-disc list-inside text-gray-700">
                        <li><strong>Assista ao vídeo:</strong> <a href="#" class="text-blue-600 underline hover:text-blue-800">"Entendendo suas emoções"</a></li>
                        <li><strong>Reflexão no Diário:</strong>
                            <ul class="ml-5 list-disc list-inside text-sm text-gray-600">
                                <li>Como você tem se sentido nos últimos dias?</li>
                                <li>Quais situações despertaram emoções intensas?</li>
                            </ul>
                        </li>
                        <li><strong>Autoavaliação:</strong> Complete a autoavaliação emocional disponível na aba correspondente.</li>
                        <li><strong>Exercício recomendado:</strong> <a href="#" class="text-blue-600 underline hover:text-blue-800">Técnica de respiração consciente</a></li>
                    </ul>
                </div>
                
                <div class="bg-blue-50 p-4 rounded-xl mb-6 border border-blue-200">
                    <p class="italic text-blue-800">
                        "Lembre-se: acolher seus sentimentos é o primeiro passo para cuidar da sua saúde mental.
                        Estarei com você nessa jornada."
                    </p>
                    <span class="block mt-2 text-sm text-blue-700 font-semibold">— Psicóloga Solange</span>
                </div>
                
                <div>
                    <h3 class="text-lg font-semibold text-gray-800 mb-3">Próximas Ações</h3>
                    <div class="space-y-3">
                        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border has-[:checked]:bg-green-50 has-[:checked]:border-green-300 transition-colors cursor-pointer">
                            <input type="checkbox" class="h-5 w-5 accent-blue-500">
                            <span>Finalizar o diário da semana</span>
                        </label>
                        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border has-[:checked]:bg-green-50 has-[:checked]:border-green-300 transition-colors cursor-pointer">
                            <input type="checkbox" class="h-5 w-5 accent-blue-500">
                            <span>Fazer a autoavaliação</span>
                        </label>
                        <label class="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border has-[:checked]:bg-green-50 has-[:checked]:border-green-300 transition-colors cursor-pointer">
                            <input type="checkbox" class="h-5 w-5 accent-blue-500">
                            <span>Enviar dúvidas ou feedback (formulário anexo)</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>`;
    },

    renderFeelingsChart() {
        setTimeout(() => {
            const canvas = document.getElementById('feelings-line-graph');
            if (!canvas) return;

            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.offsetWidth;
                canvas.height = Math.max(parent.offsetHeight, 260);
            }
            const ctx = canvas.getContext('2d');

            const feelings = (AppState.data.feelings || []).slice(-7);

            /*
             * CORREÇÃO: Implementada a nova escala de 6 pontos solicitada.
             * Este mapa agora é a fonte da verdade para a posição dos pontos.
             */
            const moodMap = {
                'pessimo': 1,
                'ruim': 2,
                'neutro': 3,
                'bom': 4,
                'otimo': 5,
                'feliz': 6
            };
            
            // CORREÇÃO: Mapas de cores e títulos atualizados para a escala de 6 pontos.
            const moodColor = {
                6: '#06b6d4', // Feliz (Ciano)
                5: '#3b82f6', // Ótimo (Azul)
                4: '#10b981', // Bom (Verde)
                3: '#fbbf24', // Neutro (Amarelo)
                2: '#f59e42', // Ruim (Laranja)
                1: '#ef4444'  // Péssimo (Vermelho)
            };
            const moodLabel = {
                6: 'Feliz', 5: 'Ótimo', 4: 'Bom', 3: 'Neutro', 2: 'Ruim', 1: 'Péssimo'
            };

            const labels = feelings.map(f => new Date(f.timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }));
            const dataPoints = feelings.map(f => moodMap[f.emotion] || 3);

            ctx.clearRect(0, 0, canvas.width, canvas.height);

            if (feelings.length === 0) {
                ctx.font = '16px Inter, sans-serif';
                ctx.fillStyle = '#9ca3af';
                ctx.textAlign = 'center';
                ctx.fillText('Nenhum sentimento registrado ainda.', canvas.width / 2, canvas.height / 2);
                return;
            }

            const padding = 40;
            const chartHeight = canvas.height - padding * 2;
            const stepX = dataPoints.length > 1 ? (canvas.width - padding * 2) / (dataPoints.length - 1) : 0;
            // CORREÇÃO: A altura é dividida por 5, pois há 5 intervalos entre os 6 níveis de humor.
            const stepY = chartHeight / 5;

            // CORREÇÃO: A função `getY` agora funciona perfeitamente com a escala de 1 a 6.
            const getY = (level) => canvas.height - padding - (level - 1) * stepY;

            ctx.save();
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 4]);
            // CORREÇÃO: Desenha 6 linhas na grade, uma para cada nível de humor.
            for (let i = 1; i <= 6; i++) {
                const y = getY(i);
                ctx.beginPath();
                ctx.moveTo(padding, y);
                ctx.lineTo(canvas.width - padding, y);
                ctx.stroke();
            }
            ctx.restore();

            ctx.save();
            ctx.beginPath();
            dataPoints.forEach((point, i) => {
                const x = padding + i * stepX;
                const y = getY(point);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.lineTo(padding + (dataPoints.length - 1) * stepX, canvas.height - padding);
            ctx.lineTo(padding, canvas.height - padding);
            ctx.closePath();
            ctx.globalAlpha = 0.15;
            ctx.fillStyle = '#3b82f6';
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.restore();

            ctx.beginPath();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2.5;
            dataPoints.forEach((point, i) => {
                const x = padding + i * stepX;
                const y = getY(point);
                if (i === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.stroke();

            dataPoints.forEach((point, i) => {
                const x = padding + i * stepX;
                const y = getY(point);
                ctx.beginPath();
                ctx.arc(x, y, 7, 0, Math.PI * 2);
                // CORREÇÃO: Usa o valor numérico do ponto (1-6) para buscar a cor e o título.
                ctx.fillStyle = moodColor[point] || '#3b82f6';
                ctx.shadowColor = ctx.fillStyle;
                ctx.shadowBlur = 8;
                ctx.fill();
                ctx.shadowBlur = 0;

                ctx.font = '13px Inter';
                ctx.fillStyle = moodColor[point] || '#3b82f6';
                ctx.textAlign = 'center';
                ctx.fillText(moodLabel[point] || '', x, y - 16);

                ctx.fillStyle = '#6b7280';
                ctx.font = '12px Inter';
                ctx.fillText(labels[i], x, canvas.height - 10);
            });
        }, 100);
    },

    async analytics() {
        const analytics = new AnalyticsEngine(AppState);
        const report = analytics.generateFullReport();

        return `
            <div class="max-w-9xl mx-auto p-4 md:p-8 space-y-6">
                <div class="bg-white rounded-2xl shadow-md p-6">
                    <h2 class="text-2xl font-bold text-gray-800 mb-4">Análises e Insights</h2>
                    <p class="text-gray-600">Entenda seus padrões de comportamento e bem-estar</p>
                </div>

                ${report.mood.hasData ? `
                    <div class="bg-white rounded-2xl shadow-md p-6">
                        <h3 class="text-xl font-semibold mb-4">Análise de Humor</h3>
                        <div class="grid md:grid-cols-3 gap-4 mb-6">
                            <div class="text-center p-4 bg-blue-50 rounded-xl">
                                <p class="text-sm text-gray-600">Média 7 dias</p>
                                <p class="text-3xl font-bold text-blue-600">${report.mood.avg7Days}/5</p>
                            </div>
                            <div class="text-center p-4 bg-purple-50 rounded-xl">
                                <p class="text-sm text-gray-600">Média 30 dias</p>
                                <p class="text-3xl font-bold text-purple-600">${report.mood.avg30Days}/5</p>
                            </div>
                            <div class="text-center p-4 bg-green-50 rounded-xl">
                                <p class="text-sm text-gray-600">Tendência</p>
                                <p class="text-xl font-bold text-green-600">${this.translateTrend(report.mood.trend)}</p>
                            </div>
                        </div>
                        
                        ${report.mood.insights.length > 0 ? `
                            <div class="space-y-2">
                                <h4 class="font-semibold">Insights:</h4>
                                ${report.mood.insights.map(insight => `
                                    <div class="flex items-start gap-3 p-3 rounded-lg ${this.getInsightBgColor(insight.type)}">
                                        <i data-lucide="${insight.icon}" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                                        <p class="text-sm">${insight.message}</p>
                                    </div>
                                `).join('')}
                            </div>
                        ` : ''}
                    </div>
                ` : ''}

                <div class="bg-white rounded-2xl shadow-md p-6">
                    <h3 class="text-xl font-semibold mb-4">Produtividade</h3>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm text-gray-600 mb-2">Taxa de Conclusão de Metas</p>
                            <div class="flex items-center gap-3">
                                <div class="flex-1 bg-gray-200 rounded-full h-3">
                                    <div class="bg-green-500 h-3 rounded-full" style="width: ${report.productivity.goalCompletionRate}%"></div>
                                </div>
                                <span class="font-bold text-green-600">${report.productivity.goalCompletionRate}%</span>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm text-gray-600 mb-2">Desafios Completados</p>
                            <div class="flex items-center gap-3">
                                <div class="flex-1 bg-gray-200 rounded-full h-3">
                                    <div class="bg-blue-500 h-3 rounded-full" style="width: ${report.productivity.challengeCompletionRate}%"></div>
                                </div>
                                <span class="font-bold text-blue-600">${report.productivity.challengeCompletionRate}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                ${report.recommendations.length > 0 ? `
                    <div class="bg-white rounded-2xl shadow-md p-6">
                        <h3 class="text-xl font-semibold mb-4">Recomendações Personalizadas</h3>
                        <div class="space-y-3">
                            ${report.recommendations.map(rec => `
                                <div class="border-l-4 ${this.getPriorityColor(rec.priority)} p-4 bg-gray-50 rounded-r-lg">
                                    <h4 class="font-semibold mb-1">${rec.title}</h4>
                                    <p class="text-sm text-gray-600">${rec.description}</p>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                ` : ''}

                <div class="flex gap-3">
                    <button data-action="export-report" class="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-xl hover:bg-blue-600">
                        <i data-lucide="download"></i>
                        Exportar Relatório
                    </button>
                </div>
            </div>
        `;
    },

    translateTrend(trend) {
        const map = {
            'improving': '↗ Melhorando',
            'declining': '↘ Declinando',
            'stable': '→ Estável'
        };
        return map[trend] || trend;
    },

    getInsightBgColor(type) {
        const colors = {
            positive: 'bg-green-50 border-green-200',
            warning: 'bg-amber-50 border-amber-200',
            concern: 'bg-red-50 border-red-200',
            info: 'bg-blue-50 border-blue-200'
        };
        return colors[type] || colors.info;
    },

    getPriorityColor(priority) {
        const colors = {
            high: 'border-red-500',
            medium: 'border-amber-500',
            low: 'border-blue-500'
        };
        return colors[priority] || colors.medium;
    }    
};