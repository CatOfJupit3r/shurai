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
  items?: Array<{ _id: string; assetId?: string }>;
}

export function CanvasNode({
  node,
  onNodeClick,
  onNodeDoubleClick,
  onNodeDragEnd,
  onNodeTransform,
  items,
}: iCanvasNodeProps) {
  const [selectedNodeId, setSelectedNodeId] = useAtom(selectedNodeIdAtom);
  const [hoveredNodeId, setHoveredNodeId] = useAtom(hoveredNodeIdAtom);
  const groupRef = useRef<Konva.Group>(null);
  const transformerRef = useRef<Konva.Transformer>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);

  // Get assetId from node directly or from linked item
  let effectiveAssetId = node.assetId;
  if (node.type === 'ITEM' && node.itemId && items) {
    const linkedItem = items.find((i) => i._id === node.itemId);
    if (linkedItem?.assetId) {
      effectiveAssetId = linkedItem.assetId;
    }
  }

  const { asset } = useAsset(effectiveAssetId ?? '');

  const isSelected = selectedNodeId === node.id;
  const isHovered = hoveredNodeId === node.id;

  // Load image when asset changes using helper
  useEffect(() => {
    if ((node.type === 'ASSET' || node.type === 'ITEM') && effectiveAssetId && asset) {
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
  }, [effectiveAssetId, asset, node.type, node.itemId, node.position, node.size, node.rotation, node.opacity]);

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

    // Get current position BEFORE we reset scale
    const currentX = groupNode.x();
    const currentY = groupNode.y();

    // Calculate new dimensions based on scale
    const newWidth = Math.max(5, node.size.width * scaleX);
    const newHeight = Math.max(5, node.size.height * scaleY);

    // Reset scale to 1 to normalize the node
    groupNode.scaleX(1);
    groupNode.scaleY(1);

    // After resetting scale, we need to adjust position to maintain visual position
    // The key is: the visual top-left corner should stay in the same place
    // Calculate the actual visual bounds before reset
    const visualWidth = node.size.width * scaleX;
    const visualHeight = node.size.height * scaleY;
    const scaleDiffX = (node.size.width - visualWidth) / 2;
    const scaleDiffY = (node.size.height - visualHeight) / 2;

    // Adjust position to compensate for scale change
    const newX = currentX + scaleDiffX;
    const newY = currentY + scaleDiffY;

    const newProps = {
      x: newX,
      y: newY,
      width: newWidth,
      height: newHeight,
      rotation: groupNode.rotation(),
    };

    onNodeTransform?.(node.id, newProps);
  };

  let strokeColor = 'transparent';
  let strokeWidth = 2;

  if (isSelected) {
    strokeColor = '#3b82f6';
  } else if (isHovered) {
    strokeColor = '#60a5fa';
  } else if (node.type === 'ITEM' && !node.itemId) {
    // Unlinked ITEM node - dashed red border to indicate it needs linking
    strokeColor = '#ef4444';
    strokeWidth = 2;
  }

  // Get placeholder/fill colors based on asset type
  const placeholder = getPlaceholderConfig(asset?.type);
  let fillColor = '#f3f4f6';
  if (node.type === 'ASSET' || node.type === 'ITEM') {
    // Use theme primary color if available, otherwise use placeholder color
    fillColor = asset?.themeConfig?.primaryColor ?? placeholder.fillColor;
  } else if (node.type === 'SUB_CANVAS') {
    fillColor = '#fef3c7';
  }

  const shouldShowImage = (node.type === 'ASSET' || node.type === 'ITEM') && image;

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
        <Rect
          width={node.size.width}
          height={node.size.height}
          fill={fillColor}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
        />
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
