const demoWaveform = Array.from({ length: 48 }, (_, index) => ({
  t: index / 48,
  amplitude: 0.18 + Math.sin(index * 0.42) * 0.12 + Math.cos(index * 0.14) * 0.15,
}));

const demoPitchPoints = [
  { t: 0.0, frequencyHz: 196.0, note: "G3", confidence: 0.82 },
  { t: 0.8, frequencyHz: 220.0, note: "A3", confidence: 0.88 },
  { t: 1.7, frequencyHz: 246.94, note: "B3", confidence: 0.91 },
  { t: 2.5, frequencyHz: 293.66, note: "D4", confidence: 0.87 },
  { t: 3.3, frequencyHz: 329.63, note: "E4", confidence: 0.85 },
  { t: 4.2, frequencyHz: 392.0, note: "G4", confidence: 0.93 },
  { t: 5.1, frequencyHz: 349.23, note: "F4", confidence: 0.9 },
  { t: 6.1, frequencyHz: 293.66, note: "D4", confidence: 0.86 },
  { t: 7.0, frequencyHz: 261.63, note: "C4", confidence: 0.88 },
  { t: 8.2, frequencyHz: 293.66, note: "D4", confidence: 0.9 },
  { t: 9.3, frequencyHz: 329.63, note: "E4", confidence: 0.89 },
  { t: 10.4, frequencyHz: 392.0, note: "G4", confidence: 0.94 },
];

const demoSpectrum = [
  { frequencyHz: 82.41, amplitude: 0.22 },
  { frequencyHz: 130.81, amplitude: 0.3 },
  { frequencyHz: 196.0, amplitude: 0.64 },
  { frequencyHz: 246.94, amplitude: 0.52 },
  { frequencyHz: 293.66, amplitude: 0.37 },
  { frequencyHz: 392.0, amplitude: 0.71 },
  { frequencyHz: 523.25, amplitude: 0.46 },
  { frequencyHz: 659.25, amplitude: 0.29 },
];

const demoMatches = [
  {
    id: "demo-1",
    title: "Bekhayali",
    artist: "Sachet Tandon",
    score: { pitchSimilarity: 0.91, contourSimilarity: 0.94, tempoSimilarity: 0.87, dtwDistance: 0.173, explanation: "Your melody follows a similar upward and downward pitch pattern." },
    contourPreview: demoPitchPoints,
  },
  {
    id: "demo-2",
    title: "Mile Ho Tum — Reprise",
    artist: "Neha Kakkar",
    score: { pitchSimilarity: 0.89, contourSimilarity: 0.91, tempoSimilarity: 0.82, dtwDistance: 0.214, explanation: "The rise and fall in your lyric phrase aligns closely with the chorus contour." },
    contourPreview: demoPitchPoints.slice(0, 9),
  },
  {
    id: "demo-3",
    title: "Tere Sang Yaara",
    artist: "Atif Aslam",
    score: { pitchSimilarity: 0.85, contourSimilarity: 0.88, tempoSimilarity: 0.83, dtwDistance: 0.233, explanation: "Your phrase keeps the same warm, forward-moving melodic arc." },
    contourPreview: demoPitchPoints.slice(1, 10),
  },
];

export async function recordAudio() {
  await new Promise((resolve) => setTimeout(resolve, 250));
  return new Blob(["demo-audio"], { type: "audio/wav" });
}

export async function analyzeAudio() {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return {
    waveform: demoWaveform,
    spectrum: demoSpectrum,
    pitchContour: {
      points: demoPitchPoints,
      durationSec: demoPitchPoints[demoPitchPoints.length - 1].t + 1,
    },
  };
}

export async function getPitchContour() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    points: demoPitchPoints,
    durationSec: 10.5,
  };
}

export async function getFrequencySpectrum() {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return demoSpectrum;
}

export async function searchMelody() {
  return [
    { status: "ANALYZING SIGNAL" },
    { status: "EXTRACTING PITCH" },
    { status: "BUILDING MELODY" },
    { status: "COMPARING PATTERNS" },
    { status: "RANKING MATCHES" },
  ];
}

export async function getMatchResults() {
  await new Promise((resolve) => setTimeout(resolve, 350));
  return demoMatches;
}
