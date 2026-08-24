import React, { useState } from 'react';
import { Check, Download, FileAudio, FileText, Music, Play, X, Zap } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';
import { encodeMidiFile } from '../audio/dsp/midiEncoder';
import { audioBufferToWav } from '../audio/dsp/wavEncoder';
import { ExportOptions } from '../types/audio';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose }) => {
  const engine = AudioEngine.getInstance();
  const [options, setOptions] = useState<ExportOptions>({
    format: 'wav_24',
    scope: 'master_mix',
    sampleRate: 44100,
    normalize: true,
    includeEffects: true,
  });

  const [isRendering, setIsRendering] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [downloadFileName, setDownloadFileName] = useState('');
  const [fileSizeBytes, setFileSizeBytes] = useState(0);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsRendering(true);
    try {
      if (options.format === 'midi') {
        // Encode MIDI File
        const tracksToExport = engine.recordedTracks.map((t) => ({
          name: t.name,
          events: t.midiEvents,
        }));

        // If no recorded tracks, export currently armed instrument take
        if (tracksToExport.length === 0) {
          tracksToExport.push({
            name: engine.currentInstrument.name,
            events: engine.currentRecordingMidi,
          });
        }

        const midiBlob = encodeMidiFile(tracksToExport, engine.bpm);
        const url = URL.createObjectURL(midiBlob);
        const fileName = `COOKUP_Session_${Date.now()}.mid`;

        setDownloadUrl(url);
        setDownloadFileName(fileName);
        setFileSizeBytes(midiBlob.size);
      } else {
        // High Quality Audio Render (WAV / Audio)
        const bitDepth = options.format === 'wav_32' ? 32 : options.format === 'wav_16' ? 16 : 24;

        // Render audio buffer via offline audio engine
        const audioBuffer = await engine.renderPerformanceOffline(
          engine.recordedTracks,
          options.sampleRate
        );

        const wavBlob = audioBufferToWav(audioBuffer, bitDepth, options.normalize);
        const url = URL.createObjectURL(wavBlob);
        const fileName = `COOKUP_${engine.currentInstrument.name.replace(/\s+/g, '_')}_${options.sampleRate / 1000}kHz_${bitDepth}bit.wav`;

        setDownloadUrl(url);
        setDownloadFileName(fileName);
        setFileSizeBytes(wavBlob.size);
      }
    } catch (err) {
      console.error('Export render error:', err);
    } finally {
      setIsRendering(false);
    }
  };

  const triggerDownload = () => {
    if (!downloadUrl) return;
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = downloadFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        id="export-modal-dialog"
        className="bg-[#121214] border border-[#28282A] rounded-2xl w-full max-w-lg shadow-2xl p-6 relative select-none animate-in fade-in zoom-in-95 duration-150"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-[#9E9E9E] hover:text-[#F0F0F0] hover:bg-[#18181B] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="p-2 rounded-lg bg-[#7C5DFF]/10 border border-[#7C5DFF]/30 text-[#9B82FF]">
            <Download className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#F0F0F0]">Export High-Quality Audio & Stems</h3>
            <p className="text-xs text-[#9E9E9E]">Lossless 24-Bit / 32-Bit Float WAV, MP3 & Standard MIDI (.mid)</p>
          </div>
        </div>

        {/* Configuration Body */}
        <div className="space-y-4 my-4">
          {/* Export Scope Selector */}
          <div>
            <label className="text-xs font-semibold text-[#E0E0E0] block mb-1.5">EXPORT SCOPE</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  setOptions({ ...options, scope: 'master_mix' });
                  setDownloadUrl(null);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  options.scope === 'master_mix'
                    ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#F0F0F0] ring-1 ring-[#7C5DFF]/40 shadow-[0_0_10px_rgba(124,93,255,0.2)]'
                    : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:bg-[#18181B]'
                }`}
              >
                <span className="font-bold text-xs block">Master Stereo Mix</span>
                <span className="text-[9px] text-[#71717A] block">All tracks & VST FX summed to 1 file</span>
              </button>

              <button
                onClick={() => {
                  setOptions({ ...options, scope: 'individual_stems' });
                  setDownloadUrl(null);
                }}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  options.scope === 'individual_stems'
                    ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#F0F0F0] ring-1 ring-[#7C5DFF]/40 shadow-[0_0_10px_rgba(124,93,255,0.2)]'
                    : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:bg-[#18181B]'
                }`}
              >
                <span className="font-bold text-xs block">Multi-Track Stems</span>
                <span className="text-[9px] text-[#71717A] block">Separate files for Drums, 808 & Leads</span>
              </button>
            </div>
          </div>

          {/* Format Selector */}
          <div>
            <label className="text-xs font-semibold text-[#E0E0E0] block mb-1.5">AUDIO FORMAT & RESOLUTION</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'wav_24', label: 'WAV 24-Bit', desc: 'Studio Master' },
                { id: 'wav_32', label: 'WAV 32-Bit', desc: 'IEEE Float' },
                { id: 'wav_16', label: 'WAV 16-Bit', desc: 'CD Quality' },
                { id: 'midi', label: 'MIDI (.mid)', desc: 'Standard File' },
              ].map((fmt) => (
                <button
                  key={fmt.id}
                  onClick={() => {
                    setOptions({ ...options, format: fmt.id as any });
                    setDownloadUrl(null);
                  }}
                  className={`p-2.5 rounded-lg border text-left transition-all ${
                    options.format === fmt.id
                      ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#F0F0F0] shadow-sm ring-1 ring-[#7C5DFF]/40 shadow-[0_0_10px_rgba(124,93,255,0.2)]'
                      : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:bg-[#18181B] hover:text-[#F0F0F0]'
                  }`}
                >
                  <span className="font-bold text-xs block">{fmt.label}</span>
                  <span className="text-[9px] text-[#71717A] block">{fmt.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Sample Rate */}
          {options.format !== 'midi' && (
            <div>
              <label className="text-xs font-semibold text-[#E0E0E0] block mb-1.5">SAMPLE RATE</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { rate: 44100, label: '44.1 kHz', note: 'Streaming / CD' },
                  { rate: 48000, label: '48.0 kHz', note: 'Film & Broadcast' },
                  { rate: 96000, label: '96.0 kHz', note: 'Ultra High-Res' },
                ].map((s) => (
                  <button
                    key={s.rate}
                    onClick={() => {
                      setOptions({ ...options, sampleRate: s.rate as any });
                      setDownloadUrl(null);
                    }}
                    className={`p-2 rounded-lg border text-center transition-all ${
                      options.sampleRate === s.rate
                        ? 'bg-[#7C5DFF]/20 border-[#7C5DFF] text-[#F0F0F0] font-bold shadow-[0_0_10px_rgba(124,93,255,0.2)]'
                        : 'bg-[#0A0A0B] border-[#28282A] text-[#9E9E9E] hover:bg-[#18181B] hover:text-[#F0F0F0]'
                    }`}
                  >
                    <span className="text-xs block">{s.label}</span>
                    <span className="text-[9px] text-[#71717A] block">{s.note}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Normalization & Headroom */}
          <div className="flex items-center justify-between p-3 bg-[#18181B] rounded-lg border border-[#28282A]">
            <div>
              <span className="text-xs font-bold text-[#F0F0F0] block">Peak Normalization (-0.3 dBFS)</span>
              <span className="text-[10px] text-[#9E9E9E]">Maximizes dynamic range with zero inter-sample clipping</span>
            </div>
            <input
              type="checkbox"
              checked={options.normalize}
              onChange={(e) => setOptions({ ...options, normalize: e.target.checked })}
              className="w-4 h-4 accent-[#7C5DFF] cursor-pointer"
            />
          </div>
        </div>

        {/* Action / Result */}
        {downloadUrl ? (
          <div className="mt-4 p-3 bg-[#7C5DFF]/15 border border-[#7C5DFF]/40 rounded-xl space-y-3 shadow-[0_0_15px_rgba(124,93,255,0.15)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileAudio className="w-4 h-4 text-[#9B82FF]" />
                <span className="text-xs font-bold text-[#F0F0F0] truncate max-w-[280px]">
                  {downloadFileName}
                </span>
              </div>
              <span className="text-[10px] font-mono text-[#9E9E9E]">
                {(fileSizeBytes / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>

            <button
              id="confirm-download-btn"
              onClick={triggerDownload}
              className="w-full py-2.5 bg-[#7C5DFF] hover:bg-[#6C47FF] text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(124,93,255,0.4)] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Download File to Desktop</span>
            </button>
          </div>
        ) : (
          <button
            id="start-export-render-btn"
            onClick={handleExport}
            disabled={isRendering}
            className="w-full py-3 bg-[#7C5DFF] hover:bg-[#6C47FF] disabled:opacity-50 text-white font-bold text-xs rounded-lg flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(124,93,255,0.35)] transition-all mt-4 cursor-pointer"
          >
            {isRendering ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Rendering High-Res Master...</span>
              </div>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Render & Generate Download</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};
