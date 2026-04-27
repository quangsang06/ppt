"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import type Konva from "konva";
import { COLORS } from "@/app/constants/constants";
import type { Shape, TextShape } from "@/app/types/types";

export type TextEditorProps = {
  shape: TextShape;
  stageRef: React.RefObject<Konva.Stage | null>;
  onChange: (shape: Shape) => void;
  onClose: () => void;
  stageScale: number;
};

export const TextEditor: React.FC<TextEditorProps> = ({
  shape,
  stageRef,
  onChange,
  onClose,
  stageScale,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);

  useLayoutEffect(() => {
    const stageBox = stageRef.current?.container().getBoundingClientRect();
    if (!stageBox) return;
    setPos({
      x: stageBox.left + shape.x * stageScale,
      y: stageBox.top + shape.y * stageScale,
    });
  }, [shape.x, shape.y, stageScale, stageRef]);

  useEffect(() => {
    if (!pos) return;
    textareaRef.current?.focus();
    textareaRef.current?.select();
  }, [pos]);

  if (!pos) return null;

  const commit = (text: string) => {
    onChange({ ...shape, text });
    onClose();
  };

  return (
    <textarea
      ref={textareaRef}
      defaultValue={shape.text}
      onBlur={(e) => commit(e.currentTarget.value)}
      onKeyDown={(e) => {
        if (e.key === "Escape") onClose();
        if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          commit(e.currentTarget.value);
        }
      }}
      style={{
        position: "fixed",
        left: pos.x,
        top: pos.y,
        width: shape.width * stageScale,
        fontSize: shape.fontSize * stageScale,
        fontFamily: shape.fontFamily,
        color: shape.fill,
        border: `2px solid ${COLORS.accent}`,
        outline: "none",
        padding: 4,
        background: "rgba(255,255,255,0.95)",
        resize: "none",
        zIndex: 1000,
        lineHeight: 1.2,
      }}
    />
  );
};
