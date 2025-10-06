// analytics.js
// Sistema de análise de dados e geração de insights

export class AnalyticsEngine {
    constructor(appState) {
        this.state = appState;
    }

    /**
     * Analisa padrões de humor
     */
    analyzeMoodPatterns() {
        const moodHistory = this.state.data.moodHistory || [];
        
        if (moodHistory.length < 3) {
            return {
                hasData: false,
                message: 'Registre seu humor por mais dias para ver padrões'
            };
        }

        const moodMap = { 'pessimo': 1, 'ruim': 2, 'neutro': 3, 'bom': 4, 'otimo': 5, 'feliz': 5 };
        const last7Days = moodHistory.slice(-7);
        const last30Days = moodHistory.slice(-30);

        // Calcula médias
        const avg7Days = this.calculateAverage(last7Days.map(m => moodMap[m.mood]));
        const avg30Days = this.calculateAverage(last30Days.map(m => moodMap[m.mood]));

        // Detecta tendência
        const trend = this.detectTrend(last7Days.map(m => moodMap[m.mood]));

        // Identifica dias da semana com melhor/pior humor
        const weekdayPatterns = this.analyzeWeekdayPatterns(moodHistory, moodMap);

        // Contagem por emoção
        const emotionCounts = this.countEmotions(last30Days);

        // Volatilidade (desvio padrão)
        const volatility = this.calculateStdDev(last7Days.map(m => moodMap[m.mood]));

        return {
            hasData: true,
            avg7Days: avg7Days.toFixed(1),
            avg30Days: avg30Days.toFixed(1),
            trend,
            weekdayPatterns,
            emotionCounts,
            volatility: volatility.toFixed(1),
            insights: this.generateMoodInsights(avg7Days, trend, volatility)
        };
    }

    /**
     * Analisa produtividade (metas e desafios)
     */
    analyzeProductivity() {
        const goals = this.state.data.goals || [];
        const completedChallenges = this.state.data.userProfile.completedChallenges || [];
        const totalChallenges = this.state.challenges.length;

        const totalGoals = goals.length;
        const completedGoals = goals.filter(g => g.completed).length;
        const goalCompletionRate = totalGoals > 0 ? (completedGoals / totalGoals * 100).toFixed(1) : 0;

        const challengeCompletionRate = (completedChallenges.length / totalChallenges * 100).toFixed(1);

        // Analisa tempo médio para completar metas
        const completedGoalsWithDates = goals.filter(g => g.completed && g.createdAt && g.completedAt);
        const avgCompletionTime = this.calculateAverageCompletionTime(completedGoalsWithDates);

        return {
            totalGoals,
            completedGoals,
            goalCompletionRate,
            challengeCompletionRate,
            avgCompletionTime,
            insights: this.generateProductivityInsights(goalCompletionRate, challengeCompletionRate)
        };
    }

    /**
     * Analisa engajamento com o app
     */
    analyzeEngagement() {
        const journalEntries = this.state.data.journalEntries || [];
        const feelings = this.state.data.feelings || [];
        const checkInStreak = this.state.data.userProfile.checkInStreak;

        // Calcula dias ativos nos últimos 30 dias
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const recentJournalDays = new Set(
            journalEntries
                .filter(e => new Date(e.createdAt || e.date) >= last30Days)
                .map(e => new Date(e.createdAt || e.date).toDateString())
        );

        const recentFeelingDays = new Set(
            feelings
                .filter(f => new Date(f.timestamp) >= last30Days)
                .map(f => new Date(f.timestamp).toDateString())
        );

        const activeDays = new Set([...recentJournalDays, ...recentFeelingDays]);
        const engagementRate = (activeDays.size / 30 * 100).toFixed(1);

        return {
            checkInStreak,
            activeDays: activeDays.size,
            engagementRate,
            totalJournalEntries: journalEntries.length,
            totalFeelings: feelings.length,
            insights: this.generateEngagementInsights(checkInStreak, engagementRate)
        };
    }

    /**
     * Gera relatório completo
     */
    generateFullReport() {
        const mood = this.analyzeMoodPatterns();
        const productivity = this.analyzeProductivity();
        const engagement = this.analyzeEngagement();
        const stats = this.state.getStatistics();

        return {
            generatedAt: new Date().toISOString(),
            mood,
            productivity,
            engagement,
            stats,
            recommendations: this.generateRecommendations(mood, productivity, engagement)
        };
    }

    /**
     * Calcula média
     */
    calculateAverage(numbers) {
        if (numbers.length === 0) return 0;
        return numbers.reduce((a, b) => a + b, 0) / numbers.length;
    }

    /**
     * Calcula desvio padrão
     */
    calculateStdDev(numbers) {
        if (numbers.length === 0) return 0;
        const avg = this.calculateAverage(numbers);
        const squareDiffs = numbers.map(n => Math.pow(n - avg, 2));
        return Math.sqrt(this.calculateAverage(squareDiffs));
    }

    /**
     * Detecta tendência (subindo, descendo, estável)
     */
    detectTrend(values) {
        if (values.length < 3) return 'insufficient_data';

        const firstHalf = values.slice(0, Math.floor(values.length / 2));
        const secondHalf = values.slice(Math.floor(values.length / 2));

        const avgFirst = this.calculateAverage(firstHalf);
        const avgSecond = this.calculateAverage(secondHalf);

        const difference = avgSecond - avgFirst;

        if (Math.abs(difference) < 0.3) return 'stable';
        return difference > 0 ? 'improving' : 'declining';
    }

    /**
     * Analisa padrões por dia da semana
     */
    analyzeWeekdayPatterns(moodHistory, moodMap) {
        const weekdays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const weekdayData = Array(7).fill(null).map(() => ({ sum: 0, count: 0 }));

        moodHistory.forEach(entry => {
            const date = new Date(entry.date);
            const dayOfWeek = date.getDay();
            const moodValue = moodMap[entry.mood] || 3;

            weekdayData[dayOfWeek].sum += moodValue;
            weekdayData[dayOfWeek].count++;
        });

        const weekdayAverages = weekdayData.map((data, index) => ({
            day: weekdays[index],
            average: data.count > 0 ? (data.sum / data.count).toFixed(1) : null,
            count: data.count
        })).filter(d => d.count > 0);

        // Encontra melhor e pior dia
        const sorted = [...weekdayAverages].sort((a, b) => b.average - a.average);
        
        return {
            all: weekdayAverages,
            best: sorted[0],
            worst: sorted[sorted.length - 1]
        };
    }

    /**
     * Conta emoções
     */
    countEmotions(moodHistory) {
        const counts = {};
        moodHistory.forEach(entry => {
            counts[entry.mood] = (counts[entry.mood] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([emotion, count]) => ({ emotion, count }))
            .sort((a, b) => b.count - a.count);
    }

    /**
     * Calcula tempo médio para completar metas
     */
    calculateAverageCompletionTime(goals) {
        if (goals.length === 0) return null;

        const times = goals.map(g => {
            const created = new Date(g.createdAt);
            const completed = new Date(g.completedAt);
            return (completed - created) / (1000 * 60 * 60 * 24); // dias
        });

        return this.calculateAverage(times).toFixed(1);
    }

    /**
     * Gera insights sobre humor
     */
    generateMoodInsights(avg7Days, trend, volatility) {
        const insights = [];

        // Insight sobre média
        if (avg7Days >= 4) {
            insights.push({
                type: 'positive',
                message: 'Seu humor está consistentemente positivo nos últimos dias!',
                icon: 'smile'
            });
        } else if (avg7Days < 2.5) {
            insights.push({
                type: 'concern',
                message: 'Seu humor tem estado baixo. Considere conversar com alguém de confiança.',
                icon: 'alert-circle'
            });
        }

        // Insight sobre tendência
        if (trend === 'improving') {
            insights.push({
                type: 'positive',
                message: 'Ótimo! Seu humor está melhorando ao longo dos dias.',
                icon: 'trending-up'
            });
        } else if (trend === 'declining') {
            insights.push({
                type: 'warning',
                message: 'Seu humor tem declinado. Que tal experimentar um dos desafios de bem-estar?',
                icon: 'trending-down'
            });
        }

        // Insight sobre volatilidade
        if (volatility > 1.5) {
            insights.push({
                type: 'info',
                message: 'Seu humor tem variado bastante. Práticas de mindfulness podem ajudar.',
                icon: 'activity'
            });
        }

        return insights;
    }

    /**
     * Gera insights sobre produtividade
     */
    generateProductivityInsights(goalRate, challengeRate) {
        const insights = [];

        if (goalRate >= 70) {
            insights.push({
                type: 'positive',
                message: 'Excelente taxa de conclusão de metas! Continue assim!',
                icon: 'trophy'
            });
        } else if (goalRate < 30) {
            insights.push({
                type: 'info',
                message: 'Tente dividir suas metas em tarefas menores para facilitar o progresso.',
                icon: 'target'
            });
        }

        if (challengeRate >= 50) {
            insights.push({
                type: 'positive',
                message: 'Você está arrasando nos desafios de bem-estar!',
                icon: 'award'
            });
        }

        return insights;
    }

    /**
     * Gera insights sobre engajamento
     */
    generateEngagementInsights(streak, engagementRate) {
        const insights = [];

        if (streak >= 7) {
            insights.push({
                type: 'positive',
                message: `Sequência incrível de ${streak} dias! Você é dedicado ao seu bem-estar.`,
                icon: 'flame'
            });
        } else if (streak >= 3) {
            insights.push({
                type: 'positive',
                message: 'Boa sequência! Continue registrando diariamente.',
                icon: 'calendar-check'
            });
        }

        if (engagementRate >= 70) {
            insights.push({
                type: 'positive',
                message: 'Alto engajamento com a plataforma! Isso é ótimo para seu desenvolvimento.',
                icon: 'heart'
            });
        } else if (engagementRate < 30) {
            insights.push({
                type: 'info',
                message: 'Tente usar a plataforma com mais frequência para melhores resultados.',
                icon: 'info'
            });
        }

        return insights;
    }

    /**
     * Gera recomendações personalizadas
     */
    generateRecommendations(mood, productivity, engagement) {
        const recommendations = [];

        // Recomendações baseadas em humor
        if (mood.hasData && mood.avg7Days < 3) {
            recommendations.push({
                priority: 'high',
                title: 'Considere agendar um atendimento',
                description: 'Seu humor tem estado baixo. Conversar com um profissional pode ajudar.',
                action: 'schedule_appointment'
            });
        }

        // Recomendações baseadas em produtividade
        if (productivity.goalCompletionRate < 30 && productivity.totalGoals > 0) {
            recommendations.push({
                priority: 'medium',
                title: 'Revise suas metas',
                description: 'Suas metas podem estar muito ambiciosas. Tente torná-las mais específicas.',
                action: 'view_goals'
            });
        }

        // Recomendações baseadas em engajamento
        if (engagement.checkInStreak === 0 || engagement.engagementRate < 30) {
            recommendations.push({
                priority: 'medium',
                title: 'Crie o hábito de check-in diário',
                description: 'Registrar seu humor regularmente traz mais insights sobre seu bem-estar.',
                action: 'record_feeling'
            });
        }

        // Recomendações positivas
        if (mood.hasData && mood.trend === 'improving') {
            recommendations.push({
                priority: 'low',
                title: 'Continue com o bom trabalho!',
                description: 'Seu humor está melhorando. Mantenha suas práticas atuais.',
                action: null
            });
        }

        return recommendations;
    }

    /**
     * Exporta relatório como PDF (texto formatado)
     */
    exportReportAsText() {
        const report = this.generateFullReport();
        const lines = [];

        lines.push('='.repeat(60));
        lines.push('RELATÓRIO DE BEM-ESTAR - SER PLENO');
        lines.push(`Gerado em: ${new Date(report.generatedAt).toLocaleString('pt-BR')}`);
        lines.push('='.repeat(60));
        lines.push('');

        // Estatísticas gerais
        lines.push('ESTATÍSTICAS GERAIS');
        lines.push('-'.repeat(60));
        lines.push(`Nível: ${report.stats.level}`);
        lines.push(`XP: ${report.stats.xp}`);
        lines.push(`Sequência de Check-in: ${report.stats.checkInStreak} dias`);
        lines.push(`Conquistas: ${report.stats.totalBadges}`);
        lines.push('');

        // Análise de humor
        if (report.mood.hasData) {
            lines.push('ANÁLISE DE HUMOR');
            lines.push('-'.repeat(60));
            lines.push(`Média (7 dias): ${report.mood.avg7Days}/5`);
            lines.push(`Média (30 dias): ${report.mood.avg30Days}/5`);
            lines.push(`Tendência: ${this.translateTrend(report.mood.trend)}`);
            lines.push('');
        }

        // Produtividade
        lines.push('PRODUTIVIDADE');
        lines.push('-'.repeat(60));
        lines.push(`Metas completadas: ${report.productivity.completedGoals}/${report.productivity.totalGoals}`);
        lines.push(`Taxa de conclusão: ${report.productivity.goalCompletionRate}%`);
        lines.push(`Desafios completados: ${report.productivity.challengeCompletionRate}%`);
        lines.push('');

        // Recomendações
        if (report.recommendations.length > 0) {
            lines.push('RECOMENDAÇÕES');
            lines.push('-'.repeat(60));
            report.recommendations.forEach((rec, i) => {
                lines.push(`${i + 1}. ${rec.title}`);
                lines.push(`   ${rec.description}`);
                lines.push('');
            });
        }

        return lines.join('\n');
    }

    translateTrend(trend) {
        const translations = {
            'improving': 'Melhorando',
            'declining': 'Declinando',
            'stable': 'Estável',
            'insufficient_data': 'Dados insuficientes'
        };
        return translations[trend] || trend;
    }
}