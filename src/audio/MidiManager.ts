import { MidiMapping, MidiMonitorMessage } from '../types/audio';
import { AudioEngine } from './AudioEngine';

export class MidiManager {
  private static instance: MidiManager | null = null;
  private audioEngine: AudioEngine;

  public isSupported: boolean = false;
  public midiAccess: MIDIAccess | null = null;
  public connectedDevices: Array<{ id: string; name: string; manufacturer: string; state: string }> = [];
  public activeDeviceId: string = 'all';

  // MIDI Learn Mode
  public isLearning: boolean = false;
  public learnTarget: {
    targetType: 'master' | 'instrument' | 'plugin' | 'bus';
    targetId: string;
    paramKey: string;
    controlName: string;
    minVal: number;
    maxVal: number;
  } | null = null;

  // Custom MIDI Mappings
  public mappings: MidiMapping[] = [
    { id: 'm1', controlName: 'Modulation Wheel', targetType: 'master', targetId: 'engine', paramKey: 'modWheel', midiChannel: 0, ccNumber: 1, minVal: 0, maxVal: 1 },
    { id: 'm2', controlName: 'Master Volume', targetType: 'master', targetId: 'engine', paramKey: 'masterVolume', midiChannel: 0, ccNumber: 7, minVal: 0, maxVal: 1 },
    { id: 'm3', controlName: 'Filter Cutoff', targetType: 'plugin', targetId: 'filter', paramKey: 'cutoff', midiChannel: 0, ccNumber: 74, minVal: 40, maxVal: 18000 },
    { id: 'm4', controlName: 'Filter Resonance', targetType: 'plugin', targetId: 'filter', paramKey: 'resonance', midiChannel: 0, ccNumber: 71, minVal: 0.5, maxVal: 15 },
    { id: 'm5', controlName: 'Sustain Pedal', targetType: 'master', targetId: 'engine', paramKey: 'sustain', midiChannel: 0, ccNumber: 64, minVal: 0, maxVal: 127 },
    { id: 'm6', controlName: 'Reverb Mix', targetType: 'plugin', targetId: 'reverb', paramKey: 'mix', midiChannel: 0, ccNumber: 91, minVal: 0, maxVal: 1 },
    { id: 'm7', controlName: 'Delay Mix', targetType: 'plugin', targetId: 'delay', paramKey: 'mix', midiChannel: 0, ccNumber: 92, minVal: 0, maxVal: 1 },
    { id: 'm8', controlName: 'Saturation Drive', targetType: 'plugin', targetId: 'saturation', paramKey: 'drive', midiChannel: 0, ccNumber: 13, minVal: 0, maxVal: 40 },
  ];

  // Monitor Message Feed
  public monitorLogs: MidiMonitorMessage[] = [];
  private maxLogs: number = 30;

  private listeners: Set<() => void> = new Set();

  public static getInstance(): MidiManager {
    if (!MidiManager.instance) {
      MidiManager.instance = new MidiManager();
    }
    return MidiManager.instance;
  }

  private constructor() {
    this.audioEngine = AudioEngine.getInstance();
  }

  public async init(): Promise<boolean> {
    if (typeof navigator === 'undefined' || !navigator.requestMIDIAccess) {
      this.isSupported = false;
      this.notify();
      return false;
    }

    try {
      this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });
      this.isSupported = true;
      this.scanDevices();

      this.midiAccess.onstatechange = () => {
        this.scanDevices();
      };

      this.attachInputs();
      this.notify();
      return true;
    } catch (err) {
      console.warn('Web MIDI API access denied or not available:', err);
      this.isSupported = false;
      this.notify();
      return false;
    }
  }

  private scanDevices(): void {
    if (!this.midiAccess) return;
    const devices: Array<{ id: string; name: string; manufacturer: string; state: string }> = [];

    this.midiAccess.inputs.forEach((input) => {
      devices.push({
        id: input.id,
        name: input.name || 'Generic MIDI Device',
        manufacturer: input.manufacturer || 'Unknown',
        state: input.state,
      });
    });

    this.connectedDevices = devices;
    this.attachInputs();
    this.notify();
  }

  private attachInputs(): void {
    if (!this.midiAccess) return;
    this.midiAccess.inputs.forEach((input) => {
      input.onmidimessage = (msg) => this.handleMidiMessage(msg, input.name || 'MIDI Device');
    });
  }

  private handleMidiMessage(event: MIDIMessageEvent, deviceName: string): void {
    if (!event.data) return;
    const [status, data1, data2] = event.data;
    const command = status >> 4;
    const channel = (status & 0xf) + 1;

    let msgType: MidiMonitorMessage['type'] = 'cc';
    let description = '';

    // 0x9 = Note On (velocity > 0), 0x8 = Note Off (or Note On with velocity 0)
    if (command === 0x9 && data2 > 0) {
      msgType = 'noteOn';
      const velocity = data2 / 127;
      description = `Note On: ${data1} (Vel: ${data2}) [${deviceName}]`;
      this.audioEngine.playNote(data1, velocity);
    } else if (command === 0x8 || (command === 0x9 && data2 === 0)) {
      msgType = 'noteOff';
      description = `Note Off: ${data1} [${deviceName}]`;
      this.audioEngine.stopNote(data1);
    } else if (command === 0xb) {
      // Control Change (CC)
      msgType = 'cc';
      description = `CC #${data1}: ${data2} (Ch ${channel})`;
      this.processControlChange(channel, data1, data2);
    } else if (command === 0xe) {
      // Pitch Bend (14-bit: data1 = LSB, data2 = MSB, center = 8192)
      msgType = 'pitchBend';
      const bendValue = (data2 << 7) + data1; // 0 to 16383, 8192 = center
      const cents = ((bendValue - 8192) / 8192) * 200; // ±200 cents
      description = `Pitch Bend: ${cents.toFixed(0)} cents`;
      this.audioEngine.setPitchBend(cents);
    } else if (command === 0xc) {
      msgType = 'programChange';
      description = `Program Change: ${data1}`;
    }

    // Add to real-time monitor log
    this.addMonitorLog({
      id: `midi_${Date.now()}_${Math.random()}`,
      timestamp: Date.now(),
      type: msgType,
      channel,
      data1: data1 || 0,
      data2: data2 || 0,
      description,
    });
  }

  private processControlChange(channel: number, ccNumber: number, value: number): void {
    // If in Learn Mode, bind immediately to selected target!
    if (this.isLearning && this.learnTarget) {
      const existingIdx = this.mappings.findIndex(
        (m) => m.targetId === this.learnTarget!.targetId && m.paramKey === this.learnTarget!.paramKey
      );

      const newMapping: MidiMapping = {
        id: `map_${Date.now()}`,
        controlName: this.learnTarget.controlName,
        targetType: this.learnTarget.targetType,
        targetId: this.learnTarget.targetId,
        paramKey: this.learnTarget.paramKey,
        midiChannel: 0, // Any channel
        ccNumber,
        minVal: this.learnTarget.minVal,
        maxVal: this.learnTarget.maxVal,
      };

      if (existingIdx >= 0) {
        this.mappings[existingIdx] = newMapping;
      } else {
        this.mappings.push(newMapping);
      }

      this.isLearning = false;
      this.learnTarget = null;
      this.notify();
      return;
    }

    // Execute matching mappings
    const matchingMappings = this.mappings.filter(
      (m) => m.ccNumber === ccNumber && (m.midiChannel === 0 || m.midiChannel === channel)
    );

    matchingMappings.forEach((map) => {
      const normalized = value / 127;
      const scaledValue = map.minVal + normalized * (map.maxVal - map.minVal);

      if (map.targetType === 'master') {
        if (map.paramKey === 'masterVolume') {
          this.audioEngine.masterVolume = scaledValue;
          if (this.audioEngine.masterGain && this.audioEngine.ctx) {
            this.audioEngine.masterGain.gain.setValueAtTime(scaledValue, this.audioEngine.ctx.currentTime);
          }
          this.audioEngine.notifyStateChange();
        } else if (map.paramKey === 'modWheel') {
          this.audioEngine.setModWheel(normalized);
        } else if (map.paramKey === 'sustain') {
          this.audioEngine.setSustainPedal(value >= 64);
        }
      } else if (map.targetType === 'plugin') {
        this.audioEngine.updateVstParam(map.targetId, map.paramKey, scaledValue);
      }
    });
  }

  public startLearning(target: NonNullable<typeof this.learnTarget>): void {
    this.isLearning = true;
    this.learnTarget = target;
    this.notify();
  }

  public cancelLearning(): void {
    this.isLearning = false;
    this.learnTarget = null;
    this.notify();
  }

  public removeMapping(id: string): void {
    this.mappings = this.mappings.filter((m) => m.id !== id);
    this.notify();
  }

  private addMonitorLog(log: MidiMonitorMessage): void {
    this.monitorLogs.unshift(log);
    if (this.monitorLogs.length > this.maxLogs) {
      this.monitorLogs.pop();
    }
    this.notify();
  }

  public subscribe(cb: () => void): () => void {
    this.listeners.add(cb);
    return () => this.listeners.delete(cb);
  }

  private notify(): void {
    this.listeners.forEach((cb) => cb());
  }
}
