import type { ShapeType } from "@/app/types/types";

export const COLORS = {
  bg: "#F5F1EA",
  panel: "#FFFFFF",
  ink: "#1A1A1A",
  muted: "#6B6256",
  accent: "#D2691E",
  accent2: "#2C5F5D",
  border: "#E8E0D3",
  shadow: "rgba(26,26,26,0.08)",
} as const;

export const FILL_COLORS = [
  "#D2691E",
  "#2C5F5D",
  "#1A1A1A",
  "#E8B04B",
  "#6B4F8F",
  "#A85751",
  "#FFFFFF",
];

export const SLIDE_W = 960;
export const SLIDE_H = 540;
export const SIDEBAR_THUMB_W = 148;
export const OVERVIEW_THUMB_W = 220;
export const IDLE_MS = 2200;
export const SPEEDS = [2, 3, 5, 8, 12];

export const SHAPE_PALETTE: { type: ShapeType; label: string }[] = [
  { type: "rect", label: "Rectangle" },
  { type: "circle", label: "Circle" },
  { type: "triangle", label: "Triangle" },
  { type: "star", label: "Star" },
  { type: "wedge", label: "Wedge" },
  { type: "ring", label: "Ring" },
  { type: "arc", label: "Arc" },
  { type: "arrow", label: "Arrow" },
  { type: "line", label: "Line" },
  { type: "path", label: "Heart" },
  { type: "text", label: "Text" },
  { type: "image", label: "Image" },
];
