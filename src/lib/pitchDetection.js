// lib/pitchDetection.js
// Real autocorrelation-based pitch detection — finds the repeating cycle
// length in the raw waveform and converts it to Hz, then maps Hz to the
// nearest musical note. Standard technique for real-time single-note
// (monophonic) pitch tracking, e.g. humming one note at a time.

const NOTE_NAMES = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

export function frequencyToNote(freq) {
  if (!freq || freq <= 0) return null;
  const midi = 12 * Math.log2(freq / 440) + 69; // A4 = 440Hz = MIDI note 69
  const rounded = Math.round(midi);
  const cents = Math.round((midi - rounded) * 100); // how sharp/flat, in cents
  const name = NOTE_NAMES[((rounded % 12) + 12) % 12];
  const octave = Math.floor(rounded / 12) - 1;
  return { name: `${name}${octave}`, cents, midi: rounded };
}

export function autoCorrelate(buffer, sampleRate) {
  const SIZE = buffer.length;

  let rms = 0;
  for (let i = 0; i < SIZE; i++) rms += buffer[i] * buffer[i];
  rms = Math.sqrt(rms / SIZE);
  if (rms < 0.01) return -1; // too quiet to trust — avoids noise-driven jitter

  let r1 = 0;
  let r2 = SIZE - 1;
  const threshold = 0.2;
  for (let i = 0; i < SIZE / 2; i++) {
    if (Math.abs(buffer[i]) < threshold) { r1 = i; break; }
  }
  for (let i = 1; i < SIZE / 2; i++) {
    if (Math.abs(buffer[SIZE - i]) < threshold) { r2 = SIZE - i; break; }
  }
  const trimmed = buffer.slice(r1, r2);
  const newSize = trimmed.length;

  const correlations = new Array(newSize).fill(0);
  for (let lag = 0; lag < newSize; lag++) {
    let sum = 0;
    for (let i = 0; i < newSize - lag; i++) sum += trimmed[i] * trimmed[i + lag];
    correlations[lag] = sum;
  }

  let d = 0;
  while (d < newSize - 1 && correlations[d] > correlations[d + 1]) d++;

  let maxVal = -1;
  let maxPos = -1;
  for (let i = d; i < newSize; i++) {
    if (correlations[i] > maxVal) { maxVal = correlations[i]; maxPos = i; }
  }
  if (maxPos <= 0) return -1;

  const x1 = correlations[maxPos - 1] || 0;
  const x2 = correlations[maxPos];
  const x3 = correlations[maxPos + 1] || 0;
  const a = (x1 + x3 - 2 * x2) / 2;
  const b = (x3 - x1) / 2;
  const shift = a ? -b / (2 * a) : 0;

  const period = maxPos + shift;
  return period > 0 ? sampleRate / period : -1;
}
