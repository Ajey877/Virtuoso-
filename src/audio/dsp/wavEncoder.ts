/**
 * Lossless WAV and Audio Exporter supporting 16-bit, 24-bit PCM and 32-bit Float formats.
 */

export function audioBufferToWav(
  buffer: AudioBuffer,
  bitDepth: 16 | 24 | 32 = 24,
  normalize: boolean = true
): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const bufferSize = 44 + dataSize;

  const arrayBuffer = new ArrayBuffer(bufferSize);
  const view = new DataView(arrayBuffer);

  // Write ASCII string helper
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  // Find max peak for normalization if enabled
  let peak = 0;
  if (normalize) {
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        const absVal = Math.abs(channelData[i]);
        if (absVal > peak) peak = absVal;
      }
    }
  }
  const gain = normalize && peak > 0 ? 0.98 / peak : 1.0;

  // RIFF Header
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
  view.setUint16(20, bitDepth === 32 ? 3 : 1, true); // 1 = PCM, 3 = IEEE Float
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Write interleaved audio samples
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < length; i++) {
    for (let channel = 0; channel < numChannels; channel++) {
      let sample = channels[channel][i] * gain;

      // Soft clamp
      if (sample > 1.0) sample = 1.0;
      if (sample < -1.0) sample = -1.0;

      if (bitDepth === 16) {
        const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
        view.setInt16(offset, intSample, true);
        offset += 2;
      } else if (bitDepth === 24) {
        const intSample = sample < 0 ? sample * 0x800000 : sample * 0x7fffff;
        const clamped = Math.floor(intSample);
        view.setUint8(offset, clamped & 0xff);
        view.setUint8(offset + 1, (clamped >> 8) & 0xff);
        view.setUint8(offset + 2, (clamped >> 16) & 0xff);
        offset += 3;
      } else if (bitDepth === 32) {
        view.setFloat32(offset, sample, true);
        offset += 4;
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}
