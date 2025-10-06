import { AppState } from './state.js';
import { UI } from './ui.js';
import { Events } from './events.js';
import { Views } from './views.js';
import { notify } from './notifications.js';
import { globalCache, performanceMonitor } from './performance.js';
import { UIUtils, debounce } from './utils.js';


class App {
    constructor() {
        this.bindEvents();
        this.setupObservers();
    }

    bindEvents() {
        window.addEventListener("DOMContentLoaded", this.init.bind(this));
    }

    setupObservers() {
        // Observa mudanças no estado
        AppState.observer.subscribe('state:loaded', () => {
            console.log('Estado carregado');
        });

        AppState.observer.subscribe('xp:added', (data) => {
            UI.updateProgressUI();
        });

        AppState.observer.subscribe('user:levelup', (data) => {
            notify.success(`Parabéns! Você alcançou o nível ${data.level}!`, {
                title: 'Level Up!',
                duration: 5000
            });
        });
    }

    init() {
        performanceMonitor.mark('app-init-start');
        performanceMonitor.measure('app-init', 'app-init-start');
        console.log("Ser Pleno App Inicializado.");
        AppState.load();

        if (AppState.data.userName) {
            this.showMainApp();
        } else {
            UI.showLoginScreen();
        }

        Events.init();
        UI.renderAllModals();
        this.setupFeelingFormListener();

        // Força renderização dos ícones Lucide após inicialização
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }

    setupFeelingFormListener() {
        setTimeout(() => {
            const feelingForm = document.getElementById('feeling-form');
            if (feelingForm) {
                feelingForm.addEventListener('change', (e) => {
                    const container = document.getElementById('descricao-container');
                    if (!container) return;
                    
                    const hasOtherSelected = Array.from(
                        feelingForm.querySelectorAll('input[type="radio"]:checked')
                    ).some(input => input.value.includes('outro'));

                    container.classList.toggle('hidden', !hasOtherSelected);
                });
            }
        }, 300);
    }

    showMainApp() {
        UI.showMainUI(AppState.data.userName);
        Views.render('dashboard');
        UI.updateActiveNav('dashboard');
        UI.updateProgressUI();
        // Força renderização dos ícones Lucide após renderização da view principal
        if (window.lucide && typeof window.lucide.createIcons === 'function') {
            window.lucide.createIcons();
        }
    }
}

new App();