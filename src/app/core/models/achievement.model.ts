export interface AchievementStats {
  mastered: number;
  started: number;
  streak: number;
  sessionsCompleted: number;
  perfectSessions: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: string;
  isUnlocked: (stats: AchievementStats) => boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first_session',
    title: 'Primer paso',
    description: 'Completa tu primera sesión de estudio.',
    icon: '🎯',
    isUnlocked: (s) => s.sessionsCompleted >= 1,
  },
  {
    id: 'sessions_10',
    title: 'Constante',
    description: 'Completa 10 sesiones de estudio.',
    icon: '📚',
    isUnlocked: (s) => s.sessionsCompleted >= 10,
  },
  {
    id: 'sessions_50',
    title: 'Dedicado',
    description: 'Completa 50 sesiones de estudio.',
    icon: '🏆',
    isUnlocked: (s) => s.sessionsCompleted >= 50,
  },
  {
    id: 'streak_3',
    title: 'Buen comienzo',
    description: 'Estudia 3 días seguidos.',
    icon: '🔥',
    isUnlocked: (s) => s.streak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Semana completa',
    description: 'Estudia 7 días seguidos.',
    icon: '🔥',
    isUnlocked: (s) => s.streak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Mes de hierro',
    description: 'Estudia 30 días seguidos.',
    icon: '💪',
    isUnlocked: (s) => s.streak >= 30,
  },
  {
    id: 'perfect_1',
    title: 'Sesión perfecta',
    description: 'Termina una sesión sin ningún fallo.',
    icon: '⭐',
    isUnlocked: (s) => s.perfectSessions >= 1,
  },
  {
    id: 'perfect_10',
    title: 'Francotirador',
    description: 'Completa 10 sesiones perfectas.',
    icon: '🎯',
    isUnlocked: (s) => s.perfectSessions >= 10,
  },
  {
    id: 'started_50',
    title: 'Explorador',
    description: 'Empieza a aprender 50 palabras.',
    icon: '🧭',
    isUnlocked: (s) => s.started >= 50,
  },
  {
    id: 'started_250',
    title: 'Coleccionista',
    description: 'Ten 250 palabras en tu vocabulario.',
    icon: '📖',
    isUnlocked: (s) => s.started >= 250,
  },
  {
    id: 'started_1000',
    title: 'Las 1000',
    description: 'Has visto las 1000 palabras del banco.',
    icon: '🗺️',
    isUnlocked: (s) => s.started >= 1000,
  },
  {
    id: 'mastered_10',
    title: 'Primeros frutos',
    description: 'Domina 10 palabras.',
    icon: '🌱',
    isUnlocked: (s) => s.mastered >= 10,
  },
  {
    id: 'mastered_100',
    title: 'Políglota en construcción',
    description: 'Domina 100 palabras.',
    icon: '🌿',
    isUnlocked: (s) => s.mastered >= 100,
  },
  {
    id: 'mastered_500',
    title: 'Casi fluido',
    description: 'Domina 500 palabras.',
    icon: '🌳',
    isUnlocked: (s) => s.mastered >= 500,
  },
  {
    id: 'mastered_1000',
    title: 'Maestro de las 1000',
    description: 'Domina las 1000 palabras del banco.',
    icon: '👑',
    isUnlocked: (s) => s.mastered >= 1000,
  },
];
