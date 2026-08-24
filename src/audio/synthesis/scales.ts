import { ChordDefinition, ScaleDefinition, TuningSystem } from '../../types/audio';

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const SCALES: ScaleDefinition[] = [
  {
    id: 'chromatic',
    name: 'Chromatic (All Notes)',
    intervals: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
    description: 'All 12 semitones without restriction',
  },
  {
    id: 'major',
    name: 'Major (Ionian)',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'Bright, cheerful, standard diatonic major scale',
  },
  {
    id: 'minor_natural',
    name: 'Natural Minor (Aeolian)',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description: 'Emotional, contemplative minor scale',
  },
  {
    id: 'minor_harmonic',
    name: 'Harmonic Minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description: 'Dramatic classical & neoclassical sound with raised 7th',
  },
  {
    id: 'dorian',
    name: 'Dorian (Jazz / Folk)',
    intervals: [0, 2, 3, 5, 7, 9, 10],
    description: 'Soulful minor with a raised 6th, popular in funk, jazz, and Celtic music',
  },
  {
    id: 'phrygian',
    name: 'Phrygian (Flamenco / Spanish)',
    intervals: [0, 1, 3, 5, 7, 8, 10],
    description: 'Exotic minor with flat 2nd, key to Andalusian flamenco & metal',
  },
  {
    id: 'pentatonic_major',
    name: 'Major Pentatonic',
    intervals: [0, 2, 4, 7, 9],
    description: 'Universal 5-note melodic scale found across worldwide cultures',
  },
  {
    id: 'pentatonic_minor',
    name: 'Minor Pentatonic / Blues',
    intervals: [0, 3, 5, 7, 10],
    description: 'Fundamental blues, rock, and soul scale',
  },
  {
    id: 'raga_bhairav',
    name: 'Indian Raga Bhairav',
    intervals: [0, 1, 4, 5, 7, 8, 11],
    description: 'Ancient morning raga with microtonal tension and profound serenity',
  },
  {
    id: 'arabic_hijaz',
    name: 'Arabic Maqam Hijaz',
    intervals: [0, 1, 4, 5, 7, 8, 10],
    description: 'Characteristic Middle Eastern modal scale with augmented 2nd',
  },
  {
    id: 'hirajoshi',
    name: 'Japanese Hirajoshi',
    intervals: [0, 2, 3, 7, 8],
    description: 'Traditional Japanese koto and shamisen pentatonic scale',
  },
  {
    id: 'insen',
    name: 'Japanese Insen',
    intervals: [0, 1, 5, 7, 10],
    description: 'Ancient Japanese scale commonly heard in shakuhachi music',
  },
  {
    id: 'chinese_gong',
    name: 'Chinese Zhi / Gong Five-Tone',
    intervals: [0, 2, 4, 7, 9],
    description: 'Classic 5-element Chinese pentatonic tuning for Guzheng and Erhu',
  },
  {
    id: 'celtic_modal',
    name: 'Celtic Double Harmonic',
    intervals: [0, 1, 4, 5, 7, 8, 11],
    description: 'Enchanting mystic scale for Irish whistles and harps',
  },
  {
    id: 'whole_tone',
    name: 'Whole Tone (Dream / Impressionist)',
    intervals: [0, 2, 4, 6, 8, 10],
    description: 'Debussy & cinematic dreamlike floating harmony without tonal center',
  },
];

export const TUNINGS: TuningSystem[] = [
  {
    id: '12tet_440',
    name: '12-TET Standard (A=440 Hz)',
    centsOffset: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    description: 'Standard modern equal temperament pitch reference',
  },
  {
    id: 'pythagorean_432',
    name: 'Healing Harmonic (A=432 Hz)',
    // 432 Hz is approximately -31.766 cents relative to 440 Hz
    centsOffset: [-31.77, -31.77, -31.77, -31.77, -31.77, -31.77, -31.77, -31.77, -31.77, -31.77, -31.77, -31.77],
    description: 'Universal resonance tuning aligned with natural acoustic math',
  },
  {
    id: 'just_intonation',
    name: 'Just Intonation (Pure Harmonics)',
    // Pure ratios based on C: C=0, C#=12, D=4, D#=16, E=-14, F=-2, F#=-10, G=2, G#=14, A=-16, A#=-4, B=-12
    centsOffset: [0, 11.7, 3.9, 15.6, -13.7, -2.0, -9.8, 2.0, 13.7, -15.6, -3.9, -11.7],
    description: 'Harmonically pure intervals with zero acoustic beat beating',
  },
  {
    id: 'arabic_quarter',
    name: 'Arabic Quarter-Tone (+50 cents Sikah/Bayati)',
    // Standard quarter-tone adjustments on E (half-flat) and B (half-flat)
    centsOffset: [0, 0, 0, 0, -50, 0, 0, 0, 0, 0, 0, -50],
    description: 'Traditional Middle Eastern Maqamat with authentic half-flats (sikah)',
  },
  {
    id: 'indian_shruti',
    name: 'Indian 22-Shruti Raga Temperament',
    centsOffset: [0, -10, 4, 16, -14, 0, 10, 2, -10, -16, 4, -12],
    description: 'Ancient Vedic micro-intervals for soulful raga ornamentation',
  },
];

export const CHORDS: ChordDefinition[] = [
  { id: 'maj', name: 'Major', symbol: 'Maj', intervals: [0, 4, 7], category: 'triad' },
  { id: 'min', name: 'Minor', symbol: 'm', intervals: [0, 3, 7], category: 'triad' },
  { id: 'maj7', name: 'Major 7th', symbol: 'Maj7', intervals: [0, 4, 7, 11], category: 'seventh' },
  { id: 'min7', name: 'Minor 7th', symbol: 'm7', intervals: [0, 3, 7, 10], category: 'seventh' },
  { id: 'dom7', name: 'Dominant 7th', symbol: '7', intervals: [0, 4, 7, 10], category: 'seventh' },
  { id: 'sus4', name: 'Suspended 4th', symbol: 'sus4', intervals: [0, 5, 7], category: 'triad' },
  { id: 'add9', name: 'Add 9th', symbol: 'add9', intervals: [0, 4, 7, 14], category: 'extended' },
  { id: 'min9', name: 'Minor 9th', symbol: 'm9', intervals: [0, 3, 7, 10, 14], category: 'extended' },
  { id: 'maj9', name: 'Major 9th', symbol: 'Maj9', intervals: [0, 4, 7, 11, 14], category: 'extended' },
  { id: 'dim7', name: 'Diminished 7th', symbol: 'dim7', intervals: [0, 3, 6, 9], category: 'seventh' },
  { id: 'power', name: 'Power Chord', symbol: '5', intervals: [0, 7, 12], category: 'triad' },
  { id: 'drone_fifth', name: 'Open 5th + Octave (World)', symbol: 'Drone', intervals: [0, 7, 12, 19], category: 'world' },
  { id: 'sitar_sympathetic', name: 'Sitar Resonance Chord', symbol: 'Sitar Ch.', intervals: [0, 5, 7, 11, 12, 16], category: 'world' },
  { id: 'flamenco_span', name: 'Flamenco Andalusian Cadence', symbol: 'Phryg', intervals: [0, 1, 5, 7, 12], category: 'world' },
];
