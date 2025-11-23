/**
 * Inspector Panel Component
 * Displays and allows editing of selected canvas node properties
 */
import { useState } from 'react';
import { FiImage, FiX, FiArrowUp, FiArrowDown } from 'react-icons/fi';

import { ASSET_TYPE } from '@shurai/shared';

import { Button } from '@~/components/ui/button';
import { Input } from '@~/components/ui/input';
import { Label } from '@~/components/ui/label';
import { AssetPickerModal } from '@~/features/assets';
import useAsset from '@~/features/assets/hooks/use-asset';

import type { iCanvasNodeData } from './canvas-node';

interface iInspectorPanelProps {
  node: iCanvasNodeData | null;
  onClose: () => void;
  onUpdate: (nodeId: string, updates: Partial<iCanvasNodeData>) => void;
}

export function InspectorPanel({ node, onClose, onUpdate }: iInspectorPanelProps) {
  const [localPosition, setLocalPosition] = useState(node?.position ?? { x: 0, y: 0 });
  const [localSize, setLocalSize] = useState(node?.size ?? { width: 100, height: 100 });
  const [localRotation, setLocalRotation] = useState(node?.rotation ?? 0);
  const [localOpacity, setLocalOpacity] = useState(node?.opacity ?? 1);
  const [isAssetPickerOpen, setIsAssetPickerOpen] = useState(false);

  // Only fetch asset if assetId exists
  const { asset } = useAsset(node?.assetId ?? '');
  const hasAsset = !!node?.assetId && !!asset;

  if (!node) return null;

  const handlePositionChange = (axis: 'x' | 'y', value: string) => {
    const numValue = parseFloat(value) || 0;
    const newPosition = { ...localPosition, [axis]: numValue };
    setLocalPosition(newPosition);
    onUpdate(node.id, { position: newPosition });
  };

  const handleSizeChange = (dimension: 'width' | 'height', value: string) => {
    const numValue = Math.max(10, parseFloat(value) || 10);
    const newSize = { ...localSize, [dimension]: numValue };
    setLocalSize(newSize);
    onUpdate(node.id, { size: newSize });
  };

  const handleRotationChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setLocalRotation(numValue);
    onUpdate(node.id, { rotation: numValue });
  };

  const handleOpacityChange = (value: string) => {
    const numValue = Math.max(0, Math.min(1, parseFloat(value) || 0));
    setLocalOpacity(numValue);
    onUpdate(node.id, { opacity: numValue });
  };

  const handleAssetSelect = (assetId: string) => {
    onUpdate(node.id, { assetId });
    setIsAssetPickerOpen(false);
  };

  const handleClearAsset = () => {
    onUpdate(node.id, { assetId: undefined });
  };

  return (
    <div className="w-80 overflow-y-auto border-l bg-card">
      {/* Header */}
      <div className="border-b p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Inspector</h2>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <FiX />
          </Button>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">Node ID: {node.id}</p>
      </div>

      {/* Properties */}
      <div className="space-y-6 p-4">
        {/* Node Type */}
        <div>
          <div className="text-xs text-muted-foreground">Type</div>
          <p className="mt-1 text-sm font-medium">{node.type}</p>
        </div>

        {/* Position */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Position</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="pos-x" className="text-xs text-muted-foreground">
                X
              </Label>
              <Input
                id="pos-x"
                type="number"
                value={localPosition.x}
                onChange={(e) => handlePositionChange('x', e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="pos-y" className="text-xs text-muted-foreground">
                Y
              </Label>
              <Input
                id="pos-y"
                type="number"
                value={localPosition.y}
                onChange={(e) => handlePositionChange('y', e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
        </div>

        {/* Size */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Size</div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="size-w" className="text-xs text-muted-foreground">
                Width
              </Label>
              <Input
                id="size-w"
                type="number"
                value={localSize.width}
                onChange={(e) => handleSizeChange('width', e.target.value)}
                className="mt-1"
                min={10}
              />
            </div>
            <div>
              <Label htmlFor="size-h" className="text-xs text-muted-foreground">
                Height
              </Label>
              <Input
                id="size-h"
                type="number"
                value={localSize.height}
                onChange={(e) => handleSizeChange('height', e.target.value)}
                className="mt-1"
                min={10}
              />
            </div>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="rotation" className="text-sm font-semibold">
              Rotation
            </Label>
            <span className="text-xs text-muted-foreground">{Math.round(localRotation)}°</span>
          </div>
          <Input
            id="rotation"
            type="range"
            value={localRotation}
            onChange={(e) => handleRotationChange(e.target.value)}
            min={0}
            max={360}
            step={1}
            className="mt-2"
          />
        </div>

        {/* Opacity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="opacity" className="text-sm font-semibold">
              Opacity
            </Label>
            <span className="text-xs text-muted-foreground">{Math.round(localOpacity * 100)}%</span>
          </div>
          <Input
            id="opacity"
            type="range"
            value={localOpacity}
            onChange={(e) => handleOpacityChange(e.target.value)}
            min={0}
            max={1}
            step={0.01}
            className="mt-2"
          />
        </div>

        {/* Z-Index */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Layers</p>
            <span className="text-xs text-muted-foreground">Z: {node.zIndex ?? 0}</span>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdate(node.id, { zIndex: Math.max(0, (node.zIndex ?? 0) - 1) })}
              disabled={(node.zIndex ?? 0) === 0}
              title="Send backward"
              className="flex-1"
            >
              <FiArrowDown className="mr-2 h-4 w-4" />
              Send Back
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onUpdate(node.id, { zIndex: (node.zIndex ?? 0) + 1 })}
              title="Bring forward"
              className="flex-1"
            >
              <FiArrowUp className="mr-2 h-4 w-4" />
              Bring Forward
            </Button>
          </div>
        </div>

        {/* Asset Selection - Only show for ASSET type nodes */}
        {node.type === 'ASSET' && (
          <div className="space-y-2">
            <div className="text-sm font-semibold">Asset</div>
            <p className="text-xs text-muted-foreground">
              Select from your existing asset library. Asset uploads are not available in canvas mode.
            </p>
            {hasAsset ? (
              <div className="space-y-2">
                {/* Asset Preview */}
                <div className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex size-16 shrink-0 items-center justify-center rounded bg-muted">
                    {(asset.iconUrl ?? asset.imageUrl) ? (
                      <img
                        src={asset.iconUrl ?? asset.imageUrl}
                        alt={asset.name}
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <FiImage className="size-8 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{asset.name}</p>
                    <p className="text-xs text-muted-foreground">{asset.type}</p>
                  </div>
                </div>
                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setIsAssetPickerOpen(true)}
                  >
                    Change Asset
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearAsset}>
                    Clear
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsAssetPickerOpen(true)}
              >
                <FiImage className="mr-2" />
                Select Asset
              </Button>
            )}
          </div>
        )}

        {/* References */}
        {node.itemId ? (
          <div>
            <div className="text-xs text-muted-foreground">Item ID</div>
            <p className="mt-1 truncate text-sm font-medium">{node.itemId}</p>
          </div>
        ) : null}
        {node.assetId ? (
          <div>
            <div className="text-xs text-muted-foreground">Asset ID</div>
            <p className="mt-1 truncate text-sm font-medium">{node.assetId}</p>
          </div>
        ) : null}
        {node.subCanvasId ? (
          <div>
            <div className="text-xs text-muted-foreground">Sub-Canvas ID</div>
            <p className="mt-1 truncate text-sm font-medium">{node.subCanvasId}</p>
          </div>
        ) : null}
      </div>

      {/* Asset Picker Modal */}
      <AssetPickerModal
        isOpen={isAssetPickerOpen}
        onClose={() => setIsAssetPickerOpen(false)}
        onSelect={handleAssetSelect}
        selectedAssetId={node.assetId}
        filterTypes={[ASSET_TYPE.ICON, ASSET_TYPE.IMAGE]}
        allowUpload={false}
      />
    </div>
  );
}
