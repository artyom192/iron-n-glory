import { ArenaDef, ArenaId } from '../types/game';

export const ARENAS: ArenaDef[] = [
  {
    id: 'courtyard',
    name: 'Замковый Двор',
    subtitle: 'Тренировочный плац рыцарей',
    width: 1000,
    height: 600,
    groundColor: '#292524',
    borderColor: '#78716c',
    accentColor: '#3b82f6',
    obstacles: [
      { x: 300, y: 220, width: 48, height: 48, type: 'pillar' },
      { x: 700, y: 220, width: 48, height: 48, type: 'pillar' },
      { x: 500, y: 380, width: 40, height: 40, type: 'crate' },
    ],
    decorations: [
      { type: 'banner', x: 200, y: 50 },
      { type: 'banner', x: 800, y: 50 },
    ],
  },
  {
    id: 'village',
    name: 'Средневековая Деревня',
    subtitle: 'Базарная площадь у таверны',
    width: 1050,
    height: 620,
    groundColor: '#3f2e1e',
    borderColor: '#854d0e',
    accentColor: '#d97706',
    obstacles: [
      { x: 280, y: 180, width: 44, height: 44, type: 'barrel' },
      { x: 330, y: 190, width: 40, height: 40, type: 'crate' },
      { x: 720, y: 390, width: 44, height: 44, type: 'barrel' },
      { x: 525, y: 290, width: 46, height: 46, type: 'rock' },
    ],
  },
  {
    id: 'forest',
    name: 'Лесная Поляна',
    subtitle: 'Убежище разбойников в чаще',
    width: 1100,
    height: 640,
    groundColor: '#1c2818',
    borderColor: '#15803d',
    accentColor: '#10b981',
    obstacles: [
      { x: 320, y: 260, width: 56, height: 56, type: 'rock' },
      { x: 750, y: 260, width: 56, height: 56, type: 'rock' },
      { x: 550, y: 160, width: 48, height: 48, type: 'rock' },
      { x: 550, y: 460, width: 48, height: 48, type: 'rock' },
    ],
  },
  {
    id: 'colosseum',
    name: 'Каменный Колизей',
    subtitle: 'Гладиаторская арена подземелья',
    width: 1000,
    height: 600,
    groundColor: '#1e1b18',
    borderColor: '#dc2626',
    accentColor: '#ef4444',
    obstacles: [
      { x: 260, y: 180, width: 52, height: 52, type: 'pillar' },
      { x: 740, y: 180, width: 52, height: 52, type: 'pillar' },
      { x: 260, y: 420, width: 52, height: 52, type: 'pillar' },
      { x: 740, y: 420, width: 52, height: 52, type: 'pillar' },
    ],
  },
  {
    id: 'throne',
    name: 'Тронный Зал Чемпионов',
    subtitle: 'Королевская арена последнего поединка',
    width: 1150,
    height: 650,
    groundColor: '#1f1315',
    borderColor: '#eab308',
    accentColor: '#facc15',
    obstacles: [
      { x: 320, y: 200, width: 56, height: 56, type: 'throne_pillar' },
      { x: 830, y: 200, width: 56, height: 56, type: 'throne_pillar' },
      { x: 320, y: 450, width: 56, height: 56, type: 'throne_pillar' },
      { x: 830, y: 450, width: 56, height: 56, type: 'throne_pillar' },
    ],
    decorations: [
      { type: 'carpet', x: 575, y: 325 },
    ],
  },
];

export function getArenaById(id: ArenaId): ArenaDef {
  return ARENAS.find((a) => a.id === id) || ARENAS[0];
}
