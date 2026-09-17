import React, { useRef, useState, useCallback } from "react";

// MelodyMatch — Match reasoning board (studio console vibe)
// Same interaction model as the corkboard version — draggable evidence
// nodes tethered to a center point — but restyled as a mixing desk:
// your hum is the turntable in the middle, each audio feature is a
// channel strip patched in by a cable, and overall confidence reads
// off an analog-style VU dial instead of a rubber stamp.

const FEATURES = [
  {
    id: "pitch",
    label: "PITCH CONTOUR",
    score: 94,
    note: "Your rising-falling shape lines up with the chorus almost exactly.",
    angle: -140,
  },
  {
    id: "rhythm",
    label: "RHYTHM PATTERN",
    score: 88,
    note: "Note timing matches within a few hundred ms across the phrase.",
    angle: -40,
  },
  {
    id: "tempo",
    label: "TEMPO",
    score: 76,
    note: "You hummed a little faster — 128 bpm vs the original's 118.",
    angle: 40,
  },
  {
    id: "interval",
    label: "INTERVAL SHAPE",
    score: 65,
    note: "Direction of each jump matches; exact sizes drift toward the end.",
    angle: 140,
  },
];

const RADIUS = 200;
const CENTER = { x: 340, y: 270 };
const CARD_W = 200;
const CARD_H = 100;

const ACCENT = "#FF6A45";
const BG = "#141110";
const CARD_BG = "#1E1A17";
const BORDER = "#332D28";
const TEXT_MUTED = "#8A8178";
const TEXT = "#F3EEE6";

function initialPositions() {
  const pos = {};
  FEATURES.forEach((f) => {
    const rad = (f.angle * Math.PI) / 180;
    pos[f.id] = {
      x: CENTER.x + RADIUS * Math.cos(rad) - CARD_W / 2,
      y: CENTER.y + RADIUS * Math.sin(rad) - CARD_H / 2,
    };
  });
  return pos;
}

function VuMeter({ score }) {
  const segments = 10;
  const filled = Math.round((score / 100) * segments);
  return (
    <div style={{ display: "flex", gap: 2, marginTop: 8 }}>
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: 5,
            background: i < filled ? ACCENT : "#3A342F",
            borderRadius: 1,
          }}
        />
      ))}
    </div>
  );
}

function Turntable() {
  return (
    <div
      style={{
        position: "relative",
        width: 150,
        height: 150,
        borderRadius: "50%",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "50%",
          background:
            "repeating-radial-gradient(circle, #0B0A09 0px, #0B0A09 3px, #201B17 3px, #201B17 6px)",
          animation: "mm-spin 6s linear infinite",
          border: `1px solid ${BORDER}`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: "50%",
            background: BG,
            border: `2px solid ${ACCENT}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT }} />
        </div>
      </div>
      <div
        style={{
          position: "absolute",
          bottom: -26,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "monospace",
          fontSize: 10,
          letterSpacing: "0.06em",
          color: TEXT_MUTED,
          whiteSpace: "nowrap",
        }}
      >
        YOUR HUM
      </div>
      <style>{`@keyframes mm-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

function ConfidenceDial({ value }) {
  const angle = -90 + (value / 100) * 180;
  return (
    <div style={{ position: "relative", width: 128, height: 84 }}>
      <svg width="128" height="84" viewBox="0 0 128 84">
        <path
          d="M 10 74 A 54 54 0 0 1 118 74"
          fill="none"
          stroke="#3A342F"
          strokeWidth="8"
          strokeLinecap="round"
        />
        <path
          d="M 10 74 A 54 54 0 0 1 118 74"
          fill="none"
          stroke={ACCENT}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * 170} 170`}
        />
        <line
          x1="64"
          y1="74"
          x2={64 + 40 * Math.cos((angle * Math.PI) / 180)}
          y2={74 + 40 * Math.sin((angle * Math.PI) / 180)}
          stroke={TEXT}
          strokeWidth="2"
        />
        <circle cx="64" cy="74" r="4" fill={TEXT} />
      </svg>
      <div
        style={{
          position: "absolute",
          top: 30,
          left: 0,
          right: 0,
          textAlign: "center",
          fontFamily: "monospace",
        }}
      >
        <div style={{ fontSize: 20, fontWeight: 700, color: ACCENT }}>{value}%</div>
        <div style={{ fontSize: 9, color: TEXT_MUTED, letterSpacing: "0.06em" }}>MATCH</div>
      </div>
    </div>
  );
}

export default function MatchReasoningBoard() {
  const [positions, setPositions] = useState(initialPositions);
  const dragRef = useRef(null);
  const boardRef = useRef(null);

  const overall = Math.round(
    FEATURES.reduce((s, f) => s + f.score, 0) / FEATURES.length
  );

  const onPointerDown = useCallback(
    (e, id) => {
      const rect = boardRef.current.getBoundingClientRect();
      const pos = positions[id];
      dragRef.current = {
        id,
        offsetX: e.clientX - rect.left - pos.x,
        offsetY: e.clientY - rect.top - pos.y,
      };
      e.target.setPointerCapture(e.pointerId);
    },
    [positions]
  );

  const onPointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const rect = boardRef.current.getBoundingClientRect();
    const { id, offsetX, offsetY } = dragRef.current;
    setPositions((p) => ({
      ...p,
      [id]: { x: e.clientX - rect.left - offsetX, y: e.clientY - rect.top - offsetY },
    }));
  }, []);

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  const cardAnchor = (id) => {
    const p = positions[id];
    return { x: p.x + CARD_W / 2, y: p.y };
  };

  const cablePath = (id) => {
    const c = cardAnchor(id);
    const midY = (CENTER.y + c.y) / 2;
    return `M ${CENTER.x} ${CENTER.y} C ${CENTER.x} ${midY}, ${c.x} ${midY}, ${c.x} ${c.y}`;
  };

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", fontFamily: "sans-serif" }}>
      <div
        style={{
          fontFamily: "monospace",
          fontSize: 12,
          letterSpacing: "0.05em",
          color: ACCENT,
          marginBottom: 8,
        }}
      >
        03 / WHY THIS MATCH
      </div>
      <h1 style={{ fontSize: 30, fontWeight: 800, margin: "0 0 20px", color: TEXT }}>
        Patched in from your hum.
      </h1>

      <div
        ref={boardRef}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: "relative",
          width: "100%",
          height: 580,
          background: BG,
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          overflow: "hidden",
          touchAction: "none",
        }}
      >
        <svg
          width="100%"
          height="100%"
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          {FEATURES.map((f) => (
            <path
              key={f.id}
              d={cablePath(f.id)}
              fill="none"
              stroke={ACCENT}
              strokeWidth={2}
              opacity={0.55}
              strokeDasharray="1 7"
              strokeLinecap="round"
            >
              <animate
                attributeName="stroke-dashoffset"
                from="0"
                to="-16"
                dur="0.9s"
                repeatCount="indefinite"
              />
            </path>
          ))}
        </svg>

        <div
          style={{
            position: "absolute",
            left: CENTER.x - 75,
            top: CENTER.y - 75,
          }}
        >
          <Turntable />
        </div>

        {FEATURES.map((f) => {
          const p = positions[f.id];
          return (
            <div
              key={f.id}
              onPointerDown={(e) => onPointerDown(e, f.id)}
              style={{
                position: "absolute",
                left: p.x,
                top: p.y,
                width: CARD_W,
                background: CARD_BG,
                border: `1px solid ${BORDER}`,
                borderLeft: `3px solid ${ACCENT}`,
                borderRadius: 4,
                padding: "12px 14px",
                cursor: "grab",
                userSelect: "none",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontFamily: "monospace",
                  fontSize: 10,
                  letterSpacing: "0.04em",
                  color: TEXT_MUTED,
                }}
              >
                <span>{f.label}</span>
                <span style={{ color: ACCENT, fontWeight: 700 }}>{f.score}%</span>
              </div>
              <p style={{ margin: "6px 0 0", fontSize: 13, lineHeight: 1.4, color: TEXT }}>
                {f.note}
              </p>
              <VuMeter score={f.score} />
            </div>
          );
        })}

        <div style={{ position: "absolute", right: 20, bottom: 16 }}>
          <ConfidenceDial value={overall} />
        </div>
      </div>
    </div>
  );
}
