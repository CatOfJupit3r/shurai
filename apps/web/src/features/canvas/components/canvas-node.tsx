/**
 * Canvas Node Component
 */
import { useAtom } from 'jotai';
import type Konva from 'konva';
import { useRef, useEffect } from 'react';
import { Rect, Transformer } from 'react-konva';

import { selectedNodeIdAtom, hoveredNodeIdAtom } from '../store/canvas-atoms';

export interface iCanvasNodeData {
  id: string;
  type: 'ITEM' | 'ASSET' | 'SUB_CANVAS';
  position: { x: number; y: number };
  size: { width: number; height: number };
  itemId?: string;
  assetId?: string;
  subCanvasId?: string;
  zIndex?: number;
  rotation?: number;
  opacity?: number;
}

interface iCanvasNodeProps {
  node: iCanvasNodeData;
  onNodeClick?: (nodeId: string) => void;
  onNodeDragEnd?: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onNodeTransform?: (
    nodeId: string,
    newProps: { x: number; y: number; width: number; height: number; rotation: number },
  ) => void;
}

export function CanvasNode({ node, onNodeClick, onNodeDragEnd, onNodeTransform }: iCanvasNodeProps) {
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [hoveredNodeId, setHoveredNodeId] = useAtom(hoveredNodeIdAtom);
  const shapeRef = useRef<Konva.Rect>(null);
  const transformerRef = useRef<Konva.Transformer>(null);

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setSelectedNodeId(node.id);
    onNodeClick?.(node.id);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    onNodeDragEnd?.(node.id, newPosition);
  };

  const handleTransformEnd = () => {
    const shapeNode = shapeRef.current;
    if (!shapeNode) return;

    const scaleX = shapeNode.scaleX();
    const scaleY = shapeNode.scaleY();

    shapeNode.scaleX(1);
    shapeNode.scaleY(1);

    const newProps = {
      x: shapeNode.x(),
      y: shapeNode.y(),
      width: Math.max(5, shapeNode.width() * scaleX),
      height: Math.max(5, shapeNode.height() * scaleY),
      rotation: shapeNode.rotation(),
    };

    onNodeTransform?.(node.id, newProps);
  };

  let strokeColor = 'transparent';
  if (isSelected) {
    strokeColor = '#3b82f6';
  } else if (isHovered) {
    strokeColor = '#60a5fa';
  }

  let fillColor = '#f3f4f6';
  if (node.type === 'ASSET') {
    fillColor = '#dbeafe';
  } else if (node.type === 'SUB_CANVAS') {
    fillColor = '#fef3c7';
  }

  return (
    <>
      <Rect
        ref={shapeRef}
        x={node.position.x}
        y={node.position.y}
        width={node.size.width}
        height={node.size.height}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth={2}
        draggable
        onClick={handleClick}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        rotation={node.rotation ?? 0}
        opacity={node.opacity ?? 1}
      />
      {isSelected ? (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      ) : null}
    </>
  );
}
