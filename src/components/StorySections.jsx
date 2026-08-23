import { useEffect, useRef, useState } from "react";
import { Heart, Play, Sparkles } from "lucide-react";
import { LaboratoryCanvas, MelodyFingerprint, PitchContour, Spectrum } from "./MelodyVisuals";

const analysisStats = [
  ["Duration", "18.4 sec", "DEMO"],
  ["Pitch range", "184–392 Hz", "DEMO"],
  ["Detected notes", "17", "DEMO"],
  ["Tempo", "94 BPM", "DEMO"],
];

const stages = [
  ["RAW AUDIO", "TIME DOMAIN", "A recording is captured as a changing signal over time."],
  ["WAVEFORM", "SIGNAL SHAPE", "We look at the amplitude and rhythm of your hum."],
  ["FREQUENCY", "FOURIER TRANSFORM", "The signal is separated into its component frequencies."],
  ["PITCH", "PITCH EXTRACTION", "The strongest musical frequency becomes a pitch trace."],
  ["MELODY", "MELODY CONTOUR", "Notes are simplified into a recognizable shape."],
  ["MATCH", "SIMILARITY MATCHING", "That shape is compared with the song library."],
];

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setVisible(true);
        observer.disconnect();
      }
    }, { threshold: 0.12 });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return [ref, visible];
}

export function ScrollSection({ id, eyebrow, title, children, className = "" }) {
  const [ref, visible] = useReveal();
  return <section ref={ref} id={id} className={`story-section ${visible ? "is-visible" : ""} ${className}`}><div className="section-heading story-heading"><div><p className="eyebrow">{eyebrow}</p><h2>{title}</h2></div></div>{children}</section>;
}

export function MelodyAnalysis() {
  return (
    <ScrollSection id="your-melody" eyebrow="02 / your melody" title="Your melody.">
      <div className="analysis-layout">
        <div className="analysis-copy">
          <p>Before we find the song, we listen to the shape of your tune.</p>
          <div className="analysis-stats">
            {analysisStats.map(([label, value, tag]) => (
              <div key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
                <small className="demo-tag">{tag}</small>
              </div>
            ))}
          </div>
        </div>
        <div className="analysis-visual">
          <div className="visual-label">PITCH CONTOUR / TRACE 01</div>
          <PitchContour />
        </div>
      </div>
    </ScrollSection>
  );
}

export function MelodyPipeline() {
  return <ScrollSection id="inside-melody" eyebrow="03 / inside the melody" title="Inside the melody." className="pipeline-section"><p className="section-lede">A small tour through the signal chain behind a song search.</p><div className="pipeline-grid">{stages.map(([name, label, description], index) => <article className="pipeline-stage" key={name}><span className="stage-index">0{index + 1}</span><div className="stage-visual">{index === 0 && <PitchContour compact />}{index === 1 && <Spectrum compact />}{index === 2 && <Spectrum compact />}{index === 3 && <PitchContour compact />}{index === 4 && <div className="note-sequence"><i /><i /><i /><i /><i /></div>}{index === 5 && <div className="match-traces"><span /><span /></div>}</div><p className="stage-label">{label}</p><h3>{name}</h3><p>{description}</p><span className="stage-detail">{index === 5 ? <>MELODY ALIGNMENT<br />PITCH SIMILARITY 91% / CONTOUR SIMILARITY 94%<br />DTW DISTANCE 0.173</> : ["Amplitude over time", "Signal shape preserved", "Peaks isolate harmonics", "Notes become a trace", "Shape survives simplification"][index]}</span></article>)}</div></ScrollSection>;
}

function MatchDetails() {
  return <div className="match-details"><div><p className="eyebrow">Why this match?</p><p className="match-explanation">Your melody follows a similar upward and downward pitch pattern.</p></div><div className="detail-metrics"><div><span>Pitch similarity</span><b>91%</b></div><div><span>Melody contour</span><b>94%</b></div><div><span>Tempo similarity</span><b>87%</b></div></div></div>;
}

export function MatchResults({ matches, reasoningFeatures, aiInsights, onSelect }) {
  const [expanded, setExpanded] = useState(null);
  const visibleMatches = matches.length ? matches : [
    { id: "demo-1", title: "Bekhayali", artist: "Sachet Tandon", confidence: 92.4, youtube_url: "https://www.youtube.com/watch?v=RqiQmj4hlzM" },
    { id: "demo-2", title: "Mile Ho Tum — Reprise", artist: "Neha Kakkar", confidence: 88.7 },
    { id: "demo-3", title: "Tere Sang Yaara", artist: "Atif Aslam", confidence: 84.9 },
    { id: "demo-4", title: "Tera Ban Jaunga", artist: "Akhil Sachdeva", confidence: 81.6 },
  ];

  return (
    <ScrollSection id="matches" eyebrow="04 / match results" title="Could this be it?">
      <div className="signal-card">
        <div>
          <span className="results-kicker">Your strongest signal</span>
          <strong>{visibleMatches[0].title}</strong>
          <span>{visibleMatches[0].artist}</span>
        </div>
        <div className="signal-score"><small>similarity</small><b>{Math.min(100, Number(visibleMatches[0].confidence) || 0).toFixed(1)}%</b></div>
      </div>
      <div className="match-list premium-list">
        {visibleMatches.slice(0, 5).map((song, index) => {
          const score = Math.min(100, Math.max(0, Number(song.confidence) || 0));
          const isOpen = expanded === (song.id || index);
          return (
            <article className={`premium-match ${isOpen ? "is-expanded" : ""}`} key={song.id || `${song.title}-${index}`}>
              <button className="match-main" type="button" onClick={() => { setExpanded(isOpen ? null : (song.id || index)); onSelect?.(song); }} aria-expanded={isOpen}>
                <span className="rank">{String(index + 1).padStart(2, "0")}</span>
                <span className={`cover-art cover-${index % 4}`}><span>MM</span></span>
                <span className="match-info">
                  <strong>{song.title || "Untitled track"}</strong>
                  <span>{song.artist || "Unknown artist"}</span>
                  <i><em style={{ width: `${score}%` }} /></i>
                  <small>{score.toFixed(1)}% similarity</small>
                </span>
                <Play size={16} className="row-play" />
              </button>
              <button className="favorite-button" type="button" aria-label={`Favorite ${song.title}`}>
                <Heart size={16} />
              </button>
              {isOpen && <MatchDetails />}
            </article>
          );
        })}
      </div>
      {reasoningFeatures?.length > 0 && <div className="reasoning-note"><Sparkles size={17} /><span>Detailed signal analysis is available below in the MelodyMatch patch bay.</span></div>}
      {aiInsights && <div className="insight-block"><div><p className="eyebrow">A little extra context</p><p>{aiInsights}</p></div></div>}
    </ScrollSection>
  );
}

export function MelodyDNA() {
  return (
    <ScrollSection id="melody-dna" eyebrow="05 / melody dna" title="Every melody has a shape.">
      <div className="dna-layout">
        <div className="dna-copy">
          <p>A fingerprint for the parts of a tune that make it feel familiar.</p>
          <dl>
            <div><dt>Pitch range</dt><dd>184–392 Hz <small className="demo-tag">DEMO</small></dd></div>
            <div><dt>Melodic movement</dt><dd>Rising / falling</dd></div>
            <div><dt>Note density</dt><dd>17 notes <small className="demo-tag">DEMO</small></dd></div>
            <div><dt>Tempo</dt><dd>94 BPM <small className="demo-tag">DEMO</small></dd></div>
          </dl>
        </div>
        <MelodyFingerprint />
      </div>
    </ScrollSection>
  );
}

export function MelodyLab() {
  const [mode, setMode] = useState("waveform");
  const [labMode, setLabMode] = useState(() => {
    const saved = localStorage.getItem("melodymatch-lab-mode");
    return saved ? saved === "true" : false;
  });

  useEffect(() => {
    localStorage.setItem("melodymatch-lab-mode", String(labMode));
  }, [labMode]);

  const handleTabKey = (event, index, keys) => {
    const { key } = event;
    if (key !== "ArrowRight" && key !== "ArrowLeft") return;
    event.preventDefault();
    const delta = key === "ArrowRight" ? 1 : -1;
    const nextIndex = (index + delta + keys.length) % keys.length;
    const target = keys[nextIndex];
    document.getElementById(`tab-${target}`)?.focus();
    setMode(target);
  };

  const tabs = [
    ["waveform", "Waveform"],
    ["frequency", "Frequency spectrum"],
    ["spectrogram", "Spectrogram"],
    ["pitch", "Pitch contour"],
  ];

  return (
    <ScrollSection id="melody-lab" eyebrow="06 / melody lab" title="Melody Lab">
      <p className="section-lede">See what your sound looks like beneath the surface.</p>
      <div className="lab-controls">
        <div className="lab-tabs" role="tablist" aria-label="Melody lab visualizations">
          {tabs.map(([key, label], index) => (
            <button
              id={`tab-${key}`}
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              tabIndex={mode === key ? 0 : -1}
              className={mode === key ? "is-active" : ""}
              onClick={() => setMode(key)}
              onKeyDown={(event) => handleTabKey(event, index, tabs.map(([value]) => value))}
            >
              {label}
            </button>
          ))}
        </div>
        <button className={`lab-mode-toggle ${labMode ? "is-active" : ""}`} type="button" onClick={() => setLabMode((value) => !value)} aria-pressed={labMode}>
          [ LAB MODE: {labMode ? "ON" : "OFF"} ]
        </button>
      </div>
      <div className="lab-frame">
        <div className="visual-label">LIVE INSTRUMENT / {mode.toUpperCase()}</div>
        <LaboratoryCanvas mode={mode} />
        {labMode && (
          <div className="lab-readout">
            <span>SAMPLE RATE <b>22050 Hz</b> <small className="demo-tag">DEMO</small></span>
            <span>FFT SIZE <b>2048</b> <small className="demo-tag">DEMO</small></span>
            <span>HOP SIZE <b>512</b> <small className="demo-tag">DEMO</small></span>
            <span>WINDOW <b>HANN</b> <small className="demo-tag">DEMO</small></span>
            <span>PITCH <b>DETECTED</b></span>
            <span>DTW <b>READY</b></span>
          </div>
        )}
      </div>
    </ScrollSection>
  );
}

export function MusicTaste() {
  return <ScrollSection id="taste" eyebrow="07 / your musical taste" title="Your melody taste." className="taste-section"><div className="taste-grid"><div><span>Most searched</span><strong>Bollywood <small>42%</small></strong><strong>Indie <small>21%</small></strong><strong>Pop <small>18%</small></strong></div><div><span>Average humming tempo</span><strong>94 <small>BPM</small></strong></div><div><span>Most common pitch range</span><strong>A3 — E5</strong></div></div></ScrollSection>;
}
