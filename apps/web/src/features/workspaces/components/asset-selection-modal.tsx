import { useState } from 'react';
import { FiCheck, FiImage } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@~/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@~/components/ui/tabs';
import { useAssetsList } from '@~/features/workspaces';

interface AssetSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
  selectedAssetId?: string;
}

export function AssetSelectionModal({ isOpen, onClose, onSelect, selectedAssetId }: AssetSelectionModalProps) {
  const [activeTab, setActiveTab] = useState<'ICON' | 'IMAGE' | 'ALL'>('ALL');

  const { assets: allAssets, isPending: isLoadingAll } = useAssetsList();
  const { assets: iconAssets, isPending: isLoadingIcons } = useAssetsList('ICON');
  const { assets: imageAssets, isPending: isLoadingImages } = useAssetsList('IMAGE');

  const assets = activeTab === 'ALL' ? allAssets : activeTab === 'ICON' ? iconAssets : imageAssets;
  const isPending = activeTab === 'ALL' ? isLoadingAll : activeTab === 'ICON' ? isLoadingIcons : isLoadingImages;

  const handleSelect = (assetId: string) => {
    onSelect(assetId);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select Asset</DialogTitle>
          <DialogDescription>
            Choose an asset to associate with this item. Assets provide icons, imagery, and styling.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ALL">All</TabsTrigger>
            <TabsTrigger value="ICON">Icons</TabsTrigger>
            <TabsTrigger value="IMAGE">Images</TabsTrigger>
          </TabsList>

          <TabsContent value="ALL" className="mt-4">
            <AssetGrid
              assets={assets}
              isPending={isPending}
              selectedAssetId={selectedAssetId}
              onSelect={handleSelect}
            />
          </TabsContent>

          <TabsContent value="ICON" className="mt-4">
            <AssetGrid
              assets={assets}
              isPending={isPending}
              selectedAssetId={selectedAssetId}
              onSelect={handleSelect}
            />
          </TabsContent>

          <TabsContent value="IMAGE" className="mt-4">
            <AssetGrid
              assets={assets}
              isPending={isPending}
              selectedAssetId={selectedAssetId}
              onSelect={handleSelect}
            />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface AssetGridProps {
  assets: any[];
  isPending: boolean;
  selectedAssetId?: string;
  onSelect: (assetId: string) => void;
}

function AssetGrid({ assets, isPending, selectedAssetId, onSelect }: AssetGridProps) {
  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="aspect-square rounded-lg" />
        ))}
      </div>
    );
  }

  if (assets.length === 0) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>No assets found</EmptyTitle>
          <EmptyDescription>Create assets in your library to use them with items.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
      {assets.map((asset) => (
        <button
          key={asset._id}
          className={`group relative aspect-square rounded-lg border-2 transition-all hover:border-primary ${
            selectedAssetId === asset._id ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          onClick={() => onSelect(asset._id)}
        >
          {/* Asset Preview */}
          <div className="flex h-full flex-col items-center justify-center p-4">
            {asset.iconUrl || asset.imageUrl ? (
              <img
                src={asset.iconUrl || asset.imageUrl}
                alt={asset.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <FiImage className="size-12 text-muted-foreground" />
            )}
          </div>

          {/* Asset Name */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
            <p className="truncate text-xs text-white">{asset.name}</p>
          </div>

          {/* Selected Indicator */}
          {selectedAssetId === asset._id && (
            <div className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <FiCheck className="size-4" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
