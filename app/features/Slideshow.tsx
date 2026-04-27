"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage } from "react-konva";
import { ShapeRenderer, SlideMini } from "./ShapeRenderer";
import {
  COLORS,
  IDLE_MS,
  OVERVIEW_THUMB_W,
  SLIDE_H,
  SLIDE_W,
  SPEEDS,
} from "@/app/constants/constants";
import type { Blackout, Slide } from "@/app/types/types";

export type SlideshowProps = {
  slides: Slide[];
  startIndex: number;
  onClose: () => void;
};

const TOP_INSET = 28;
const BOTTOM_INSET = 96;
const SIDE_INSET = 32;

export const Slideshow: React.FC<SlideshowProps> = ({ slides, startIndex, onClose }) => {
  const [idx, setIdx] = useState(startIndex);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [blackout, setBlackout] = useState<Blackout>("off");
  const [showHelp, setShowHelp] = useState(false);
  const [showOverview, setShowOverview] = useState(false);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [pendingNumber, setPendingNumber] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [autoplay, setAutoplay] = useState(false);
  const [intervalSec, setIntervalSec] = useState(5);
  const [loop, setLoop] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const numberTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goNext = useCallback(
    () => setIdx((i) => Math.min(slides.length - 1, i + 1)),
    [slides.length],
  );
  const goPrev = useCallback(() => setIdx((i) => Math.max(0, i - 1)), []);
  const goTo = useCallback(
    (target: number) => setIdx(Math.max(0, Math.min(slides.length - 1, target))),
    [slides.length],
  );

  const cycleSpeed = useCallback(
    (dir: 1 | -1) =>
      setIntervalSec((s) => {
        const i = SPEEDS.indexOf(s);
        return SPEEDS[(i + dir + SPEEDS.length) % SPEEDS.length] ?? 5;
      }),
    [],
  );

  const isPausedByOverlay = showHelp || showOverview || blackout !== "off";
  const isLast = idx === slides.length - 1;
  const timerActive = autoplay && !isPausedByOverlay && (!isLast || loop);

  // Auto-advance
  useEffect(() => {
    if (!timerActive) return;
    const t = setTimeout(() => (isLast ? goTo(0) : goNext()), intervalSec * 1000);
    return () => clearTimeout(t);
  }, [timerActive, intervalSec, idx, isLast, goNext, goTo]);

  const revealControls = useCallback(() => {
    setControlsVisible(true);
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    idleTimerRef.current = setTimeout(() => setControlsVisible(false), IDLE_MS);
  }, []);

  // Viewport size
  useEffect(() => {
    const fit = () => setViewport({ w: window.innerWidth, h: window.innerHeight });
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Idle controls
  useEffect(() => {
    const onMove = () => revealControls();
    window.addEventListener("mousemove", onMove);
    idleTimerRef.current = setTimeout(() => setControlsVisible(false), IDLE_MS);
    return () => {
      window.removeEventListener("mousemove", onMove);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
    };
  }, [revealControls]);

  // Fullscreen state
  useEffect(() => {
    const onChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  // Cleanup on unmount
  useEffect(
    () => () => {
      if (numberTimerRef.current) clearTimeout(numberTimerRef.current);
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    },
    [],
  );

  const toggleFullscreen = useCallback(() => {
    if (typeof document === "undefined") return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else containerRef.current?.requestFullscreen?.().catch(() => {});
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      revealControls();

      if (e.key === "Escape") {
        if (showHelp) return setShowHelp(false);
        if (showOverview) return setShowOverview(false);
        if (blackout !== "off") return setBlackout("off");
        onClose();
        return;
      }

      if (/^[0-9]$/.test(e.key)) {
        setPendingNumber((p) => (p + e.key).slice(-3));
        if (numberTimerRef.current) clearTimeout(numberTimerRef.current);
        numberTimerRef.current = setTimeout(() => setPendingNumber(""), 1500);
        return;
      }

      if (e.key === "Enter" && pendingNumber) {
        const n = parseInt(pendingNumber, 10);
        if (!Number.isNaN(n)) goTo(n - 1);
        setPendingNumber("");
        return;
      }

      const k = e.key.toLowerCase();
      if (k === "?" || k === "h") return setShowHelp((s) => !s);
      if (k === "f") return toggleFullscreen();
      if (k === "b") return setBlackout((s) => (s === "black" ? "off" : "black"));
      if (k === "w") return setBlackout((s) => (s === "white" ? "off" : "white"));
      if (k === "t") return setShowOverview((s) => !s);
      if (k === "p") return setAutoplay((a) => !a);
      if (k === "l") return setLoop((l) => !l);
      if (e.key === "+" || e.key === "=" || e.key === "]") return cycleSpeed(-1);
      if (e.key === "-" || e.key === "_" || e.key === "[") return cycleSpeed(1);

      if (blackout !== "off") return setBlackout("off");

      if (
        e.key === "ArrowRight" ||
        e.key === "ArrowDown" ||
        e.key === " " ||
        e.key === "PageDown"
      ) {
        e.preventDefault();
        goNext();
      } else if (
        e.key === "ArrowLeft" ||
        e.key === "ArrowUp" ||
        e.key === "PageUp" ||
        e.key === "Backspace"
      ) {
        e.preventDefault();
        goPrev();
      } else if (e.key === "Home") goTo(0);
      else if (e.key === "End") goTo(slides.length - 1);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [
    blackout,
    showHelp,
    showOverview,
    pendingNumber,
    slides.length,
    onClose,
    goNext,
    goPrev,
    goTo,
    toggleFullscreen,
    revealControls,
    cycleSpeed,
  ]);

  if (viewport.w === 0) return null;

  const usableW = Math.max(100, viewport.w - SIDE_INSET * 2);
  const usableH = Math.max(100, viewport.h - TOP_INSET - BOTTOM_INSET);
  const scale = Math.min(usableW / SLIDE_W, usableH / SLIDE_H);
  const stageW = SLIDE_W * scale;
  const stageH = SLIDE_H * scale;
  const slide = slides[idx];

  const onSurfaceClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("[data-control]")) return;
    if (blackout !== "off") return setBlackout("off");
    if (showHelp) return setShowHelp(false);
    if (showOverview) return setShowOverview(false);
    goNext();
  };

  const onSurfaceContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if ((e.target as HTMLElement).closest("[data-control]")) return;
    if (blackout !== "off") return setBlackout("off");
    goPrev();
  };

  return (
    <div
      ref={containerRef}
      onClick={onSurfaceClick}
      onContextMenu={onSurfaceContextMenu}
      style={{
        position: "fixed",
        inset: 0,
        background: "#0B0B0B",
        zIndex: 9999,
        userSelect: "none",
        cursor: controlsVisible ? "default" : "none",
      }}
    >
      {/* Slide */}
      {blackout === "off" && (
        <div
          style={{
            position: "absolute",
            top: TOP_INSET,
            bottom: BOTTOM_INSET,
            left: SIDE_INSET,
            right: SIDE_INSET,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div key={idx} style={{ animation: "ppt-fade 280ms ease", display: "block" }}>
            <Stage
              width={stageW}
              height={stageH}
              scaleX={scale}
              scaleY={scale}
              style={{
                background: "#fff",
                boxShadow: "0 24px 80px rgba(0,0,0,0.6)",
                borderRadius: 4,
              }}
            >
              <Layer>
                {slide.shapes.map((shape) => (
                  <ShapeRenderer key={shape.id} shape={shape} draggable={false} />
                ))}
              </Layer>
            </Stage>
          </div>
        </div>
      )}

      {blackout === "black" && (
        <div style={{ position: "absolute", inset: 0, background: "#000" }} />
      )}
      {blackout === "white" && (
        <div style={{ position: "absolute", inset: 0, background: "#fff" }} />
      )}

      {/* Top progress bar — overall deck progress */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: "rgba(255,255,255,0.10)",
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 200ms",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${((idx + 1) / slides.length) * 100}%`,
            background: COLORS.accent,
            transition: "width 280ms ease",
          }}
        />
      </div>

      {/* Bottom-edge countdown — auto-advance progress for current slide */}
      {timerActive && (
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 2,
            background: "rgba(255,255,255,0.08)",
            pointerEvents: "none",
          }}
        >
          <div
            key={`${idx}-${intervalSec}`}
            style={{
              height: "100%",
              width: 0,
              background: COLORS.accent,
              animation: `ppt-countdown ${intervalSec}s linear forwards`,
            }}
          />
        </div>
      )}

      {/* Bottom toolbar */}
      <div
        data-control
        onClick={(e) => e.stopPropagation()}
        onContextMenu={(e) => e.stopPropagation()}
        style={{
          position: "absolute",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "10px 16px",
          background: "rgba(20,20,20,0.85)",
          backdropFilter: "blur(10px)",
          borderRadius: 999,
          color: "#fff",
          fontFamily: "Georgia, serif",
          fontSize: 13,
          letterSpacing: 0.5,
          opacity: controlsVisible ? 1 : 0,
          transition: "opacity 200ms",
          pointerEvents: controlsVisible ? "auto" : "none",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <CircleBtn onClick={goPrev} disabled={idx === 0} title="Previous (←)">
          ‹
        </CircleBtn>
        <span style={{ minWidth: 70, textAlign: "center" }}>
          {idx + 1}{" "}
          <span style={{ color: "rgba(255,255,255,0.5)" }}>/ {slides.length}</span>
        </span>
        <CircleBtn onClick={goNext} disabled={idx === slides.length - 1} title="Next (→)">
          ›
        </CircleBtn>
        <Sep />
        <CircleBtn
          onClick={() => setAutoplay((a) => !a)}
          active={autoplay}
          title={autoplay ? "Pause auto-advance (P)" : "Play auto-advance (P)"}
        >
          {autoplay ? "❚❚" : "▶"}
        </CircleBtn>
        <button
          onClick={() => cycleSpeed(1)}
          title="Slide duration — click to cycle (+/-)"
          style={pillBtnStyle}
        >
          {intervalSec}s
        </button>
        <CircleBtn
          onClick={() => setLoop((l) => !l)}
          active={loop}
          title={loop ? "Loop on (L)" : "Loop off (L)"}
        >
          ↻
        </CircleBtn>
        <Sep />
        <CircleBtn
          onClick={() => setShowOverview((s) => !s)}
          active={showOverview}
          title="Slide overview (T)"
        >
          ▦
        </CircleBtn>
        <CircleBtn
          onClick={() => setBlackout((s) => (s === "black" ? "off" : "black"))}
          active={blackout === "black"}
          title="Black screen (B)"
        >
          ●
        </CircleBtn>
        <CircleBtn onClick={toggleFullscreen} active={isFullscreen} title="Fullscreen (F)">
          {isFullscreen ? "▢" : "▣"}
        </CircleBtn>
        <CircleBtn onClick={() => setShowHelp(true)} title="Shortcuts (?)">
          ?
        </CircleBtn>
        <Sep />
        <button onClick={onClose} title="Exit (Esc)" style={exitBtnStyle}>
          Exit
        </button>
      </div>

      {/* Pending slide-number indicator */}
      {pendingNumber && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "#fff",
            fontFamily: "Georgia, serif",
            pointerEvents: "none",
            textShadow: "0 4px 24px rgba(0,0,0,0.7)",
            textAlign: "center",
          }}
        >
          <div style={{ fontSize: 96, fontWeight: 600, lineHeight: 1 }}>{pendingNumber}</div>
          <div style={{ fontSize: 13, opacity: 0.7, marginTop: 12, letterSpacing: 1 }}>
            Press Enter to jump
          </div>
        </div>
      )}

      {/* Help overlay */}
      {showHelp && (
        <div
          data-control
          onClick={(e) => {
            e.stopPropagation();
            setShowHelp(false);
          }}
          onContextMenu={(e) => e.stopPropagation()}
          style={overlayStyle(0.8)}
        >
          <div onClick={(e) => e.stopPropagation()} style={dialogStyle}>
            <div style={dialogHeader}>Keyboard Shortcuts</div>
            <ShortRow keys={["→", "↓", "Space", "Click"]} desc="Next slide" />
            <ShortRow keys={["←", "↑", "Right-click"]} desc="Previous slide" />
            <ShortRow keys={["Home"]} desc="First slide" />
            <ShortRow keys={["End"]} desc="Last slide" />
            <ShortRow keys={["1-9", "↵"]} desc="Jump to slide N" />
            <ShortRow keys={["P"]} desc="Play / pause auto-advance" />
            <ShortRow keys={["+", "−"]} desc="Faster / slower" />
            <ShortRow keys={["L"]} desc="Toggle loop" />
            <ShortRow keys={["B"]} desc="Black screen" />
            <ShortRow keys={["W"]} desc="White screen" />
            <ShortRow keys={["F"]} desc="Toggle fullscreen" />
            <ShortRow keys={["T"]} desc="Slide overview" />
            <ShortRow keys={["?", "H"]} desc="Toggle this help" />
            <ShortRow keys={["Esc"]} desc="Exit slideshow" />
            <div
              style={{
                marginTop: 20,
                textAlign: "center",
                opacity: 0.5,
                fontSize: 11,
                letterSpacing: 1,
              }}
            >
              Click anywhere to close
            </div>
          </div>
        </div>
      )}

      {/* Overview / thumbnails */}
      {showOverview && (
        <div
          data-control
          onClick={(e) => {
            e.stopPropagation();
            setShowOverview(false);
          }}
          onContextMenu={(e) => e.stopPropagation()}
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.88)",
            padding: "60px 40px 40px",
            overflowY: "auto",
            color: "#fff",
            fontFamily: "Georgia, serif",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              fontSize: 11,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.6)",
              marginBottom: 28,
              textAlign: "center",
            }}
          >
            All Slides — click to jump
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(auto-fill, ${OVERVIEW_THUMB_W}px)`,
              gap: 20,
              justifyContent: "center",
            }}
          >
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={(e) => {
                  e.stopPropagation();
                  goTo(i);
                  setShowOverview(false);
                }}
                style={{
                  all: "unset",
                  aspectRatio: "16/9",
                  width: OVERVIEW_THUMB_W,
                  background: "#fff",
                  borderRadius: 6,
                  outline:
                    i === idx ? `3px solid ${COLORS.accent}` : "3px solid transparent",
                  cursor: "pointer",
                  position: "relative",
                  overflow: "hidden",
                  transition: "transform 0.12s",
                }}
              >
                <SlideMini slide={s} width={OVERVIEW_THUMB_W} />
                <div
                  style={{
                    position: "absolute",
                    bottom: 6,
                    right: 8,
                    color: "#1A1A1A",
                    fontSize: 11,
                    background: "rgba(255,255,255,0.92)",
                    padding: "2px 8px",
                    borderRadius: 3,
                    letterSpacing: 0.5,
                  }}
                >
                  {i + 1}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes ppt-fade {
          from { opacity: 0; transform: scale(0.985); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes ppt-countdown {
          from { width: 0; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};

// ---------- Internal helpers ----------

const Sep: React.FC = () => (
  <div style={{ width: 1, height: 18, background: "rgba(255,255,255,0.18)" }} />
);

type CircleBtnProps = {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  title?: string;
};

const CircleBtn: React.FC<CircleBtnProps> = ({
  children,
  onClick,
  disabled,
  active,
  title,
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    title={title}
    style={{
      border: `1px solid ${active ? COLORS.accent : "rgba(255,255,255,0.20)"}`,
      background: active ? COLORS.accent : "transparent",
      color: "#fff",
      width: 32,
      height: 32,
      borderRadius: "50%",
      cursor: disabled ? "default" : "pointer",
      opacity: disabled ? 0.35 : 1,
      fontSize: 14,
      lineHeight: 1,
      fontFamily: "inherit",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: 0,
      transition: "background 0.15s, border-color 0.15s",
    }}
  >
    {children}
  </button>
);

const ShortRow: React.FC<{ keys: string[]; desc: string }> = ({ keys, desc }) => (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "8px 0",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      fontSize: 13,
    }}
  >
    <span style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
      {keys.map((k) => (
        <span
          key={k}
          style={{
            display: "inline-block",
            padding: "2px 8px",
            border: "1px solid rgba(255,255,255,0.25)",
            borderRadius: 4,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: 11,
            background: "rgba(255,255,255,0.05)",
          }}
        >
          {k}
        </span>
      ))}
    </span>
    <span style={{ opacity: 0.85 }}>{desc}</span>
  </div>
);

// ---------- Shared inline styles ----------

const pillBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.20)",
  background: "transparent",
  color: "#fff",
  height: 32,
  padding: "0 10px",
  borderRadius: 16,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  letterSpacing: 0.5,
  minWidth: 44,
};

const exitBtnStyle: React.CSSProperties = {
  border: "1px solid rgba(255,255,255,0.25)",
  background: "transparent",
  color: "#fff",
  padding: "0 14px",
  height: 32,
  borderRadius: 16,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: 12,
  letterSpacing: 1,
  textTransform: "uppercase",
};

const overlayStyle = (alpha: number): React.CSSProperties => ({
  position: "absolute",
  inset: 0,
  background: `rgba(0,0,0,${alpha})`,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  fontFamily: "Georgia, serif",
  backdropFilter: "blur(4px)",
});

const dialogStyle: React.CSSProperties = {
  padding: 36,
  maxWidth: 460,
  width: "100%",
  border: "1px solid rgba(255,255,255,0.15)",
  borderRadius: 8,
  background: "rgba(20,20,20,0.6)",
};

const dialogHeader: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: 3,
  textTransform: "uppercase",
  opacity: 0.7,
  marginBottom: 20,
  textAlign: "center",
};
