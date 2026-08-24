import { AudioEngine } from '../AudioEngine';
import { InstrumentPreset } from '../../types/audio';

export interface MorphStyle {
  id: string;
  name: string;
  badge: string;
  description: string;
  color: string;
}

export const MORPH_STYLES: MorphStyle[] = [
  {
    id: 'lofi_tape',
    name: 'Vintage Lo-Fi Tape & Dust',
    badge: 'TAPE SATURATION',
    description: 'Adds warm bandpass filtering, tube saturation, subtle wow/flutter vibrato, and mellow attack.',
    color: '#f59e0b',
  },
  {
    id: 'hyperpop_lead',
    name: 'Hyperpop / Future Bass Lead',
    badge: 'SUPERSAW GLIDE',
    description: 'Maximizes harmonic brightness, tight snappy attack, high resonance, and smooth pitch glide.',
    color: '#06b6d4',
  },
  {
    id: 'ambient_shimmer',
    name: 'Ethereal Ambient Shimmer Pad',
    badge: 'CATHEDRAL SPACE',
    description: 'Lush slow attack & release, wide open filter, rich overtone harmonics, and deep space reverb.',
    color: '#8b5cf6',
  },
  {
    id: 'trap_pluck',
    name: 'Crisp Trap / Pluck Staccato',
    badge: 'SNAPPY PERC',
    description: 'Instant zero-sustain pluck envelope, punchy transient click, and resonant bell harmonic tone.',
    color: '#10b981',
  },
  {
    id: 'cinematic_braam',
    name: 'Cinematic Braam & Sub Drone',
    badge: 'HEAVY DRONE',
    description: 'Deep low octave rumble, massive body resonance, heavy lowpass sweep, and maximum analog warmth.',
    color: '#ef4444',
  },
  {
    id: 'random_mutate',
    name: 'Mutate Current Timbre 15%',
    badge: 'SMART VARIATION',
    description: 'Creates a musically coherent evolutionary variation of the current patch without breaking its identity.',
    color: '#7c5dff',
  },
];

export class SoundMorpher {
  public static applyMorph(styleId: string, basePreset: InstrumentPreset): InstrumentPreset {
    const engine = AudioEngine.getInstance();
    const cloned: InstrumentPreset = JSON.parse(JSON.stringify(basePreset));

    switch (styleId) {
      case 'lofi_tape': {
        cloned.name = `Lo-Fi ${basePreset.name}`;
        cloned.envelope.attack = Math.max(0.01, cloned.envelope.attack * 1.5);
        cloned.envelope.decay = Math.max(1.2, cloned.envelope.decay);
        cloned.envelope.release = Math.max(0.4, cloned.envelope.release * 1.3);
        cloned.filter.cutoff = Math.min(4500, Math.max(1200, cloned.filter.cutoff * 0.45));
        cloned.filter.resonance = Math.min(2.5, cloned.filter.resonance * 1.2);
        cloned.vibrato.rate = 4.2;
        cloned.vibrato.depth = 0.25;
        cloned.vibrato.delay = 0.05;
        cloned.harmonics = Math.max(0.4, cloned.harmonics * 0.75);
        cloned.noiseAmount = Math.min(0.5, cloned.noiseAmount + 0.18);

        // Turn on tape saturation VST
        engine.updateVstParam('saturation', 'drive', 18);
        engine.updateVstParam('saturation', 'warmth', 0.85);
        engine.updateVstParam('saturation', 'mix', 0.6);
        break;
      }

      case 'hyperpop_lead': {
        cloned.name = `Hyperpop ${basePreset.name}`;
        cloned.envelope.attack = 0.002;
        cloned.envelope.decay = 0.8;
        cloned.envelope.sustain = 0.6;
        cloned.envelope.release = 0.2;
        cloned.filter.cutoff = 16000;
        cloned.filter.resonance = 3.5;
        cloned.filter.envelopeAmount = 0.7;
        cloned.portamento = 0.07;
        cloned.harmonics = 0.98;
        cloned.vibrato.depth = 0.08;

        // Punchy compressor
        engine.updateVstParam('compressor', 'threshold', -22);
        engine.updateVstParam('compressor', 'ratio', 6.0);
        break;
      }

      case 'ambient_shimmer': {
        cloned.name = `Ambient ${basePreset.name}`;
        cloned.envelope.attack = 0.6;
        cloned.envelope.decay = 2.5;
        cloned.envelope.sustain = 0.85;
        cloned.envelope.release = 2.2;
        cloned.filter.cutoff = 8000;
        cloned.filter.resonance = 1.8;
        cloned.filter.envelopeAmount = 0.25;
        cloned.harmonics = 0.92;
        cloned.resonanceTone = 0.95;

        // Big reverb
        engine.updateVstParam('reverb', 'mix', 0.55);
        engine.updateVstParam('reverb', 'decay', 4.5);
        engine.updateVstParam('delay', 'mix', 0.35);
        break;
      }

      case 'trap_pluck': {
        cloned.name = `Trap Pluck ${basePreset.name}`;
        cloned.envelope.attack = 0.001;
        cloned.envelope.decay = 0.38;
        cloned.envelope.sustain = 0.0;
        cloned.envelope.release = 0.15;
        cloned.filter.cutoff = 11000;
        cloned.filter.resonance = 3.8;
        cloned.filter.envelopeAmount = 0.8;
        cloned.harmonics = 0.9;
        cloned.noiseAmount = Math.max(0.2, cloned.noiseAmount * 1.5);
        break;
      }

      case 'cinematic_braam': {
        cloned.name = `Cinematic ${basePreset.name} Braam`;
        cloned.envelope.attack = 0.04;
        cloned.envelope.decay = 1.0;
        cloned.envelope.sustain = 0.95;
        cloned.envelope.release = 0.8;
        cloned.filter.type = 'lowpass';
        cloned.filter.cutoff = 3200;
        cloned.filter.resonance = 4.5;
        cloned.filter.envelopeAmount = 0.6;
        cloned.harmonics = 0.95;
        cloned.resonanceTone = 0.98;
        cloned.portamento = 0.08;

        engine.updateVstParam('saturation', 'drive', 24);
        engine.updateVstParam('reverb', 'mix', 0.45);
        break;
      }

      case 'random_mutate':
      default: {
        cloned.name = `${basePreset.name} (Mutated)`;
        const jitter = (val: number, pct: number = 0.25) => {
          const delta = (Math.random() * 2 - 1) * pct;
          return Math.max(0.001, val * (1 + delta));
        };

        cloned.envelope.attack = jitter(cloned.envelope.attack, 0.3);
        cloned.envelope.decay = jitter(cloned.envelope.decay, 0.25);
        cloned.envelope.sustain = Math.min(1.0, Math.max(0.0, jitter(cloned.envelope.sustain, 0.2)));
        cloned.envelope.release = jitter(cloned.envelope.release, 0.3);
        cloned.filter.cutoff = Math.min(18000, Math.max(200, jitter(cloned.filter.cutoff, 0.35)));
        cloned.filter.resonance = Math.min(10.0, Math.max(0.2, jitter(cloned.filter.resonance, 0.3)));
        cloned.harmonics = Math.min(1.0, Math.max(0.1, jitter(cloned.harmonics, 0.2)));
        cloned.resonanceTone = Math.min(1.0, Math.max(0.1, jitter(cloned.resonanceTone, 0.2)));
        cloned.vibrato.rate = Math.min(12, Math.max(0.5, jitter(cloned.vibrato.rate, 0.25)));
        cloned.vibrato.depth = Math.min(0.8, Math.max(0.0, jitter(cloned.vibrato.depth, 0.3)));
        break;
      }
    }

    engine.currentInstrument = cloned;
    engine.notifyStateChange();
    return cloned;
  }
}
