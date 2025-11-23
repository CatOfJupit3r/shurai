/**
 * Hero Canvas Preview Component
 *
 * Interactive preview of canvas and item management features for the hero page.
 * All state is local - no server interaction.
 */
import type Konva from 'konva';
import React, { useState, useCallback, useMemo } from 'react';
import { FiPlus, FiTrash2, FiMove, FiMaximize2 } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';
import { Stage, Layer, Rect, Image as KonvaImage, Transformer, Text } from 'react-konva';

import { Button } from '@~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@~/components/ui/card';
import { Input } from '@~/components/ui/input';
import { Label } from '@~/components/ui/label';
import type { iCanvasNode } from '@~/features/canvas';

// Predefined global assets for the preview
const PREVIEW_ASSETS = [
  {
    id: 'monitor-1',
    name: 'Monitor',
    type: 'IMAGE' as const,
    imageUrl: 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400',
    iconUrl: '🖥️',
  },
  {
    id: 'keyboard-1',
    name: 'Keyboard',
    type: 'IMAGE' as const,
    imageUrl: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400',
    iconUrl: '⌨️',
  },
  {
    id: 'mouse-1',
    name: 'Mouse',
    type: 'IMAGE' as const,
    imageUrl: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400',
    iconUrl: '🖱️',
  },
  {
    id: 'headphone-1',
    name: 'Headphones',
    type: 'IMAGE' as const,
    imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    iconUrl: '🎧',
  },
  {
    id: 'desk-1',
    name: 'Desk',
    type: 'IMAGE' as const,
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
    iconUrl: '🪑',
  },
  {
    id: 'plant-1',
    name: 'Plant',
    type: 'IMAGE' as const,
    imageUrl: 'https://images.unsplash.com/photo-1509937528035-ad76254b0356?w=400',
    iconUrl: '🪴',
  },
];

// Predefined items for the preview
interface iPreviewItem {
  id: string;
  name: string;
  description?: string;
  assetId: string;
  addedToCanvas?: boolean;
}

const INITIAL_ITEMS: iPreviewItem[] = [
  {
    id: 'item-1',
    name: 'Ultrawide Monitor',
    description: 'Dell 34" Curved Monitor',
    assetId: 'monitor-1',
  },
  {
    id: 'item-2',
    name: 'Mechanical Keyboard',
    description: 'Keychron K2',
    assetId: 'keyboard-1',
  },
  {
    id: 'item-3',
    name: 'Gaming Mouse',
    description: 'Logitech G Pro',
    assetId: 'mouse-1',
  },
];

// Canvas node component for rendering items
interface iCanvasNodeProps {
  node: iCanvasNode;
  isSelected: boolean;
  onSelect: () => void;
  onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => void;
  onTransformEnd: (e: Konva.KonvaEventObject<Event>) => void;
}

function CanvasNodeImage({ node, isSelected, onSelect, onDragEnd, onTransformEnd }: iCanvasNodeProps) {
  const asset = PREVIEW_ASSETS.find((a) => a.id === node.assetId);
  const [image, setImage] = React.useState<HTMLImageElement | null>(null);
  const transformerRef = React.useRef<Konva.Transformer>(null);
  const nodeRef = React.useRef<Konva.Rect | Konva.Image>(null);

  React.useEffect(() => {
    if (asset?.imageUrl) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = asset.imageUrl;
      img.onload = () => setImage(img);
    }
  }, [asset?.imageUrl]);

  React.useEffect(() => {
    if (isSelected && transformerRef.current && nodeRef.current) {
      transformerRef.current.nodes([nodeRef.current]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [isSelected]);

  if (!image) {
    // Render placeholder while loading
    return (
      <>
        <Rect
          ref={nodeRef as React.Ref<Konva.Rect>}
          x={node.position.x}
          y={node.position.y}
          width={node.size.width}
          height={node.size.height}
          fill="#e5e7eb"
          stroke={isSelected ? '#7c3aed' : '#d1d5db'}
          strokeWidth={2}
          rotation={node.rotation ?? 0}
          opacity={node.opacity ?? 1}
          draggable
          onClick={onSelect}
          onTap={onSelect}
          onDragEnd={onDragEnd}
          onTransformEnd={onTransformEnd}
        />
        {/* eslint-disable-next-line jsx-a11y/heading-has-content */}
        <Text
          x={node.position.x}
          y={node.position.y + node.size.height / 2 - 10}
          width={node.size.width}
          text={asset?.iconUrl ?? '⏳'}
          fontSize={32}
          align="center"
          listening={false}
        />
      </>
    );
  }

  return (
    <>
      <KonvaImage
        ref={nodeRef as React.Ref<Konva.Image>}
        image={image}
        x={node.position.x}
        y={node.position.y}
        width={node.size.width}
        height={node.size.height}
        rotation={node.rotation ?? 0}
        opacity={node.opacity ?? 1}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragEnd={onDragEnd}
        onTransformEnd={onTransformEnd}
        shadowColor={isSelected ? '#7c3aed' : undefined}
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.6 : 0}
      />
      {isSelected ? (
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            if (newBox.width < 50 || newBox.height < 50) {
              return oldBox;
            }
            return newBox;
          }}
        />
      ) : null}
    </>
  );
}

// Add React import for useRef
// import React from 'react'; // Already imported at the top

export function HeroCanvasPreview() {
  const [items, setItems] = useState<iPreviewItem[]>(INITIAL_ITEMS);
  const [canvasNodes, setCanvasNodes] = useState<iCanvasNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newItemName, setNewItemName] = useState('');
  const [newItemAsset, setNewItemAsset] = useState('');

  const handleAddItem = useCallback(() => {
    if (!newItemName || !newItemAsset) return;

    const newItem: iPreviewItem = {
      id: `item-${Date.now()}`,
      name: newItemName,
      assetId: newItemAsset,
    };

    setItems((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemAsset('');
  }, [newItemName, newItemAsset]);

  const handleDeleteItem = useCallback((itemId: string) => {
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    setCanvasNodes((prev) => prev.filter((n) => n.itemId !== itemId));
  }, []);

  const handleAddToCanvas = useCallback(
    (item: iPreviewItem) => {
      const newNode: iCanvasNode = {
        id: `node-${Date.now()}`,
        type: 'ITEM',
        position: { x: 100 + canvasNodes.length * 30, y: 100 + canvasNodes.length * 30 },
        size: { width: 200, height: 150 },
        itemId: item.id,
        assetId: item.assetId,
        zIndex: canvasNodes.length,
        rotation: 0,
        opacity: 1,
      };

      setCanvasNodes((prev) => [...prev, newNode]);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, addedToCanvas: true } : i)));
    },
    [canvasNodes.length],
  );

  const handleNodeDragEnd = useCallback((nodeId: string, e: Konva.KonvaEventObject<DragEvent>) => {
    setCanvasNodes((prev) =>
      prev.map((n) => (n.id === nodeId ? { ...n, position: { x: e.target.x(), y: e.target.y() } } : n)),
    );
  }, []);

  const handleNodeTransformEnd = useCallback((nodeId: string, e: Konva.KonvaEventObject<Event>) => {
    const node = e.target;
    const newWidth = node.width() * node.scaleX();
    const newHeight = node.height() * node.scaleY();

    // Update width and height, then reset scale
    node.width(newWidth);
    node.height(newHeight);
    node.scaleX(1);
    node.scaleY(1);

    setCanvasNodes((prev) =>
      prev.map((n) =>
        n.id === nodeId
          ? {
              ...n,
              position: { x: node.x(), y: node.y() },
              size: {
                width: newWidth,
                height: newHeight,
              },
              rotation: node.rotation(),
            }
          : n,
      ),
    );
  }, []);

  const handleDeleteNode = useCallback(() => {
    if (!selectedNodeId) return;
    const node = canvasNodes.find((n) => n.id === selectedNodeId);
    if (node?.itemId) {
      setItems((prev) => prev.map((i) => (i.id === node.itemId ? { ...i, addedToCanvas: false } : i)));
    }
    setCanvasNodes((prev) => prev.filter((n) => n.id !== selectedNodeId));
    setSelectedNodeId(null);
  }, [selectedNodeId, canvasNodes]);

  const selectedNode = useMemo(() => canvasNodes.find((n) => n.id === selectedNodeId), [canvasNodes, selectedNodeId]);

  return (
    <section className="border-b border-border py-16 sm:py-24">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Showcase Your Setup</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Create items, add them to a canvas, and arrange them to present your perfect workspace. Try it out below!
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Item Management Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <HiOutlineCube className="h-5 w-5" />
                Item Management
              </CardTitle>
              <CardDescription>Create and manage items that represent your workspace components</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add Item Form */}
              <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                <div className="space-y-2">
                  <Label htmlFor="item-name">Item Name</Label>
                  <Input
                    id="item-name"
                    placeholder="e.g., Ultrawide Monitor"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-asset">Select Asset</Label>
                  <select
                    id="item-asset"
                    value={newItemAsset}
                    onChange={(e) => setNewItemAsset(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Choose an asset</option>
                    {PREVIEW_ASSETS.map((asset) => (
                      <option key={asset.id} value={asset.id}>
                        {asset.iconUrl} {asset.name}
                      </option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAddItem} disabled={!newItemName || !newItemAsset} className="w-full">
                  <FiPlus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                <Label htmlFor="items-list">Your Items</Label>
                <div id="items-list" className="max-h-[300px] space-y-2 overflow-y-auto">
                  {items.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                      No items yet. Add some to get started!
                    </div>
                  ) : (
                    items.map((item) => {
                      const asset = PREVIEW_ASSETS.find((a) => a.id === item.assetId);
                      return (
                        <div
                          key={item.id}
                          className="flex items-center justify-between rounded-lg border border-border bg-background p-3"
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-2xl">{asset?.iconUrl}</span>
                            <div>
                              <p className="text-sm font-medium">{item.name}</p>
                              {item.description ? (
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                              ) : null}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!item.addedToCanvas ? (
                              <Button size="sm" variant="outline" onClick={() => handleAddToCanvas(item)}>
                                <FiMove className="mr-1 h-3 w-3" />
                                Add to Canvas
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">On Canvas</span>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteItem(item.id)}>
                              <FiTrash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Canvas Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FiMaximize2 className="h-5 w-5" />
                Canvas Preview
              </CardTitle>
              <CardDescription>Drag, resize, and rotate items on the canvas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted/20">
                <Stage
                  width={800}
                  height={450}
                  className="cursor-move"
                  onClick={(e) => {
                    // Deselect if clicking on empty space
                    if (e.target === e.target.getStage()) {
                      setSelectedNodeId(null);
                    }
                  }}
                >
                  <Layer>
                    {/* Background */}
                    <Rect x={0} y={0} width={800} height={450} fill="#fafafa" />

                    {/* Grid Pattern - Vertical Lines */}
                    {Array.from({ length: 40 }, (_, i) => i).map((i) => (
                      <Rect key={`grid-v-${i}`} x={i * 20} y={0} width={1} height={450} fill="#e5e5e5" opacity={0.5} />
                    ))}
                    {/* Grid Pattern - Horizontal Lines */}
                    {Array.from({ length: 40 }, (_, i) => i).map((i) => (
                      <Rect key={`grid-h-${i}`} x={0} y={i * 20} width={800} height={1} fill="#e5e5e5" opacity={0.5} />
                    ))}

                    {/* Canvas Nodes */}
                    {canvasNodes.map((node) => (
                      <CanvasNodeImage
                        key={node.id}
                        node={node}
                        isSelected={selectedNodeId === node.id}
                        onSelect={() => setSelectedNodeId(node.id)}
                        onDragEnd={(e) => handleNodeDragEnd(node.id, e)}
                        onTransformEnd={(e) => handleNodeTransformEnd(node.id, e)}
                      />
                    ))}
                  </Layer>
                </Stage>

                {canvasNodes.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center text-sm text-muted-foreground">
                      <p>Add items to the canvas to see them here</p>
                      <p className="mt-1 text-xs">Click &ldquo;Add to Canvas&rdquo; on any item</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Inspector Panel */}
              {selectedNode ? (
                <div className="mt-4 space-y-3 rounded-lg border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="inspector-details" className="text-sm font-semibold">
                      Selected Item
                    </Label>
                    <Button size="sm" variant="destructive" onClick={handleDeleteNode}>
                      <FiTrash2 className="mr-1 h-3 w-3" />
                      Remove
                    </Button>
                  </div>
                  <div id="inspector-details" className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-muted-foreground">X:</span> {Math.round(selectedNode.position.x)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Y:</span> {Math.round(selectedNode.position.y)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Width:</span> {Math.round(selectedNode.size.width)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Height:</span> {Math.round(selectedNode.size.height)}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Rotation:</span> {Math.round(selectedNode.rotation ?? 0)}°
                    </div>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            💡 <strong>Tip:</strong> This is a live preview. Changes are not saved. Sign up to create real workspaces!
          </p>
        </div>
      </div>
    </section>
  );
}
