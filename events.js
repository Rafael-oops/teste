import { Validator } from './validators.js';
import { AppState } from './state.js';
import { UI } from './ui.js';
import { Views } from './views.js';
import { notify } from './notifications.js';
import { FileUtils } from './utils.js';
import { AnalyticsEngine } from './analytics.js';


export const Events = {
    // Armazena referências para remoção posterior
    _boundHandlers: {},
    
    init() {
        // Event delegation otimizado
        this._boundHandlers.click = this.handleGlobalClick.bind(this);
        this._boundHandlers.submit = this.handleFormSubmit.bind(this);
        this._boundHandlers.change = this.handleInputChange.bind(this);
        this._boundHandlers.input = this.handleInputEvent.bind(this);
        this._boundHandlers.keydown = this.handleKeyDown.bind(this);
        
        document.body.addEventListener("click", this._boundHandlers.click, { passive: false });
        document.body.addEventListener("submit", this._boundHandlers.submit);
        document.body.addEventListener("change", this._boundHandlers.change, { passive: true });
        document.body.addEventListener("input", this._boundHandlers.input, { passive: true });
        window.addEventListener('keydown', this._boundHandlers.keydown);
        
        // Observa mudanças de visibilidade para pausar atualizações
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
        // Observa quando um badge é concedido para atualizar apenas o badge na UI
        AppState.observer.subscribe('badge:awarded', (badge) => {
            try {
                UI.markBadgeUnlocked(badge);
            } catch (e) {
                console.error('Erro ao atualizar badge na UI:', e);
            }
        });
    },

    destroy() {
        // Cleanup para evitar memory leaks
        document.body.removeEventListener("click", this._boundHandlers.click);
        document.body.removeEventListener("submit", this._boundHandlers.submit);
        document.body.removeEventListener("change", this._boundHandlers.change);
        document.body.removeEventListener("input", this._boundHandlers.input);
        window.removeEventListener('keydown', this._boundHandlers.keydown);
    },

    handleVisibilityChange() {
        if (document.hidden) {
            // Salva estado quando tab fica inativa
            AppState.save(true);
        }
    },

    handleKeyDown(e) {
        // Escape fecha modais
        if (e.key === 'Escape') {
            UI.hideAllModals();
            return;
        }
        
        // Ctrl/Cmd + K para busca rápida no journal
        if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('journal-search-input');
            if (searchInput) {
                searchInput.focus();
            }
        }
        
        // Navegação por teclado em modais
        if (e.key === 'Tab') {
            this.handleTabNavigation(e);
        }
    },

    handleTabNavigation(e) {
        const activeModal = document.querySelector('.modal-overlay.active');
        if (!activeModal) return;
        
        const focusableElements = activeModal.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        // Trap focus dentro do modal
        if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
        } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
        }
    },

    handleGlobalClick(e) {
        const element = e.target.closest("button, a, label, [data-action]");
        if (!element) return;

        // Previne duplo clique
        if (element.disabled || element.classList.contains('processing')) return;

        // Navegação
        if (element.matches(".nav-btn")) {
            e.preventDefault();
            const viewName = element.dataset.view;
            this.navigateToView(viewName);
            return;
        }

        // Modais
        if (element.dataset.modal) {
            e.preventDefault();
            UI.showModal(element.dataset.modal);
            return;
        }

        if (element.classList.contains('modal-close') || element.classList.contains('modal-close-privacy') || e.target.matches('.modal-overlay')) {
            e.preventDefault();
            UI.hideAllModals();
            return;
        }
        
        // Ações
        this.handleAction(element);
    },

    navigateToView(viewName) {
        const content = document.getElementById('app-content');
        
        content.style.opacity = '0';
        content.style.transform = 'translateY(10px)';
        
        setTimeout(() => {
            Views.render(viewName);
            UI.updateActiveNav(viewName);
            
            requestAnimationFrame(() => {
                content.style.transition = 'opacity 0.3s ease, transform 0.3s ease';
                content.style.opacity = '1';
                content.style.transform = 'translateY(0)';
            });
        }, 150);
    },

    async handleAction(element) {
        const action = element.dataset.action;
        if (!action) return;

        const id = element.dataset.id ? parseInt(element.dataset.id) : null;
        const isButton = element.tagName === 'BUTTON';
        
        if (isButton) {
            element.disabled = true;
        }

        try {
            await this.executeAction(action, element, id);
        } catch (error) {
            console.error('Erro ao executar ação:', error);
            notify.error('Ocorreu um erro. Tente novamente.');
        } finally {
            if (isButton) {
                element.disabled = false;
            }
        }
    },

    async executeAction(action, element, id) {
        const actionMap = {
            "logout": () => this.handleLogout(),
            "add-journal": () => UI.openJournalModal(),
            "edit-journal": () => UI.openJournalModal(id),
            "delete-journal": () => this.handleDeleteJournal(id),
            "complete-challenge": () => this.handleCompleteChallenge(element.dataset.challengeId),
            "record-feeling": () => this.handleRecordFeeling(element),
            "open-schedule-modal": () => UI.openAppointmentModal(element.dataset.date, element.dataset.time),
            "manage-appointment": () => UI.openManageAppointmentModal(parseInt(element.dataset.appointmentId || id)),
            "cancel-appointment": () => this.handleCancelAppointment(id),
            "export-journal": () => this.handleExportJournal(),
            "export-report": () => this.handleExportReport(), // CORREÇÃO: Nova ação
            "crisis-help": () => UI.showModal('crisis-modal'),
            "schedule-prev-day": () => this.handleScheduleNavigation('prev'),
            "schedule-next-day": () => this.handleScheduleNavigation('next'),
            "subscribe-event": () => this.handleSubscribeEvent(),
            "open-support-link": () => notify.info("Abrindo recursos de apoio..."),
            "toggle-guidance-task": () => this.handleToggleGuidanceTask(element.dataset.taskId),
            "toggle-mobile-menu": () => this.handleToggleMobileMenu(),
        };

        const handler = actionMap[action];
        if (handler) {
            await handler();
        } else {
            console.warn(`Ação não mapeada: ${action}`);
        }
    },

    handleLogout() {
        if (confirm("Deseja realmente sair? Seus dados salvos serão perdidos.")) {
            AppState.reset();
        }
    },

    handleDeleteJournal(id) {
        if (confirm("Tem certeza que deseja excluir este registro?")) {
            AppState.deleteJournalEntry(id);
            notify.success("Registro excluído!");
            Views.render('journal');
        }
    },

    handleCompleteChallenge(challengeId) {
        const result = AppState.completeChallenge(challengeId);
        if (result.success) {
            // Atualiza somente o botão do desafio para evitar re-render geral e flicker de ícones
            const btn = document.querySelector(`[data-challenge-id="${challengeId}"]`);
            if (btn) {
                btn.disabled = true;
                btn.classList.remove('bg-blue-500', 'hover:bg-blue-600', 'text-white');
                btn.classList.add('bg-green-200', 'text-green-800', 'cursor-not-allowed');
                btn.textContent = '✓ Feito!';
                btn.setAttribute('aria-label', 'Desafio já completado');
            }

            // Atualiza indicadores de progresso (XP, level, streak)
            UI.updateProgressUI();
            // Notifica views que podem depender disso, mas evita re-render completo
            if (typeof Views !== 'undefined' && typeof Views.updateChallengeUI === 'function') {
                try { Views.updateChallengeUI(challengeId, result.challenge); } catch (e) {}
            }
        }
    },

    handleToggleMobileMenu() {
        const panel = document.getElementById('mobile-menu-panel');
        if (!panel) return;

        const isOpen = !panel.classList.contains('translate-y-full');
        if (isOpen) {
            panel.classList.add('translate-y-full');
            panel.setAttribute('aria-hidden', 'true');
        } else {
            panel.classList.remove('translate-y-full');
            panel.setAttribute('aria-hidden', 'false');
        }
    },

    handleRecordFeeling(element) {
        const emotion = element.dataset.emotion;
        const openForm = element.dataset.form === 'true';
        
        if (openForm) {
            /*
             * CORREÇÃO: Armazena a emoção inicial no próprio formulário antes de abri-lo.
             * Isso garante que, ao submeter, saibamos qual foi o gatilho original.
             */
            const form = document.getElementById('feeling-form');
            if (form) {
                form.dataset.initialEmotion = emotion;
            }
            UI.showModal('feeling-form-modal');

        } else {
            AppState.recordFeeling(emotion, { simpleClick: true });
            notify.success('Sentimento registrado!');
            element.style.transform = 'scale(1.1)';
            setTimeout(() => {
                element.style.transform = '';
                UI.updateProgressUI();
                UI.updateDashboardMood();
                if (typeof Views !== 'undefined' && Views.renderFeelingsChart) {
                    Views.renderFeelingsChart();
                }
            }, 200);
        }
    },

    handleCancelAppointment(id) {
        if (confirm("Tem certeza que deseja cancelar este agendamento?")) {
            AppState.cancelAppointment(id);
            UI.hideAllModals();
            Views.render('scheduling');
        }
    },

    handleExportJournal() {
        try {
            // CORREÇÃO: Usa a classe FileUtils importada corretamente.
            const result = FileUtils.exportJournalToCSV(AppState.data.journalEntries);
            
            if (result.success) {
                notify.success('Diário exportado com sucesso!');
            } else {
                notify.error('Erro ao exportar diário: ' + result.error);
            }
        } catch (error) {
            notify.error('Ocorreu um erro inesperado ao exportar.');
            console.error(error);
        }
    },

    // CORREÇÃO: Nova função para exportar o relatório de análise.
    handleExportReport() {
        try {
            const analytics = new AnalyticsEngine(AppState);
            const reportText = analytics.exportReportAsText();
            const result = FileUtils.exportTextFile(reportText, 'relatorio_ser_pleno');

            if(result.success) {
                notify.success('Relatório exportado com sucesso!');
            } else {
                notify.error('Erro ao exportar relatório: ' + result.error);
            }
        } catch (error) {
            notify.error('Ocorreu um erro inesperado ao gerar o relatório.');
            console.error(error);
        }
    },

    handleScheduleNavigation(direction) {
        AppState.changeSchedulingDate(direction);
        Views.render('scheduling');
    },

    handleSubscribeEvent() {
        if (confirm("Deseja se inscrever neste evento?")) {
            notify.success("Inscrição confirmada com sucesso!");
        }
    },

    handleToggleGuidanceTask(taskId) {
        if (taskId) {
            // Simula a lógica, já que a função não existe no AppState
            // AppState.toggleGuidanceTask(taskId); 
            notify.success("Progresso salvo!");
        }
    },
    
    handleFormSubmit(e) {
        e.preventDefault();
        const form = e.target;
        
        const isValid = form.checkValidity();
        if (!isValid) {
            form.reportValidity();
            return;
        }
        
        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.classList.add('opacity-50', 'cursor-wait');
        }

        try {
            this.processFormSubmit(form, data);
        } finally {
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.classList.remove('opacity-50', 'cursor-wait');
            }
        }
    },

    processFormSubmit(form, data) {
        const formHandlers = {
            "login-form": () => this.handleLoginSubmit(data),
            "journal-form": () => this.handleJournalSubmit(form, data),
            "feeling-form": () => this.handleFeelingFormSubmit(form, data),
            "self-assessment-form": () => this.handleAssessmentSubmit(data),
            "goal-form": () => this.handleGoalSubmit(form, data),
            "appointment-form": () => this.handleAppointmentSubmit(form, data),
        };

        const handler = formHandlers[form.id];
        if (handler) {
            handler();
        }
    },

    handleLoginSubmit(data) {
        if (Validator.validateLogin(data.username, data.password)) {
            AppState.login(data.username.trim());
            window.location.reload();
        }
    },

    handleJournalSubmit(form, data) {
        const entryId = form.dataset.entryId ? parseInt(form.dataset.entryId) : null;
        const result = AppState.saveJournalEntry(data.content, entryId);
        
        if (result.success) {
            UI.hideAllModals();
            Views.render('journal');
        }
    },

    handleFeelingFormSubmit(form, data) {
        const validation = Validator.validateFeelingForm(data);
        if(!validation.isValid) {
            notify.error(validation.errors[0]);
            return;
        }
        
        /*
         * CORREÇÃO: Recupera a emoção inicial que foi armazenada no formulário.
         * Isso garante que estamos salvando 'ruim' ou 'pessimo' em vez de 'ansiedade'.
         */
        const initialEmotion = form.dataset.initialEmotion || data.sentimento;
        
        // Grava o sentimento inicial correto junto com os detalhes do formulário
        AppState.recordFeeling(initialEmotion, validation.sanitized);
        
        notify.success("Sentimento registrado com mais detalhes!");
        UI.hideAllModals();
        // Re-renderiza o dashboard para atualizar o gráfico com o novo dado correto.
        Views.render('dashboard'); 
        form.reset();
        
        const descContainer = document.getElementById('descricao-container');
        if (descContainer) descContainer.classList.add('hidden');
    },

    handleAssessmentSubmit(data) {
        AppState.addXp(30, 'Autoavaliação completada');
        notify.success('Autoavaliação salva com sucesso!');
        document.getElementById('self-assessment-form')?.reset();
    },

    handleGoalSubmit(form, data) {
        const title = data["goal-title"] || document.getElementById('goal-input')?.value;
        AppState.addGoal(title);
        form.reset();
        Views.render('progress');
    },

    handleAppointmentSubmit(form, data) {
        const { date, time } = form.dataset;
        const result = AppState.scheduleAppointment({ date, time, reason: data.reason });
        
        if (result.success) {
            UI.hideAllModals();
            form.reset();
            Views.render('scheduling');
        }
    },

    handleInputEvent: (function() {
        let timeout;
        return function(e) {
            if (e.target.id === 'journal-search-input') {
                clearTimeout(timeout);
                timeout = setTimeout(() => {
                    this.performJournalSearch(e.target.value);
                }, 300);
            }
        };
    })(),

    performJournalSearch(searchTerm) {
        const term = searchTerm.toLowerCase().trim();
        const entries = document.querySelectorAll('.journal-entry-card');
        
        let visibleCount = 0;
        
        entries.forEach(entry => {
            const content = entry.dataset.content?.toLowerCase() || '';
            const date = entry.dataset.date?.toLowerCase() || '';
            const isMatch = content.includes(term) || date.includes(term);
            
            entry.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            
            if (isMatch || term === '') {
                entry.classList.remove('hidden');
                entry.style.opacity = '1';
                entry.style.transform = 'scale(1)';
                visibleCount++;
            } else {
                entry.style.opacity = '0';
                entry.style.transform = 'scale(0.95)';
                setTimeout(() => entry.classList.add('hidden'), 200);
            }
        });

        this.updateSearchResults(visibleCount, term);
    },

    updateSearchResults(count, term) {
        let message = document.getElementById('search-results-message');
        
        if (term && count === 0) {
            if (!message) {
                message = document.createElement('div');
                message.id = 'search-results-message';
                message.className = 'text-center text-gray-500 mt-8 p-4 bg-gray-50 rounded-lg';
                document.getElementById('journal-list-container')?.appendChild(message);
            }
            message.textContent = `Nenhum resultado encontrado para "${term}"`;
            message.classList.remove('hidden');
        } else if (message) {
            message.classList.add('hidden');
        }
    },

    handleInputChange(e) {
        const input = e.target;
        
        if (input.matches(".goal-checkbox")) {
            const goalId = parseInt(input.dataset.goalId);
            
            const parent = input.closest('div');
            if (parent) {
                parent.style.transition = 'all 0.3s ease';
                if (input.checked) {
                    parent.style.opacity = '0.6';
                } else {
                    parent.style.opacity = '1';
                }
            }
            
            const result = AppState.toggleGoal(goalId);
            if (result && result.success) {
                // Atualiza apenas o item de meta na UI (sem re-render global)
                const goal = result.goal;
                const span = parent.querySelector('span');
                if (span) {
                    if (goal.completed) span.classList.add('goal-completed');
                    else span.classList.remove('goal-completed');
                }

                // animação sutil para indicar mudança
                parent.classList.add('transition-all');
                parent.style.transform = 'scale(0.995)';
                setTimeout(() => parent.style.transform = '', 180);

                // Atualiza indicadores de progresso (usa UI para manter animações)
                UI.updateProgressUI();

                // Notifica outros listeners que possam precisar atualizar (observer já notifica 'goal:toggled')
            } else {
                // Caso de erro, reverte visualmente o checkbox
                input.checked = !input.checked;
                notify.error(result && result.message ? result.message : 'Erro ao atualizar meta');
            }
        }
    },
};