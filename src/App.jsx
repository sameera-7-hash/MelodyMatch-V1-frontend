/*
  Audit: design tokens from the current system are:
  --ink: #4E220F
  --paper: #F7F1DE
  --coral: #9D6638
  --panel: #fffaf0
  --line: #B0BA99
  Existing component inventory: App.jsx (shell & state), HeroRecorder.jsx, MelodyNav.jsx, MelodyVisuals.jsx, StorySections.jsx, MatchReasoningBoard.jsx, plus the lib/data seam in melodyApi.js.
  Existing animation primitives: CSS keyframes/transitions in App.css and a few IntersectionObserver reveals in StorySections.jsx. No second animation library is in use; the interaction pass should reuse that pattern.
  Existing mock data: the waveform, pitch contour, and result lists already live in StorySections.jsx and MelodyVisuals.jsx; these shapes should be reused rather than replaced.
  State pattern: lift only the recorder/search state in App.jsx; feature-level UI state stays local to each component.
  Breakpoints in use: sm/md/lg are not in Tailwind here, but the app responds at ~760px and 800px widths using the existing CSS media queries.
*/

import { useEffect, useRef, useState } from "react";
import { CircleHelp, Music2 } from "lucide-react";
import HeroRecorder from "./components/HeroRecorder";
import MelodyNav from "./components/MelodyNav";
import MatchReasoningBoard from "./components/MatchReasoningBoard";
import { MatchResults, MelodyAnalysis, MelodyDNA, MelodyLab, MelodyPipeline, MusicTaste } from "./components/StorySections";
import { searchMelody } from "./lib/melodyApi";

const RECORDING_LIMIT = 20;

export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [matches, setMatches] = useState([]);
  const [aiInsights, setAiInsights] = useState("");
  const [error, setError] = useState("");
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [inputVolume, setInputVolume] = useState(0);
  const [selectedSong, setSelectedSong] = useState(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const canvasRef = useRef(null);
  const audioRef = useRef(null);
  const volumeFrameRef = useRef(null);

  const startRecording = async () => {
    setError(""); setMatches([]); setAiInsights(""); setAudioBlob(null); setAudioUrl(""); setRecordingSeconds(0); setInputVolume(0); audioChunksRef.current = [];
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioContext = new AudioContext(); const analyser = audioContext.createAnalyser(); analyser.fftSize = 128; audioContext.createMediaStreamSource(stream).connect(analyser); audioContextRef.current = audioContext; analyserRef.current = analyser;
      const recorder = new MediaRecorder(stream); mediaRecorderRef.current = recorder;
      recorder.ondataavailable = (event) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
      recorder.onstop = () => { const blob = new Blob(audioChunksRef.current, { type: "audio/wav" }); setAudioBlob(blob); setAudioUrl(URL.createObjectURL(blob)); };
      recorder.start(); setIsRecording(true);
    } catch { setError("Microphone permission denied or unavailable."); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state !== "recording") return;
    mediaRecorderRef.current.stop(); mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop()); setIsRecording(false); setInputVolume(0);
  };

  useEffect(() => {
    if (!isRecording) return undefined;
    const startedAt = Date.now();
    const timer = window.setInterval(() => { const seconds = Math.min(RECORDING_LIMIT, (Date.now() - startedAt) / 1000); setRecordingSeconds(seconds); if (seconds >= RECORDING_LIMIT) stopRecording(); }, 100);
    return () => window.clearInterval(timer);
  }, [isRecording]);

  useEffect(() => {
    if (!isRecording || !analyserRef.current) return undefined;
    const data = new Uint8Array(analyserRef.current.frequencyBinCount); let last = 0;
    const update = () => { analyserRef.current?.getByteFrequencyData(data); const volume = data.reduce((sum, value) => sum + value, 0) / data.length / 255; last += (volume - last) * .22; setInputVolume(last); volumeFrameRef.current = requestAnimationFrame(update); };
    update(); return () => cancelAnimationFrame(volumeFrameRef.current);
  }, [isRecording]);

  useEffect(() => () => { if (audioUrl) URL.revokeObjectURL(audioUrl); audioContextRef.current?.close(); }, [audioUrl]);

  const submitHumming = async () => {
    if (!audioBlob) return;
    setIsLoading(true); setError("");
    try { const data = await searchMelody(audioBlob); setMatches(data.results || []); setAiInsights(data.ai_insights || ""); } catch { setError("Failed to connect to backend engine. Please try again."); } finally { setIsLoading(false); }
  };

  const returnedFeatures = matches[0]?.features || matches[0]?.feature_scores || [];
  const reasoningFeatures = Array.isArray(returnedFeatures) ? returnedFeatures : Object.entries(returnedFeatures).map(([id, value]) => ({ id, score: value }));

  return <div className={`app-shell ${isDarkMode ? "theme-dark" : "theme-light"}`}>
    <a className="skip-link" href="#main-content">Skip to content</a><MelodyNav onToggleTheme={() => setIsDarkMode((current) => !current)} />
    <nav className="topbar"><a className="wordmark" href="#discover" aria-label="MelodyMatch home"><span className="wordmark-mark"><Music2 size={17} /></span><span>melody<span>match</span></span></a><div className="topbar-meta"><span className="live-dot" /> music recognition lab <CircleHelp size={15} /></div></nav>
    <main id="main-content" className="page-content">
      <section id="discover" className="discover-hero"><div className="intro-block"><p className="eyebrow">01 / discover</p><h1>Find the song<br /><em>in your head.</em></h1><p className="intro-copy">Hum it. Whistle it. Sing the bit you remember.<br />We will do the digging.</p><div className="hero-note"><span>FIELD NOTE 001</span><p>Every song leaves a shape behind.</p></div></div><HeroRecorder maxDuration={RECORDING_LIMIT} isRecording={isRecording} isLoading={isLoading} audioBlob={audioBlob} audioUrl={audioUrl} recordingSeconds={recordingSeconds} inputVolume={inputVolume} analyserRef={analyserRef} canvasRef={canvasRef} audioRef={audioRef} onStart={startRecording} onStop={stopRecording} onSearch={submitHumming} onReplay={startRecording} /></section>
      {error && <p className="error-message">{error}</p>}
      <MelodyAnalysis />
      <MelodyPipeline />
      <MatchResults matches={matches} reasoningFeatures={reasoningFeatures} aiInsights={aiInsights} onSelect={setSelectedSong} />
      {reasoningFeatures.length > 0 && <MatchReasoningBoard features={reasoningFeatures} />}
      <MelodyDNA selectedSong={selectedSong} />
      <MelodyLab />
      <MusicTaste />
    </main>
    <footer><span>Made for the songs that got away.</span><span>MM / 2026</span></footer>
  </div>;
}
