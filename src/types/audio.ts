export type InstrumentCategory =
  | 'keyboards'
  | 'world'
  | 'strings'
  | 'synths'
  | 'guitars'
  | 'percussion'
  | 'custom';

export type SynthesisType =
  | 'additive_piano'
  | 'fm_epiano'
  | 'organ_drawbars'
  | 'karplus_sitar'
  | 'karplus_koto'
  | 'bowed_erhu'
  | 'plucked_oud'
  | 'kalimba_tines'
  | 'flute_wind'
  | 'bagpipe_drone'
  | 'harp_plucked'
  | 'violin_bowed'
  | 'cello_bowed'
  | 'brass_ensemble'
  | 'analog_bass'
  | 'sub_808'
  | 'juno_pad'
  | 'acoustic_guitar'
  | 'tabla_world'
  | 'custom_sample';

export interface EnvelopeSettings {
  attack: number; // in seconds
  decay: number; // in seconds
  sustain: number; // 0 to 1
  release: number; // in seconds
}

export interface FilterSettings {
  type: BiquadFilterType;
  cutoff: number; // 20 to 20000 Hz
  resonance: number; // 0.1 to 30 Q
  envelopeAmount: number; // -1 to 1
}

export interface VibratoSettings {
  rate: number; // 0.1 to 20 Hz
  depth: number; // 0 to 1
  delay: number; // 0 to 2 seconds
}

export interface InstrumentPreset {
  id: string;
  name: string;
  category: InstrumentCategory;
  synthesisType: SynthesisType;
  description: string;
  origin: string; // e.g. "India", "Japan", "USA", "Scotland"
  icon: string;
  envelope: EnvelopeSettings;
  filter: FilterSettings;
  vibrato: VibratoSettings;
  portamento: number; // 0 to 0.5s glide
  harmonics: number; // 0 to 1 brightness / overtone weight
  resonanceTone: number; // 0 to 1 body resonance / jawari / breath
  noiseAmount: number; // 0 to 1 transient click / breath / scrape noise
  drawbars?: number[]; // For Hammond organ: 9 drawbars (0 to 8)
  sampleData?: AudioBuffer | null;
  sampleBaseNote?: number; // MIDI note number of original sample (e.g. 60 = C4)
  sampleUrl?: string;
  isFavorite?: boolean;
}

export interface VstPlugin {
  id: string;
  name: string;
  type: 'saturation' | 'filter' | 'delay' | 'reverb' | 'eq' | 'chorus' | 'compressor';
  enabled: boolean;
  bypass: boolean;
  params: Record<string, number>;
}

export interface BusChannel {
  id: string;
  name: string;
  color: string;
  volume: number; // 0 to 1.5 (default 1.0)
  pan: number; // -1 (L) to +1 (R)
  mute: boolean;
  solo: boolean;
  sendLevelA: number; // 0 to 1
  sendLevelB: number; // 0 to 1
  outputTarget: 'master' | 'busA' | 'busB' | 'busC' | 'cue';
}

export interface MidiMapping {
  id: string;
  controlName: string; // e.g., "Master Volume", "Filter Cutoff", "Reverb Decay"
  targetType: 'master' | 'instrument' | 'plugin' | 'bus';
  targetId: string;
  paramKey: string;
  midiChannel: number; // 0-16 (0 = any)
  ccNumber: number; // 0-127
  minVal: number;
  maxVal: number;
}

export interface MidiMonitorMessage {
  id: string;
  timestamp: number;
  type: 'noteOn' | 'noteOff' | 'cc' | 'pitchBend' | 'programChange';
  channel: number;
  data1: number; // Note or CC number
  data2: number; // Velocity or CC value
  description: string;
}

export interface RecordedTrack {
  id: string;
  name: string;
  color: string;
  instrumentId: string;
  instrumentName: string;
  audioBlob?: Blob;
  audioUrl?: string;
  audioBuffer?: AudioBuffer;
  midiEvents: Array<{
    timestamp: number;
    type: 'noteOn' | 'noteOff' | 'pitchBend';
    note: number;
    velocity: number;
    duration?: number;
  }>;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  busId: string;
  duration: number;
}

export interface ScaleDefinition {
  id: string;
  name: string;
  intervals: number[]; // semitone intervals from root
  description: string;
}

export interface TuningSystem {
  id: string;
  name: string;
  centsOffset: number[]; // 12 offsets for C through B in cents
  description: string;
}

export interface ChordDefinition {
  id: string;
  name: string;
  symbol: string;
  intervals: number[];
  category: 'triad' | 'seventh' | 'extended' | 'world' | 'modal';
}

export interface ArpeggiatorSettings {
  enabled: boolean;
  mode: 'up' | 'down' | 'upDown' | 'random' | 'chord' | 'asPlayed';
  rate: '1/4' | '1/8' | '1/16' | '1/32' | '1/8t' | '1/16t';
  octaves: number; // 1, 2, 3, 4
  gate: number; // 0.1 to 1.0 (note length ratio)
  swing: number; // 0 to 0.75
}

export interface ExportOptions {
  format: 'wav_24' | 'wav_32' | 'wav_16' | 'mp3_320' | 'midi';
  scope: 'master_mix' | 'individual_stems' | 'dry_instrument' | 'midi_only';
  sampleRate: 44100 | 48000 | 96000;
  normalize: boolean;
  includeEffects: boolean;
}

export interface PianoRollNote {
  id: string;
  note: number; // MIDI pitch (e.g. 60 = C4)
  step: number; // start 16th step (0 to totalSteps - 1)
  duration: number; // in 16th steps (1, 2, 4, etc.)
  velocity: number; // 0.1 to 1.0
  selected?: boolean;
}

export type AppTab =
  | 'instruments'
  | 'pianoroll'
  | 'sequencer'
  | 'designer'
  | 'vst'
  | 'routing'
  | 'recorder'
  | 'midi'
  | 'scales'
  | 'sampler';


