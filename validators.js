/**
 * Sistema de validação robusto e reutilizável
 * Previne XSS, valida inputs e fornece feedback claro
 */

import { notify } from './notifications.js';

/**
 * Regras de validação disponíveis
 */
const VALIDATION_RULES = {
    required: (value, fieldName) => {
        if (!value || String(value).trim() === '') {
            return `${fieldName} é obrigatório.`;
        }
        return null;
    },

    minLength: (value, fieldName, minLength) => {
        if (value && String(value).length < minLength) {
            return `${fieldName} deve ter pelo menos ${minLength} caracteres.`;
        }
        return null;
    },

    maxLength: (value, fieldName, maxLength) => {
        if (value && String(value).length > maxLength) {
            return `${fieldName} deve ter no máximo ${maxLength} caracteres.`;
        }
        return null;
    },

    email: (value, fieldName) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (value && !emailRegex.test(value)) {
            return `${fieldName} deve ser um email válido.`;
        }
        return null;
    },

    alphanumeric: (value, fieldName) => {
        const alphanumericRegex = /^[a-zA-Z0-9\s]+$/;
        if (value && !alphanumericRegex.test(value)) {
            return `${fieldName} deve conter apenas letras e números.`;
        }
        return null;
    },

    noSpecialChars: (value, fieldName) => {
        const specialCharsRegex = /[<>{}[\]\\]/;
        if (value && specialCharsRegex.test(value)) {
            return `${fieldName} contém caracteres não permitidos.`;
        }
        return null;
    },

    pattern: (value, fieldName, pattern) => {
        if (value && !pattern.test(value)) {
            return `${fieldName} está em formato inválido.`;
        }
        return null;
    },

    range: (value, fieldName, min, max) => {
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < min || numValue > max) {
            return `${fieldName} deve estar entre ${min} e ${max}.`;
        }
        return null;
    }
};

/**
 * Sanitizadores para prevenir XSS
 */
const SANITIZERS = {
    /**
     * Remove tags HTML e caracteres perigosos
     */
    html: (str) => {
        if (!str) return '';
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Remove apenas tags script e seus conteúdos
     */
    script: (str) => {
        if (!str) return '';
        return String(str).replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    },

    /**
     * Sanitiza para uso em URLs
     */
    url: (str) => {
        if (!str) return '';
        return encodeURIComponent(String(str));
    },

    /**
     * Sanitiza nome de usuário
     */
    username: (str) => {
        if (!str) return '';
        return String(str)
            .trim()
            .replace(/[<>{}[\]\\]/g, '')
            .slice(0, 50);
    },

    /**
     * Sanitiza texto longo (journal, etc)
     */
    text: (str) => {
        if (!str) return '';
        return String(str)
            .trim()
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .slice(0, 10000);
    }
};

/**
 * Classe principal de validação
 */
export class Validator {
    /**
     * Valida um campo com múltiplas regras
     */
    static validateField(value, rules, fieldName = 'Campo') {
        const errors = [];

        for (const rule of rules) {
            let error = null;

            if (typeof rule === 'string') {
                // Regra simples: 'required', 'email', etc
                error = VALIDATION_RULES[rule]?.(value, fieldName);
            } else if (typeof rule === 'object') {
                // Regra com parâmetros: { type: 'minLength', value: 3 }
                const { type, value: ruleValue, min, max, pattern } = rule;
                const validator = VALIDATION_RULES[type];

                if (validator) {
                    if (type === 'minLength' || type === 'maxLength') {
                        error = validator(value, fieldName, ruleValue);
                    } else if (type === 'range') {
                        error = validator(value, fieldName, min, max);
                    } else if (type === 'pattern') {
                        error = validator(value, fieldName, pattern);
                    } else {
                        error = validator(value, fieldName);
                    }
                }
            }

            if (error) {
                errors.push(error);
            }
        }

        return errors;
    }

    /**
     * Valida login
     */
    static validateLogin(username, password) {
        const usernameErrors = this.validateField(
            username,
            ['required', { type: 'minLength', value: 2 }, 'noSpecialChars'],
            'Nome de usuário'
        );

        const passwordErrors = this.validateField(
            password,
            ['required', { type: 'minLength', value: 3 }],
            'Senha'
        );

        const allErrors = [...usernameErrors, ...passwordErrors];

        if (allErrors.length > 0) {
            notify.error(allErrors[0]);
            return false;
        }

        return true;
    }

    /**
     * Valida entrada de diário
     */
    static validateJournalEntry(content) {
        const errors = this.validateField(
            content,
            ['required', { type: 'minLength', value: 3 }, { type: 'maxLength', value: 10000 }],
            'Conteúdo do diário'
        );

        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
                sanitized: null
            };
        }

        return {
            isValid: true,
            errors: [],
            sanitized: SANITIZERS.text(content)
        };
    }

    /**
     * Valida meta
     */
    static validateGoal(title) {
        const errors = this.validateField(
            title,
            ['required', { type: 'minLength', value: 3 }, { type: 'maxLength', value: 200 }],
            'Meta'
        );

        if (errors.length > 0) {
            return {
                isValid: false,
                errors,
                sanitized: null
            };
        }

        return {
            isValid: true,
            errors: [],
            sanitized: SANITIZERS.text(title)
        };
    }

    /**
     * Valida agendamento
     */
    static validateAppointment(data) {
        const dateErrors = this.validateField(data.date, ['required'], 'Data');
        const timeErrors = this.validateField(data.time, ['required'], 'Horário');

        // Valida que a data não é no passado
        if (data.date) {
            const appointmentDate = new Date(`${data.date}T${data.time || '00:00'}`);
            const now = new Date();

            if (appointmentDate < now) {
                dateErrors.push('A data do agendamento não pode ser no passado.');
            }
        }

        const allErrors = [...dateErrors, ...timeErrors];

        if (allErrors.length > 0) {
            return {
                isValid: false,
                errors: allErrors,
                sanitized: null
            };
        }

        return {
            isValid: true,
            errors: [],
            sanitized: {
                date: data.date,
                time: data.time,
                reason: SANITIZERS.text(data.reason || '')
            }
        };
    }

    /**
     * Valida formulário de sentimentos
     */
    static validateFeelingForm(data) {
        const required = ['sentimento', 'causa', 'lidar', 'precisa', 'laudo'];
        const errors = [];

        for (const field of required) {
            if (!data[field]) {
                errors.push(`O campo ${field} é obrigatório.`);
            }
        }

        // Valida descrição se campos "outro" foram selecionados
        const hasOther = Object.values(data).some(val => 
            typeof val === 'string' && val.includes('outro')
        );

        if (hasOther && (!data.descricao || data.descricao.trim().length < 5)) {
            errors.push('Por favor, descreva mais detalhes quando selecionar "Outro".');
        }

        if (errors.length > 0) {
            return { isValid: false, errors };
        }

        return {
            isValid: true,
            errors: [],
            sanitized: {
                ...data,
                descricao: SANITIZERS.text(data.descricao || '')
            }
        };
    }

    /**
     * Sanitiza string genérica
     */
    static sanitize(str, type = 'html') {
        const sanitizer = SANITIZERS[type] || SANITIZERS.html;
        return sanitizer(str);
    }

    /**
     * Valida formato de arquivo
     */
    static validateFile(file, options = {}) {
        const {
            maxSize = 5 * 1024 * 1024, // 5MB
            allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
            allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.pdf']
        } = options;

        const errors = [];

        // Valida tamanho
        if (file.size > maxSize) {
            errors.push(`Arquivo muito grande. Tamanho máximo: ${(maxSize / 1024 / 1024).toFixed(0)}MB`);
        }

        // Valida tipo MIME
        if (!allowedTypes.includes(file.type)) {
            errors.push(`Tipo de arquivo não permitido. Permitidos: ${allowedExtensions.join(', ')}`);
        }

        // Valida extensão
        const extension = '.' + file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(extension)) {
            errors.push(`Extensão de arquivo não permitida.`);
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    /**
     * Escape para prevenir XSS em HTML
     */
    static escapeHTML(str) {
        return SANITIZERS.html(str);
    }

    /**
     * Valida JSON
     */
    static validateJSON(str) {
        try {
            JSON.parse(str);
            return { isValid: true, errors: [] };
        } catch (e) {
            return {
                isValid: false,
                errors: ['JSON inválido: ' + e.message]
            };
        }
    }

    /**
     * Valida URL
     */
    static validateURL(url) {
        try {
            new URL(url);
            return { isValid: true, errors: [] };
        } catch {
            return {
                isValid: false,
                errors: ['URL inválida']
            };
        }
    }
}

/**
 * Schema de validação para formulários complexos
 */
export class ValidationSchema {
    constructor(schema) {
        this.schema = schema;
    }

    /**
     * Valida objeto contra schema
     */
    validate(data) {
        const errors = {};
        let isValid = true;

        for (const [field, rules] of Object.entries(this.schema)) {
            const fieldErrors = Validator.validateField(
                data[field],
                rules.rules,
                rules.label || field
            );

            if (fieldErrors.length > 0) {
                errors[field] = fieldErrors;
                isValid = false;
            }
        }

        return { isValid, errors };
    }

    /**
     * Sanitiza objeto baseado no schema
     */
    sanitize(data) {
        const sanitized = {};

        for (const [field, rules] of Object.entries(this.schema)) {
            const sanitizer = rules.sanitizer || 'text';
            sanitized[field] = Validator.sanitize(data[field], sanitizer);
        }

        return sanitized;
    }
}

/**
 * Validadores específicos pré-configurados
 */
export const FormValidators = {
    login: new ValidationSchema({
        username: {
            label: 'Nome de usuário',
            rules: ['required', { type: 'minLength', value: 2 }, 'noSpecialChars'],
            sanitizer: 'username'
        },
        password: {
            label: 'Senha',
            rules: ['required', { type: 'minLength', value: 3 }],
            sanitizer: 'text'
        }
    }),

    journal: new ValidationSchema({
        content: {
            label: 'Conteúdo',
            rules: ['required', { type: 'minLength', value: 3 }, { type: 'maxLength', value: 10000 }],
            sanitizer: 'text'
        }
    }),

    goal: new ValidationSchema({
        title: {
            label: 'Título da meta',
            rules: ['required', { type: 'minLength', value: 3 }, { type: 'maxLength', value: 200 }],
            sanitizer: 'text'
        }
    }),

    appointment: new ValidationSchema({
        date: {
            label: 'Data',
            rules: ['required'],
            sanitizer: 'text'
        },
        time: {
            label: 'Horário',
            rules: ['required'],
            sanitizer: 'text'
        },
        reason: {
            label: 'Motivo',
            rules: [{ type: 'maxLength', value: 500 }],
            sanitizer: 'text'
        }
    })
};

/**
 * Utilitários de validação em tempo real
 */
export class RealTimeValidator {
    constructor(inputElement, rules, fieldName) {
        this.input = inputElement;
        this.rules = rules;
        this.fieldName = fieldName;
        this.errorElement = null;
        
        this.init();
    }

    init() {
        // Cria elemento de erro
        this.errorElement = document.createElement('div');
        this.errorElement.className = 'text-sm text-red-600 mt-1 hidden transition-all';
        this.input.parentElement.appendChild(this.errorElement);

        // Valida on blur
        this.input.addEventListener('blur', () => this.validate());
        
        // Remove erro on input
        this.input.addEventListener('input', () => {
            if (this.errorElement && !this.errorElement.classList.contains('hidden')) {
                this.clearError();
            }
        });
    }

    validate() {
        const errors = Validator.validateField(
            this.input.value,
            this.rules,
            this.fieldName
        );

        if (errors.length > 0) {
            this.showError(errors[0]);
            this.input.classList.add('border-red-500');
            this.input.classList.remove('border-gray-300');
            return false;
        }

        this.clearError();
        return true;
    }

    showError(message) {
        if (this.errorElement) {
            this.errorElement.textContent = message;
            this.errorElement.classList.remove('hidden');
        }
    }

    clearError() {
        if (this.errorElement) {
            this.errorElement.classList.add('hidden');
            this.input.classList.remove('border-red-500');
            this.input.classList.add('border-gray-300');
        }
    }
}

/**
 * Helper para validação de formulários completos
 */
export class FormValidator {
    constructor(formElement) {
        this.form = formElement;
        this.validators = new Map();
    }

    /**
     * Adiciona validação a um campo
     */
    addField(inputId, rules, fieldName) {
        const input = this.form.querySelector(`#${inputId}`);
        if (input) {
            const validator = new RealTimeValidator(input, rules, fieldName);
            this.validators.set(inputId, validator);
        }
    }

    /**
     * Valida todos os campos
     */
    validateAll() {
        let isValid = true;

        for (const validator of this.validators.values()) {
            if (!validator.validate()) {
                isValid = false;
            }
        }

        return isValid;
    }

    /**
     * Limpa todos os erros
     */
    clearAllErrors() {
        for (const validator of this.validators.values()) {
            validator.clearError();
        }
    }
}

export default Validator;