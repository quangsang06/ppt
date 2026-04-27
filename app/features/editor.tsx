"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Layer, Stage, Transformer } from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import {
  COLORS,
  FILL_COLORS,
  SHAPE_PALETTE,
  SIDEBAR_THUMB_W,
  SLIDE_H,
  SLIDE_W,
} from "@/app/constants/constants";
import { createShape, newId } from "@/app/utils/factory";
import { ShapeRenderer, SlideMini } from "./ShapeRenderer";
import { Slideshow } from "./Slideshow";
import { TextEditor } from "./TextEditor";
import type { ImageShape, Shape, ShapeType, Slide } from "@/app/types/types";
import { ActionButton, inputStyle, Label, PropRow, toolbarBtn } from "./ui";

export default function PresentationApp() {
  const [slides, setSlides] = useState<Slide[]>([{ id: "s1", shapes: [] }]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [stageScale, setStageScale] = useState(1);
  const [stageOffset, setStageOffset] = useState({ x: 0, y: 0 });
  const [presenting, setPresenting] = useState(false);

  const stageRef = useRef<Konva.Stage>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const shapes = slides[currentSlide].shapes;
  const selectedShape = shapes.find((s) => s.id === selectedId) ?? null;

  // Fit canvas to container
  useEffect(() => {
    const fit = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      const padding = 40;
      const scale = Math.min(
        (clientWidth - padding * 2) / SLIDE_W,
        (clientHeight - padding * 2) / SLIDE_H,
      );
      setStageScale(scale);
      setStageOffset({
        x: (clientWidth - SLIDE_W * scale) / 2,
        y: (clientHeight - SLIDE_H * scale) / 2,
      });
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // Attach transformer to selected shape
  useEffect(() => {
    const tr = transformerRef.current;
    const stage = stageRef.current;
    if (!tr) return;
    if (selectedId && stage) {
      const node = stage.findOne(`#${selectedId}`);
      if (node) {
        tr.nodes([node]);
        tr.getLayer()?.batchDraw();
        return;
      }
    }
    tr.nodes([]);
  }, [selectedId, shapes]);

  const updateShapes = useCallback(
    (updater: (arr: Shape[]) => Shape[]) => {
      setSlides((prev) =>
        prev.map((slide, idx) =>
          idx === currentSlide ? { ...slide, shapes: updater(slide.shapes) } : slide,
        ),
      );
    },
    [currentSlide],
  );

  const updateShape = useCallback(
    (updated: Shape) => updateShapes((arr) => arr.map((s) => (s.id === updated.id ? updated : s))),
    [updateShapes],
  );

  const deleteShape = useCallback(
    (id: string) => {
      updateShapes((arr) => arr.filter((s) => s.id !== id));
      setSelectedId(null);
    },
    [updateShapes],
  );

  // Editor keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (presenting || editingTextId) return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const target = e.target as HTMLElement | null;
        if (target?.tagName === "INPUT" || target?.tagName === "TEXTAREA") return;
        deleteShape(selectedId);
      }
      if (e.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, editingTextId, presenting, deleteShape]);

  const pickImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        const src = reader.result as string;
        const probe = new window.Image();
        probe.onload = () => {
          const maxW = SLIDE_W * 0.6;
          const maxH = SLIDE_H * 0.6;
          const ratio = Math.min(maxW / probe.naturalWidth, maxH / probe.naturalHeight, 1);
          const w = probe.naturalWidth * ratio;
          const h = probe.naturalHeight * ratio;
          const id = newId("shape");
          const shape: ImageShape = {
            id,
            type: "image",
            x: SLIDE_W / 2 - w / 2,
            y: SLIDE_H / 2 - h / 2,
            rotation: 0,
            fill: "transparent",
            stroke: COLORS.ink,
            strokeWidth: 0,
            src,
            width: w,
            height: h,
          };
          updateShapes((arr) => [...arr, shape]);
          setSelectedId(id);
        };
        probe.src = src;
      };
      reader.readAsDataURL(file);
    };
    input.click();
  };

  const addShape = (type: ShapeType) => {
    if (type === "image") return pickImage();
    const id = newId("shape");
    updateShapes((arr) => [...arr, createShape(type, id)]);
    setSelectedId(id);
  };

  const duplicateShape = (id: string) => {
    const shape = shapes.find((s) => s.id === id);
    if (!shape) return;
    const copy: Shape = { ...shape, id: newId("shape"), x: shape.x + 20, y: shape.y + 20 };
    updateShapes((arr) => [...arr, copy]);
    setSelectedId(copy.id);
  };

  const moveLayer = (id: string, direction: "up" | "down") => {
    updateShapes((arr) => {
      const idx = arr.findIndex((s) => s.id === id);
      if (idx === -1) return arr;
      const newIdx =
        direction === "up" ? Math.min(arr.length - 1, idx + 1) : Math.max(0, idx - 1);
      if (newIdx === idx) return arr;
      const next = [...arr];
      [next[idx], next[newIdx]] = [next[newIdx], next[idx]];
      return next;
    });
  };

  const addSlide = () => {
    setSlides((prev) => [...prev, { id: newId("s"), shapes: [] }]);
    setCurrentSlide(slides.length);
    setSelectedId(null);
  };

  const deleteSlide = (idx: number) => {
    if (slides.length === 1) return;
    setSlides((prev) => prev.filter((_, i) => i !== idx));
    setCurrentSlide((cur) => {
      if (idx < cur) return cur - 1;
      if (idx === cur) return Math.max(0, cur - (cur === slides.length - 1 ? 1 : 0));
      return cur;
    });
    setSelectedId(null);
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent | TouchEvent>) => {
    if (e.target === e.target.getStage()) setSelectedId(null);
  };

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        background: COLORS.bg,
        fontFamily: "Georgia, 'Times New Roman', serif",
        color: COLORS.ink,
        overflow: "hidden",
      }}
    >
      {/* ===== LEFT: Slides Panel ===== */}
      <aside
        style={{
          width: 200,
          background: COLORS.panel,
          borderRight: `1px solid ${COLORS.border}`,
          padding: "20px 16px",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: COLORS.muted,
            marginBottom: 16,
          }}
        >
          Slides · {slides.length}
        </div>
        {slides.map((slide, idx) => (
          <div
            key={slide.id}
            onClick={() => {
              setCurrentSlide(idx);
              setSelectedId(null);
            }}
            style={{
              position: "relative",
              marginBottom: 12,
              padding: 8,
              borderRadius: 6,
              border: `2px solid ${idx === currentSlide ? COLORS.accent : "transparent"}`,
              background: idx === currentSlide ? COLORS.bg : "transparent",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            <div
              style={{
                width: SIDEBAR_THUMB_W,
                height: (SIDEBAR_THUMB_W * SLIDE_H) / SLIDE_W,
                background: "#fff",
                border: `1px solid ${COLORS.border}`,
                borderRadius: 3,
                position: "relative",
                overflow: "hidden",
              }}
            >
              <SlideMini slide={slide} width={SIDEBAR_THUMB_W} />
            </div>
            <div
              style={{
                fontSize: 11,
                marginTop: 6,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span style={{ color: COLORS.muted }}>Slide {idx + 1}</span>
              {slides.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSlide(idx);
                  }}
                  style={{
                    border: "none",
                    background: "transparent",
                    color: COLORS.muted,
                    cursor: "pointer",
                    fontSize: 14,
                    padding: 0,
                  }}
                  title="Delete slide"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        ))}
        <button
          onClick={addSlide}
          style={{
            width: "100%",
            padding: "10px",
            border: `1px dashed ${COLORS.muted}`,
            background: "transparent",
            color: COLORS.muted,
            cursor: "pointer",
            borderRadius: 6,
            fontSize: 12,
            fontFamily: "inherit",
            letterSpacing: 1,
            textTransform: "uppercase",
          }}
        >
          + New Slide
        </button>
      </aside>

      {/* ===== CENTER: Toolbar + Canvas ===== */}
      <main style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <div
          style={{
            background: COLORS.panel,
            borderBottom: `1px solid ${COLORS.border}`,
            padding: "12px 24px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              fontFamily: "Georgia, serif",
              fontSize: 18,
              fontStyle: "italic",
              fontWeight: 600,
              marginRight: 16,
              color: COLORS.ink,
            }}
          >
            Présenter
          </div>
          <div style={{ width: 1, height: 24, background: COLORS.border }} />
          {SHAPE_PALETTE.map((s) => (
            <button
              key={s.type}
              onClick={() => addShape(s.type)}
              style={toolbarBtn}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = COLORS.accent;
                e.currentTarget.style.color = COLORS.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = COLORS.border;
                e.currentTarget.style.color = COLORS.ink;
              }}
            >
              + {s.label}
            </button>
          ))}

          <div style={{ flex: 1 }} />

          <button
            onClick={() => {
              setSelectedId(null);
              setPresenting(true);
            }}
            style={{
              padding: "8px 18px",
              border: `1px solid ${COLORS.accent}`,
              background: COLORS.accent,
              color: "#fff",
              cursor: "pointer",
              borderRadius: 4,
              fontSize: 12,
              fontFamily: "Georgia, serif",
              letterSpacing: 1,
              textTransform: "uppercase",
              fontWeight: 600,
            }}
            title="Start slideshow (current slide)"
          >
            ▶ Present
          </button>
        </div>

        <div
          ref={containerRef}
          style={{
            flex: 1,
            position: "relative",
            overflow: "hidden",
            backgroundImage: `radial-gradient(circle, ${COLORS.border} 1px, transparent 1px)`,
            backgroundSize: "20px 20px",
          }}
        >
          <Stage
            ref={stageRef}
            width={SLIDE_W * stageScale}
            height={SLIDE_H * stageScale}
            scaleX={stageScale}
            scaleY={stageScale}
            onClick={handleStageClick}
            onTap={handleStageClick}
            style={{
              position: "absolute",
              left: stageOffset.x,
              top: stageOffset.y,
              background: "#fff",
              boxShadow: `0 20px 60px ${COLORS.shadow}`,
              borderRadius: 4,
            }}
          >
            <Layer>
              {shapes.map((shape) => (
                <ShapeRenderer
                  key={shape.id}
                  shape={shape}
                  onSelect={() => setSelectedId(shape.id)}
                  onChange={updateShape}
                  onDoubleClick={() => {
                    if (shape.type === "text") {
                      setEditingTextId(shape.id);
                      setSelectedId(shape.id);
                    }
                  }}
                />
              ))}
              <Transformer
                ref={transformerRef}
                rotateEnabled
                borderStroke={COLORS.accent}
                borderStrokeWidth={1.5}
                anchorStroke={COLORS.accent}
                anchorFill="#fff"
                anchorSize={8}
                anchorCornerRadius={4}
                boundBoxFunc={(oldBox, newBox) =>
                  newBox.width < 10 || newBox.height < 10 ? oldBox : newBox
                }
              />
            </Layer>
          </Stage>

          {editingTextId && selectedShape?.type === "text" && (
            <TextEditor
              shape={selectedShape}
              stageRef={stageRef}
              onChange={updateShape}
              onClose={() => setEditingTextId(null)}
              stageScale={stageScale}
            />
          )}

          {shapes.length === 0 && (
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                color: COLORS.muted,
                fontStyle: "italic",
                fontSize: 14,
                pointerEvents: "none",
                letterSpacing: 0.5,
              }}
            >
              Click a shape above to begin
            </div>
          )}
        </div>
      </main>

      {/* ===== RIGHT: Properties Panel ===== */}
      <aside
        style={{
          width: 260,
          background: COLORS.panel,
          borderLeft: `1px solid ${COLORS.border}`,
          padding: "20px 20px",
          overflowY: "auto",
          flexShrink: 0,
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 2,
            textTransform: "uppercase",
            color: COLORS.muted,
            marginBottom: 20,
          }}
        >
          Properties
        </div>

        {!selectedShape ? (
          <div style={{ color: COLORS.muted, fontSize: 13, fontStyle: "italic", lineHeight: 1.6 }}>
            Select a shape on the canvas to edit its properties.
            <div style={{ marginTop: 24, fontSize: 11, fontStyle: "normal", letterSpacing: 1 }}>
              <div style={{ color: COLORS.ink, marginBottom: 8, textTransform: "uppercase" }}>
                Shortcuts
              </div>
              <div style={{ marginBottom: 4 }}>Delete · remove shape</div>
              <div style={{ marginBottom: 4 }}>Esc · deselect / exit present</div>
              <div style={{ marginBottom: 4 }}>Double-click text · edit</div>
              <div style={{ marginBottom: 4 }}>Drag corners · resize</div>
              <div>← → · navigate slides in present mode</div>
            </div>
          </div>
        ) : (
          <div>
            <PropRow label="Type" value={selectedShape.type} readonly />

            <PropRow
              label="X"
              value={Math.round(selectedShape.x)}
              type="number"
              onChange={(v) => updateShape({ ...selectedShape, x: Number(v) })}
            />
            <PropRow
              label="Y"
              value={Math.round(selectedShape.y)}
              type="number"
              onChange={(v) => updateShape({ ...selectedShape, y: Number(v) })}
            />
            <PropRow
              label="Rotation"
              value={Math.round(selectedShape.rotation)}
              type="number"
              onChange={(v) => updateShape({ ...selectedShape, rotation: Number(v) })}
            />

            {selectedShape.type === "text" && (
              <>
                <div style={{ marginTop: 16 }}>
                  <Label>Text</Label>
                  <textarea
                    value={selectedShape.text}
                    onChange={(e) => updateShape({ ...selectedShape, text: e.target.value })}
                    style={inputStyle}
                    rows={3}
                  />
                </div>
                <PropRow
                  label="Font Size"
                  value={Math.round(selectedShape.fontSize)}
                  type="number"
                  onChange={(v) => updateShape({ ...selectedShape, fontSize: Number(v) })}
                />
              </>
            )}

            {selectedShape.type !== "line" && (
              <div style={{ marginTop: 16 }}>
                <Label>Fill</Label>
                <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                  {FILL_COLORS.map((c) => (
                    <button
                      key={c}
                      onClick={() => updateShape({ ...selectedShape, fill: c })}
                      style={{
                        width: 26,
                        height: 26,
                        borderRadius: "50%",
                        background: c,
                        border:
                          selectedShape.fill === c
                            ? `2px solid ${COLORS.ink}`
                            : `1px solid ${COLORS.border}`,
                        cursor: "pointer",
                        padding: 0,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}

            <PropRow
              label="Stroke Width"
              value={selectedShape.strokeWidth || 0}
              type="number"
              onChange={(v) => updateShape({ ...selectedShape, strokeWidth: Number(v) })}
            />

            <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 8 }}>
              <ActionButton onClick={() => duplicateShape(selectedShape.id)}>
                Duplicate
              </ActionButton>
              <div style={{ display: "flex", gap: 6 }}>
                <ActionButton onClick={() => moveLayer(selectedShape.id, "up")} small>
                  ↑ Forward
                </ActionButton>
                <ActionButton onClick={() => moveLayer(selectedShape.id, "down")} small>
                  ↓ Back
                </ActionButton>
              </div>
              <ActionButton danger onClick={() => deleteShape(selectedShape.id)}>
                Delete
              </ActionButton>
            </div>
          </div>
        )}
      </aside>

      {presenting && (
        <Slideshow
          slides={slides}
          startIndex={currentSlide}
          onClose={() => setPresenting(false)}
        />
      )}
    </div>
  );
}
