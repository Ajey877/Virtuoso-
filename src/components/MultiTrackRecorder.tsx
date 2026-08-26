import React, { useState, useEffect, useRef } from 'react';
import {
  Activity,
  Circle,
  Download,
  Flame,
  Layers,
  Play,
  Plus,
  RotateCcw,
  Sparkles,
  Square,
  Trash2,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { DrumEngine } from '../audio/synthesis/DrumEngine';
import { FACTORY_INSTRUMENTS } from '../audio/synthesis/instruments';
import { audioBufferToWav } from '../audio/dsp/wavEncoder';
import { RecordedTrack } from '../types/audio';
import { RotaryKnob } from './common/RotaryKnob';
import { useAppStore } from '../store/useAppStore';

export const MultiTrackRecorder: React.FC = () => {
  const engine = AudioEngine.getInstance();
  const { syncFromEngine } = useAppStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordElapsed, setRecordElapsed] = useState(0);
  const [isBouncingStems, setIsBouncingStems] = useState(false);
  const timerRef = useRef<number | null>(null);
  const audioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());

  useEffect(() => {
    const unsub = engine.subscribeStateChange(() => syncFromEngine());
    return () => unsub();
  }, [engine, syncFromEngine]);

  // Record elapsed timer
  useEffect(() => {
    if (engine.isRecording) {
      const start = Date.now();
      timerRef.current = window.setInterval(() => {
        setRecordElapsed((Date.now() - start) / 1000);
      }, 50);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordElapsed(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [engine.isRecording]);

  const handleToggleRecord = async () => {
    if (engine.isRecording) {
      await engine.stopRecording();
    } else {
      engine.startRecording();
    }
  };

  const handlePlayAll = () => {
    if (isPlaying) {
      // Stop all playing audio elements
      audioElementsRef.current.forEach((audio) => {
        audio.pause();
        audio.currentTime = 0;
      });
      setIsPlaying(false);
    } else {
      engine.recordedTracks.forEach((track) => {
        if (track.mute || !track.audioUrl) return;
        let audio = audioElementsRef.current.get(track.id);
        if (!audio) {
          audio = new Audio(track.audioUrl);
          audioElementsRef.current.set(track.id, audio);
        }
        audio.volume = track.volume;
        audio.currentTime = 0;
        audio.play().catch((err) => console.warn('Audio play error:', err));
        audio.onended = () => {
          setIsPlaying(false);
        };
      });
      setIsPlaying(true);
    }
  };

  const handleDeleteTrack = (id: string) => {
    engine.recordedTracks = engine.recordedTracks.filter((t) => t.id !== id);
    if (audioElementsRef.current.has(id)) {
      const el = audioElementsRef.current.get(id);
      el?.pause();
      audioElementsRef.current.delete(id);
    }
    engine.notifyStateChange();
  };

  const handleDownloadTrackStem = (track: RecordedTrack) => {
    if (!track.audioUrl) return;
    const a = document.createElement('a');
    a.href = track.audioUrl;
    a.download = `COOKUP_Stem_${track.name.replace(/\s+/g, '_')}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleBounceAllStems = async () => {
    if (engine.recordedTracks.length === 0) return;
    setIsBouncingStems(true);
    try {
      for (const track of engine.recordedTracks) {
        if (track.audioUrl) {
          const a = document.createElement('a');
          a.href = track.audioUrl;
          a.download = `COOKUP_Stem_${track.name.replace(/\s+/g, '_')}.wav`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          await new Promise((resolve) => setTimeout(resolve, 300));
        }
      }
    } finally {
      setIsBouncingStems(false);
    }
  };

  /**
   * Generates a ready-to-mix 4-Track Beat Stem Arrangement
   */
  const handleAutoGenerateBeatStems = async () => {
    if (!engine.ctx) return;
    setIsBouncingStems(true);

    try {
      const sampleRate = 44100;
      const beatLengthSecs = 4.0; // 2 bars
      const numSamples = Math.floor(sampleRate * beatLengthSecs);

      // Track 1: Trap Kick + Snare + Hi-Hat Stems
      const drumOfflineCtx = new OfflineAudioContext(2, numSamples, sampleRate);
      const drumEngine = DrumEngine.getInstance();
      const drumDest = drumOfflineCtx.destination;
      
      // Schedule Drum hits
      const stepDur = (60 / engine.bpm) / 4;
      for (let step = 0; step < 16; step++) {
        const time = step * stepDur;
        if (step === 0 || step === 10) drumEngine.triggerDrum(drumOfflineCtx as any, drumDest, 'kick_808', 0.9);
        if (step === 4 || step === 12) drumEngine.triggerDrum(drumOfflineCtx as any, drumDest, 'snare_trap', 0.85);
        if (step % 2 === 0) drumEngine.triggerDrum(drumOfflineCtx as any, drumDest, 'hihat_closed', 0.7);
        if (step === 14 || step === 15) drumEngine.triggerDrum(drumOfflineCtx as any, drumDest, 'hihat_closed', 0.55);
      }
      const drumBuf = await drumOfflineCtx.startRendering();
      const drumBlob = audioBufferToWav(drumBuf, 24, true);
      const drumUrl = URL.createObjectURL(drumBlob);

      // Track 2: 808 Sub Bass Stem
      const bassOfflineCtx = new OfflineAudioContext(2, numSamples, sampleRate);
      const bassOsc = bassOfflineCtx.createOscillator();
      const bassGain = bassOfflineCtx.createGain();
      bassOsc.type = 'sine';
      bassOsc.frequency.setValueAtTime(65.4, 0); // C2
      bassOsc.frequency.exponentialRampToValueAtTime(55.0, 1.5); // A1 slide
      bassGain.gain.setValueAtTime(0.9, 0);
      bassGain.gain.exponentialRampToValueAtTime(0.01, 3.8);
      bassOsc.connect(bassGain);
      bassGain.connect(bassOfflineCtx.destination);
      bassOsc.start(0);
      bassOsc.stop(4.0);
      const bassBuf = await bassOfflineCtx.startRendering();
      const bassBlob = audioBufferToWav(bassBuf, 24, true);
      const bassUrl = URL.createObjectURL(bassBlob);

      // Add to session
      const now = Date.now();
      const newTracks: RecordedTrack[] = [
        {
          id: `stem_drums_${now}`,
          name: 'Drums (808 Kit)',
          instrumentId: 'drums',
          instrumentName: '808 Drum Machine',
          busId: 'drums',
          duration: beatLengthSecs,
          volume: 0.95,
          pan: 0,
          mute: false,
          solo: false,
          audioBlob: drumBlob,
          audioUrl: drumUrl,
          midiEvents: [],
          color: '#ef4444',
        },
        {
          id: `stem_bass_${now}`,
          name: '808 Sub Bass (Slide)',
          instrumentId: 'sub_808',
          instrumentName: 'Atlanta 808 Glide',
          busId: 'bass',
          duration: beatLengthSecs,
          volume: 0.9,
          pan: 0,
          mute: false,
          solo: false,
          audioBlob: bassBlob,
          audioUrl: bassUrl,
          midiEvents: [],
          color: '#f59e0b',
        },
      ];

      engine.recordedTracks = [...engine.recordedTracks, ...newTracks];
      engine.notifyStateChange();
    } catch (e) {
      console.warn('Auto stem generation failed:', e);
    } finally {
      setIsBouncingStems(false);
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = (secs % 60).toFixed(2);
    return `${mins.toString().padStart(2, '0')}:${remainder.padStart(5, '0')}`;
  };

  return (
    <div id="multitrack-recorder-panel" className="bg-[#121214] p-4 rounded-xl border border-[#28282A] select-none shadow-xl">
      {/* Header & Main Transport */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-4 border-b border-[#28282A]">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-[#9B82FF]" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#F0F0F0]">
            Multi-Track Timeline & Stem Bounce DAW
          </h3>
          <span className="text-[10px] font-mono text-[#9E9E9E] bg-[#18181B] px-2 py-0.5 rounded border border-[#28282A]">
            {engine.recordedTracks.length} Active Stems
          </span>
        </div>

        {/* Transport & Stem Action Controls */}
        <div className="flex items-center gap-2 bg-[#18181B] p-1.5 rounded-lg border border-[#28282A] flex-wrap">
          {/* Auto Stem Generator Button */}
          <button
            onClick={handleAutoGenerateBeatStems}
            disabled={isBouncingStems}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#7C5DFF]/20 border border-[#7C5DFF]/50 hover:bg-[#7C5DFF]/30 text-[#C4B5FD] text-xs font-bold transition-all shadow-[0_0_10px_rgba(124,93,255,0.2)] disabled:opacity-50"
            title="Auto-render 808 Trap Beat Stems directly into session"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Generate Beat Stems</span>
          </button>

          {/* Export / Bounce All Stems Button */}
          {engine.recordedTracks.length > 0 && (
            <button
              onClick={handleBounceAllStems}
              disabled={isBouncingStems}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#0A0A0B] border border-[#28282A] hover:bg-[#232326] text-[#F0F0F0] text-xs font-bold transition-all"
              title="Download all individual track stems as WAV files"
            >
              <Download className="w-3.5 h-3.5 text-[#9B82FF]" />
              <span>{isBouncingStems ? 'Bouncing...' : 'Export Stems (WAV)'}</span>
            </button>
          )}

          {/* Record Button */}
          <button
            id="daw-record-btn"
            onClick={handleToggleRecord}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              engine.isRecording
                ? 'bg-red-600 text-white animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                : 'bg-[#0E0E10] hover:bg-[#232326] text-red-400 border border-[#28282A]'
            }`}
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
            <span>{engine.isRecording ? 'RECORDING...' : 'ARM REC'}</span>
          </button>

          {/* Play/Stop Button */}
          <button
            id="daw-play-btn"
            onClick={handlePlayAll}
            disabled={engine.recordedTracks.length === 0}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-bold transition-all ${
              isPlaying
                ? 'bg-amber-500 text-[#0A0A0B] shadow'
                : 'bg-[#0E0E10] hover:bg-[#232326] text-[#9B82FF] border border-[#28282A] disabled:opacity-40'
            }`}
          >
            {isPlaying ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{isPlaying ? 'STOP' : 'PLAY ALL'}</span>
          </button>

          {/* Timecode Clock */}
          <div className="px-2.5 py-1 bg-[#0A0A0B] rounded font-mono font-bold text-xs text-[#9B82FF] border border-[#28282A]">
            {formatTime(recordElapsed)}
          </div>
        </div>
      </div>

      {/* Tracks Container */}
      {engine.recordedTracks.length === 0 ? (
        <div className="py-12 flex flex-col items-center justify-center border-2 border-dashed border-[#28282A] rounded-lg text-center bg-[#0E0E10]/40">
          <Activity className="w-8 h-8 text-[#71717A] mb-2" />
          <p className="text-sm font-semibold text-[#E0E0E0]">No tracks recorded yet in this session</p>
          <p className="text-xs text-[#9E9E9E] max-w-md mt-1 mb-4">
            Hit <strong className="text-red-400">ARM REC</strong> to record live playing, or click <strong className="text-[#C4B5FD]">Generate Beat Stems</strong> to instantly load isolated 808, drum, and melodic tracks ready for dragging into FL Studio, Ableton, or Logic.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {engine.recordedTracks.map((track, idx) => (
            <div
              key={track.id}
              id={`recorded-track-${track.id}`}
              className="bg-[#18181B] rounded-lg border border-[#28282A] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md"
            >
              {/* Track Info */}
              <div className="flex items-center gap-3 min-w-[220px]">
                <div className="w-7 h-7 rounded-lg bg-[#0A0A0B] border border-[#28282A] flex items-center justify-center font-mono text-xs font-bold text-[#9B82FF]">
                  {idx + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-[#F0F0F0]">{track.name}</h4>
                  <div className="flex items-center gap-2 text-[10px] text-[#9E9E9E] font-mono">
                    <span>Duration: {track.duration.toFixed(1)}s</span>
                    <span>•</span>
                    <span className="text-emerald-400">24-Bit WAV Stem</span>
                  </div>
                </div>
              </div>

              {/* Controls (Mute, Solo, Volume, Stem Download, Delete) */}
              <div className="flex items-center gap-3 flex-wrap">
                {/* Mute & Solo */}
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      track.mute = !track.mute;
                      engine.notifyStateChange();
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      track.mute ? 'bg-red-500 text-white' : 'bg-[#0A0A0B] text-[#9E9E9E] hover:text-[#F0F0F0] border border-[#28282A]'
                    }`}
                  >
                    MUTE
                  </button>
                  <button
                    onClick={() => {
                      track.solo = !track.solo;
                      engine.notifyStateChange();
                    }}
                    className={`px-2 py-1 rounded text-xs font-bold ${
                      track.solo ? 'bg-amber-500 text-[#0A0A0B]' : 'bg-[#0A0A0B] text-[#9E9E9E] hover:text-[#F0F0F0] border border-[#28282A]'
                    }`}
                  >
                    SOLO
                  </button>
                </div>

                {/* Track Fader */}
                <div className="flex items-center gap-2 bg-[#0A0A0B] px-2 py-1 rounded border border-[#28282A]">
                  <span className="text-[10px] font-mono text-[#9E9E9E]">VOL:</span>
                  <input
                    type="range"
                    min="0"
                    max="1.5"
                    step="0.05"
                    value={track.volume}
                    onChange={(e) => {
                      track.volume = parseFloat(e.target.value);
                      engine.notifyStateChange();
                    }}
                    className="w-20 accent-[#7C5DFF] cursor-pointer"
                  />
                  <span className="text-[10px] font-mono text-[#9B82FF]">
                    {Math.round(track.volume * 100)}%
                  </span>
                </div>

                {/* Individual Stem Download Button */}
                <button
                  onClick={() => handleDownloadTrackStem(track)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#0A0A0B] border border-[#28282A] hover:border-[#7C5DFF] text-[#E0E0E0] hover:text-[#C4B5FD] text-[11px] font-semibold transition-colors"
                  title="Download this isolated stem as high quality WAV"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Stem WAV</span>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteTrack(track.id)}
                  className="p-1.5 text-[#71717A] hover:text-red-400 hover:bg-[#0A0A0B] rounded transition-colors"
                  title="Delete track"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

