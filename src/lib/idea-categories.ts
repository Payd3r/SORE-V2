// Categorie predefinite per le idee
export const IDEA_CATEGORIES = [
  { id: 'restaurant', name: 'Ristorante', icon: '🍽️', description: 'Idee per ristoranti e locali da visitare' },
  { id: 'trip', name: 'Viaggio', icon: '✈️', description: 'Idee per viaggi e destinazioni' },
  { id: 'simple', name: 'Semplice', icon: '💡', description: 'Idee semplici e veloci da realizzare' },
  { id: 'date', name: 'Appuntamento', icon: '💕', description: 'Idee per appuntamenti romantici' },
  { id: 'activity', name: 'Attività', icon: '🎯', description: 'Attività e hobby da fare insieme' },
  { id: 'experience', name: 'Esperienza', icon: '🌟', description: 'Esperienze speciali da vivere' },
  { id: 'gift', name: 'Regalo', icon: '🎁', description: 'Idee per regali e sorprese' },
  { id: 'home', name: 'Casa', icon: '🏠', description: 'Attività da fare a casa' },
  { id: 'outdoor', name: 'All\'aperto', icon: '🌲', description: 'Attività all\'aria aperta' },
  { id: 'culture', name: 'Cultura', icon: '🎭', description: 'Eventi culturali, musei, spettacoli' },
  { id: 'sport', name: 'Sport', icon: '⚽', description: 'Attività sportive e fitness' },
  { id: 'relaxation', name: 'Relax', icon: '🧘', description: 'Attività di relax e benessere' },
  { id: 'learning', name: 'Apprendimento', icon: '📚', description: 'Corsi e attività di apprendimento' },
  { id: 'adventure', name: 'Avventura', icon: '🏔️', description: 'Avventure ed esperienze emozionanti' },
  { id: 'other', name: 'Altro', icon: '📝', description: 'Altre categorie' }
] as const;

// Tipo per le categorie
export type IdeaCategoryId = typeof IDEA_CATEGORIES[number]['id'];
export type IdeaCategory = typeof IDEA_CATEGORIES[number]; 