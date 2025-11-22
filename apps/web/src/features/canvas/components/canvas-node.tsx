/**
 * Canvas Node Component
 *
 * NOTE: This component requires react-konva to be installed
 */

// import { Rect, Image, Transformer } from 'react-konva';
// import { useAtom } from 'jotai';
// import { selectedNodeIdAtom, hoveredNodeIdAtom } from '../store/canvas-atoms';
// import { useRef, useEffect } from 'react';

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

export function CanvasNode(_props: iCanvasNodeProps) {
  // Placeholder implementation
  return null;
}

/*
// Full implementation - uncomment when react-konva is installed
export function CanvasNode({ node, onNodeClick, onNodeDragEnd, onNodeTransform }: CanvasNodeProps) {
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [hoveredNodeId, setHoveredNodeId] = useAtom(hoveredNodeIdAtom);
  const shapeRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  useEffect(() => {
    if (isSelected && transformerRef.current && shapeRef.current) {
      transformerRef.current.nodes([shapeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: any) => {
    e.cancelBubble = true;
    setSelectedNodeId(node.id);
    onNodeClick?.(node.id);
  };

  const handleDragEnd = (e: any) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    onNodeDragEnd?.(node.id, newPosition);
  };

  const handleTransformEnd = (e: any) => {
    const shapeNode = shapeRef.current;
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

  const strokeColor = isSelected ? '#3b82f6' : isHovered ? '#60a5fa' : 'transparent';

  return (
    <>
      <Rect
        ref={shapeRef}
        x={node.position.x}
        y={node.position.y}
        width={node.size.width}
        height={node.size.height}
        fill={node.type === 'ITEM' ? '#f3f4f6' : node.type === 'ASSET' ? '#dbeafe' : '#fef3c7'}
        stroke={strokeColor}
        strokeWidth={2}
        draggable
        onClick={handleClick}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        rotation={node.rotation || 0}
        opacity={node.opacity || 1}
      />
      {isSelected && (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 5 || newBox.height < 5) {
              return oldBox;
            }
            return newBox;
          }}
        />
      )}
    </>
  );
}
*/
