/**
 * Canvas Stage Component
 */
import { useAtom } from 'jotai';
import type Konva from 'konva';
import type React from 'react';
import { Stage, Layer } from 'react-konva';

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

  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
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
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    setStagePosition({
      x: e.target.x(),
      y: e.target.y(),
    });
  };

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
