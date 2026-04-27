export type ShapeType =
  | "rect"
  | "circle"
  | "triangle"
  | "star"
  | "text"
  | "line"
  | "arrow"
  | "path"
  | "wedge"
  | "ring"
  | "arc"
  | "image";

export type BaseShape = {
  id: string;
  x: number;
  y: number;
  rotation: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
};

export type RectShape = BaseShape & {
  type: "rect";
  width: number;
  height: number;
  cornerRadius: number;
};
export type CircleShape = BaseShape & { type: "circle"; radius: number };
export type TriangleShape = BaseShape & { type: "triangle"; sides: number; radius: number };
export type StarShape = BaseShape & {
  type: "star";
  numPoints: number;
  innerRadius: number;
  outerRadius: number;
};
export type TextShape = BaseShape & {
  type: "text";
  text: string;
  fontSize: number;
  fontFamily: string;
  width: number;
};
export type LineShape = BaseShape & { type: "line"; points: number[] };
export type ArrowShape = BaseShape & {
  type: "arrow";
  points: number[];
  pointerLength: number;
  pointerWidth: number;
};
export type PathShape = BaseShape & {
  type: "path";
  data: string;
  scaleX: number;
  scaleY: number;
};
export type WedgeShape = BaseShape & { type: "wedge"; radius: number; angle: number };
export type RingShape = BaseShape & {
  type: "ring";
  innerRadius: number;
  outerRadius: number;
};
export type ArcShape = BaseShape & {
  type: "arc";
  innerRadius: number;
  outerRadius: number;
  angle: number;
};
export type ImageShape = BaseShape & {
  type: "image";
  src: string;
  width: number;
  height: number;
};

export type Shape =
  | RectShape
  | CircleShape
  | TriangleShape
  | StarShape
  | TextShape
  | LineShape
  | ArrowShape
  | PathShape
  | WedgeShape
  | RingShape
  | ArcShape
  | ImageShape;

export type Slide = { id: string; shapes: Shape[] };

export type Blackout = "off" | "black" | "white";
