import { AppState } from './state.js';
import { StringUtils } from './utils.js';
import { NAV_ITEMS } from './config.js';

/**
 * Gerenciador de UI otimizado com lazy loading e performance
 */
class UIManager {
	constructor() {
		this._activeModals = new Set();
		this._observers = new Map();
		this._renderCache = new Map();
		this.setupIconObserver();
		this.setupModalCloseHandler();
	}

    /**
     * Garante que todos os botões .modal-close fechem o modal corretamente
     */
    setupModalCloseHandler() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('.modal-close');
            if (btn) {
                e.preventDefault();
                this.hideAllModals();
            }
        });
    }

    /**
     * Observer otimizado para ícones Lucide - renderiza apenas uma vez
     */
    setupIconObserver() {
        if (this._iconObserver) return;

        // Throttle para evitar múltiplas chamadas
        let renderTimeout;
        const renderIcons = () => {
            clearTimeout(renderTimeout);
            renderTimeout = setTimeout(() => {
                if (window.lucide?.createIcons) {
                    window.lucide.createIcons();
                }
            }, 50);
        };

        this._iconObserver = new MutationObserver((mutations) => {
            // Verifica se há novos ícones antes de renderizar
            const hasNewIcons = mutations.some(mutation => 
                Array.from(mutation.addedNodes).some(node => 
                    node.nodeType === 1 && (
                        node.hasAttribute?.('data-lucide') ||
                        node.querySelector?.('[data-lucide]')
                    )
                )
            );

            if (hasNewIcons) {
                renderIcons();
            }
        });

        // Observa apenas containers principais
        const targets = ['#app-content', '#modal-container', '#sidebar-nav-container', '#mobile-nav']
            .map(sel => document.querySelector(sel))
            .filter(Boolean);

        targets.forEach(target => {
            this._iconObserver.observe(target, { 
                childList: true, 
                subtree: true 
            });
        });
    }

    /**
     * Mostra tela de login com animação
     */
    showLoginScreen() {
        const mainApp = document.getElementById('main-app');
        const loginScreen = document.getElementById('login-screen');
        
        mainApp?.classList.add('hidden');
        
        loginScreen.innerHTML = this._createLoginHTML();
        loginScreen.classList.remove('hidden');
        
        // Animação de entrada
        requestAnimationFrame(() => {
            loginScreen.querySelector('.bg-white')?.classList.add('animate__fadeInUp');
        });
    }

    _createLoginHTML() {
        return `
            <div class="bg-white p-8 md:p-12 rounded-2xl shadow-xl w-full max-w-sm text-center animate__animated">
                <div class="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-lg">
                    <i data-lucide="heart" class="w-10 h-10 text-white"></i>
                </div>
                <h1 class="text-3xl font-bold text-gray-800 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                    Ser Pleno
                </h1>
                <p class="mt-2 text-gray-600">Sua jornada de bem-estar começa aqui</p>
                
                <form id="login-form" class="mt-6 space-y-4" autocomplete="off" novalidate>
                    <div class="relative">
                        <i data-lucide="user" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"></i>
                        <input 
                            type="text" 
                            name="username" 
                            placeholder="Seu nome" 
                            required 
                            aria-label="Nome de usuário"
                            class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-center"
                        />
                    </div>
                    
                    <div class="relative">
                        <i data-lucide="lock" class="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"></i>
                        <input 
                            type="password" 
                            name="password" 
                            placeholder="Sua senha" 
                            required 
                            aria-label="Senha"
                            class="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent transition-all text-center"
                        />
                    </div>
                    
                    <button 
                        type="submit" 
                        class="w-full p-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl hover:from-blue-600 hover:to-blue-700 transition-all font-semibold shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98]"
                    >
                        Entrar
                    </button>
                    
                    <button 
                        type="button" 
                        data-modal="privacy-modal" 
                        class="mt-4 text-sm text-blue-500 hover:text-blue-700 hover:underline transition-colors"
                    >
                        <i data-lucide="shield-check" class="inline w-4 h-4 mr-1"></i>
                        Política de Privacidade
                    </button>
                </form>
            </div>
        `;
    }

    /**
     * Mostra UI principal
     */
    showMainUI(userName) {
        document.getElementById('login-screen')?.classList.add('hidden');
        const mainApp = document.getElementById('main-app');
        mainApp?.classList.remove('hidden');
        
        this.renderNav(userName);
        
        // Animação de entrada
        requestAnimationFrame(() => {
            mainApp?.classList.add('animate__fadeIn');
        });
    }

    /**
     * Renderiza navegação com cache
     */
    renderNav(userName) {
        const cacheKey = `nav-${userName}`;
        
        if (!this._renderCache.has(cacheKey)) {
            this._renderCache.set(cacheKey, {
                sidebar: this._createSidebarNav(),
                mobile: this._createMobileNav(),
                footer: this._createSidebarFooter(userName)
            });
        }

        const cached = this._renderCache.get(cacheKey);
        
        const sidebarNav = document.getElementById('sidebar-nav-container');
        const mobileNav = document.getElementById('mobile-nav');
        const sidebarFooter = document.getElementById('sidebar-footer-container');

        if (sidebarNav) sidebarNav.innerHTML = cached.sidebar;
        if (mobileNav) mobileNav.innerHTML = cached.mobile;
        if (sidebarFooter) sidebarFooter.innerHTML = cached.footer;
    }

    _createSidebarNav() {
        const header = `
            <div class="flex items-center space-x-2 py-4 px-2 mb-4 border-b border-gray-100">
                <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <i data-lucide="heart" class="w-6 h-6 text-white"></i>
                </div>
                <h1 class="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-blue-400">
                    Ser Pleno
                </h1>
            </div>
        `;

        const navItems = NAV_ITEMS.map(item => `
            <button 
                data-view="${item.id}" 
                class="nav-btn w-full flex items-center space-x-3 p-3 rounded-xl text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 group"
                aria-label="Ir para ${item.label}"
            >
                <i data-lucide="${item.icon}" class="group-hover:scale-110 transition-transform"></i>
                <span>${item.label}</span>
            </button>
        `).join('');

        return `${header}<nav class="space-y-2" role="navigation">${navItems}</nav>`;
    }

    _createMobileNav() {
        // Hamburger button + hidden slide-up panel conter todos os itens de NAV_ITEMS
        const itemsHtml = NAV_ITEMS.map(item => `
            <button data-view="${item.id}" class="nav-btn w-full flex items-center space-x-3 p-3 rounded-lg text-gray-700 hover:bg-blue-50 hover:text-blue-600 transition-all" aria-label="Ir para ${item.label}">
                <i data-lucide="${item.icon}" class="w-5 h-5"></i>
                <span>${item.label}</span>
            </button>
        `).join('');

        return `
            <!-- Botão hamburger fixo -->
            <div class="md:hidden fixed bottom-4 right-4 z-40">
                <button data-action="toggle-mobile-menu" aria-label="Abrir menu" class="p-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400">
                    <i data-lucide="menu" class="w-5 h-5"></i>
                </button>
            </div>

            <!-- Painel móvel que sobe quando aberto -->
            <div id="mobile-menu-panel" class="fixed inset-x-0 bottom-0 transform translate-y-full transition-transform duration-300 ease-in-out z-30 md:hidden" aria-hidden="true">
                <div class="bg-white rounded-t-2xl shadow-xl p-4 max-h-[70vh] overflow-y-auto">
                    <div class="flex items-center justify-between mb-3">
                        <h3 class="text-lg font-semibold">Menu</h3>
                        <button data-action="toggle-mobile-menu" aria-label="Fechar menu" class="p-2 rounded-lg text-gray-600 hover:bg-gray-100">
                            <i data-lucide="x" class="w-5 h-5"></i>
                        </button>
                    </div>
                    <nav class="space-y-2">${itemsHtml}</nav>
                </div>
            </div>
        `;
    }

    _createSidebarFooter(userName) {
        return `
            <div class="p-3 border-t border-gray-200">
                <div class="flex flex-col items-center text-center mb-3">
                    <div class="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-2">
                        <i data-lucide="user" class="w-7 h-7 text-blue-600"></i>
                    </div>
                    <p class="text-sm text-gray-700 font-medium truncate w-full px-2">
                        <strong>${StringUtils.escapeHTML(userName)}</strong>
                    </p>
                </div>
                <button 
                    data-action="logout" 
                    class="w-full mt-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-all flex items-center justify-center gap-2"
                >
                    <i data-lucide="log-out" class="w-4 h-4"></i>
                    Sair
                </button>
            </div>
        `;
    }

    /**
     * Atualiza navegação ativa
     */
    updateActiveNav(viewName) {
        const navButtons = document.querySelectorAll('.nav-btn');
        
        navButtons.forEach(btn => {
            const isActive = btn.dataset.view === viewName;
            btn.classList.toggle('nav-btn-active', isActive);
            
            // Animação suave
            if (isActive) {
                btn.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    btn.style.transform = '';
                }, 200);
            }
        });
    }

    /**
     * Atualiza UI de progresso com animação
     */
    updateProgressUI() {
        if (!AppState.data?.userProfile) return;

        const { level, xp, checkInStreak } = AppState.data.userProfile;
        const requiredXp = AppState.xpForNextLevel(level);
        const xpPercent = Math.min(100, (xp / requiredXp) * 100);
        
        // Atualiza elementos com animação
        this._animateElement('#level-display', `Nvl ${level}`);
        this._animateElement('#xp-display', `${xp} / ${requiredXp}`);
        
        // Anima barra de XP
        const xpBars = document.querySelectorAll('.xp-bar');
        xpBars.forEach(bar => {
            bar.style.transition = 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
            requestAnimationFrame(() => {
                bar.style.width = `${xpPercent}%`;
            });
        });
        
        // Atualiza streak com pulse animation
        const streakElements = document.querySelectorAll('#streak-display span');
        streakElements.forEach(el => {
            el.textContent = `${checkInStreak} dias`;
            if (checkInStreak > 0) {
                el.classList.add('animate-pulse');
                setTimeout(() => el.classList.remove('animate-pulse'), 1000);
            }
        });
    }

    /**
     * Marca um badge específico como desbloqueado na UI sem re-renderizar tudo
     */
    markBadgeUnlocked(badge) {
        if (!badge || !badge.id) return;
        const el = document.querySelector(`[data-badge-id="${badge.id}"]`);
        if (!el) return;

        el.classList.add('unlocked');
        const iconWrap = el.querySelector('.badge-icon');
        if (iconWrap) iconWrap.classList.add('unlocked');

        // adiciona selo de check se ainda não existir (usa SVG inline para evitar re-render global)
        if (!el.querySelector('.absolute.-top-2')) {
            const checkSpan = document.createElement('span');
            checkSpan.className = 'absolute -top-2 -right-2 bg-green-500 text-white rounded-full p-1 flex items-center justify-center';
            checkSpan.style.fontSize = '10px';
            checkSpan.title = 'Conquista desbloqueada';
            // SVG simples de check (inline) para não depender do mecanismo global de icons
            checkSpan.innerHTML = `
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path d="M20 6L9 17l-5-5" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
            `;
            iconWrap?.appendChild(checkSpan);
        }

        const title = el.querySelector('.badge-title');
        if (title) title.classList.remove('text-gray-500'), title.classList.add('text-gray-800');

        const status = el.querySelector('span.block');
        if (status) {
            status.className = 'block text-green-600 text-[10px] font-semibold mt-1';
            status.textContent = 'Desbloqueada';
        }
    }

    _animateElement(selector, newText) {
        const elements = document.querySelectorAll(selector);
        elements.forEach(el => {
            if (el.textContent !== newText) {
                el.style.transition = 'opacity 0.2s ease';
                el.style.opacity = '0';
                
                setTimeout(() => {
                    el.textContent = newText;
                    el.style.opacity = '1';
                }, 200);
            }
        });
    }

    /**
     * Mostra modal com gestão de foco
     */
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        // Previne scroll do body
        document.body.style.overflow = 'hidden';
        
        modal.classList.add('active');
        this._activeModals.add(modalId);
        
        // Foca primeiro elemento focável
        requestAnimationFrame(() => {
            const focusable = modal.querySelector('input, textarea, button');
            focusable?.focus();
        });
        
        // Trap focus
        this._trapFocus(modal);
    }

    _trapFocus(modal) {
        const focusableElements = modal.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements.length === 0) return;
        
        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];
        
        const handleTab = (e) => {
            if (e.key !== 'Tab') return;
            
            if (e.shiftKey && document.activeElement === firstElement) {
                e.preventDefault();
                lastElement.focus();
            } else if (!e.shiftKey && document.activeElement === lastElement) {
                e.preventDefault();
                firstElement.focus();
            }
        };
        
        modal.addEventListener('keydown', handleTab);
        
        // Cleanup
        modal.addEventListener('transitionend', function cleanup() {
            if (!modal.classList.contains('active')) {
                modal.removeEventListener('keydown', handleTab);
                modal.removeEventListener('transitionend', cleanup);
            }
        }, { once: true });
    }

    /**
     * Esconde todos os modais
     */
    hideAllModals() {
        const activeModals = document.querySelectorAll('.modal-overlay.active');
        
        activeModals.forEach(modal => {
            modal.classList.remove('active');
            this._activeModals.delete(modal.id);
        });
        
        // Restaura scroll do body
        if (this._activeModals.size === 0) {
            document.body.style.overflow = '';
        }
    }

    /**
     * Abre modal de journal com validação
     */
    openJournalModal(entryId = null) {
        const form = document.getElementById('journal-form');
        const title = document.getElementById('journal-modal-title');
        const content = document.getElementById('journal-content');
        const deleteBtn = document.getElementById('delete-journal-btn');
        
        if (!form || !title || !content) return;
        
        form.reset();

        if (entryId) {
            const entry = AppState.data.journalEntries.find(e => e.id === entryId);
            if (entry) {
                title.textContent = "Editar Registro";
                content.value = entry.content;
                form.dataset.entryId = entryId;
                deleteBtn?.classList.remove('hidden');
                if (deleteBtn) deleteBtn.dataset.id = entryId;
            }
        } else {
            title.textContent = "Novo Registro";
            deleteBtn?.classList.add('hidden');
            delete form.dataset.entryId;
        }
        
        this.showModal('journal-modal');
        
        // Auto-resize textarea
        if (content) {
            content.style.height = 'auto';
            content.style.height = content.scrollHeight + 'px';
            
            content.addEventListener('input', function() {
                this.style.height = 'auto';
                this.style.height = this.scrollHeight + 'px';
            });
        }
    }

    /**
     * Abre modal de agendamento
     */
    openAppointmentModal(date, time) {
        const title = document.getElementById('appointment-modal-title');
        const form = document.getElementById('appointment-form');
        
        if (!form || !title) return;
        
        const formattedDate = new Date(date + 'T00:00:00').toLocaleDateString('pt-BR', { timeZone: 'UTC' });
        
        title.innerHTML = `
            <i data-lucide="calendar-plus" class="inline w-5 h-5 mr-2 text-blue-600"></i>
            Agendar para ${formattedDate} às ${time}
        `;
        
        form.dataset.date = date;
        form.dataset.time = time;
        form.reset();
        
        this.showModal('appointment-modal');
    }
    
    /**
     * Abre modal de gerenciamento de agendamento
     */
    openManageAppointmentModal(appointmentId) {
        const appointment = AppState.data.appointments.find(a => a.id === appointmentId);
        if (!appointment) return;

        const contentDiv = document.getElementById('manage-appointment-content');
        const cancelBtn = document.getElementById('cancel-appointment-btn');
        
        if (!contentDiv || !cancelBtn) return;
        
        const date = new Date(appointment.date);
        const statusMap = {
            confirmed: { label: 'Confirmado', class: 'text-green-600 bg-green-50' },
            pending: { label: 'Pendente', class: 'text-amber-600 bg-amber-50' },
            completed: { label: 'Concluído', class: 'text-blue-600 bg-blue-50' }
        };
        
        const status = statusMap[appointment.status] || statusMap.pending;

        contentDiv.innerHTML = `
            <div class="space-y-3">
                <div class="flex items-start gap-3">
                    <i data-lucide="calendar" class="w-5 h-5 text-gray-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm text-gray-600">Data</p>
                        <p class="font-semibold text-gray-800">${date.toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
                
                <div class="flex items-start gap-3">
                    <i data-lucide="clock" class="w-5 h-5 text-gray-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm text-gray-600">Horário</p>
                        <p class="font-semibold text-gray-800">${date.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}</p>
                    </div>
                </div>
                
                <div class="flex items-start gap-3">
                    <i data-lucide="user" class="w-5 h-5 text-gray-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm text-gray-600">Profissional</p>
                        <p class="font-semibold text-gray-800">${StringUtils.escapeHTML(appointment.professional)}</p>
                    </div>
                </div>
                
                <div class="flex items-start gap-3">
                    <i data-lucide="check-circle" class="w-5 h-5 text-gray-500 mt-0.5"></i>
                    <div>
                        <p class="text-sm text-gray-600">Status</p>
                        <span class="inline-block px-3 py-1 rounded-full text-sm font-semibold ${status.class}">
                            ${status.label}
                        </span>
                    </div>
                </div>
                
                ${appointment.reason ? `
                    <div class="flex items-start gap-3">
                        <i data-lucide="file-text" class="w-5 h-5 text-gray-500 mt-0.5"></i>
                        <div>
                            <p class="text-sm text-gray-600">Motivo</p>
                            <p class="text-gray-700">${StringUtils.escapeHTML(appointment.reason)}</p>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        cancelBtn.dataset.id = appointmentId;
        
        this.showModal('manage-appointment-modal');
    }
    
    /**
     * Renderiza todos os modais uma vez
     */
    renderAllModals() {
        const container = document.getElementById('modal-container');
        if (!container) return;
        
        container.innerHTML = this._createModalsHTML();
    }

    _createModalsHTML() {
        return `
            ${this._createPrivacyModal()}
            ${this._createAppointmentModal()}
            ${this._createManageAppointmentModal()}
            ${this._createJournalModal()}
            ${this._createFeelingFormModal()}
            ${this._createCrisisModal()}
        `;
    }

    _createPrivacyModal() {
        return `
            <div id="privacy-modal" class="modal-overlay z-[60] p-4">
                <div class="modal-content bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md mx-auto">
                    <div class="flex justify-between items-center mb-4">
                        <div class="flex items-center gap-2">
                            <i data-lucide="shield-check" class="w-6 h-6 text-blue-600"></i>
                            <h3 class="text-xl font-semibold text-gray-800">Aviso Importante</h3>
                        </div>
                        <button class="modal-close text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <p class="text-sm text-gray-700 leading-relaxed">
                        Para garantir o seu bem-estar, as informações que você compartilha são confidenciais, 
                        mas serão acessadas pela equipe de analistas para a triagem e gerenciamento do seu 
                        atendimento psicológico.
                    </p>
                    <button class="modal-close mt-6 w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg">
                        Entendi
                    </button>
                </div>
            </div>
        `;
    }

    _createAppointmentModal() {
        return `
            <div id="appointment-modal" class="modal-overlay z-50 p-4">
                <div class="modal-content bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm mx-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800" id="appointment-modal-title">Agendar Horário</h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="appointment-form" class="space-y-4">
                        <div>
                            <label for="appointment-reason" class="block text-sm font-medium text-gray-700 mb-2">
                                Motivo da consulta
                            </label>
                            <textarea 
                                id="appointment-reason"
                                name="reason" 
                                rows="3" 
                                placeholder="Descreva brevemente o motivo..." 
                                class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all"
                            ></textarea>
                        </div>
                        <button type="submit" class="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                            <i data-lucide="check" class="w-5 h-5"></i>
                            Confirmar Agendamento
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    _createManageAppointmentModal() {
        return `
            <div id="manage-appointment-modal" class="modal-overlay z-50 p-4">
                <div class="modal-content bg-white p-6 rounded-2xl shadow-2xl w-full max-w-sm mx-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800">Detalhes do Agendamento</h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <div id="manage-appointment-content" class="text-gray-700"></div>
                    <div class="mt-6 flex flex-col gap-2">
                        <button id="cancel-appointment-btn" data-action="cancel-appointment" class="w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center justify-center gap-2">
                            <i data-lucide="x-circle" class="w-5 h-5"></i>
                            Cancelar Agendamento
                        </button>
                        <button class="modal-close w-full p-3 bg-gray-200 text-gray-800 rounded-xl hover:bg-gray-300 transition-all">
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        `;
    }

    _createJournalModal() {
        return `
            <div id="journal-modal" class="modal-overlay z-50 p-4">
                <div class="modal-content bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-auto">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-semibold text-gray-800" id="journal-modal-title"></h3>
                        <button class="modal-close text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="journal-form" class="space-y-4">
                        <div>
                            <label for="journal-content" class="block text-sm font-medium text-gray-700 mb-2">
                                Seus pensamentos
                            </label>
                            <textarea 
                                id="journal-content" 
                                name="content" 
                                rows="8" 
                                placeholder="O que você está pensando hoje?..." 
                                required
                                class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all"
                            ></textarea>
                            <p class="mt-1 text-xs text-gray-500">Mínimo 3 caracteres</p>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button 
                                type="button" 
                                id="delete-journal-btn" 
                                data-action="delete-journal" 
                                class="hidden p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all flex items-center gap-2"
                            >
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                                Excluir
                            </button>
                            <button type="submit" class="p-3 px-6 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center gap-2">
                                <i data-lucide="save" class="w-4 h-4"></i>
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;
    }

    _createFeelingFormModal() {
        const emotionOptions = [
            { value: 'ansiedade', label: 'Ansiedade ou preocupação' },
            { value: 'tristeza', label: 'Tristeza ou desânimo' },
            { value: 'raiva', label: 'Irritação ou raiva' },
            { value: 'frustracao', label: 'Frustração ou sobrecarga' },
            { value: 'outro-sentimento', label: 'Outro (descreva abaixo)' }
        ];

        const causaOptions = [
            { value: 'academico', label: 'Problemas acadêmicos (estudo, provas, desempenho)' },
            { value: 'pessoal', label: 'Conflito com amigos ou familiares' },
            { value: 'estresse', label: 'Estresse ou sobrecarga (pressão, falta de tempo)' },
            { value: 'saude', label: 'Questões de saúde (física ou mental)' },
            { value: 'outro-causa', label: 'Outro (descreva abaixo)' }
        ];

        const lidarOptions = [
            { value: 'sim', label: 'Sim, estou no controle' },
            { value: 'pouco', label: 'Um pouco, mas está difícil' },
            { value: 'nao', label: 'Não, preciso de ajuda' }
        ];

        const precisaOptions = [
            { value: 'sugestao', label: 'Uma sugestão para lidar com a situação' },
            { value: 'atendimento', label: 'Gostaria de agendar um atendimento' },
            { value: 'desabafar', label: 'Apenas desabafar no meu diário' },
            { value: 'outro-precisa', label: 'Outro (descreva abaixo)' }
        ];

        const laudoOptions = [
            { value: 'sim-laudo', label: 'Sim, possuo laudo' },
            { value: 'sem-laudo', label: 'Não, não possuo laudo' }
        ];

        const createRadioGroup = (name, options) => options.map(opt => `
            <label class="emotion-option block p-3 rounded-xl border border-gray-300 cursor-pointer transition-all hover:border-blue-300 hover:bg-blue-50">
                <input type="radio" name="${name}" value="${opt.value}" class="mr-2 accent-blue-500">
                ${opt.label}
            </label>
        `).join('');

        return `
            <div id="feeling-form-modal" class="modal-overlay z-50 p-4">
                <div class="modal-content bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-auto custom-scrollbar max-h-[90vh] overflow-y-auto">
                    <div class="flex justify-between items-center mb-4 sticky top-0 bg-white pb-4 border-b">
                        <div class="flex items-center gap-2">
                            <i data-lucide="heart" class="w-6 h-6 text-blue-600"></i>
                            <h3 class="text-xl font-semibold text-gray-800">Compartilhe como você se sente</h3>
                        </div>
                        <button class="modal-close text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                            <i data-lucide="x"></i>
                        </button>
                    </div>
                    <form id="feeling-form" class="space-y-6">
                        <div>
                            <p class="font-medium text-gray-700 mb-3">Como você está se sentindo neste momento?</p>
                            <div class="space-y-2">${createRadioGroup('sentimento', emotionOptions)}</div>
                        </div>
                        
                        <div>
                            <p class="font-medium text-gray-700 mb-3">Você consegue identificar o que pode ter causado essa emoção?</p>
                            <div class="space-y-2">${createRadioGroup('causa', causaOptions)}</div>
                        </div>
                        
                        <div>
                            <p class="font-medium text-gray-700 mb-3">Você está conseguindo lidar com isso sozinho(a)?</p>
                            <div class="space-y-2">${createRadioGroup('lidar', lidarOptions)}</div>
                        </div>
                        
                        <div>
                            <p class="font-medium text-gray-700 mb-3">O que você precisa agora?</p>
                            <div class="space-y-2">${createRadioGroup('precisa', precisaOptions)}</div>
                        </div>
                        
                        <div>
                            <p class="font-medium text-gray-700 mb-3">Você possui laudo?</p>
                            <div class="space-y-2">${createRadioGroup('laudo', laudoOptions)}</div>
                        </div>
                        
                        <div id="descricao-container" class="hidden">
                            <label for="descricao-textarea" class="font-medium text-gray-700 block mb-2">
                                Descreva mais detalhes:
                            </label>
                            <textarea 
                                id="descricao-textarea"
                                name="descricao" 
                                rows="4" 
                                placeholder="Ex: 'Sinto-me muito ansioso por causa das provas finais...' "
                                class="w-full p-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none transition-all"
                            ></textarea>
                        </div>
                        
                        <button type="submit" class="w-full p-3 bg-blue-500 text-white rounded-xl hover:bg-blue-600 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2">
                            <i data-lucide="send" class="w-5 h-5"></i>
                            Enviar Resposta
                        </button>
                    </form>
                </div>
            </div>
        `;
    }

    _createCrisisModal() {
        return `
            <div id="crisis-modal" class="modal-overlay z-50 p-4">
                <div class="modal-content bg-white p-6 rounded-2xl shadow-2xl w-full max-w-lg mx-auto text-center">
                    <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <i data-lucide="heart-pulse" class="text-red-500 w-8 h-8"></i>
                    </div>
                    <h3 class="text-2xl font-bold text-gray-800 mb-2">Momento de Crise</h3>
                    <p class="text-gray-600 mb-6">
                        Se você está sentindo taquicardia ou sudorese, respire fundo. 
                        Siga o exercício no vídeo para tentar acalmar.
                    </p>
                    <div class="w-full aspect-video rounded-xl overflow-hidden bg-gray-200 mb-6 shadow-inner">
                        <iframe 
                            class="w-full h-full" 
                            src="https://www.youtube.com/embed/mPepsJkhIPs" 
                            frameborder="0" 
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                            allowfullscreen
                            title="Exercício de respiração para crise"
                        ></iframe>
                    </div>
                    <div class="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
                        <p class="text-sm text-amber-800 flex items-start gap-2">
                            <i data-lucide="info" class="w-5 h-5 flex-shrink-0 mt-0.5"></i>
                            <span>Se os sintomas persistirem, procure ajuda médica imediatamente ou ligue para o CVV: 188</span>
                        </p>
                    </div>
                    <button class="modal-close w-full p-3 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all shadow-md hover:shadow-lg">
                        Fechar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Cleanup para evitar memory leaks
     */
    destroy() {
        this._iconObserver?.disconnect();
        this._observers.forEach(observer => observer.disconnect());
        this._observers.clear();
        this._renderCache.clear();
        this._activeModals.clear();
    }

    /**
     * Atualiza apenas o bloco de humor na dashboard e o gráfico de histórico
     */
    updateDashboardMood() {
        // Atualiza o emoji e o texto do humor atual
        const moodBlock = document.getElementById('dashboard-mood-block');
        if (!moodBlock) return;

        // Recria o bloco de humor com o humor mais recente
        const feelings = AppState.data.feelings || [];
        const lastFeeling = feelings.length > 0 ? feelings[feelings.length - 1] : null;
        const emojiMap = {
            feliz: '😄',
            otimo: '😁',
            neutro: '😐',
            ruim: '😟',
            pessimo: '😢',
        };
        let mood = 'neutro';
        if (lastFeeling && emojiMap[lastFeeling.emotion]) {
            mood = lastFeeling.emotion;
        }
        moodBlock.innerHTML = `
            <span class="text-3xl md:text-5xl">${emojiMap[mood]}</span>
            <p class="text-sm mt-2 text-gray-600">${mood.charAt(0).toUpperCase() + mood.slice(1)}</p>
        `;
        // Atualiza o gráfico de histórico de sentimentos
        if (typeof Views !== 'undefined' && Views.renderFeelingsChart) {
            Views.renderFeelingsChart();
        }
    }
}

// Exporta instância singleton
export const UI = new UIManager();