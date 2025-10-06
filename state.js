// state.js
// Gerenciamento de estado com Observer Pattern

import { CHALLENGES, BADGES, INITIAL_STATE } from './config.js';
import { StorageManager } from './storage.js';
import { Validator } from './validators.js';
import { notify } from './notifications.js';

/**
 * Observer Pattern para mudanças de estado
 */
class StateObserver {
    constructor() {
        this.observers = {};
    }

    subscribe(event, callback) {
        if (!this.observers[event]) {
            this.observers[event] = [];
        }
        this.observers[event].push(callback);

        // Retorna função para cancelar inscrição
        return () => {
            this.observers[event] = this.observers[event].filter(cb => cb !== callback);
        };
    }

    notify(event, data) {
        if (this.observers[event]) {
            this.observers[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Erro no observer ${event}:`, error);
                }
            });
        }
    }
}

/**
 * Gerenciador de estado melhorado
 */
export class AppStateManager {
    constructor() {
        this.data = null;
        this.storage = new StorageManager('serPlenoAppState');
        this.observer = new StateObserver();
        this.challenges = CHALLENGES;
        this.badges = BADGES;
        this.changeHistory = [];
    }

    /**
     * Carrega estado inicial
     */
    load() {
        const result = this.storage.load(this.getInitialState());
        
        if (!result.success) {
            notify.error('Erro ao carregar dados. Usando configuração padrão.');
            this.data = this.getInitialState();
        } else {
            // Merge para garantir novas propriedades
            this.data = this.mergeWithDefaults(result.data);
        }

        this.observer.notify('state:loaded', this.data);
        return this.data;
    }

    /**
     * Salva estado com debounce
     */
    save(immediate = false) {
        if (this.saveTimeout) {
            clearTimeout(this.saveTimeout);
        }
        if (immediate) {
            const result = this.storage.save(this.data);
            if (!result.success) {
                notify.error('Erro ao salvar dados: ' + result.error);
            }
            this.observer.notify('state:saved', this.data);
        } else {
            this.saveTimeout = setTimeout(() => {
                const result = this.storage.save(this.data);
                if (!result.success) {
                    notify.error('Erro ao salvar dados: ' + result.error);
                }
                this.observer.notify('state:saved', this.data);
            }, 500);
        }
    }

    /**
     * Reseta estado
     */
    reset() {
        const result = this.storage.clear();
        
        if (result.success) {
            this.data = null;
            this.changeHistory = [];
            this.observer.notify('state:reset', null);
            window.location.reload();
        } else {
            notify.error('Erro ao limpar dados');
        }
    }

    /**
     * Faz login do usuário
     */
    login(userName) {
        const validation = Validator.validateField(
            userName,
            ['required', { type: 'minLength', value: 2 }],
            'Nome'
        );

        if (validation.length > 0) {
            notify.error(validation[0]);
            return { success: false, errors: validation };
        }

    this.data = this.getInitialState();
    this.data.userName = Validator.sanitize(userName);
    this.save(true); // Salva imediatamente
    this.observer.notify('user:login', this.data.userName);
    return { success: true };
    }

    /**
     * Adiciona XP com validação
     */
    addXp(amount, reason = '') {
        if (!amount || amount <= 0) return;

        const previousXp = this.data.userProfile.xp;
        const previousLevel = this.data.userProfile.level;

        this.data.userProfile.xp += amount;
        this.checkForLevelUp();
        this.save();

        this.observer.notify('xp:added', { 
            amount, 
            reason, 
            previousXp, 
            currentXp: this.data.userProfile.xp 
        });

        // Notifica se subiu de nível
        if (this.data.userProfile.level > previousLevel) {
            notify.success(`🎉 Você subiu para o Nível ${this.data.userProfile.level}!`, {
                title: 'Parabéns!',
                duration: 5000
            });
        }
    }

    /**
     * Verifica e processa level up
     */
    checkForLevelUp() {
        const requiredXp = this.xpForNextLevel(this.data.userProfile.level);
        
        if (this.data.userProfile.xp >= requiredXp) {
            this.data.userProfile.level++;
            this.data.userProfile.xp -= requiredXp;

            this.observer.notify('user:levelup', {
                level: this.data.userProfile.level
            });

            // Badges especiais por nível
            if (this.data.userProfile.level === 5) {
                this.awardBadge("LEVEL_5");
            }

            // Recursivo para múltiplos level ups
            if (this.data.userProfile.xp >= this.xpForNextLevel(this.data.userProfile.level)) {
                this.checkForLevelUp();
            }
        }
    }

    /**
     * Calcula XP necessário para próximo nível
     */
    xpForNextLevel(level) {
        return Math.floor(100 * Math.pow(1.2, level - 1));
    }

    /**
     * Concede badge ao usuário
     */
    awardBadge(badgeId) {
        if (!this.data.userProfile.badges.includes(badgeId)) {
            this.data.userProfile.badges.push(badgeId);
            const badge = this.badges[badgeId];
            
            if (badge) {
                notify.success(`Conquista desbloqueada: ${badge.title}!`, {
                    title: '🏆 Nova Conquista',
                    duration: 5000
                });
                
                this.observer.notify('badge:awarded', badge);
            }
            
            this.save();
        }
    }

    /**
     * Atualiza sequência de check-in
     */
    updateCheckInStreak() {
        const today = new Date().toISOString().split("T")[0];
        const lastDate = this.data.userProfile.lastCheckInDate;

        if (lastDate === today) {
            return { continued: false, streak: this.data.userProfile.checkInStreak };
        }

        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];

        if (lastDate === yesterdayStr) {
            this.data.userProfile.checkInStreak++;
        } else {
            this.data.userProfile.checkInStreak = 1;
        }

        this.data.userProfile.lastCheckInDate = today;

        // Badges de sequência
        const streak = this.data.userProfile.checkInStreak;
        if (streak === 3) this.awardBadge("STREAK_3");
        if (streak === 7) this.awardBadge("STREAK_7");

        this.observer.notify('checkin:updated', { streak });
        this.save();

        return { continued: true, streak };
    }

    /**
     * Adiciona meta com validação
     */
    addGoal(title) {
        const validation = Validator.validateGoal(title);
        
        if (!validation.isValid) {
            notify.error(validation.errors[0]);
            return { success: false, errors: validation.errors };
        }

        const goal = {
            id: Date.now(),
            title: validation.sanitized,
            completed: false,
            createdAt: new Date().toISOString()
        };

        this.data.goals.unshift(goal);
        this.save();
        
        this.observer.notify('goal:added', goal);
        notify.success('Meta adicionada com sucesso!');
        
        return { success: true, goal };
    }

    /**
     * Alterna status de meta
     */
    toggleGoal(goalId) {
        const goal = this.data.goals.find(g => g.id === goalId);
        
        if (!goal) {
            notify.error('Meta não encontrada');
            return { success: false };
        }

        goal.completed = !goal.completed;
        goal.completedAt = goal.completed ? new Date().toISOString() : null;

        if (goal.completed) {
            this.addXp(50, 'Meta concluída');
            
            // Badge de mestre das metas
            const completedCount = this.data.goals.filter(g => g.completed).length;
            if (completedCount >= 5) {
                this.awardBadge("GOAL_MASTER");
            }
        }

        this.save();
        this.observer.notify('goal:toggled', goal);
        
        return { success: true, goal };
    }

    /**
     * Remove meta
     */
    deleteGoal(goalId) {
        const index = this.data.goals.findIndex(g => g.id === goalId);
        
        if (index === -1) {
            return { success: false };
        }

        const deletedGoal = this.data.goals.splice(index, 1)[0];
        this.save();
        
        this.observer.notify('goal:deleted', deletedGoal);
        notify.success('Meta removida');
        
        return { success: true };
    }

    /**
     * Salva entrada de diário com validação
     */
    saveJournalEntry(content, entryId = null) {
        const validation = Validator.validateJournalEntry(content);
        
        if (!validation.isValid) {
            notify.error(validation.errors[0]);
            return { success: false, errors: validation.errors };
        }

        if (entryId) {
            // Edição
            const entry = this.data.journalEntries.find(e => e.id === entryId);
            if (entry) {
                entry.content = validation.sanitized;
                entry.updatedAt = new Date().toISOString();
                this.save();
                
                this.observer.notify('journal:updated', entry);
                notify.success('Registro atualizado!');
                
                return { success: true, entry };
            }
        } else {
            // Nova entrada
            const entry = {
                id: Date.now(),
                date: new Date().toLocaleDateString('pt-BR'),
                content: validation.sanitized,
                createdAt: new Date().toISOString(),
                mood: this.getCurrentMood()
            };

            const isFirstEntry = this.data.journalEntries.length === 0;
            this.data.journalEntries.unshift(entry);
            
            this.addXp(25, 'Entrada no diário');
            
            if (isFirstEntry) {
                this.awardBadge("JOURNAL_START");
            }

            this.save();
            this.observer.notify('journal:created', entry);
            notify.success('Registro salvo!');
            
            return { success: true, entry };
        }

        return { success: false };
    }

    /**
     * Deleta entrada de diário
     */
    deleteJournalEntry(entryId) {
        const index = this.data.journalEntries.findIndex(e => e.id === entryId);
        
        if (index === -1) {
            return { success: false };
        }

        const deleted = this.data.journalEntries.splice(index, 1)[0];
        this.save();
        
        this.observer.notify('journal:deleted', deleted);
        notify.success('Registro excluído!');
        
        return { success: true };
    }

    /**
     * Registra sentimento
     */
    recordFeeling(emotion, details = {}) {
        const feeling = {
            emotion,
            date: new Date().toISOString().split('T')[0],
            timestamp: new Date().toISOString(),
            ...details
        };

        this.data.feelings.push(feeling);
        
        // Atualiza histórico de humor
        this.data.moodHistory.push({
            date: feeling.date,
            mood: emotion
        });

        const streakResult = this.updateCheckInStreak();
        this.addXp(10, 'Check-in diário');
        this.save();

        this.observer.notify('feeling:recorded', { feeling, streak: streakResult.streak });
        
        return { success: true, feeling };
    }

    /**
     * Completa desafio
     */
    completeChallenge(challengeId) {
        if (this.data.userProfile.completedChallenges.includes(challengeId)) {
            return { success: false, message: 'Desafio já completado' };
        }

        const challenge = this.challenges.find(c => c.id === challengeId);
        
        if (!challenge) {
            return { success: false, message: 'Desafio não encontrado' };
        }

        this.data.userProfile.completedChallenges.push(challengeId);
        this.addXp(challenge.xp, `Desafio: ${challenge.title}`);

        // Badge de herói dos desafios
        if (this.data.userProfile.completedChallenges.length === this.challenges.length) {
            this.awardBadge("CHALLENGE_HERO");
        }

        this.save();
        this.observer.notify('challenge:completed', challenge);
        notify.success(`Desafio completado: ${challenge.title} (+${challenge.xp} XP)`, {
            duration: 4000
        });

        return { success: true, challenge };
    }

    /**
     * Agenda atendimento
     */
    scheduleAppointment(appointmentData) {
        const validation = Validator.validateAppointment(appointmentData);
        
        if (!validation.isValid) {
            notify.error(validation.errors[0]);
            return { success: false, errors: validation.errors };
        }

        const appointment = {
            id: Date.now(),
            date: `${appointmentData.date} ${appointmentData.time}`,
            professional: 'A Confirmar',
            status: 'pending',
            reason: Validator.sanitize(appointmentData.reason || ''),
            createdAt: new Date().toISOString()
        };

        this.data.appointments.unshift(appointment);

        // Marca horário como indisponível
        const slot = this.data.availableSlots.find(
            s => s.date === appointmentData.date && s.time === appointmentData.time
        );
        if (slot) {
            slot.available = false;
        }

        this.save();
        this.observer.notify('appointment:scheduled', appointment);
        notify.success('Solicitação de agendamento enviada!');

        return { success: true, appointment };
    }

    /**
     * Cancela agendamento
     */
    cancelAppointment(appointmentId) {
        const index = this.data.appointments.findIndex(a => a.id === appointmentId);
        
        if (index === -1) {
            notify.error('Agendamento não encontrado');
            return { success: false };
        }

        const appointment = this.data.appointments[index];
        
        // Libera horário
        const [date, time] = appointment.date.split(' ');
        const slot = this.data.availableSlots.find(s => s.date === date && s.time === time);
        if (slot) {
            slot.available = true;
        }

        this.data.appointments.splice(index, 1);
        this.save();
        
        this.observer.notify('appointment:cancelled', appointment);
        notify.success('Agendamento cancelado');

        return { success: true };
    }

    /**
     * Muda data de agendamento
     */
    changeSchedulingDate(direction) {
        const currentDate = new Date(this.data.currentDate + 'T00:00:00');
        currentDate.setDate(currentDate.getDate() + (direction === 'next' ? 1 : -1));
        this.data.currentDate = currentDate.toISOString().split('T')[0];
        this.save();
        
        this.observer.notify('scheduling:date-changed', this.data.currentDate);
    }

    /**
     * Retorna humor atual baseado em registros recentes
     */
    getCurrentMood() {
        const recentFeelings = this.data.feelings.slice(-3);
        if (recentFeelings.length === 0) return 'neutro';
        return recentFeelings[recentFeelings.length - 1].emotion;
    }

    /**
     * Estatísticas do usuário
     */
    getStatistics() {
        const stats = {
            totalJournalEntries: this.data.journalEntries.length,
            totalGoals: this.data.goals.length,
            completedGoals: this.data.goals.filter(g => g.completed).length,
            totalBadges: this.data.userProfile.badges.length,
            checkInStreak: this.data.userProfile.checkInStreak,
            level: this.data.userProfile.level,
            xp: this.data.userProfile.xp,
            completedChallenges: this.data.userProfile.completedChallenges.length,
            totalChallenges: this.challenges.length,
            averageMood: this.calculateAverageMood()
        };

        return stats;
    }

    /**
     * Calcula humor médio
     */
    calculateAverageMood() {
        if (this.data.moodHistory.length === 0) return 0;

        const moodMap = { 'pessimo': 1, 'ruim': 2, 'neutro': 3, 'bom': 4, 'otimo': 5, 'feliz': 5 };
        const sum = this.data.moodHistory.reduce((acc, entry) => {
            return acc + (moodMap[entry.mood] || 3);
        }, 0);

        return (sum / this.data.moodHistory.length).toFixed(1);
    }

    /**
     * Retorna estado inicial com deep clone
     */
    getInitialState() {
        return JSON.parse(JSON.stringify(INITIAL_STATE));
    }

    /**
     * Merge estado salvo com defaults
     */
    mergeWithDefaults(savedState) {
        const defaults = this.getInitialState();
        const safeState = savedState || {};
        return {
            ...defaults,
            ...safeState,
            userProfile: {
                ...defaults.userProfile,
                ...(safeState.userProfile || {})
            }
        };
    }

    /**
     * Exporta dados
     */
    exportData() {
        return this.storage.exportData();
    }

    /**
     * Importa dados
     */
    async importData(file) {
        const result = await this.storage.importData(file);
        
        if (result.success) {
            this.load();
            notify.success('Dados importados com sucesso!');
        } else {
            notify.error('Erro ao importar: ' + result.error);
        }

        return result;
    }
}

// Instância singleton
export const AppState = new AppStateManager();