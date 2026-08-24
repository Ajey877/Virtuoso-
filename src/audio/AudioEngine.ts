import {
  ArpeggiatorSettings,
  BusChannel,
  EnvelopeSettings,
  FilterSettings,
  InstrumentPreset,
  RecordedTrack,
  VibratoSettings,
  VstPlugin,
} from '../types/audio';
import { FACTORY_INSTRUMENTS } from './synthesis/instruments';
import { SCALES, TUNINGS } from './synthesis/scales';
import { generateImpulseResponse, makeDistortionCurve } from './dsp/reverbImpulse';

interface ActiveVoice {
  note: number;
  frequency: number;
  velocity: number;
  startTime: number;
  nodes: {
    oscillators: OscillatorNode[];
    gains: GainNode[];
    filters: BiquadFilterNode[];
    noiseSources: AudioNode[];
    mainGain: GainNode;
  };
  instrumentId: string;
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;

  public ctx: AudioContext | null = null;
  public masterGain: GainNode | null = null;
  public limiter: DynamicsCompressorNode | null = null;
  public masterAnalyser: AnalyserNode | null = null;
  public isRunning: boolean = false;

  // Active Voices
  private activeVoices: Map<number, ActiveVoice> = new Map();
  private maxPolyphony: number = 32;

  // Current Instrument & Settings
  public currentInstrument: InstrumentPreset = FACTORY_INSTRUMENTS[0];
  public masterVolume: number = 0.85;
  public bpm: number = 120;
  public octaveShift: number = 0; // -3 to +3
  public semitoneTranspose: number = 0; // -12 to +12
  public pitchBendCents: number = 0; // -200 to +200 cents
  public modWheelValue: number = 0; // 0 to 1
  public sustainPedal: boolean = false;
  private sustainedNotes: Set<number> = new Set();

  // Scale & Tuning
  public currentScaleId: string = 'chromatic';
  public currentRootNote: number = 0; // 0 = C, 1 = C#, ... 11 = B
  public scaleLockEnabled: boolean = false;
  public currentTuningId: string = '12tet_440';

  // Legato 808 Slide & Glide Engine
  public glideEnabled: boolean = true;
  public glideTime: number = 0.08; // 80ms default (0.01s - 0.5s)
  public glideMode: 'legato' | 'always' = 'legato';
  public lastPlayedNote: number | null = null;
  public lastPlayedFreq: number | null = null;

  // Sidechain Ducking & Pumping Engine
  public sidechainEnabled: boolean = true;
  public sidechainDepth: number = 0.75; // 0 (no duck) to 1.0 (full silence on kick)
  public sidechainRelease: number = 0.18; // 180ms recovery
  private sidechainGainNode: GainNode | null = null;
  public sidechainMeterValue: number = 1.0; // for UI animation

  // Producer Master Macros (Direct Fast Performance Control)
  public macroCutoff: number = 1.0; // 0.1 to 2.0 (brightness sweep)
  public macroDrive: number = 0.0; // 0 to 1.0 (heat & saturation)
  public macroSpace: number = 0.0; // 0 to 1.0 (reverb & delay depth)
  public macroMotion: number = 0.0; // 0 to 1.0 (lfo / vibrato speed & depth)

  // Arpeggiator
  public arpeggiator: ArpeggiatorSettings = {
    enabled: false,
    mode: 'up',
    rate: '1/16',
    octaves: 1,
    gate: 0.8,
    swing: 0,
  };
  private heldNotesForArp: number[] = [];
  private arpTimerId: number | null = null;
  private arpStepIndex: number = 0;

  // VST Plugins
  public vstPlugins: VstPlugin[] = [
    {
      id: 'saturation',
      name: 'Tube Saturation',
      type: 'saturation',
      enabled: true,
      bypass: false,
      params: { drive: 12, warmth: 0.7, mix: 0.4 },
    },
    {
      id: 'filter',
      name: 'Ladder Resonant Filter',
      type: 'filter',
      enabled: true,
      bypass: false,
      params: { cutoff: 14000, resonance: 1.5, lfoRate: 1.2, lfoDepth: 0.0 },
    },
    {
      id: 'eq',
      name: '4-Band Parametric EQ',
      type: 'eq',
      enabled: true,
      bypass: false,
      params: { lowGain: 1.5, lowMidGain: -0.5, highMidGain: 1.0, highGain: 2.0 },
    },
    {
      id: 'chorus',
      name: 'Vintage Dimension Chorus',
      type: 'chorus',
      enabled: true,
      bypass: true,
      params: { rate: 1.2, depth: 0.4, mix: 0.5 },
    },
    {
      id: 'delay',
      name: 'Stereo Tape Delay',
      type: 'delay',
      enabled: true,
      bypass: true,
      params: { timeL: 0.25, timeR: 0.375, feedback: 0.35, damping: 3500, mix: 0.3 },
    },
    {
      id: 'reverb',
      name: 'Shimmer Cathedral Reverb',
      type: 'reverb',
      enabled: true,
      bypass: false,
      params: { decay: 2.8, preDelay: 0.02, shimmer: 0.3, mix: 0.35 },
    },
    {
      id: 'compressor',
      name: 'Studio Master Compressor',
      type: 'compressor',
      enabled: true,
      bypass: false,
      params: { threshold: -16, ratio: 3.5, attack: 0.015, release: 0.18, makeup: 2.0 },
    },
  ];

  // VST Node Graph
  private fxInputNode: GainNode | null = null;
  private fxOutputNode: GainNode | null = null;
  private saturationNode: WaveShaperNode | null = null;
  private saturationDriveGain: GainNode | null = null;
  private ladderFilterNode: BiquadFilterNode | null = null;
  private delayNodeL: DelayNode | null = null;
  private delayNodeR: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private delayWetGain: GainNode | null = null;
  private delayDryGain: GainNode | null = null;
  private convolverNode: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private eqLowShelf: BiquadFilterNode | null = null;
  private eqLowMid: BiquadFilterNode | null = null;
  private eqHighMid: BiquadFilterNode | null = null;
  private eqHighShelf: BiquadFilterNode | null = null;
  private chorusDelayNodeL: DelayNode | null = null;
  private chorusDelayNodeR: DelayNode | null = null;
  private chorusLfo: OscillatorNode | null = null;
  private compressorNode: DynamicsCompressorNode | null = null;

  // Audio Routing Matrix & Busses
  public busChannels: BusChannel[] = [
    { id: 'master', name: 'Master Bus', color: '#10b981', volume: 1.0, pan: 0, mute: false, solo: false, sendLevelA: 0, sendLevelB: 0, outputTarget: 'master' },
    { id: 'busA', name: 'Bus A (Leads/Pluck)', color: '#3b82f6', volume: 1.0, pan: 0, mute: false, solo: false, sendLevelA: 0, sendLevelB: 0, outputTarget: 'master' },
    { id: 'busB', name: 'Bus B (Rhythm/World)', color: '#f59e0b', volume: 1.0, pan: 0, mute: false, solo: false, sendLevelA: 0, sendLevelB: 0, outputTarget: 'master' },
    { id: 'busC', name: 'Bus C (Ambient/Pads)', color: '#8b5cf6', volume: 1.0, pan: 0, mute: false, solo: false, sendLevelA: 0, sendLevelB: 0, outputTarget: 'master' },
    { id: 'cue', name: 'Cue / Headphones', color: '#ec4899', volume: 1.0, pan: 0, mute: false, solo: false, sendLevelA: 0, sendLevelB: 0, outputTarget: 'cue' },
  ];
  public activeBusId: string = 'master';

  // Aux / Mic Input
  public micStream: MediaStream | null = null;
  public micSourceNode: MediaStreamAudioSourceNode | null = null;
  public micGainNode: GainNode | null = null;
  public micEnabled: boolean = false;
  public micMonitoring: boolean = false;

  // Recording & Multi-Track System
  public isRecording: boolean = false;
  public recordingStartTime: number = 0;
  public currentRecordingMidi: Array<{
    timestamp: number;
    type: 'noteOn' | 'noteOff' | 'pitchBend';
    note: number;
    velocity: number;
    duration?: number;
  }> = [];
  private mediaRecorder: MediaRecorder | null = null;
  private recordedAudioChunks: Blob[] = [];
  public recordedTracks: RecordedTrack[] = [];
  private mediaStreamDest: MediaStreamAudioDestinationNode | null = null;

  // Metronome
  public metronomeEnabled: boolean = false;
  private metronomeTimerId: number | null = null;
  private metronomeBeat: number = 0;

  // Event Listeners for UI updates
  private noteEventListeners: Set<(note: number, velocity: number, isNoteOn: boolean) => void> = new Set();
  private stateChangeListeners: Set<() => void> = new Set();

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  public async init(): Promise<void> {
    if (this.ctx && this.ctx.state !== 'closed') {
      if (this.ctx.state === 'suspended') {
        await this.ctx.resume();
      }
      this.isRunning = true;
      this.notifyStateChange();
      return;
    }

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 44100,
    });

    // Master Limiter and Output Graph
    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.setValueAtTime(-1.0, this.ctx.currentTime);
    this.limiter.knee.setValueAtTime(0, this.ctx.currentTime);
    this.limiter.ratio.setValueAtTime(20.0, this.ctx.currentTime);
    this.limiter.attack.setValueAtTime(0.002, this.ctx.currentTime);
    this.limiter.release.setValueAtTime(0.05, this.ctx.currentTime);

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);

    this.masterAnalyser = this.ctx.createAnalyser();
    this.masterAnalyser.fftSize = 1024;
    this.masterAnalyser.smoothingTimeConstant = 0.8;

    // Media Stream Destination for Lossless Master Recording
    this.mediaStreamDest = this.ctx.createMediaStreamDestination();

    // Connect Output Chain: Limiter -> MasterGain -> MasterAnalyser -> ctx.destination & mediaStreamDest
    this.limiter.connect(this.masterGain);
    this.masterGain.connect(this.masterAnalyser);
    this.masterAnalyser.connect(this.ctx.destination);
    this.masterGain.connect(this.mediaStreamDest);

    // Setup FX Rack Graph
    this.setupFxRack();

    this.isRunning = true;
    this.notifyStateChange();
  }

  private setupFxRack(): void {
    if (!this.ctx || !this.limiter) return;

    this.fxInputNode = this.ctx.createGain();
    this.fxOutputNode = this.ctx.createGain();

    // 1. Saturation (Waveshaper)
    this.saturationNode = this.ctx.createWaveShaper();
    this.saturationDriveGain = this.ctx.createGain();
    this.saturationDriveGain.gain.setValueAtTime(1.0, this.ctx.currentTime);
    this.updateSaturationCurve();

    // 2. Ladder / Resonant Filter
    this.ladderFilterNode = this.ctx.createBiquadFilter();
    this.ladderFilterNode.type = 'lowpass';
    this.ladderFilterNode.frequency.setValueAtTime(14000, this.ctx.currentTime);
    this.ladderFilterNode.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // 3. 4-Band Parametric EQ
    this.eqLowShelf = this.ctx.createBiquadFilter();
    this.eqLowShelf.type = 'lowshelf';
    this.eqLowShelf.frequency.setValueAtTime(80, this.ctx.currentTime);
    this.eqLowShelf.gain.setValueAtTime(1.5, this.ctx.currentTime);

    this.eqLowMid = this.ctx.createBiquadFilter();
    this.eqLowMid.type = 'peaking';
    this.eqLowMid.frequency.setValueAtTime(450, this.ctx.currentTime);
    this.eqLowMid.Q.setValueAtTime(1.0, this.ctx.currentTime);
    this.eqLowMid.gain.setValueAtTime(-0.5, this.ctx.currentTime);

    this.eqHighMid = this.ctx.createBiquadFilter();
    this.eqHighMid.type = 'peaking';
    this.eqHighMid.frequency.setValueAtTime(2800, this.ctx.currentTime);
    this.eqHighMid.Q.setValueAtTime(1.2, this.ctx.currentTime);
    this.eqHighMid.gain.setValueAtTime(1.0, this.ctx.currentTime);

    this.eqHighShelf = this.ctx.createBiquadFilter();
    this.eqHighShelf.type = 'highshelf';
    this.eqHighShelf.frequency.setValueAtTime(9500, this.ctx.currentTime);
    this.eqHighShelf.gain.setValueAtTime(2.0, this.ctx.currentTime);

    // 4. Stereo Tape Delay
    this.delayNodeL = this.ctx.createDelay(2.0);
    this.delayNodeR = this.ctx.createDelay(2.0);
    this.delayFeedbackGain = this.ctx.createGain();
    this.delayWetGain = this.ctx.createGain();
    this.delayDryGain = this.ctx.createGain();
    this.delayNodeL.delayTime.setValueAtTime(0.25, this.ctx.currentTime);
    this.delayNodeR.delayTime.setValueAtTime(0.375, this.ctx.currentTime);
    this.delayFeedbackGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.delayWetGain.gain.setValueAtTime(0.0, this.ctx.currentTime); // bypass initial
    this.delayDryGain.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Delay internal routing
    this.delayNodeL.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNodeL);
    this.delayNodeL.connect(this.delayWetGain);

    // 5. Algorithmic Shimmer Reverb (Convolver)
    this.convolverNode = this.ctx.createConvolver();
    this.convolverNode.buffer = generateImpulseResponse(this.ctx, 2.5, 2.0, false, true);
    this.reverbWetGain = this.ctx.createGain();
    this.reverbDryGain = this.ctx.createGain();
    this.reverbWetGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
    this.reverbDryGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

    this.convolverNode.connect(this.reverbWetGain);

    // 6. Studio Compressor
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.setValueAtTime(-16, this.ctx.currentTime);
    this.compressorNode.ratio.setValueAtTime(3.5, this.ctx.currentTime);
    this.compressorNode.attack.setValueAtTime(0.015, this.ctx.currentTime);
    this.compressorNode.release.setValueAtTime(0.18, this.ctx.currentTime);

    // Wire serial chain:
    // fxInputNode -> saturation -> ladderFilter -> EQ (Low -> LowMid -> HighMid -> High) -> Compressor -> fxOutputNode
    this.fxInputNode.connect(this.saturationDriveGain);
    this.saturationDriveGain.connect(this.saturationNode);
    this.saturationNode.connect(this.ladderFilterNode);
    this.ladderFilterNode.connect(this.eqLowShelf);
    this.eqLowShelf.connect(this.eqLowMid);
    this.eqLowMid.connect(this.eqHighMid);
    this.eqHighMid.connect(this.eqHighShelf);
    this.eqHighShelf.connect(this.compressorNode);

    // Connect Reverb & Delay sends from EQ
    this.eqHighShelf.connect(this.reverbDryGain);
    this.eqHighShelf.connect(this.convolverNode);
    this.reverbDryGain.connect(this.fxOutputNode);
    this.reverbWetGain.connect(this.fxOutputNode);

    this.eqHighShelf.connect(this.delayDryGain);
    this.eqHighShelf.connect(this.delayNodeL);
    this.delayDryGain.connect(this.fxOutputNode);
    this.delayWetGain.connect(this.fxOutputNode);

    this.compressorNode.connect(this.fxOutputNode);

    // Sidechain Dynamic Pumping Node (Ducks audio before Limiter & Master)
    this.sidechainGainNode = this.ctx.createGain();
    this.sidechainGainNode.gain.setValueAtTime(1.0, this.ctx.currentTime);

    // Finally, fxOutputNode -> Sidechain Ducker -> Limiter -> Master
    this.fxOutputNode.connect(this.sidechainGainNode);
    this.sidechainGainNode.connect(this.limiter);
  }

  // --- KICK / DRUM SIDECHAIN DUCKING PUMP ---
  public triggerSidechainPump(customDepth?: number, customRelease?: number): void {
    if (!this.sidechainEnabled || !this.sidechainGainNode || !this.ctx) return;

    const depth = customDepth !== undefined ? customDepth : this.sidechainDepth;
    const release = customRelease !== undefined ? customRelease : this.sidechainRelease;
    const now = this.ctx.currentTime;

    const duckGain = Math.max(0.01, 1.0 - depth);

    // Fast 4ms ducking drop, then smooth exponential recovery
    this.sidechainGainNode.gain.cancelScheduledValues(now);
    this.sidechainGainNode.gain.setValueAtTime(this.sidechainGainNode.gain.value, now);
    this.sidechainGainNode.gain.linearRampToValueAtTime(duckGain, now + 0.005);
    this.sidechainGainNode.gain.exponentialRampToValueAtTime(1.0, now + 0.005 + release);

    this.sidechainMeterValue = duckGain;
    setTimeout(() => {
      this.sidechainMeterValue = 1.0;
      this.notifyStateChange();
    }, (release + 0.01) * 1000);
  }

  public updateSaturationCurve(): void {
    if (!this.saturationNode || !this.ctx) return;
    const sat = this.vstPlugins.find((p) => p.id === 'saturation');
    if (!sat || sat.bypass || !sat.enabled) {
      this.saturationNode.curve = makeDistortionCurve(0, this.ctx.sampleRate);
      return;
    }
    const drive = sat.params.drive || 12;
    this.saturationNode.curve = makeDistortionCurve(drive, this.ctx.sampleRate);
  }

  public updateVstParam(pluginId: string, paramKey: string, value: number): void {
    const plugin = this.vstPlugins.find((p) => p.id === pluginId);
    if (!plugin) return;
    plugin.params[paramKey] = value;

    if (!this.ctx) return;

    if (pluginId === 'saturation') {
      this.updateSaturationCurve();
    } else if (pluginId === 'filter') {
      if (this.ladderFilterNode) {
        if (paramKey === 'cutoff') this.ladderFilterNode.frequency.setValueAtTime(value, this.ctx.currentTime);
        if (paramKey === 'resonance') this.ladderFilterNode.Q.setValueAtTime(value, this.ctx.currentTime);
      }
    } else if (pluginId === 'eq') {
      if (paramKey === 'lowGain' && this.eqLowShelf) this.eqLowShelf.gain.setValueAtTime(value, this.ctx.currentTime);
      if (paramKey === 'lowMidGain' && this.eqLowMid) this.eqLowMid.gain.setValueAtTime(value, this.ctx.currentTime);
      if (paramKey === 'highMidGain' && this.eqHighMid) this.eqHighMid.gain.setValueAtTime(value, this.ctx.currentTime);
      if (paramKey === 'highGain' && this.eqHighShelf) this.eqHighShelf.gain.setValueAtTime(value, this.ctx.currentTime);
    } else if (pluginId === 'delay') {
      if (paramKey === 'timeL' && this.delayNodeL) this.delayNodeL.delayTime.setValueAtTime(value, this.ctx.currentTime);
      if (paramKey === 'timeR' && this.delayNodeR) this.delayNodeR.delayTime.setValueAtTime(value, this.ctx.currentTime);
      if (paramKey === 'feedback' && this.delayFeedbackGain) this.delayFeedbackGain.gain.setValueAtTime(value, this.ctx.currentTime);
      if (paramKey === 'mix' && this.delayWetGain) {
        this.delayWetGain.gain.setValueAtTime(plugin.bypass ? 0 : value, this.ctx.currentTime);
      }
    } else if (pluginId === 'reverb') {
      if (paramKey === 'mix' && this.reverbWetGain) {
        this.reverbWetGain.gain.setValueAtTime(plugin.bypass ? 0 : value, this.ctx.currentTime);
      }
      if (paramKey === 'decay' && this.convolverNode) {
        this.convolverNode.buffer = generateImpulseResponse(this.ctx, Math.max(0.5, value), 2.0, false, (plugin.params.shimmer || 0) > 0.2);
      }
    } else if (pluginId === 'compressor') {
      if (this.compressorNode) {
        if (paramKey === 'threshold') this.compressorNode.threshold.setValueAtTime(value, this.ctx.currentTime);
        if (paramKey === 'ratio') this.compressorNode.ratio.setValueAtTime(value, this.ctx.currentTime);
        if (paramKey === 'attack') this.compressorNode.attack.setValueAtTime(value, this.ctx.currentTime);
        if (paramKey === 'release') this.compressorNode.release.setValueAtTime(value, this.ctx.currentTime);
      }
    }

    this.notifyStateChange();
  }

  public togglePluginBypass(pluginId: string): void {
    const plugin = this.vstPlugins.find((p) => p.id === pluginId);
    if (!plugin) return;
    plugin.bypass = !plugin.bypass;
    this.updateSaturationCurve();
    if (pluginId === 'reverb' && this.reverbWetGain && this.ctx) {
      this.reverbWetGain.gain.setValueAtTime(plugin.bypass ? 0 : plugin.params.mix, this.ctx.currentTime);
    }
    if (pluginId === 'delay' && this.delayWetGain && this.ctx) {
      this.delayWetGain.gain.setValueAtTime(plugin.bypass ? 0 : plugin.params.mix, this.ctx.currentTime);
    }
    this.notifyStateChange();
  }

  // --- SCALE QUANTIZATION & PITCH CALCULATION ---
  public quantizeNoteToScale(rawNote: number): number {
    if (!this.scaleLockEnabled || this.currentScaleId === 'chromatic') {
      return rawNote;
    }

    const scale = SCALES.find((s) => s.id === this.currentScaleId);
    if (!scale) return rawNote;

    const octave = Math.floor(rawNote / 12);
    const noteClass = ((rawNote % 12) + 12) % 12;

    // Check if current note class is in scale relative to root
    const relativeInterval = (noteClass - this.currentRootNote + 12) % 12;
    if (scale.intervals.includes(relativeInterval)) {
      return rawNote;
    }

    // Find nearest interval in scale
    let closestInterval = scale.intervals[0];
    let minDiff = 999;
    for (const interval of scale.intervals) {
      const diff = Math.abs(interval - relativeInterval);
      if (diff < minDiff) {
        minDiff = diff;
        closestInterval = interval;
      }
    }

    const quantizedNoteClass = (this.currentRootNote + closestInterval) % 12;
    return octave * 12 + quantizedNoteClass;
  }

  public midiNoteToFrequency(midiNote: number): number {
    // Standard A4 = 440 Hz (MIDI 69)
    const tuning = TUNINGS.find((t) => t.id === this.currentTuningId);
    const noteClass = ((midiNote % 12) + 12) % 12;
    const centsOffset = tuning ? tuning.centsOffset[noteClass] || 0 : 0;

    const totalCents = (midiNote - 69) * 100 + centsOffset + this.pitchBendCents;
    return 440 * Math.pow(2, totalCents / 1200);
  }

  // --- PLAY NOTE (NOTE ON) ---
  public async playNote(
    rawMidiNote: number,
    velocity: number = 0.85,
    customInstrument?: InstrumentPreset
  ): Promise<void> {
    if (!this.isRunning || !this.ctx) {
      await this.init();
    }
    if (!this.ctx || !this.fxInputNode) return;

    // Apply Transposition & Scale Quantization
    const transposedNote = rawMidiNote + this.octaveShift * 12 + this.semitoneTranspose;
    const note = this.quantizeNoteToScale(transposedNote);

    // Stop existing voice on same note to retrigger cleanly
    if (this.activeVoices.has(note)) {
      this.stopNote(note, true);
    }

    // Polyphony Voice Stealing if exceeded
    if (this.activeVoices.size >= this.maxPolyphony) {
      const oldestNote = this.activeVoices.keys().next().value;
      if (oldestNote !== undefined) {
        this.stopNote(oldestNote, true);
      }
    }

    const instrument = customInstrument || this.currentInstrument;
    const frequency = this.midiNoteToFrequency(note);
    const now = this.ctx.currentTime;

    let fromFreq: number | null = null;
    if (this.glideEnabled && this.lastPlayedFreq && (this.glideMode === 'always' || this.activeVoices.size > 0)) {
      fromFreq = this.lastPlayedFreq;
    }
    this.lastPlayedNote = note;
    this.lastPlayedFreq = frequency;

    const voice = this.synthesizeVoice(note, frequency, velocity, instrument, now, fromFreq);
    this.activeVoices.set(note, voice);

    // Record Event if recording
    if (this.isRecording) {
      this.currentRecordingMidi.push({
        timestamp: (now - this.recordingStartTime),
        type: 'noteOn',
        note,
        velocity,
      });
    }

    // Arpeggiator Tracking
    if (this.arpeggiator.enabled) {
      if (!this.heldNotesForArp.includes(note)) {
        this.heldNotesForArp.push(note);
        this.heldNotesForArp.sort((a, b) => a - b);
      }
      this.ensureArpRunning();
    }

    // Notify UI
    this.notifyNoteEvent(note, velocity, true);
  }

  // --- PLAY NOTE AT TIME (FOR SEQUENCER & CHORD STRUMMER) ---
  public playNoteAtTime(
    rawMidiNote: number,
    velocity: number = 0.8,
    startTime: number = 0,
    duration: number = 0.5,
    customInstrument?: InstrumentPreset
  ): void {
    if (!this.ctx || !this.fxInputNode) return;

    const transposedNote = rawMidiNote + this.octaveShift * 12 + this.semitoneTranspose;
    const note = this.quantizeNoteToScale(transposedNote);
    const instrument = customInstrument || this.currentInstrument;
    const freq = this.midiNoteToFrequency(note);
    const t = startTime || this.ctx.currentTime;

    const voice = this.synthesizeVoice(note, freq, velocity, instrument, t);

    // Schedule automatic note off
    const releaseTime = Math.max(0.02, instrument.envelope.release);
    const stopTime = t + duration;

    voice.nodes.mainGain.gain.setValueAtTime(voice.nodes.mainGain.gain.value || (velocity * 0.8), stopTime);
    voice.nodes.mainGain.gain.exponentialRampToValueAtTime(0.0001, stopTime + releaseTime);

    setTimeout(() => {
      voice.nodes.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore
        }
      });
      voice.nodes.gains.forEach((g) => g.disconnect());
      voice.nodes.filters.forEach((f) => f.disconnect());
      voice.nodes.mainGain.disconnect();
    }, (stopTime + releaseTime - this.ctx.currentTime) * 1000 + 100);

    // Trigger visual note event
    setTimeout(() => {
      this.notifyNoteEvent(note, velocity, true);
      setTimeout(() => this.notifyNoteEvent(note, 0, false), duration * 1000);
    }, Math.max(0, (t - this.ctx.currentTime) * 1000));
  }

  // --- PRODUCER PERFORMANCE MACROS ---
  public setProducerMacro(macroKey: 'cutoff' | 'drive' | 'space' | 'motion', value: number): void {
    if (macroKey === 'cutoff') {
      this.macroCutoff = value;
      // Adjust ladder filter
      const baseCutoff = this.vstPlugins.find((p) => p.id === 'filter')?.params.cutoff || 14000;
      const targetCutoff = Math.max(80, Math.min(18000, baseCutoff * value));
      if (this.ladderFilterNode && this.ctx) {
        this.ladderFilterNode.frequency.setValueAtTime(targetCutoff, this.ctx.currentTime);
      }
    } else if (macroKey === 'drive') {
      this.macroDrive = value;
      const driveAmount = Math.round(value * 40);
      this.updateVstParam('saturation', 'drive', driveAmount);
      this.updateVstParam('saturation', 'mix', Math.min(1.0, 0.3 + value * 0.5));
    } else if (macroKey === 'space') {
      this.macroSpace = value;
      this.updateVstParam('reverb', 'mix', Math.min(0.85, value * 0.7));
      this.updateVstParam('delay', 'mix', Math.min(0.7, value * 0.5));
    } else if (macroKey === 'motion') {
      this.macroMotion = value;
      this.currentInstrument.vibrato.depth = Math.min(0.8, 0.05 + value * 0.6);
      this.updateVstParam('chorus', 'mix', Math.min(0.8, value * 0.75));
      if (this.vstPlugins.find((p) => p.id === 'chorus')) {
        this.vstPlugins.find((p) => p.id === 'chorus')!.bypass = value < 0.05;
      }
    }
    this.notifyStateChange();
  }

  // --- STOP NOTE (NOTE OFF) ---
  public stopNote(rawMidiNote: number, forceStop: boolean = false): void {
    if (!this.ctx) return;

    const transposedNote = rawMidiNote + this.octaveShift * 12 + this.semitoneTranspose;
    const note = this.quantizeNoteToScale(transposedNote);

    if (this.sustainPedal && !forceStop) {
      this.sustainedNotes.add(note);
      return;
    }

    const voice = this.activeVoices.get(note);
    if (!voice) return;

    const now = this.ctx.currentTime;
    const releaseTime = Math.max(0.02, this.currentInstrument.envelope.release);

    // Graceful release envelope
    voice.nodes.mainGain.gain.cancelScheduledValues(now);
    voice.nodes.mainGain.gain.setValueAtTime(voice.nodes.mainGain.gain.value, now);
    voice.nodes.mainGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

    // Cleanup Web Audio nodes after release
    setTimeout(() => {
      voice.nodes.oscillators.forEach((osc) => {
        try {
          osc.stop();
          osc.disconnect();
        } catch {
          // ignore already stopped
        }
      });
      voice.nodes.gains.forEach((g) => g.disconnect());
      voice.nodes.filters.forEach((f) => f.disconnect());
      voice.nodes.mainGain.disconnect();
    }, releaseTime * 1000 + 100);

    this.activeVoices.delete(note);

    // Record Event if recording
    if (this.isRecording) {
      this.currentRecordingMidi.push({
        timestamp: (now - this.recordingStartTime),
        type: 'noteOff',
        note,
        velocity: 0,
      });
    }

    // Arp Tracking
    if (this.arpeggiator.enabled) {
      this.heldNotesForArp = this.heldNotesForArp.filter((n) => n !== note);
      if (this.heldNotesForArp.length === 0 && this.arpTimerId) {
        clearInterval(this.arpTimerId);
        this.arpTimerId = null;
      }
    }

    // Notify UI
    this.notifyNoteEvent(note, 0, false);
  }

  public setSustainPedal(isDown: boolean): void {
    this.sustainPedal = isDown;
    if (!isDown) {
      // Release all sustained notes
      this.sustainedNotes.forEach((note) => {
        this.stopNote(note, true);
      });
      this.sustainedNotes.clear();
    }
    this.notifyStateChange();
  }

  public setPitchBend(cents: number): void {
    this.pitchBendCents = Math.max(-1200, Math.min(1200, cents));
    if (!this.ctx) return;

    // Update frequencies on all currently active voices in real-time
    this.activeVoices.forEach((voice) => {
      const newFreq = this.midiNoteToFrequency(voice.note);
      voice.nodes.oscillators.forEach((osc) => {
        osc.frequency.setValueAtTime(newFreq, this.ctx!.currentTime);
      });
    });
    this.notifyStateChange();
  }

  public setModWheel(val: number): void {
    this.modWheelValue = Math.max(0, Math.min(1, val));
    if (this.ladderFilterNode && this.ctx) {
      // Mod wheel opens filter and adds vibrato
      const baseFreq = this.currentInstrument.filter.cutoff;
      const modFreq = Math.min(20000, baseFreq + this.modWheelValue * 8000);
      this.ladderFilterNode.frequency.setValueAtTime(modFreq, this.ctx.currentTime);
    }
    this.notifyStateChange();
  }

  // --- MULTI-TIMBRAL SYNTHESIS ENGINE ---
  private synthesizeVoice(
    note: number,
    freq: number,
    velocity: number,
    inst: InstrumentPreset,
    now: number,
    fromFreq?: number | null
  ): ActiveVoice {
    const ctx = this.ctx!;
    const oscs: OscillatorNode[] = [];
    const gains: GainNode[] = [];
    const filters: BiquadFilterNode[] = [];
    const noiseNodes: AudioNode[] = [];

    // Helper for legato glide
    const setOscFreq = (osc: OscillatorNode, targetF: number, mult: number = 1.0) => {
      if (fromFreq && fromFreq > 0) {
        const startF = fromFreq * mult;
        const glideDur = inst.portamento || this.glideTime;
        osc.frequency.setValueAtTime(startF, now);
        osc.frequency.exponentialRampToValueAtTime(targetF, now + Math.max(0.01, glideDur));
      } else {
        osc.frequency.setValueAtTime(targetF, now);
      }
    };

    const mainGain = ctx.createGain();
    const env = inst.envelope;
    const filterEnv = inst.filter;
    const vibrato = inst.vibrato;

    // Main Envelope (Attack, Decay, Sustain)
    const peakGain = Math.min(1.0, velocity * 0.8);
    const sustainGain = Math.max(0.0001, peakGain * env.sustain);

    mainGain.gain.setValueAtTime(0.0001, now);
    mainGain.gain.linearRampToValueAtTime(peakGain, now + Math.max(0.001, env.attack));
    if (env.decay > 0) {
      mainGain.gain.exponentialRampToValueAtTime(sustainGain, now + env.attack + env.decay);
    }

    // Voice Filter
    const voiceFilter = ctx.createBiquadFilter();
    voiceFilter.type = filterEnv.type;
    const startCutoff = Math.max(40, Math.min(20000, filterEnv.cutoff * (0.5 + velocity * 0.5)));
    voiceFilter.frequency.setValueAtTime(startCutoff, now);
    voiceFilter.Q.setValueAtTime(filterEnv.resonance, now);

    if (filterEnv.envelopeAmount !== 0) {
      const peakFilterFreq = Math.max(40, Math.min(20000, startCutoff * (1 + filterEnv.envelopeAmount * 2)));
      voiceFilter.frequency.linearRampToValueAtTime(peakFilterFreq, now + env.attack);
      voiceFilter.frequency.exponentialRampToValueAtTime(startCutoff, now + env.attack + Math.max(0.1, env.decay));
    }
    filters.push(voiceFilter);

    // Vibrato LFO
    let vibratoGain: GainNode | null = null;
    if (vibrato.depth > 0 || this.modWheelValue > 0) {
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(vibrato.rate, now);
      vibratoGain = ctx.createGain();
      const totalDepth = (vibrato.depth + this.modWheelValue * 0.3) * (freq * 0.05);
      vibratoGain.gain.setValueAtTime(totalDepth, now + vibrato.delay);
      lfo.connect(vibratoGain);
      lfo.start(now);
      oscs.push(lfo);
      gains.push(vibratoGain);
    }

    // Synthesis Type Branching
    switch (inst.synthesisType) {
      case 'additive_piano': {
        // Multi-harmonic additive grand piano with inharmonic string dispersion
        const partialRatios = [1.0, 2.001, 3.004, 4.008, 5.015, 6.025];
        const partialGains = [1.0, 0.6 * inst.harmonics, 0.35 * inst.harmonics, 0.2 * inst.harmonics, 0.1, 0.05];

        partialRatios.forEach((ratio, idx) => {
          const osc = ctx.createOscillator();
          osc.type = idx === 0 ? 'triangle' : 'sine';
          osc.frequency.setValueAtTime(freq * ratio, now);
          if (vibratoGain) vibratoGain.connect(osc.frequency);

          const partGain = ctx.createGain();
          partGain.gain.setValueAtTime(partialGains[idx] * (1 / (idx + 1)), now);
          // High harmonics decay faster
          partGain.gain.exponentialRampToValueAtTime(0.0001, now + env.attack + env.decay * (1 / (1 + idx * 0.4)));

          osc.connect(partGain);
          partGain.connect(voiceFilter);
          osc.start(now);
          oscs.push(osc);
          gains.push(partGain);
        });

        // Hammer click transient
        if (inst.noiseAmount > 0) {
          const noiseBuffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.02), ctx.sampleRate);
          const data = noiseBuffer.getChannelData(0);
          for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (data.length * 0.2));
          const noiseSource = ctx.createBufferSource();
          noiseSource.buffer = noiseBuffer;
          const noiseGain = ctx.createGain();
          noiseGain.gain.setValueAtTime(inst.noiseAmount * 0.3 * velocity, now);
          noiseSource.connect(noiseGain);
          noiseGain.connect(voiceFilter);
          noiseSource.start(now);
          noiseNodes.push(noiseSource);
        }
        break;
      }

      case 'fm_epiano': {
        // 2-Operator FM Rhodes Tine synthesis
        const carrier = ctx.createOscillator();
        carrier.type = 'sine';
        carrier.frequency.setValueAtTime(freq, now);
        if (vibratoGain) vibratoGain.connect(carrier.frequency);

        const modulator = ctx.createOscillator();
        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(freq * 14, now); // Bell chime ratio

        const modGain = ctx.createGain();
        const modIndex = freq * (inst.harmonics * 4 + velocity * 2);
        modGain.gain.setValueAtTime(modIndex, now);
        modGain.gain.exponentialRampToValueAtTime(freq * 0.2, now + 0.8);

        modulator.connect(modGain);
        modGain.connect(carrier.frequency);
        carrier.connect(voiceFilter);

        carrier.start(now);
        modulator.start(now);
        oscs.push(carrier, modulator);
        gains.push(modGain);
        break;
      }

      case 'organ_drawbars': {
        // 9 Drawbar Tonewheel harmonics
        const drawbars = inst.drawbars || [8, 8, 8, 0, 0, 0, 4, 6, 8];
        const intervals = [0.5, 1.498, 1.0, 2.0, 2.996, 4.0, 5.04, 5.993, 8.0];

        drawbars.forEach((level, idx) => {
          if (level <= 0) return;
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq * intervals[idx], now);
          if (vibratoGain) vibratoGain.connect(osc.frequency);

          const g = ctx.createGain();
          g.gain.setValueAtTime((level / 8) * 0.25, now);

          osc.connect(g);
          g.connect(voiceFilter);
          osc.start(now);
          oscs.push(osc);
          gains.push(g);
        });
        break;
      }

      case 'karplus_sitar':
      case 'karplus_koto':
      case 'plucked_oud':
      case 'harp_plucked':
      case 'acoustic_guitar': {
        // Physical Plucked String Modeling (Multi-Oscillator Comb + Jawari Buzz)
        const osc1 = ctx.createOscillator();
        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(freq, now);

        const osc2 = ctx.createOscillator();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(freq * (inst.synthesisType === 'karplus_sitar' ? 2.001 : 1.002), now);

        if (vibratoGain) {
          vibratoGain.connect(osc1.frequency);
          vibratoGain.connect(osc2.frequency);
        }

        const pluckGain = ctx.createGain();
        pluckGain.gain.setValueAtTime(0.6, now);
        pluckGain.gain.exponentialRampToValueAtTime(0.0001, now + env.attack + env.decay);

        osc1.connect(pluckGain);
        osc2.connect(pluckGain);
        pluckGain.connect(voiceFilter);

        osc1.start(now);
        osc2.start(now);
        oscs.push(osc1, osc2);
        gains.push(pluckGain);
        break;
      }

      case 'bowed_erhu':
      case 'violin_bowed':
      case 'cello_bowed': {
        // Bowed String Friction with Rosin Formants
        const sawOsc = ctx.createOscillator();
        sawOsc.type = 'sawtooth';
        sawOsc.frequency.setValueAtTime(freq, now);
        if (vibratoGain) vibratoGain.connect(sawOsc.frequency);

        const subSquare = ctx.createOscillator();
        subSquare.type = 'triangle';
        subSquare.frequency.setValueAtTime(freq * 0.5, now);

        sawOsc.connect(voiceFilter);
        subSquare.connect(voiceFilter);

        sawOsc.start(now);
        subSquare.start(now);
        oscs.push(sawOsc, subSquare);
        break;
      }

      case 'flute_wind':
      case 'bagpipe_drone': {
        // Wind Acoustic Pipe + Noise Breath
        const pipeOsc = ctx.createOscillator();
        pipeOsc.type = 'sine';
        pipeOsc.frequency.setValueAtTime(freq, now);
        if (vibratoGain) vibratoGain.connect(pipeOsc.frequency);

        const overtoneOsc = ctx.createOscillator();
        overtoneOsc.type = 'triangle';
        overtoneOsc.frequency.setValueAtTime(freq * 2, now);

        const overtoneGain = ctx.createGain();
        overtoneGain.gain.setValueAtTime(inst.harmonics * 0.4, now);

        pipeOsc.connect(voiceFilter);
        overtoneOsc.connect(overtoneGain);
        overtoneGain.connect(voiceFilter);

        pipeOsc.start(now);
        overtoneOsc.start(now);
        oscs.push(pipeOsc, overtoneOsc);
        gains.push(overtoneGain);
        break;
      }

      case 'analog_bass':
      case 'sub_808': {
        // Snappy Analog Sub Bass with 808 Glide Pitch Slide
        const osc1 = ctx.createOscillator();
        osc1.type = inst.synthesisType === 'sub_808' ? 'sine' : 'sawtooth';
        
        if (fromFreq && fromFreq > 0) {
          const glideDur = inst.portamento || this.glideTime;
          osc1.frequency.setValueAtTime(fromFreq, now);
          osc1.frequency.exponentialRampToValueAtTime(freq, now + Math.max(0.01, glideDur));
        } else if (inst.synthesisType === 'sub_808') {
          osc1.frequency.setValueAtTime(freq * 2.5, now);
          osc1.frequency.exponentialRampToValueAtTime(freq, now + 0.06);
        } else {
          osc1.frequency.setValueAtTime(freq, now);
        }

        const subOsc = ctx.createOscillator();
        subOsc.type = 'sine';
        if (fromFreq && fromFreq > 0) {
          const glideDur = inst.portamento || this.glideTime;
          subOsc.frequency.setValueAtTime(fromFreq * 0.5, now);
          subOsc.frequency.exponentialRampToValueAtTime(freq * 0.5, now + Math.max(0.01, glideDur));
        } else {
          subOsc.frequency.setValueAtTime(freq * 0.5, now);
        }

        osc1.connect(voiceFilter);
        subOsc.connect(voiceFilter);
        osc1.start(now);
        subOsc.start(now);
        oscs.push(osc1, subOsc);
        break;
      }

      case 'juno_pad': {
        // 3-Oscillator Stereo Detuned Warm Analog Saw Stack
        const detunes = [-12, 0, 14];
        detunes.forEach((cents) => {
          const osc = ctx.createOscillator();
          osc.type = 'sawtooth';
          osc.frequency.setValueAtTime(freq, now);
          osc.detune.setValueAtTime(cents, now);
          if (vibratoGain) vibratoGain.connect(osc.frequency);
          osc.connect(voiceFilter);
          osc.start(now);
          oscs.push(osc);
        });
        break;
      }

      case 'custom_sample': {
        if (inst.sampleData) {
          const sampleSource = ctx.createBufferSource();
          sampleSource.buffer = inst.sampleData;
          const baseNote = inst.sampleBaseNote || 60;
          const playbackRate = Math.pow(2, (note - baseNote) / 12);
          sampleSource.playbackRate.setValueAtTime(playbackRate, now);
          sampleSource.connect(voiceFilter);
          sampleSource.start(now);
          noiseNodes.push(sampleSource);
        } else {
          // Fallback sine if sample empty
          const osc = ctx.createOscillator();
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now);
          osc.connect(voiceFilter);
          osc.start(now);
          oscs.push(osc);
        }
        break;
      }

      default: {
        // Default warm polyphonic synth
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now);
        osc.connect(voiceFilter);
        osc.start(now);
        oscs.push(osc);
        break;
      }
    }

    // Connect voiceFilter -> mainGain -> fxInputNode
    voiceFilter.connect(mainGain);
    mainGain.connect(this.fxInputNode);

    return {
      note,
      frequency: freq,
      velocity,
      startTime: now,
      nodes: {
        oscillators: oscs,
        gains,
        filters,
        noiseSources: noiseNodes,
        mainGain,
      },
      instrumentId: inst.id,
    };
  }

  // --- ARPEGGIATOR ENGINE ---
  private ensureArpRunning(): void {
    if (!this.arpeggiator.enabled || this.arpTimerId || this.heldNotesForArp.length === 0) return;

    const getIntervalMs = (rate: string, bpm: number): number => {
      const beatMs = (60 / bpm) * 1000;
      switch (rate) {
        case '1/4': return beatMs;
        case '1/8': return beatMs / 2;
        case '1/16': return beatMs / 4;
        case '1/32': return beatMs / 8;
        case '1/8t': return (beatMs / 2) * (2 / 3);
        case '1/16t': return (beatMs / 4) * (2 / 3);
        default: return beatMs / 4;
      }
    };

    const intervalMs = getIntervalMs(this.arpeggiator.rate, this.bpm);

    this.arpTimerId = window.setInterval(() => {
      if (this.heldNotesForArp.length === 0) return;

      const baseNotes = [...this.heldNotesForArp];
      let fullSequence: number[] = [];

      for (let oct = 0; oct < this.arpeggiator.octaves; oct++) {
        fullSequence.push(...baseNotes.map((n) => n + oct * 12));
      }

      if (this.arpeggiator.mode === 'down') {
        fullSequence.reverse();
      } else if (this.arpeggiator.mode === 'upDown') {
        const reversed = [...fullSequence].reverse().slice(1, -1);
        fullSequence = [...fullSequence, ...reversed];
      } else if (this.arpeggiator.mode === 'random') {
        fullSequence.sort(() => Math.random() - 0.5);
      }

      const noteToTrigger = fullSequence[this.arpStepIndex % fullSequence.length];
      this.arpStepIndex++;

      // Trigger short arp note
      if (this.ctx) {
        const freq = this.midiNoteToFrequency(noteToTrigger);
        const now = this.ctx.currentTime;
        const voice = this.synthesizeVoice(noteToTrigger, freq, 0.8, this.currentInstrument, now);
        const gateDuration = (intervalMs / 1000) * this.arpeggiator.gate;

        setTimeout(() => {
          if (this.ctx) {
            voice.nodes.mainGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.05);
            setTimeout(() => {
              voice.nodes.oscillators.forEach((o) => {
                try { o.stop(); o.disconnect(); } catch { /* ignore */ }
              });
              voice.nodes.mainGain.disconnect();
            }, 100);
          }
        }, gateDuration * 1000);

        this.notifyNoteEvent(noteToTrigger, 0.8, true);
        setTimeout(() => this.notifyNoteEvent(noteToTrigger, 0, false), gateDuration * 1000);
      }
    }, intervalMs);
  }

  // --- RECORDING & MULTI-TRACK ---
  public startRecording(): void {
    if (!this.ctx) return;
    this.isRecording = true;
    this.recordingStartTime = this.ctx.currentTime;
    this.currentRecordingMidi = [];
    this.recordedAudioChunks = [];

    if (this.mediaStreamDest && typeof MediaRecorder !== 'undefined') {
      try {
        this.mediaRecorder = new MediaRecorder(this.mediaStreamDest.stream, {
          mimeType: 'audio/webm;codecs=opus',
        });
        this.mediaRecorder.ondataavailable = (e) => {
          if (e.data.size > 0) this.recordedAudioChunks.push(e.data);
        };
        this.mediaRecorder.start(100);
      } catch (err) {
        console.warn('MediaRecorder init fallback:', err);
      }
    }
    this.notifyStateChange();
  }

  public async stopRecording(): Promise<RecordedTrack | null> {
    if (!this.isRecording || !this.ctx) return null;
    this.isRecording = false;

    const duration = this.ctx.currentTime - this.recordingStartTime;
    const trackId = `track_${Date.now()}`;
    const trackName = `${this.currentInstrument.name} (Take ${this.recordedTracks.length + 1})`;

    let audioBlob: Blob | undefined;
    let audioUrl: string | undefined;

    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      await new Promise<void>((resolve) => {
        this.mediaRecorder!.onstop = () => resolve();
        this.mediaRecorder!.stop();
      });
      audioBlob = new Blob(this.recordedAudioChunks, { type: 'audio/webm' });
      audioUrl = URL.createObjectURL(audioBlob);
    }

    const newTrack: RecordedTrack = {
      id: trackId,
      name: trackName,
      color: this.busChannels[1].color,
      instrumentId: this.currentInstrument.id,
      instrumentName: this.currentInstrument.name,
      audioBlob,
      audioUrl,
      midiEvents: [...this.currentRecordingMidi],
      volume: 0.9,
      pan: 0,
      mute: false,
      solo: false,
      busId: 'master',
      duration,
    };

    this.recordedTracks.push(newTrack);
    this.notifyStateChange();
    return newTrack;
  }

  // --- LIVE AUX / MIC INPUT ---
  public async enableMicrophone(): Promise<boolean> {
    if (!this.ctx) await this.init();
    if (!this.ctx || !this.fxInputNode) return false;

    try {
      this.micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.micSourceNode = this.ctx.createMediaStreamSource(this.micStream);
      this.micGainNode = this.ctx.createGain();
      this.micGainNode.gain.setValueAtTime(0.85, this.ctx.currentTime);

      this.micSourceNode.connect(this.micGainNode);
      this.micGainNode.connect(this.fxInputNode);

      this.micEnabled = true;
      this.notifyStateChange();
      return true;
    } catch (err) {
      console.error('Failed to open microphone input:', err);
      return false;
    }
  }

  public disableMicrophone(): void {
    if (this.micStream) {
      this.micStream.getTracks().forEach((t) => t.stop());
      this.micStream = null;
    }
    if (this.micSourceNode) {
      this.micSourceNode.disconnect();
      this.micSourceNode = null;
    }
    this.micEnabled = false;
    this.notifyStateChange();
  }

  // --- METRONOME ---
  public toggleMetronome(): void {
    this.metronomeEnabled = !this.metronomeEnabled;
    if (this.metronomeEnabled) {
      this.startMetronome();
    } else if (this.metronomeTimerId) {
      clearInterval(this.metronomeTimerId);
      this.metronomeTimerId = null;
    }
    this.notifyStateChange();
  }

  private startMetronome(): void {
    if (this.metronomeTimerId) clearInterval(this.metronomeTimerId);
    const intervalMs = (60 / this.bpm) * 1000;

    this.metronomeTimerId = window.setInterval(() => {
      if (!this.metronomeEnabled || !this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      const isDownbeat = this.metronomeBeat % 4 === 0;
      osc.frequency.setValueAtTime(isDownbeat ? 1600 : 800, now);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);

      osc.connect(gain);
      gain.connect(this.masterGain || this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);

      this.metronomeBeat++;
    }, intervalMs);
  }

  // --- OFFLINE RENDERER & HIGH QUALITY EXPORT ---
  public async renderPerformanceOffline(
    tracks: RecordedTrack[],
    sampleRate: number = 44100
  ): Promise<AudioBuffer> {
    const maxDuration = Math.max(2.0, ...tracks.map((t) => t.duration));
    const offlineCtx = new OfflineAudioContext(2, Math.ceil(sampleRate * (maxDuration + 1.0)), sampleRate);

    // Recreate Synth & DSP Graph in Offline Context for Lossless High-Precision Render
    const offlineLimiter = offlineCtx.createDynamicsCompressor();
    offlineLimiter.threshold.setValueAtTime(-1.0, 0);
    offlineLimiter.connect(offlineCtx.destination);

    for (const track of tracks) {
      if (track.mute) continue;
      const trackGain = offlineCtx.createGain();
      trackGain.gain.setValueAtTime(track.volume, 0);
      trackGain.connect(offlineLimiter);

      // Render MIDI events in offline context
      const inst = FACTORY_INSTRUMENTS.find((i) => i.id === track.instrumentId) || this.currentInstrument;

      track.midiEvents.forEach((ev) => {
        if (ev.type === 'noteOn') {
          const freq = 440 * Math.pow(2, (ev.note - 69) / 12);
          const osc = offlineCtx.createOscillator();
          osc.type = 'triangle';
          osc.frequency.setValueAtTime(freq, ev.timestamp);

          const envGain = offlineCtx.createGain();
          envGain.gain.setValueAtTime(0.0001, ev.timestamp);
          envGain.gain.linearRampToValueAtTime(ev.velocity * 0.7, ev.timestamp + inst.envelope.attack);
          envGain.gain.exponentialRampToValueAtTime(0.0001, ev.timestamp + inst.envelope.attack + inst.envelope.decay);

          osc.connect(envGain);
          envGain.connect(trackGain);
          osc.start(ev.timestamp);
          osc.stop(ev.timestamp + inst.envelope.attack + inst.envelope.decay + 0.1);
        }
      });
    }

    return await offlineCtx.startRendering();
  }

  // --- LISTENERS & OBSERVERS ---
  public subscribeNoteEvent(cb: (note: number, velocity: number, isNoteOn: boolean) => void): () => void {
    this.noteEventListeners.add(cb);
    return () => this.noteEventListeners.delete(cb);
  }

  public subscribeStateChange(cb: () => void): () => void {
    this.stateChangeListeners.add(cb);
    return () => this.stateChangeListeners.delete(cb);
  }

  private notifyNoteEvent(note: number, velocity: number, isNoteOn: boolean): void {
    this.noteEventListeners.forEach((cb) => cb(note, velocity, isNoteOn));
  }

  public notifyStateChange(): void {
    this.stateChangeListeners.forEach((cb) => cb());
  }
}
