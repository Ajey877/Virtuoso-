# Virtuoso — World Instrument Keyboard Workstation

Virtuoso is a browser-based music workstation focused on reliable instrument performance, sequencing, MIDI control, recording, editing, mixing, and audio export.

## Current focus

Phase 0 is focused on stability and the core workflow:

**Play → Record → Edit → Playback → Export**

AI features are intentionally disabled for the current product direction.

## Run locally

**Prerequisite:** Node.js 22+

```bash
npm install
npm run lint
npm run build
npm run dev
```

The development server runs on port 3000.

## Project areas

- Web Audio synthesis and effects
- Virtual keyboard
- MIDI input and MIDI learn
- Piano roll and sequencing
- Groove sequencing
- Multitrack recording
- WAV and MIDI export
- Instrument and scale systems

## Engineering rule

Core audio reliability comes before adding new features. Timing, note lifecycle, recording, playback, and export must remain stable as the workstation grows.
