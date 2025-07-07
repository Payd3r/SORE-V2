// Sistema di priorità per le idee
export const PRIORITY_LEVELS = {
  low: {
    value: 1,
    label: 'Bassa',
    color: 'bg-gray-100 text-gray-800',
    icon: '⬇️',
    description: 'Priorità bassa - può essere rimandata'
  },
  medium: {
    value: 2,
    label: 'Media',
    color: 'bg-yellow-100 text-yellow-800',
    icon: '➡️',
    description: 'Priorità media - importante ma non urgente'
  },
  high: {
    value: 3,
    label: 'Alta',
    color: 'bg-red-100 text-red-800',
    icon: '⬆️',
    description: 'Priorità alta - urgente e importante'
  }
} as const;

export type PriorityLevel = keyof typeof PRIORITY_LEVELS;

// Funzione per ottenere informazioni sulla priorità
export function getPriorityInfo(priority: PriorityLevel | string) {
  const key = priority as PriorityLevel;
  return PRIORITY_LEVELS[key] || PRIORITY_LEVELS.medium;
}

// Funzione per ordinare le idee per priorità
export function sortByPriority<T extends { priority?: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const priorityA = getPriorityInfo(a.priority || 'medium');
    const priorityB = getPriorityInfo(b.priority || 'medium');
    
    // Ordina in ordine decrescente (alta priorità prima)
    return priorityB.value - priorityA.value;
  });
}

// Funzione per filtrare le idee per priorità
export function filterByPriority<T extends { priority?: string }>(
  items: T[],
  priorities: PriorityLevel[]
): T[] {
  if (priorities.length === 0) return items;
  
  return items.filter(item => {
    const itemPriority = (item.priority || 'medium') as PriorityLevel;
    return priorities.includes(itemPriority);
  });
}

// Funzione per calcolare la distribuzione delle priorità
export function calculatePriorityDistribution<T extends { priority?: string }>(
  items: T[]
): Record<PriorityLevel, { count: number; percentage: number }> {
  const total = items.length;
  
  const distribution = {
    low: { count: 0, percentage: 0 },
    medium: { count: 0, percentage: 0 },
    high: { count: 0, percentage: 0 }
  };
  
  items.forEach(item => {
    const priority = (item.priority || 'medium') as PriorityLevel;
    distribution[priority].count++;
  });
  
  // Calcola le percentuali
  Object.keys(distribution).forEach(key => {
    const priority = key as PriorityLevel;
    distribution[priority].percentage = total > 0 
      ? Math.round((distribution[priority].count / total) * 100)
      : 0;
  });
  
  return distribution;
}

// Funzione per suggerire la priorità basata sul contenuto
export function suggestPriority(title: string, description?: string): PriorityLevel {
  const content = `${title} ${description || ''}`.toLowerCase();
  
  // Parole chiave per alta priorità
  const highPriorityKeywords = [
    'urgente', 'importante', 'subito', 'asap', 'critico', 'emergenza',
    'oggi', 'domani', 'scadenza', 'deadline', 'priorità alta'
  ];
  
  // Parole chiave per bassa priorità
  const lowPriorityKeywords = [
    'forse', 'magari', 'quando possibile', 'prima o poi', 'se abbiamo tempo',
    'non urgente', 'bassa priorità', 'eventualmente'
  ];
  
  // Controlla parole chiave ad alta priorità
  if (highPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'high';
  }
  
  // Controlla parole chiave a bassa priorità
  if (lowPriorityKeywords.some(keyword => content.includes(keyword))) {
    return 'low';
  }
  
  // Di default, priorità media
  return 'medium';
}

// Funzione per aggiornare automaticamente le priorità basate su scadenze
export function updatePriorityBasedOnDueDate(
  dueDate: Date | string | null,
  currentPriority: PriorityLevel
): PriorityLevel {
  if (!dueDate) return currentPriority;
  
  const due = new Date(dueDate);
  const now = new Date();
  const daysUntilDue = Math.ceil((due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  
  // Se la scadenza è tra 0-3 giorni, priorità alta
  if (daysUntilDue <= 3) {
    return 'high';
  }
  
  // Se la scadenza è tra 4-7 giorni, priorità media (se non è già alta)
  if (daysUntilDue <= 7 && currentPriority !== 'high') {
    return 'medium';
  }
  
  // Mantieni la priorità corrente se la scadenza è lontana
  return currentPriority;
}

// Funzione per validare una priorità
export function isValidPriority(priority: string): priority is PriorityLevel {
  return priority in PRIORITY_LEVELS;
}

// Funzione per convertire priorità a numero per ordinamento
export function priorityToNumber(priority: PriorityLevel | string): number {
  return getPriorityInfo(priority).value;
}

// Funzione per ottenere il colore CSS per la priorità
export function getPriorityColor(priority: PriorityLevel | string): string {
  return getPriorityInfo(priority).color;
}

// Funzione per ottenere l'icona per la priorità
export function getPriorityIcon(priority: PriorityLevel | string): string {
  return getPriorityInfo(priority).icon;
}

// Funzione per ottenere la label per la priorità
export function getPriorityLabel(priority: PriorityLevel | string): string {
  return getPriorityInfo(priority).label;
} 