"use client";

import { useEffect, useState } from "react";
import { COLORS, SLIDE_H, SLIDE_W } from "@/app/constants/constants";
import type { BaseShape, Shape, ShapeType } from "@/app/types/types";

export const HEART_PATH =
  "M 50 30 C 35 0, 0 0, 0 35 C 0 60, 30 80, 50 100 C 70 80, 100 60, 100 35 C 100 0, 65 0, 50 30 Z";

export const newId = (prefix: string) =>
  `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const createShape = (type: ShapeType, id: string): Shape => {
  const base: BaseShape = {
    id,
    x: SLIDE_W / 2 - 60,
    y: SLIDE_H / 2 - 60,
    rotation: 0,
    fill: COLORS.accent,
    stroke: COLORS.ink,
    strokeWidth: 0,
  };
  switch (type) {
    case "rect":
      return { ...base, type, width: 160, height: 100, cornerRadius: 4 };
    case "circle":
      return { ...base, type, radius: 60 };
    case "triangle":
      return { ...base, type, sides: 3, radius: 70 };
    case "star":
      return { ...base, type, numPoints: 5, innerRadius: 30, outerRadius: 65 };
    case "text":
      return {
        ...base,
        type,
        text: "Double-click to edit",
        fontSize: 28,
        fontFamily: "Georgia, serif",
        fill: COLORS.ink,
        width: 260,
      };
    case "line":
      return { ...base, type, points: [0, 0, 180, 0], stroke: COLORS.ink, strokeWidth: 4 };
    case "arrow":
      return {
        ...base,
        type,
        points: [0, 0, 180, 0],
        pointerLength: 16,
        pointerWidth: 16,
        stroke: COLORS.ink,
        strokeWidth: 4,
        fill: COLORS.ink,
      };
    case "path":
      return { ...base, type, data: HEART_PATH, scaleX: 1.4, scaleY: 1.4, fill: "#A85751" };
    case "wedge":
      return { ...base, type, radius: 80, angle: 60, rotation: -30 };
    case "ring":
      return { ...base, type, innerRadius: 35, outerRadius: 70 };
    case "arc":
      return { ...base, type, innerRadius: 35, outerRadius: 70, angle: 90, rotation: -45 };
    case "image":
      return { ...base, type, src: "", width: 240, height: 180, fill: "transparent" };
  }
};

export const useLoadedImage = (src: string | null) => {
  const [loaded, setLoaded] = useState<{ src: string; img: HTMLImageElement } | null>(null);
  useEffect(() => {
    if (!src) return;
    const i = new window.Image();
    i.crossOrigin = "anonymous";
    i.src = src;
    const onLoad = () => setLoaded({ src, img: i });
    if (i.complete && i.naturalWidth > 0) onLoad();
    else i.addEventListener("load", onLoad);
    return () => i.removeEventListener("load", onLoad);
  }, [src]);
  return loaded && loaded.src === src ? loaded.img : null;
};
