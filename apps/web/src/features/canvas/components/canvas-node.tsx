/**
 * Canvas Node Component
 */
import { useAtom } from 'jotai';
import type Konva from 'konva';
import { useRef, useEffect, useState } from 'react';
import { Group, Image as KonvaImage, Rect, Transformer } from 'react-konva';

import useAsset from '@~/features/assets/hooks/use-asset';

import { selectedNodeIdAtom, hoveredNodeIdAtom } from '../store/canvas-atoms';
import { loadAndCacheImage, getKonvaNodeProps, getPlaceholderConfig } from '../utils/asset-rendering';

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
  onNodeDoubleClick?: (nodeId: string) => void;
  onNodeDragEnd?: (nodeId: string, newPosition: { x: number; y: number }) => void;
  onNodeTransform?: (
    nodeId: string,
    newProps: { x: number; y: number; width: number; height: number; rotation: number },
  ) => void;
}

export function CanvasNode({ node, onNodeClick, onNodeDoubleClick, onNodeDragEnd, onNodeTransform }: iCanvasNodeProps) {
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [hoveredNodeId, setHoveredNodeId] = useAtom(hoveredNodeIdAtom);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  const { asset } = useAsset(node.assetId ?? '');

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  // Load image when asset changes using helper
  useEffect(() => {
    if (node.type === 'ASSET' && node.assetId && asset) {
      const konvaProps = getKonvaNodeProps(asset, {
        position: node.position,
        size: node.size,
        rotation: node.rotation,
        opacity: node.opacity,
      });

      if (konvaProps.imageUrl) {
        loadAndCacheImage(konvaProps.imageUrl)
          .then((img) => {
            setImage(img);
          })
          .catch(() => {
            setImage(null);
          });
      } else {
        setImage(null);
      }
    } else {
      setImage(null);
    }
  }, [node.type, node.assetId, node.position, node.size, node.rotation, node.opacity, asset]);

  useEffect(() => {
    if (isSelected && transformerRef.current && groupRef.current) {
      transformerRef.current.nodes([groupRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  const handleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setSelectedNodeId(node.id);
    onNodeClick?.(node.id);
  };

  const handleDoubleClick = (e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onNodeDoubleClick?.(node.id);
  };

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    onNodeDragEnd?.(node.id, newPosition);
  };

  const handleTransformEnd = () => {
    const groupNode = groupRef.current;
    if (!groupNode) return;

    const scaleX = groupNode.scaleX();
    const scaleY = groupNode.scaleY();

    groupNode.scaleX(1);
    groupNode.scaleY(1);

    const newProps = {
      x: groupNode.x(),
      y: groupNode.y(),
      width: Math.max(5, node.size.width * scaleX),
      height: Math.max(5, node.size.height * scaleY),
      rotation: groupNode.rotation(),
    };

    onNodeTransform?.(node.id, newProps);
  };

  let strokeColor = 'transparent';
  if (isSelected) {
    strokeColor = '#3b82f6';
  } else if (isHovered) {
    strokeColor = '#60a5fa';
  }

  // Get placeholder/fill colors based on asset type
  const placeholder = getPlaceholderConfig(asset?.type);
  let fillColor = '#f3f4f6';
  if (node.type === 'ASSET') {
    // Use theme primary color if available, otherwise use placeholder color
    fillColor = asset?.themeConfig?.primaryColor ?? placeholder.fillColor;
  } else if (node.type === 'SUB_CANVAS') {
    fillColor = '#fef3c7';
  }

  const shouldShowImage = node.type === 'ASSET' && image;

  return (
    <>
      <Group
        ref={groupRef}
        x={node.position.x}
        y={node.position.y}
        width={node.size.width}
        height={node.size.height}
        draggable
        onClick={handleClick}
        onDblClick={handleDoubleClick}
        onMouseEnter={() => setHoveredNodeId(node.id)}
        onMouseLeave={() => setHoveredNodeId(null)}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        rotation={node.rotation ?? 0}
        opacity={node.opacity ?? 1}
      >
        {/* Background Rectangle */}
        <Rect width={node.size.width} height={node.size.height} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
        {/* Asset Image */}
        {shouldShowImage ? (
          <KonvaImage image={image} width={node.size.width} height={node.size.height} listening={false} />
        ) : null}
      </Group>
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
