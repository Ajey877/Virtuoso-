import { InstrumentPreset } from '../../types/audio';
import { FACTORY_INSTRUMENTS } from './instruments';

export interface StashPreset extends InstrumentPreset {
  isCustom?: boolean;
  isFavorite?: boolean;
  author?: string;
  tags?: string[];
}

export const PRODUCER_STASH_PRESETS: StashPreset[] = [
  {
    id: 'spinz_hard_808',
    name: 'Spinz Hard 808 (Distorted)',
    category: 'synths',
    synthesisType: 'sub_808',
    description: 'Iconic hard-hitting trap 808 sub with aggressive mid-range saturation and punchy transient kick thump.',
    origin: 'Atlanta / Trap',
    icon: 'Zap',
    envelope: { attack: 0.001, decay: 2.2, sustain: 0.1, release: 0.25 },
    filter: { type: 'lowpass', cutoff: 6500, resonance: 2.5, envelopeAmount: 0.6 },
    vibrato: { rate: 0, depth: 0, delay: 0 },
    portamento: 0.08,
    harmonics: 0.95,
    resonanceTone: 0.9,
    noiseAmount: 0.1,
    tags: ['808', 'Trap', 'Hard', 'Bass'],
    author: 'COOKUP Lab',
  },
  {
    id: 'drill_glide_sub',
    name: 'UK/NY Drill Legato Glide 808',
    category: 'synths',
    synthesisType: 'sub_808',
    description: 'Designed specifically for rapid pitch sliding and octave snaps with seamless exponential legato glide curves.',
    origin: 'London / New York',
    icon: 'Activity',
    envelope: { attack: 0.002, decay: 3.0, sustain: 0.4, release: 0.3 },
    filter: { type: 'lowpass', cutoff: 5200, resonance: 1.8, envelopeAmount: 0.3 },
    vibrato: { rate: 0, depth: 0, delay: 0 },
    portamento: 0.12,
    harmonics: 0.88,
    resonanceTone: 0.85,
    noiseAmount: 0.05,
    tags: ['Drill', '808', 'Slide', 'Legato'],
    author: 'COOKUP Lab',
  },
  {
    id: 'tokyo_bell_pluck',
    name: 'Tokyo Night Bell Pluck',
    category: 'world',
    synthesisType: 'kalimba_tines',
    description: 'Crystalline metallic bell pluck with Karplus-style ringing harmonics, perfect for modern anime, melodic trap, and hyperpop.',
    origin: 'Tokyo / Japan',
    icon: 'Sparkles',
    envelope: { attack: 0.001, decay: 1.8, sustain: 0.02, release: 0.4 },
    filter: { type: 'bandpass', cutoff: 4500, resonance: 4.2, envelopeAmount: 0.5 },
    vibrato: { rate: 6.0, depth: 0.05, delay: 0.3 },
    portamento: 0,
    harmonics: 0.92,
    resonanceTone: 0.88,
    noiseAmount: 0.12,
    tags: ['Pluck', 'Bell', 'Trap', 'Anime'],
    author: 'COOKUP Lab',
  },
  {
    id: 'silk_neosoul_rhodes',
    name: 'Silk Neo-Soul EP (Tine & Chorus)',
    category: 'keyboards',
    synthesisType: 'fm_epiano',
    description: 'Ultra-lush 2-operator FM electric piano tuned with subtle detuning and soft velocity dynamic response for R&B chords.',
    origin: 'Chicago / R&B',
    icon: 'Radio',
    envelope: { attack: 0.004, decay: 3.2, sustain: 0.35, release: 0.4 },
    filter: { type: 'lowpass', cutoff: 7200, resonance: 1.1, envelopeAmount: 0.4 },
    vibrato: { rate: 4.5, depth: 0.18, delay: 0.05 },
    portamento: 0,
    harmonics: 0.78,
    resonanceTone: 0.82,
    noiseAmount: 0.06,
    tags: ['Keys', 'Neo-Soul', 'R&B', 'Vintage'],
    author: 'COOKUP Lab',
  },
  {
    id: 'hyperpop_supersaw_lead',
    name: 'Hyperpop 7-Voice Supersaw Lead',
    category: 'synths',
    synthesisType: 'juno_pad',
    description: 'Massive stereo spread detuned sawtooth lead with snappy envelope filter sweeps and vibrant harmonics.',
    origin: 'Internet / Hyperpop',
    icon: 'Sliders',
    envelope: { attack: 0.005, decay: 2.0, sustain: 0.6, release: 0.2 },
    filter: { type: 'lowpass', cutoff: 16000, resonance: 3.0, envelopeAmount: 0.7 },
    vibrato: { rate: 5.8, depth: 0.2, delay: 0.2 },
    portamento: 0.05,
    harmonics: 0.95,
    resonanceTone: 0.7,
    noiseAmount: 0.05,
    tags: ['Lead', 'Hyperpop', 'Saw', 'EDM'],
    author: 'COOKUP Lab',
  },
  {
    id: 'vintage_lofi_tape_ep',
    name: 'Midnight Lo-Fi Tape Rhodes',
    category: 'keyboards',
    synthesisType: 'fm_epiano',
    description: 'Band-limited nostalgic electric piano with pitch flutter, tape saturation warmth, and soft felt attack.',
    origin: 'Lo-Fi Chill',
    icon: 'Disc',
    envelope: { attack: 0.015, decay: 2.4, sustain: 0.2, release: 0.5 },
    filter: { type: 'lowpass', cutoff: 3800, resonance: 1.5, envelopeAmount: 0.2 },
    vibrato: { rate: 3.8, depth: 0.35, delay: 0.0 },
    portamento: 0,
    harmonics: 0.65,
    resonanceTone: 0.9,
    noiseAmount: 0.2,
    tags: ['Lo-Fi', 'Tape', 'Chill', 'Keys'],
    author: 'COOKUP Lab',
  },
  {
    id: 'trap_flute_staccato',
    name: 'Atlanta Melodic Trap Flute',
    category: 'world',
    synthesisType: 'flute_wind',
    description: 'Airy wooden flute with rapid staccato tonguing, subtle breath turbulence, and expressive vibrato.',
    origin: 'Atlanta / Trap',
    icon: 'Wind',
    envelope: { attack: 0.008, decay: 1.5, sustain: 0.4, release: 0.15 },
    filter: { type: 'bandpass', cutoff: 2800, resonance: 3.5, envelopeAmount: 0.45 },
    vibrato: { rate: 6.2, depth: 0.3, delay: 0.1 },
    portamento: 0.06,
    harmonics: 0.7,
    resonanceTone: 0.85,
    noiseAmount: 0.3,
    tags: ['Flute', 'Melodic', 'Trap', 'Wind'],
    author: 'COOKUP Lab',
  },
  {
    id: 'deep_house_pluck_bass',
    name: 'Ibiza Deep House Donk Bass',
    category: 'synths',
    synthesisType: 'analog_bass',
    description: 'Punchy FM/analog resonant low-end bass with instant transient attack and tight envelope decay.',
    origin: 'Ibiza / House',
    icon: 'Music',
    envelope: { attack: 0.001, decay: 0.45, sustain: 0.0, release: 0.08 },
    filter: { type: 'lowpass', cutoff: 1800, resonance: 4.8, envelopeAmount: 0.85 },
    vibrato: { rate: 0, depth: 0, delay: 0 },
    portamento: 0.02,
    harmonics: 0.8,
    resonanceTone: 0.95,
    noiseAmount: 0.05,
    tags: ['Bass', 'House', 'Pluck', 'Club'],
    author: 'COOKUP Lab',
  },
];

const LOCAL_STORAGE_KEY_CUSTOM = 'cookup_user_custom_presets_v1';
const LOCAL_STORAGE_KEY_FAVORITES = 'cookup_user_favorites_v1';

export class PresetStashManager {
  private static instance: PresetStashManager | null = null;
  private customPresets: StashPreset[] = [];
  private favoriteIds: Set<string> = new Set();

  public static getInstance(): PresetStashManager {
    if (!PresetStashManager.instance) {
      PresetStashManager.instance = new PresetStashManager();
      PresetStashManager.instance.loadFromStorage();
    }
    return PresetStashManager.instance;
  }

  private loadFromStorage(): void {
    try {
      const savedCustom = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOM);
      if (savedCustom) {
        this.customPresets = JSON.parse(savedCustom);
      }

      const savedFavs = localStorage.getItem(LOCAL_STORAGE_KEY_FAVORITES);
      if (savedFavs) {
        this.favoriteIds = new Set(JSON.parse(savedFavs));
      }
    } catch (e) {
      console.warn('Could not load stash from local storage', e);
    }
  }

  private saveToStorage(): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOM, JSON.stringify(this.customPresets));
      localStorage.setItem(LOCAL_STORAGE_KEY_FAVORITES, JSON.stringify(Array.from(this.favoriteIds)));
    } catch (e) {
      console.warn('Could not save stash to local storage', e);
    }
  }

  public getAllPresets(): StashPreset[] {
    const all = [
      ...PRODUCER_STASH_PRESETS,
      ...FACTORY_INSTRUMENTS.map((f) => ({ ...f, tags: [f.category, f.origin] })),
      ...this.customPresets,
    ];

    return all.map((p) => ({
      ...p,
      isFavorite: this.favoriteIds.has(p.id),
    }));
  }

  public toggleFavorite(presetId: string): boolean {
    if (this.favoriteIds.has(presetId)) {
      this.favoriteIds.delete(presetId);
    } else {
      this.favoriteIds.add(presetId);
    }
    this.saveToStorage();
    return this.favoriteIds.has(presetId);
  }

  public isFavorite(presetId: string): boolean {
    return this.favoriteIds.has(presetId);
  }

  public saveCustomPreset(preset: InstrumentPreset, author: string = 'Producer'): StashPreset {
    const newStashPreset: StashPreset = {
      ...preset,
      id: `custom_${Date.now()}`,
      isCustom: true,
      author,
      tags: ['Custom', preset.category],
    };

    this.customPresets.push(newStashPreset);
    this.saveToStorage();
    return newStashPreset;
  }

  public deleteCustomPreset(id: string): void {
    this.customPresets = this.customPresets.filter((p) => p.id !== id);
    this.saveToStorage();
  }

  public exportBankAsJson(): string {
    const bundle = {
      version: '1.0',
      type: 'COOKUP_PRESET_BANK',
      timestamp: Date.now(),
      presets: this.customPresets,
    };
    return JSON.stringify(bundle, null, 2);
  }

  public importBankFromJson(jsonStr: string): number {
    try {
      const parsed = JSON.parse(jsonStr);
      if (parsed.presets && Array.isArray(parsed.presets)) {
        let addedCount = 0;
        parsed.presets.forEach((p: StashPreset) => {
          if (p.name && p.envelope) {
            this.customPresets.push({
              ...p,
              id: `custom_imported_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
              isCustom: true,
            });
            addedCount++;
          }
        });
        this.saveToStorage();
        return addedCount;
      }
      return 0;
    } catch {
      return 0;
    }
  }
}
