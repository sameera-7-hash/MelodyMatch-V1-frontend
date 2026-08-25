import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { useCountUp } from "../lib/useCountUp";
import "./MatchReasoningBoard.css";

const DEFAULT_POSITIONS = {
  pitch: { x: 8, y: 10 },
  rhythm: { x: 69, y: 10 },
  tempo: { x: 8, y: 62 },
  interval: { x: 69, y: 62 },
};

function clamp(value, minimum, maximum) {
  return Math.min(Math.max(value, minimum), maximum);
}

function featureKey(feature, index) {
  return feature.id || `feature-${index}`;
}

function scoreValue(score) {
  const value = Number(score);
  return Number.isFinite(value) ? clamp(value, 0, 100) : 0;
}

function cablePath(start, end, boardRect) {
  const startX = start.x - boardRect.left;
  const startY = start.y - boardRect.top;
  const endX = end.x - boardRect.left;
  const endY = end.y - boardRect.top;
  const distance = Math.max(70, Math.abs(endX - startX) * 0.42);
  const direction = endX > startX ? 1 : -1;

  return `M ${startX} ${startY} C ${startX + distance * direction} ${startY}, ${endX - distance * direction} ${endY}, ${endX} ${endY}`;
}

function TurntableNode({ confidence }) {
  const displayConfidence = useCountUp(confidence, { duration: 1000 });
  return (
    <div className="reasoning-turntable" aria-label="Your hummed melody">
      <div className="turntable-screw" />
      <div className="turntable-disc"><span className="turntable-label">YOUR<br />HUM</span><span className="turntable-groove groove-one" /><span className="turntable-groove groove-two" /></div>
      <div className="turntable-arm" />
      <span className="turntable-caption">source signal</span>
      <span className="turntable-confidence">{Math.round(displayConfidence)}%</span>
    </div>
  );
}

function VuMeter({ score }) {
  const filledSegments = Math.round(score / 10);

  return (
    <div className="channel-meter" aria-label={`${Math.round(score)} percent`}>
      {Array.from({ length: 10 }, (_, index) => <i key={index} className={index < filledSegments ? "is-filled" : ""} />)}
    </div>
  );
}

export default function MatchReasoningBoard({ features = [] }) {
  const boardRef = useRef(null);
  const [positions, setPositions] = useState({});
  const [draggingId, setDraggingId] = useState(null);
  const [layoutVersion, setLayoutVersion] = useState(0);

  const normalizedFeatures = useMemo(() => features.filter(Boolean).map((feature, index) => ({
    ...feature,
    id: featureKey(feature, index),
    score: scoreValue(feature.score),
  })), [features]);

  const confidence = useMemo(() => {
    if (!normalizedFeatures.length) return 0;
    const weights = { pitch: 1.35, rhythm: 1.35, tempo: 0.8 };
    const weightedTotal = normalizedFeatures.reduce((total, feature) => total + feature.score * (weights[feature.id] || 1), 0);
    const totalWeight = normalizedFeatures.reduce((total, feature) => total + (weights[feature.id] || 1), 0);
    return weightedTotal / totalWeight;
  }, [normalizedFeatures]);

  useLayoutEffect(() => {
    setLayoutVersion((version) => version + 1);
  }, [normalizedFeatures.length]);

  const getPosition = (feature, index) => positions[feature.id] || DEFAULT_POSITIONS[feature.id] || {
    x: 10 + ((index % 2) * 59),
    y: 8 + (Math.floor(index / 2) * 52),
  };

  const handlePointerDown = (event, feature, index) => {
    if (window.matchMedia("(max-width: 500px)").matches) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const board = boardRef.current?.getBoundingClientRect();
    if (!board) return;
    const current = getPosition(feature, index);
    const cardWidth = event.currentTarget.offsetWidth;
    const cardHeight = event.currentTarget.offsetHeight;
    const offsetX = event.clientX - (board.left + (current.x / 100) * board.width);
    const offsetY = event.clientY - (board.top + (current.y / 100) * board.height);
    event.currentTarget.dataset.dragOffset = `${offsetX},${offsetY},${cardWidth},${cardHeight}`;
    setDraggingId(feature.id);
  };

  const handlePointerMove = (event, feature) => {
    if (draggingId !== feature.id || !boardRef.current) return;
    const board = boardRef.current.getBoundingClientRect();
    const [offsetX, offsetY, cardWidth, cardHeight] = event.currentTarget.dataset.dragOffset.split(",").map(Number);
    const x = clamp(((event.clientX - board.left - offsetX) / board.width) * 100, 2, 98 - ((cardWidth / board.width) * 100));
    const y = clamp(((event.clientY - board.top - offsetY) / board.height) * 100, 2, 98 - ((cardHeight / board.height) * 100));
    setPositions((current) => ({ ...current, [feature.id]: { x, y } }));
  };

  const handlePointerUp = (event) => {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    setDraggingId(null);
  };

  const displayConfidence = useCountUp(confidence, { duration: 1000 });

  if (!normalizedFeatures.length) return null;

  return (
    <section className="reasoning-board-section" aria-label="Match reasoning">
      <div className="reasoning-board-heading"><div><p className="eyebrow">03 / signal chain</p><h2>Why it sounds right.</h2></div><span className="reasoning-board-meta">drag channels to inspect</span></div>
      <div className="reasoning-board" ref={boardRef}>
        <div className="console-grid" aria-hidden="true" />
        <div className="console-label console-label-top">MELODYMATCH / PATCH BAY 01</div>
        <svg key={layoutVersion} className="patch-cables" aria-hidden="true">
          {normalizedFeatures.map((feature, index) => {
            const position = getPosition(feature, index);
            const board = boardRef.current?.getBoundingClientRect();
            const card = boardRef.current?.querySelector(`[data-feature-id="${feature.id}"]`);
            if (!board || !card) return null;
            const cardRect = card.getBoundingClientRect();
            const cardCenter = { x: cardRect.left + cardRect.width / 2, y: cardRect.top + cardRect.height / 2 };
            const center = { x: board.left + board.width / 2, y: board.top + board.height / 2 };
            const start = position.x < 50 ? { x: cardRect.right, y: cardCenter.y } : { x: cardRect.left, y: cardCenter.y };
            return <path key={feature.id} className="patch-cable" d={cablePath(start, center, board)} />;
          })}
        </svg>
        <div className="turntable-wrap"><TurntableNode confidence={confidence} /></div>
        {normalizedFeatures.map((feature, index) => {
          const position = getPosition(feature, index);
          return <article key={feature.id} data-feature-id={feature.id} className={`channel-strip ${draggingId === feature.id ? "is-dragging" : ""}`} style={{ left: `${position.x}%`, top: `${position.y}%` }} onPointerDown={(event) => handlePointerDown(event, feature, index)} onPointerMove={(event) => handlePointerMove(event, feature)} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
            <div className="channel-strip-header"><span className="channel-number">CH {String(index + 1).padStart(2, "0")}</span><span className="channel-status">{Math.round(feature.score) >= 70 ? "LOCKED" : "TRACE"}</span></div>
            <div className="channel-strip-main"><div><h3>{feature.label}</h3><p>{feature.note}</p></div><strong className="channel-score">{Math.round(feature.score)}<small>%</small></strong></div>
            <VuMeter score={feature.score} />
            <span className="channel-port" aria-hidden="true" />
          </article>;
        })}
        <div className="console-label console-label-bottom">PITCH / RHYTHM / TEMPO / INTERVAL</div>
        <div className="confidence-dial" aria-label={`Overall confidence ${Math.round(confidence)} percent`}><div className="dial-scale"><span>0</span><span>50</span><span>100</span></div><div className="dial-face"><div className="dial-needle" style={{ transform: `rotate(${-90 + (displayConfidence * 1.8)}deg)` }} /><div className="dial-center" /></div><span className="dial-caption">overall confidence</span><strong>{Math.round(displayConfidence)}<small>%</small></strong></div>
      </div>
    </section>
  );
}
