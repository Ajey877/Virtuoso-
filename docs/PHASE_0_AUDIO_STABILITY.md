# Virtuoso Phase 0 — Audio Stability

## Goal
Make the existing audio workflow reliable before adding features.

## Verification order
1. AudioEngine note lifecycle and cleanup
2. Transport and scheduling
3. Piano Roll playback
4. MIDI recording and audio recording
5. WAV/MIDI export
6. CI build/type checks

## Engineering rules
- Schedule musical events against `AudioContext.currentTime`.
- UI timers must never be the source of musical timing truth.
- Every started oscillator/source must have a defined cleanup path.
- Stop/restart must be idempotent.
- Avoid claiming native VST hosting unless a native plugin host exists.
- No AI features in the current product scope.

## Acceptance workflow
Play -> Stop -> Play -> Record -> Stop -> Playback -> Export.

The workflow must not produce stuck notes, duplicate scheduling, silent exports, unexpected clipping, or divergent exported timing.
