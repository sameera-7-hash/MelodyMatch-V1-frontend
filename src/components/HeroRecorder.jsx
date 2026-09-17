import { ArrowUpRight, Headphones, LoaderCircle, Mic, RotateCcw, Sparkles, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { autoCorrelate, frequencyToNote } from "../lib/pitchDetection";

const PROCESSING_STEPS = ["ANALYZING SIGNAL", "EXTRACTING PITCH", "BUILDING MELODY", "COMPARING PATTERNS", "RANKING MATCHES"];
const STEP_DURATION_MS = 850;

function LiveWaveform({ analyserRef, canvasRef, isRecording, audioUrl, audioRef }) {
  const historyRef = useRef([]);
  const smoothRef = useRef([]);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return undefined;
    const context = canvas.getContext("2d"); const data = new Uint8Array(analyserRef.current?.frequencyBinCount || 64); let frame;
    const resize = () => { const ratio = window.devicePixelRatio || 1; const bounds = canvas.getBoundingClientRect(); canvas.width = bounds.width * ratio; canvas.height = bounds.height * ratio; context.setTransform(ratio, 0, 0, ratio, 0, 0); };
    const draw = () => { const { width, height } = canvas.getBoundingClientRect(); context.clearRect(0, 0, width, height); const styles = getComputedStyle(canvas); const ink = styles.getPropertyValue("--ink").trim() || "#4e220f"; const accent = styles.getPropertyValue("--coral").trim() || "#9d6638"; context.strokeStyle = `${ink}24`; context.beginPath(); context.moveTo(0, height / 2); context.lineTo(width, height / 2); context.stroke(); if (isRecording && analyserRef.current) { analyserRef.current.getByteFrequencyData(data); historyRef.current.push(Math.max(.05, data.reduce((sum, value) => sum + value, 0) / data.length / 255)); if (historyRef.current.length > 64) historyRef.current.shift(); } smoothRef.current = Array.from({ length: 64 }, (_, index) => { const previous = smoothRef.current[index] || .05; const target = historyRef.current[index] || .05; return previous + (target - previous) * .16; }); const gradient = context.createLinearGradient(0, 0, width, 0); gradient.addColorStop(0, accent); gradient.addColorStop(1, ink); smoothRef.current.forEach((value, index) => { const barWidth = width / 64; const barHeight = Math.max(4, value * height * .9); context.fillStyle = gradient; context.fillRect(index * barWidth + 1, (height - barHeight) / 2, Math.max(2, barWidth - 3), barHeight); }); const audio = audioRef.current; if (audio?.duration && audio.currentTime > 0) { const x = audio.currentTime / audio.duration * width; context.strokeStyle = ink; context.lineWidth = 2; context.beginPath(); context.moveTo(x, 8); context.lineTo(x, height - 8); context.stroke(); } frame = requestAnimationFrame(draw); };
    resize(); draw(); window.addEventListener("resize", resize); return () => { cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, [analyserRef, audioRef, audioUrl, canvasRef, isRecording]);
  return <canvas ref={canvasRef} className="waveform-canvas" aria-label={isRecording ? "Live recording waveform" : "Recorded melody waveform"} />;
}

function usePitchDetection(analyserRef, isRecording) {
  const [pitch, setPitch] = useState(null);
  const frameRef = useRef(null);
  useEffect(() => {
    if (!isRecording || !analyserRef.current) { setPitch(null); return undefined; }
    const analyser = analyserRef.current;
    const buffer = new Float32Array(analyser.fftSize);
    const tick = () => {
      analyser.getFloatTimeDomainData(buffer);
      const freq = autoCorrelate(buffer, analyser.context.sampleRate);
      if (freq !== -1 && freq > 70 && freq < 1200) {
        const note = frequencyToNote(freq);
        setPitch({ hz: Math.round(freq), note: note?.name, cents: note?.cents ?? 0 });
      }
      frameRef.current = requestAnimationFrame(tick);
    };
    frameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameRef.current);
  }, [analyserRef, isRecording]);
  return pitch;
}

// Plays a short synthesized tick — no audio file needed, just a brief
// sine blip through the Web Audio API each time a processing step completes.
function useStepTick() {
  const ctxRef = useRef(null);
  return (pitchHz = 880) => {
    try {
      const ctx = ctxRef.current || (ctxRef.current = new (window.AudioContext || window.webkitAudioContext)());
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = pitchHz;
      gain.gain.setValueAtTime(0.001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } catch {
      // Web Audio can throw if the tab is muted/blocked — fine to skip silently
    }
  };
}

// Advances one step at a time while isLoading is true. Holds on the final
// step (rather than looping or finishing early) if the real request takes
// longer than the animation — so it never claims to be "done" before the
// backend actually responds.
function useProcessingSteps(isLoading) {
  const [index, setIndex] = useState(-1);
  const playTick = useStepTick();

  useEffect(() => {
    if (!isLoading) { setIndex(-1); return undefined; }
    setIndex(0);
    const timer = window.setInterval(() => {
      setIndex((current) => (current < PROCESSING_STEPS.length - 1 ? current + 1 : current));
    }, STEP_DURATION_MS);
    return () => window.clearInterval(timer);
  }, [isLoading]);

  useEffect(() => {
    if (index >= 0) playTick(700 + index * 60); // pitch rises slightly each step
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  return index;
}

function ProcessingSteps({ isLoading }) {
  const activeIndex = useProcessingSteps(isLoading);
  if (!isLoading) return null;

  return (
    <div className="processing-steps" aria-live="polite">
      {PROCESSING_STEPS.map((label, index) => {
        const status = index < activeIndex ? "done" : index === activeIndex ? "active" : "pending";
        return (
          <span key={label} className={`step-card step-${status}`} style={{ "--step-delay": `${index * 40}ms` }}>
            {label} {status === "done" ? "✓" : status === "active" ? "◌" : "○"}
          </span>
        );
      })}
    </div>
  );
}

function BestMatchInline({ matches }) {
  if (!matches?.length) return null;
  const top = matches[0];
  const confidence = top.confidence ?? top.similarity ?? top.score;
  return (
    <div className="best-match-inline">
      <span>YOUR STRONGEST SIGNAL</span>
      <div>
        <strong>{top.title}</strong>
        <em>{top.artist}</em>
      </div>
      <b>{typeof confidence === "number" ? `${confidence.toFixed(1)}%` : confidence}</b>
    </div>
  );
}

export default function HeroRecorder({ isRecording, isLoading, audioBlob, audioUrl, recordingSeconds, inputVolume, maxDuration, matches, analyserRef, canvasRef, audioRef, onStart, onStop, onSearch, onReplay }) {
  const state = isRecording ? "LISTENING..." : isLoading ? "ANALYZING MELODY..." : audioBlob ? "MELODY CAPTURED" : "READY TO SEARCH";
  const seconds = `${Math.floor(recordingSeconds / 60).toString().padStart(2, "0")}:${Math.floor(recordingSeconds % 60).toString().padStart(2, "0")}`;
  const pitch = usePitchDetection(analyserRef, isRecording);
  const needleOffset = pitch ? Math.max(-12, Math.min(12, (pitch.cents / 50) * 12)) : 0;

  return <section className={`recorder-panel ${isRecording ? "is-recording" : ""} ${isLoading ? "is-processing" : ""}`} aria-label="Melody recorder"><div className="panel-topline"><span>{state}</span><span className="duration">{isRecording ? `${seconds} / 00:${String(maxDuration).padStart(2, "0")}` : `maximum ${maxDuration} sec`}</span></div><div className="waveform-shell"><LiveWaveform analyserRef={analyserRef} canvasRef={canvasRef} isRecording={isRecording} audioUrl={audioUrl} audioRef={audioRef} /></div><div className="pitch-readout"><span>CURRENT PITCH</span><strong>{isRecording && pitch ? `${pitch.hz} Hz` : isRecording ? "listening..." : "—"}</strong><b>{isRecording && pitch ? pitch.note : "—"}</b><i style={{ transform: `translateY(${needleOffset}px)` }} /></div><div className="recorder-action"><div className="record-button-wrap" style={{ "--volume": inputVolume, "--countdown": `${(recordingSeconds / maxDuration) * 100}%` }}><span className="countdown-ring" /><button className={`record-button ${isRecording ? "stop" : ""}`} onClick={isRecording ? onStop : onStart} aria-label={isRecording ? "Stop recording" : "Start recording"}>{isRecording ? <Square size={21} fill="currentColor" /> : <Mic size={24} />}</button></div><div><strong>{state}</strong><span>{isRecording ? "Keep going, we are listening" : audioBlob ? "Replay it, then search" : "Hum, whistle, or sing the bit you remember"}</span></div></div>{audioUrl && !isRecording && <div className="sample-preview"><audio ref={audioRef} src={audioUrl} controls /><button className="icon-button" onClick={onReplay} aria-label="Record again"><RotateCcw size={16} /></button></div>}{!isRecording && audioBlob && <button className="search-button" onClick={onSearch} disabled={isLoading}>{isLoading ? <><LoaderCircle className="spin" size={18} /> ANALYZING MELODY...</> : <><Sparkles size={18} /> Search melody <ArrowUpRight size={17} /></>}</button>}{isLoading && <div className="matching-skeleton" aria-live="polite"><span className="skeleton-art" /><span className="skeleton-lines"><i /><i /><i /></span><ProcessingSteps isLoading={isLoading} /></div>}{!isLoading && <BestMatchInline matches={matches} />}<p className="privacy-note"><Headphones size={13} /> Your recording stays yours.</p></section>;
}
