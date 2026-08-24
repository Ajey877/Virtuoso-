/**
 * Algorithmic impulse response generators for Studio Reverbs
 */

export function generateImpulseResponse(
  ctx: AudioContext | BaseAudioContext,
  durationSeconds: number = 2.5,
  decay: number = 2.0,
  reverse: boolean = false,
  shimmer: boolean = false
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const n = reverse ? length - i : i;
    const progress = n / length;
    // Exponential decay curve
    const envelope = Math.exp(-progress * decay * 3.5);

    // Filtered noise with stereo decorrelation
    const whiteL = (Math.random() * 2 - 1);
    const whiteR = (Math.random() * 2 - 1);

    // Add harmonic shimmer reflections if enabled
    let shimmerMod = 1.0;
    if (shimmer) {
      shimmerMod = 1.0 + 0.3 * Math.sin(progress * 440 * Math.PI * 2);
    }

    left[i] = whiteL * envelope * shimmerMod;
    right[i] = whiteR * envelope * shimmerMod;
  }

  return impulse;
}

export function makeDistortionCurve(amount: number = 20, sampleRate: number = 44100): Float32Array {
  const k = typeof amount === 'number' ? amount : 20;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;

  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    if (k === 0) {
      curve[i] = x;
    } else {
      // Tube saturation curve with even harmonic warmth
      curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
    }
  }
  return curve;
}
