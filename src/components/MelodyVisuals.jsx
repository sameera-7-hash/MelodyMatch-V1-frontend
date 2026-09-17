import { useEffect, useRef, useState } from "react";

const PITCH_POINTS = "0,108 38,88 72,94 108,54 143,68 180,35 220,53 260,29 302,42 344,20 388,47 432,31 468,52 500,39";

export function PitchContour({ compact = false }) {
  const [activePoint, setActivePoint] = useState(null);
  const [playing, setPlaying] = useState(false);
  const [playhead, setPlayhead] = useState(0);
  const points = PITCH_POINTS.split(" ").map((point) => point.split(",").map(Number));

  useEffect(() => {
    if (!playing) return undefined;
    const timer = window.setInterval(() => setPlayhead((value) => (value + 1) % points.length), 180);
    return () => window.clearInterval(timer);
  }, [playing, points.length]);

  const point = activePoint === null ? points[playhead] : points[activePoint];

  return (
    <div className={`pitch-visual ${compact ? "is-compact" : ""}`} onClick={() => setPlaying((value) => !value)} onMouseLeave={() => setActivePoint(null)}>
      <svg viewBox="0 0 500 130" role="img" aria-label="Pitch contour visualization. Click to play the demo contour." preserveAspectRatio="none">
        <path className="pitch-grid-line" d="M0 26H500M0 65H500M0 104H500" />
        <polyline className="pitch-shadow" points={PITCH_POINTS} />
        <polyline className="pitch-line" points={PITCH_POINTS} />
        <line className="pitch-playhead" x1={point[0]} x2={point[0]} y1="12" y2="112" />
        <circle className="pitch-node" cx={point[0]} cy={point[1]} r="4" />
        {points.map(([x, y], index) => (
          <circle key={index} className="pitch-hit-area" cx={x} cy={y} r="12" onMouseEnter={() => setActivePoint(index)} onFocus={() => setActivePoint(index)} onClick={() => setActivePoint(index)} />
        ))}
      </svg>
      {!compact && activePoint !== null && (
        <div className="pitch-tooltip">
          <span>TIME</span>
          <b>{((point[0] / 500) * 18.4).toFixed(2)} sec</b>
          <span>PITCH / FREQUENCY</span>
          <b>{point[1] < 45 ? "G4" : "E4"} / {point[1] < 45 ? "392" : "330"} Hz</b>
        </div>
      )}
      {!compact && <div className="visual-axis"><span>0s</span><span>9.2s</span><span>18.4s</span></div>}
    </div>
  );
}

export function Spectrum({ compact = false }) {
  const bars = [18, 32, 26, 48, 74, 42, 62, 34, 54, 28, 82, 46, 35, 59, 24, 41, 30, 22, 18, 13];
  const [active, setActive] = useState(null);

  return (
    <div className={`spectrum-visual ${compact ? "is-compact" : ""}`} aria-label="Frequency spectrum visualization" onMouseLeave={() => setActive(null)}>
      {bars.map((height, index) => (
        <i key={index} className={active === index ? "is-active" : ""} style={{ "--bar-height": `${height}%` }} onMouseEnter={() => setActive(index)} onFocus={() => setActive(index)} onClick={() => setActive(index)} tabIndex={0} aria-label={`Spectrum bin ${index}`} />
      ))}
      {!compact && active !== null && (
        <div className="spectrum-tooltip">
          <span>FREQUENCY</span>
          <b>{[130.81, 196, 261.63, 329.63, 392][active % 5].toFixed(2)} Hz</b>
          <span>NOTE / AMPLITUDE</span>
          <b>{["C3", "G3", "C4", "E4", "G4"][active % 5]} / {(bars[active] / 100).toFixed(2)}</b>
        </div>
      )}
    </div>
  );
}

export function MelodyFingerprint() {
  const lines = Array.from({ length: 18 }, (_, index) => {
    const x = 18 + index * 24;
    const height = 22 + ((index * 31) % 62);
    return `M${x} ${104 - height / 2} Q ${x + 12} ${104 - height} ${x + 24} ${104 - height / 2}`;
  });

  return (
    <div className="fingerprint-visual">
      <svg viewBox="0 0 470 130" role="img" aria-label="Abstract melody fingerprint">
        <path className="fingerprint-axis" d="M12 104H458" />
        {lines.map((line, index) => (
          <path key={index} className="fingerprint-line" style={{ "--line-delay": `${index * 35}ms` }} d={line} />
        ))}
        <circle className="fingerprint-dot" cx="236" cy="42" r="5" />
      </svg>
    </div>
  );
}

export function LaboratoryCanvas({ mode }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext("2d");

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const bounds = canvas.getBoundingClientRect();
      canvas.width = bounds.width * ratio;
      canvas.height = bounds.height * ratio;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const ink = getComputedStyle(canvas).getPropertyValue("--ink").trim() || "#4e220f";
      const accent = getComputedStyle(canvas).getPropertyValue("--coral").trim() || "#9d6638";
      context.clearRect(0, 0, width, height);
      context.strokeStyle = `${ink}20`;
      context.lineWidth = 1;
      for (let index = 1; index < 5; index += 1) {
        context.beginPath();
        context.moveTo(0, (height / 5) * index);
        context.lineTo(width, (height / 5) * index);
        context.stroke();
      }

      if (mode === "spectrogram") {
        for (let row = 0; row < 12; row += 1) {
          for (let column = 0; column < 48; column += 1) {
            const value = ((row * 17 + column * 11) % 100) / 100;
            context.fillStyle = `${accent}${Math.round((0.08 + value * 0.24) * 255).toString(16).padStart(2, "0")}`;
            context.fillRect((column * width) / 48, (row * height) / 12, width / 48 - 1, height / 12 - 1);
          }
        }
      } else if (mode === "frequency") {
        for (let column = 0; column < 42; column += 1) {
          const bar = 14 + ((column * 29) % 58);
          context.fillStyle = `${accent}${Math.round((0.32 + bar / 160) * 255).toString(16).padStart(2, "0")}`;
          context.fillRect(column * (width / 42) + 2, height - (bar / 100) * height, width / 42 - 4, (bar / 100) * height);
        }
      } else {
        context.strokeStyle = accent;
        context.lineWidth = 2;
        context.beginPath();
        for (let column = 0; column <= 80; column += 1) {
          const x = (column * width) / 80;
          const wave = mode === "pitch" ? Math.sin(column * 0.19) * 24 + Math.sin(column * 0.06) * 12 : Math.sin(column * 0.58) * 17 + Math.sin(column * 0.13) * 9;
          const y = height / 2 + wave;
          if (column === 0) context.moveTo(x, y);
          else context.lineTo(x, y);
        }
        context.stroke();
      }
    };

    resize();
    draw();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [mode]);

  return <canvas ref={canvasRef} className="lab-canvas" aria-label={`${mode} laboratory visualization`} />;
}
