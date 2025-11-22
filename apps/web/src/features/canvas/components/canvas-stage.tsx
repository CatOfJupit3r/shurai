/**
 * Canvas Stage Component
 *
 * NOTE: This component requires react-konva to be installed
 * Uncomment the implementation once packages are available
 */
import type React from 'react';

// import { Stage, Layer } from 'react-konva';
// import { useAtom } from 'jotai';
// import { scaleAtom, stagePositionAtom } from '../store/canvas-atoms';

interface iCanvasStageProps {
  width: number;
  height: number;
  children?: React.ReactNode;
  onStageClick?: () => void;
}

export function CanvasStage({ width, height, children, onStageClick }: iCanvasStageProps) {
  // Placeholder implementation
  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="rounded-lg border border-border bg-muted" style={{ width, height }} onClick={onStageClick}>
      <div className="flex h-full items-center justify-center text-muted-foreground">
        <div className="text-center">
          <p className="text-lg font-semibold">Canvas View</p>
          <p className="mt-2 text-sm">Install react-konva, konva, and jotai to enable canvas</p>
          <p className="mt-4 max-w-md text-xs">
            See /apps/web/src/features/canvas/README.md for installation instructions
          </p>
        </div>
      </div>
      {children}
    </div>
  );
}

/*
// Full implementation - uncomment when react-konva is installed
export function CanvasStage({ width, height, children, onStageClick }: CanvasStageProps) {
  const [scale, setScale] = useAtom(scaleAtom);
  const [stagePosition, setStagePosition] = useAtom(stagePositionAtom);

  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const scaleBy = 1.05;
    const stage = e.target.getStage();
    const oldScale = stage.scaleX();
    const pointer = stage.getPointerPosition();

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

  const handleDragEnd = (e: any) => {
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
*/
