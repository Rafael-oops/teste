// config.js
// Armazena dados estáticos e configurações da aplicação.

export const CHALLENGES = [
    { id: "challenge_1", title: "Respiração Profunda", description: "Faça 1 minuto de respiração consciente.", xp: 15 },
    { id: "challenge_2", title: "Momento de Gratidão", description: "Anote 3 coisas pelas quais você é grato hoje.", xp: 20 },
    { id: "challenge_3", title: "Pausa Ativa", description: "Levante-se e alongue-se por 5 minutos.", xp: 15 },
    { id: "challenge_4", title: "Hidratação", description: "Beba um copo de água agora.", xp: 10 },
    { id: "challenge_5", title: "Organização", description: "Organize sua mesa ou ambiente de estudo.", xp: 25 }
];

export const BADGES = {
    JOURNAL_START: { id: "JOURNAL_START", title: "Diário Iniciado", icon: "book-plus", description: "Escreveu sua primeira entrada no diário." },
    STREAK_3: { id: "STREAK_3", title: "Trio Imbatível", icon: "flame", description: "Fez check-in por 3 dias seguidos." },
    STREAK_7: { id: "STREAK_7", title: "Semana Consistente", icon: "calendar-check", description: "Fez check-in por 7 dias seguidos." },
    LEVEL_5: { id: "LEVEL_5", title: "Nível 5", icon: "star", description: "Alcançou o nível 5 de bem-estar." },
    GOAL_MASTER: { id: "GOAL_MASTER", title: "Mestre das Metas", icon: "target", description: "Completou 5 metas pessoais." },
    CHALLENGE_HERO: { id: "CHALLENGE_HERO", title: "Herói dos Desafios", icon: "award", description: "Completou todos os desafios disponíveis." }
};

export const INITIAL_STATE = {
    userName: null,
    currentDate: new Date().toISOString().split("T")[0], 
    guidanceTasks: {
        journal: false,
        assessment: false,
        feedback: false,
    },
    userProfile: {
        xp: 120,
        level: 2,
        checkInStreak: 3,
        lastCheckInDate: null,
        badges: ["JOURNAL_START", "STREAK_3"],
        completedChallenges: ["challenge_1", "challenge_2"],
    },
    goals: [
        { id: 1, title: "Praticar 30 minutos de meditação", completed: true },
        { id: 2, title: "Organizar a semana de estudos", completed: false },
        { id: 3, title: "Fazer uma caminhada ao ar livre", completed: false },
        { id: 4, title: "Escrever no diário por 5 dias seguidos", completed: true },
        { id: 5, title: "Ler um capítulo de livro sobre bem-estar", completed: false },
    ],
    journalEntries: [
        { id: 1, date: "08/09/2025", content: "Primeiro dia usando o app. Parece promissor!" },
        { id: 2, date: "07/09/2025", content: "Hoje foi um dia desafiador. Tive que lidar com várias tarefas ao mesmo tempo e me senti um pouco sobrecarregado. Mas consegui terminar a maioria delas!" },
        { id: 3, date: "06/09/2025", content: "Comecei a planejar meu projeto de biologia. A parte inicial é sempre a mais difícil, mas me sinto motivado para seguir em frente." },
        { id: 4, date: "05/09/2025", content: "Tive uma conversa muito boa com um amigo hoje. Foi ótimo desabafar e ouvir a perspectiva dele sobre algumas coisas." },
        { id: 5, date: "04/09/2025", content: "Me senti um pouco ansioso hoje. Acho que é por causa das provas que estão chegando. Preciso encontrar maneiras de relaxar mais." },
    ],
    feelings: [
        // CORREÇÃO: Padronizado para 'neutro'
        { emotion: "bom", date: "2025-09-01", timestamp: "2025-09-01T10:00:00Z" },
        { emotion: "neutro", date: "2025-09-02", timestamp: "2025-09-02T10:00:00Z" },
        { emotion: "ruim", date: "2025-09-03", timestamp: "2025-09-03T10:00:00Z" },
        { emotion: "neutro", date: "2025-09-04", timestamp: "2025-09-04T10:00:00Z" },
        { emotion: "otimo", date: "2025-09-05", timestamp: "2025-09-05T10:00:00Z" },
        { emotion: "bom", date: "2025-09-06", timestamp: "2025-09-06T10:00:00Z" },
        { emotion: "neutro", date: "2025-09-07", timestamp: "2025-09-07T10:00:00Z" },
        { emotion: "ruim", date: "2025-09-08", timestamp: "2025-09-08T10:00:00Z" },
    ],
    selfAssessments: [],
    messages: [
        { id: 1, from: "Psicóloga Ana", subject: "Confirmação de Agendamento", content: "Olá! Seu atendimento está confirmado para 15/09/2025 às 14:00. Até lá!", date: "2025-09-08", read: false },
        { id: 2, from: "Psicóloga Solange", subject: "Material de Apoio", content: "Aqui está o link para o artigo sobre gerenciamento de estresse que comentamos: <a href='#' class='text-blue-600 underline'>Clique aqui</a>.", date: "2025-09-05", read: true },
        { id: 3, from: "Psicólogo Bruno", subject: "Dicas para Melhorar o Sono", content: "Olá! Seguem algumas dicas para melhorar a qualidade do seu sono: manter uma rotina, evitar telas antes de dormir e criar um ambiente tranquilo.", date: "2025-08-28", read: true },
    ],
    appointments: [
        { id: 1, date: "2025-09-15 14:00", professional: "Psicóloga Ana", status: "confirmed" },
        { id: 2, date: "2025-09-16 16:00", professional: "Psicóloga Solange", status: "confirmed" },
    ],
    availableSlots: [
        { date: "2025-10-03", time: "09:00", available: true },
        { date: "2025-10-03", time: "10:00", available: false },
        { date: "2025-10-03", time: "11:00", available: true },
        { date: "2025-10-03", time: "14:00", available: true },
        { date: "2025-10-03", time: "15:00", available: true },
        { date: "2025-10-03", time: "16:00", available: false },
        { date: "2025-10-04", time: "22:00", available: true },
    ],
    moodHistory: [
        // CORREÇÃO: Padronizado para 'neutro' para consistência
        { date: "2025-09-01", mood: "bom" },
        { date: "2025-09-02", mood: "neutro" },
        { date: "2025-09-03", mood: "ruim" },
        { date: "2025-09-04", mood: "neutro" },
        { date: "2025-09-05", mood: "otimo" },
        { date: "2025-09-06", mood: "bom" },
        { date: "2025-09-07", mood: "neutro" },
        { date: "2025-09-08", mood: "ruim" },
    ]
};

export const NAV_ITEMS = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'progress', label: 'Meu Progresso', icon: 'trending-up' },
    { id: 'analytics', label: 'Análises', icon: 'bar-chart-2' },
    { id: 'journal', label: 'Diário', icon: 'book-open' },
    { id: 'assessment', label: 'Autoavaliação', icon: 'user-check' },
    { id: 'infoWall', label: 'Mural', icon: 'megaphone' },
    { id: 'scheduling', label: 'Agendamentos', icon: 'calendar' },
    { id: 'history', label: 'Meu Histórico', icon: 'file-text' },
    { id: 'messages', label: 'Mensagens', icon: 'mail' },
    { id: 'guidance', label: 'Orientações', icon: 'heart' },
];