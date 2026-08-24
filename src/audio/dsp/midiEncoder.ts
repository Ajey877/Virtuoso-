/**
 * Standard MIDI File (.mid) Format 1 Multi-track Binary Encoder
 */

export interface RawMidiNoteEvent {
  timestamp: number; // in seconds
  type: 'noteOn' | 'noteOff' | 'pitchBend';
  note: number;
  velocity: number;
  duration?: number;
}

export function encodeMidiFile(
  tracks: Array<{
    name: string;
    events: RawMidiNoteEvent[];
  }>,
  bpm: number = 120
): Blob {
  const ticksPerQuarterNote = 480;
  const microsecondsPerQuarterNote = Math.round(60000000 / bpm);

  // Helper to encode variable-length quantity (VLQ)
  const writeVarLength = (delta: number): number[] => {
    const bytes: number[] = [];
    let buffer = delta & 0x7f;
    while ((delta >>= 7)) {
      buffer <<= 8;
      buffer |= (delta & 0x7f) | 0x80;
    }
    while (true) {
      bytes.push(buffer & 0xff);
      if (buffer & 0x80) {
        buffer >>= 8;
      } else {
        break;
      }
    }
    return bytes;
  };

  const headerChunk = [
    // 'MThd'
    0x4d, 0x54, 0x68, 0x64,
    // Chunk length = 6
    0x00, 0x00, 0x00, 0x06,
    // Format 1 (multi-track)
    0x00, 0x01,
    // Number of tracks (Track 0 Tempo + instrument tracks)
    0x00, tracks.length + 1,
    // Division (ticks per quarter note)
    (ticksPerQuarterNote >> 8) & 0xff, ticksPerQuarterNote & 0xff,
  ];

  // Track 0: Tempo and Time Signature
  const track0Events: number[] = [];
  // Delta time 0
  track0Events.push(0x00);
  // Time signature: 4/4
  track0Events.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);
  // Delta time 0, Set Tempo
  track0Events.push(0x00);
  track0Events.push(
    0xff,
    0x51,
    0x03,
    (microsecondsPerQuarterNote >> 16) & 0xff,
    (microsecondsPerQuarterNote >> 8) & 0xff,
    microsecondsPerQuarterNote & 0xff
  );
  // End of track meta event
  track0Events.push(0x00, 0xff, 0x2f, 0x00);

  const track0Chunk = [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    (track0Events.length >> 24) & 0xff,
    (track0Events.length >> 16) & 0xff,
    (track0Events.length >> 8) & 0xff,
    track0Events.length & 0xff,
    ...track0Events,
  ];

  const allChunks: number[] = [...headerChunk, ...track0Chunk];

  // Process instrument tracks
  tracks.forEach((track, channelIdx) => {
    const channel = Math.min(channelIdx, 15);
    const sortedEvents: Array<{
      timeSec: number;
      status: number;
      data1: number;
      data2: number;
    }> = [];

    track.events.forEach((ev) => {
      if (ev.type === 'noteOn') {
        sortedEvents.push({
          timeSec: ev.timestamp,
          status: 0x90 | channel,
          data1: Math.min(127, Math.max(0, ev.note)),
          data2: Math.min(127, Math.max(1, Math.round(ev.velocity * 127))),
        });
        if (ev.duration) {
          sortedEvents.push({
            timeSec: ev.timestamp + ev.duration,
            status: 0x80 | channel,
            data1: Math.min(127, Math.max(0, ev.note)),
            data2: 0,
          });
        }
      } else if (ev.type === 'noteOff') {
        sortedEvents.push({
          timeSec: ev.timestamp,
          status: 0x80 | channel,
          data1: Math.min(127, Math.max(0, ev.note)),
          data2: 0,
        });
      }
    });

    sortedEvents.sort((a, b) => a.timeSec - b.timeSec);

    const trackEvents: number[] = [];

    // Track Name Meta Event
    const nameBytes = Array.from(new TextEncoder().encode(track.name || `Track ${channelIdx + 1}`));
    trackEvents.push(0x00, 0xff, 0x03, nameBytes.length, ...nameBytes);

    let lastTick = 0;
    sortedEvents.forEach((ev) => {
      const currentTick = Math.round((ev.timeSec * (bpm / 60)) * ticksPerQuarterNote);
      const deltaTicks = Math.max(0, currentTick - lastTick);
      lastTick = currentTick;

      trackEvents.push(...writeVarLength(deltaTicks));
      trackEvents.push(ev.status, ev.data1, ev.data2);
    });

    // End of Track
    trackEvents.push(0x00, 0xff, 0x2f, 0x00);

    const trackLength = trackEvents.length;
    const trackHeader = [
      0x4d, 0x54, 0x72, 0x6b,
      (trackLength >> 24) & 0xff,
      (trackLength >> 16) & 0xff,
      (trackLength >> 8) & 0xff,
      trackLength & 0xff,
    ];

    allChunks.push(...trackHeader, ...trackEvents);
  });

  const uint8 = new Uint8Array(allChunks);
  return new Blob([uint8], { type: 'audio/midi' });
}
