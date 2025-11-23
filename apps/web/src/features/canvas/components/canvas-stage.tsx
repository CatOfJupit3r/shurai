/**
 * Canvas Stage Component
 */
import { useAtom } from 'jotai';
import type Konva from 'konva';
import type React from 'react';
import { Stage, Layer } from 'react-konva';

import useStableCallback from '@~/hooks/use-stable-callback';

import { scaleAtom, stagePositionAtom } from '../store/canvas-atoms';

interface iCanvasStageProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  onStageClick?: () => void;
}

export function CanvasStage({ width, height, children, onStageClick }: iCanvasStageProps) {
  const [scale, setScale] = useAtom(scaleAtom);
  const [stagePosition, setStagePosition] = useAtom(stagePositionAtom);

  const handleWheel = useStableCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = e.target.getStage();
    if (!stage) return;

    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();
    if (!pointer) return;

    const mousePointTo = {
      x: (pointer.x - stage.x()) / oldScale,
      y: (pointer.y - stage.y()) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 ? oldScale * scaleBy : oldScale / scaleBy;

    const clampedScale = Math.max(0.1, Math.min(5, newScale));
    setScale(clampedScale);

    const newPos = {
      x: pointer.x - mousePointTo.x * clampedScale,
      y: pointer.y - mousePointTo.y * clampedScale,
    };
    setStagePosition(newPos);
  });

  const handleDragEnd = useStableCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const CANVAS_WIDTH = 1440;
    const CANVAS_HEIGHT = 810;

    const stage = e.target.getStage();
    if (!stage) return;

    // Calculate the viewport size (window dimensions)
    const viewportWidth = width;
    const viewportHeight = height;

    // Calculate the maximum pan distances based on current scale
    // We want to prevent panning so far that the entire canvas is off-screen
    const maxX = (CANVAS_WIDTH * scale - viewportWidth) / scale;
    const maxY = (CANVAS_HEIGHT * scale - viewportHeight) / scale;
    const minX = 0;
    const minY = 0;

    // Clamp the position to keep canvas visible
    const clampedX = Math.max(minX, Math.min(maxX, e.target.x()));
    const clampedY = Math.max(minY, Math.min(maxY, e.target.y()));

    setStagePosition({
      x: clampedX,
      y: clampedY,
    });
  });

  return (
    <Stage
      width={width}
      height={height}
      scaleX={scale}
      scaleY={scale}
      x={stagePosition.x}
      y={stagePosition.y}
      draggable
      onWheel={handleWheel}
      onDragEnd={handleDragEnd}
      onClick={onStageClick}
    >
      <Layer>{children}</Layer>
    </Stage>
  );
}
