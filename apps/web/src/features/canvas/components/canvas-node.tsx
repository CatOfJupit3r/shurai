/**
 * Canvas Node Component
 */
import { useAtom } from 'jotai';
import type Konva from 'konva';
import { useRef, useEffect, useState, useMemo } from 'react';
import { Group, Image as KonvaImage, Rect, Text as KonvaText, Transformer } from 'react-konva';

import useAsset from '@~/features/assets/hooks/use-asset';
import useStableCallback from '@~/hooks/use-stable-callback';

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

interface iCanvasItemTreeNode {
  _id: string;
  name?: string;
  assetId?: string;
  children?: iCanvasItemTreeNode[];
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
  items?: iCanvasItemTreeNode[];
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

  const handleClick = useStableCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    setSelectedNodeId(node.id);
    onNodeClick?.(node.id);
  });

  const handleDoubleClick = useStableCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    e.cancelBubble = true;
    onNodeDoubleClick?.(node.id);
  });

  const handleDragEnd = useStableCallback((e: Konva.KonvaEventObject<DragEvent>) => {
    const newPosition = {
      x: e.target.x(),
      y: e.target.y(),
    };
    onNodeDragEnd?.(node.id, newPosition);
  });

  const handleTransformEnd = useStableCallback(() => {
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
  });

  const subCanvasData = useMemo(() => {
    if (node.type !== 'SUB_CANVAS' || !node.itemId || !items) return null;
    const linkedItem = items.find((i) => i._id === node.itemId);
    if (!linkedItem) return null;
    const children = linkedItem.children ?? [];

    return {
      title: linkedItem.name ?? 'Linked Items',
      items: children.map((child) => ({
        id: child._id,
        name: child.name ?? 'Untitled item',
      })),
      totalCount: children.length,
      isEmpty: children.length === 0,
    };
  }, [items, node.itemId, node.type]);

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
    fillColor = '#f3f4f6';
    if (!isSelected && !isHovered) {
      strokeColor = '#e2e8f0';
      strokeWidth = 1.5;
    }
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
        {/* Sub-Canvas Children List */}
        {node.type === 'SUB_CANVAS' && subCanvasData ? (
          <>
            <KonvaText
              x={8}
              y={8}
              text={subCanvasData.title}
              fontSize={12}
              fontStyle="bold"
              fill="#1f2937"
              listening={false}
              width={node.size.width - 16}
              ellipsis
            />
            {!subCanvasData.isEmpty ? (
              (() => {
                const contentStartY = 32;
                const rowHeight = 28;
                const rowWidth = node.size.width - 16;
                const availableHeight = node.size.height - contentStartY - 12;
                const maxVisibleItems = Math.max(1, Math.floor(availableHeight / rowHeight));
                const itemsToDisplay = subCanvasData.items.slice(0, maxVisibleItems);
                const hasOverflow = subCanvasData.totalCount > itemsToDisplay.length;
                const overflowText = hasOverflow ? `+${subCanvasData.totalCount - itemsToDisplay.length} more` : null;

                return (
                  <Group listening={false}>
                    {itemsToDisplay.map((item, index) => {
                      const baseY = contentStartY + index * rowHeight;
                      return (
                        <Group key={item.id ?? `${item.name}-${index}`} x={8} y={baseY} listening={false}>
                          <Rect
                            width={rowWidth}
                            height={rowHeight - 6}
                            y={3}
                            cornerRadius={8}
                            fill="#ffffff"
                            stroke="#e5e7eb"
                            strokeWidth={1}
                            listening={false}
                          />
                          <Rect
                            x={14}
                            y={rowHeight / 2 - 10}
                            width={20}
                            height={20}
                            cornerRadius={6}
                            fill="#e5e7eb"
                            listening={false}
                          />
                          <KonvaText
                            x={40}
                            y={rowHeight / 2 - 7}
                            text={item.name}
                            fontSize={11}
                            fontStyle="normal"
                            fill="#111827"
                            listening={false}
                            width={rowWidth - 48}
                            height={rowHeight - 6}
                            verticalAlign="middle"
                            ellipsis
                          />
                        </Group>
                      );
                    })}
                    {overflowText ? (
                      <KonvaText
                        x={16}
                        y={contentStartY + itemsToDisplay.length * rowHeight + 4}
                        text={overflowText}
                        fontSize={10}
                        fill="#6b7280"
                        listening={false}
                        width={rowWidth - 8}
                        ellipsis
                      />
                    ) : null}
                  </Group>
                );
              })()
            ) : (
              <Group x={8} y={36} listening={false}>
                <Rect
                  width={node.size.width - 16}
                  height={48}
                  cornerRadius={8}
                  fill="#f9fafb"
                  stroke="#e5e7eb"
                  strokeWidth={1}
                  dash={[6, 4]}
                  listening={false}
                />
                <KonvaText
                  x={12}
                  y={12}
                  text="No linked items yet"
                  fontSize={11}
                  fill="#9ca3af"
                  listening={false}
                  width={node.size.width - 40}
                  height={24}
                  verticalAlign="middle"
                />
              </Group>
            )}
          </>
        ) : null}
        {node.type === 'SUB_CANVAS' && !subCanvasData ? (
          <KonvaText
            x={8}
            y={8}
            text="Link this sub-canvas to a workspace item"
            fontSize={11}
            fill="#9ca3af"
            listening={false}
            width={node.size.width - 16}
            wrap="word"
            lineHeight={1.4}
          />
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
