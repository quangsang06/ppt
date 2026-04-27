"use client";

import React, { useRef } from "react";
import {
  Arc,
  Arrow,
  Circle,
  Image as KonvaImage,
  Layer,
  Line,
  Path,
  Rect,
  RegularPolygon,
  Ring,
  Stage,
  Star,
  Text,
  Wedge,
} from "react-konva";
import type Konva from "konva";
import type { KonvaEventObject } from "konva/lib/Node";
import { SLIDE_H, SLIDE_W } from "@/app/constants/constants";
import { useLoadedImage } from "@/app/utils/factory";
import type { Shape, Slide } from "@/app/types/types";

export type ShapeRendererProps = {
  shape: Shape;
  draggable?: boolean;
  onSelect?: () => void;
  onChange?: (shape: Shape) => void;
  onDoubleClick?: () => void;
};

export const ShapeRenderer: React.FC<ShapeRendererProps> = ({
  shape,
  draggable = true,
  onSelect,
  onChange,
  onDoubleClick,
}) => {
  const shapeRef = useRef<Konva.Node>(null);
  const loadedImage = useLoadedImage(shape.type === "image" ? shape.src : null);

  const commonProps = {
    id: shape.id,
    x: shape.x,
    y: shape.y,
    rotation: shape.rotation,
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    draggable,
    onClick: onSelect,
    onTap: onSelect,
    onDblClick: onDoubleClick,
    onDblTap: onDoubleClick,
    onDragEnd: (e: KonvaEventObject<DragEvent>) => {
      onChange?.({ ...shape, x: e.target.x(), y: e.target.y() });
    },
    onTransformEnd: () => {
      const node = shapeRef.current;
      if (!node || !onChange) return;
      const sx = node.scaleX();
      const sy = node.scaleY();
      node.scaleX(1);
      node.scaleY(1);

      const next = {
        ...shape,
        x: node.x(),
        y: node.y(),
        rotation: node.rotation(),
      } as Shape;

      const uniform = Math.max(sx, sy);
      switch (next.type) {
        case "rect":
        case "image":
          next.width = Math.max(10, next.width * sx);
          next.height = Math.max(10, next.height * sy);
          break;
        case "circle":
        case "triangle":
        case "wedge":
          next.radius = Math.max(10, next.radius * uniform);
          break;
        case "star":
        case "ring":
        case "arc":
          next.innerRadius *= uniform;
          next.outerRadius *= uniform;
          break;
        case "text":
          next.width = Math.max(30, next.width * sx);
          next.fontSize = Math.max(8, next.fontSize * sy);
          break;
        case "line":
        case "arrow":
          next.points = next.points.map((p, i) => (i % 2 === 0 ? p * sx : p * sy));
          break;
        case "path":
          next.scaleX = sx;
          next.scaleY = sy;
          break;
      }
      onChange(next);
    },
  };

  switch (shape.type) {
    case "rect":
      return (
        <Rect
          ref={shapeRef as React.Ref<Konva.Rect>}
          {...commonProps}
          width={shape.width}
          height={shape.height}
          cornerRadius={shape.cornerRadius}
        />
      );
    case "circle":
      return (
        <Circle
          ref={shapeRef as React.Ref<Konva.Circle>}
          {...commonProps}
          radius={shape.radius}
        />
      );
    case "triangle":
      return (
        <RegularPolygon
          ref={shapeRef as React.Ref<Konva.RegularPolygon>}
          {...commonProps}
          sides={3}
          radius={shape.radius}
        />
      );
    case "star":
      return (
        <Star
          ref={shapeRef as React.Ref<Konva.Star>}
          {...commonProps}
          numPoints={shape.numPoints}
          innerRadius={shape.innerRadius}
          outerRadius={shape.outerRadius}
        />
      );
    case "text":
      return (
        <Text
          ref={shapeRef as React.Ref<Konva.Text>}
          {...commonProps}
          text={shape.text}
          fontSize={shape.fontSize}
          fontFamily={shape.fontFamily}
          width={shape.width}
        />
      );
    case "line":
      return (
        <Line
          ref={shapeRef as React.Ref<Konva.Line>}
          {...commonProps}
          points={shape.points}
          lineCap="round"
        />
      );
    case "arrow":
      return (
        <Arrow
          ref={shapeRef as React.Ref<Konva.Arrow>}
          {...commonProps}
          points={shape.points}
          pointerLength={shape.pointerLength}
          pointerWidth={shape.pointerWidth}
        />
      );
    case "path":
      return (
        <Path
          ref={shapeRef as React.Ref<Konva.Path>}
          {...commonProps}
          data={shape.data}
          scaleX={shape.scaleX}
          scaleY={shape.scaleY}
        />
      );
    case "wedge":
      return (
        <Wedge
          ref={shapeRef as React.Ref<Konva.Wedge>}
          {...commonProps}
          radius={shape.radius}
          angle={shape.angle}
        />
      );
    case "ring":
      return (
        <Ring
          ref={shapeRef as React.Ref<Konva.Ring>}
          {...commonProps}
          innerRadius={shape.innerRadius}
          outerRadius={shape.outerRadius}
        />
      );
    case "arc":
      return (
        <Arc
          ref={shapeRef as React.Ref<Konva.Arc>}
          {...commonProps}
          innerRadius={shape.innerRadius}
          outerRadius={shape.outerRadius}
          angle={shape.angle}
        />
      );
    case "image":
      if (!loadedImage) {
        return (
          <Rect
            ref={shapeRef as React.Ref<Konva.Rect>}
            {...commonProps}
            width={shape.width}
            height={shape.height}
            fill="#F2EFE8"
            stroke="#C9C0AE"
            strokeWidth={1}
            dash={[6, 4]}
          />
        );
      }
      return (
        <KonvaImage
          ref={shapeRef as React.Ref<Konva.Image>}
          {...commonProps}
          image={loadedImage}
          width={shape.width}
          height={shape.height}
        />
      );
  }
};

export const SlideMini: React.FC<{ slide: Slide; width: number }> = ({ slide, width }) => {
  const height = (width * SLIDE_H) / SLIDE_W;
  return (
    <Stage
      width={width}
      height={height}
      scaleX={width / SLIDE_W}
      scaleY={height / SLIDE_H}
      listening={false}
    >
      <Layer listening={false}>
        {slide.shapes.map((shape) => (
          <ShapeRenderer key={shape.id} shape={shape} draggable={false} />
        ))}
      </Layer>
    </Stage>
  );
};
