import { useState } from 'react';
import { FiCheck, FiImage, FiPlus, FiSearch } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@~/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@~/components/ui/empty';
import { Input } from '@~/components/ui/input';
import { Skeleton } from '@~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@~/components/ui/tabs';

import useAssetsList from '../hooks/use-assets-list';
import useGlobalAssetsList from '../hooks/use-global-assets-list';
import { AssetUploadModal } from './asset-upload-modal';

type AssetType = 'ICON' | 'IMAGE' | 'COVER' | 'THEME_PRESET';

interface iAsset {
  _id: string;
  name: string;
  type: AssetType;
  iconUrl?: string;
  imageUrl?: string;
  description?: string;
  isGlobal: boolean;
}

interface iAssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (assetId: string) => void;
  selectedAssetId?: string;
  filterTypes?: AssetType[];
  allowUpload?: boolean;
}

export function AssetPickerModal({
  isOpen,
  onClose,
  onSelect,
  selectedAssetId,
  filterTypes,
  allowUpload = true,
}: iAssetPickerModalProps) {
  const [activeTab, setActiveTab] = useState<'MY_ASSETS' | 'GLOBAL'>('MY_ASSETS');
  const [filterType, setFilterType] = useState<AssetType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const { assets: myAssets, isPending: isLoadingMyAssets } = useAssetsList(
    filterType !== 'ALL' ? filterType : undefined,
  );
  const { assets: globalAssets, isPending: isLoadingGlobalAssets } = useGlobalAssetsList(
    filterType !== 'ALL' ? filterType : undefined,
  );

  const getActiveAssets = () => {
    let assets = activeTab === 'MY_ASSETS' ? myAssets : globalAssets;

    if (filterTypes && filterTypes.length > 0) {
      assets = assets.filter((asset) => filterTypes.includes(asset.type));
    }

    if (!searchQuery) return assets;

    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description?.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  };

  const getActivePending = () => (activeTab === 'MY_ASSETS' ? isLoadingMyAssets : isLoadingGlobalAssets);

  const assets = getActiveAssets();
  const isPending = getActivePending();

  const handleSelect = (assetId: string) => {
    onSelect(assetId);
    onClose();
  };

  const availableTypes: AssetType[] = filterTypes ?? ['ICON', 'IMAGE', 'COVER', 'THEME_PRESET'];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
          <DialogHeader>
            <DialogTitle>Select Asset</DialogTitle>
            <DialogDescription>
              {allowUpload
                ? 'Choose an asset from your library or the global collection. You can also create a new asset.'
                : 'Choose an asset from your library or the global collection. Asset uploads are disabled in canvas mode.'}
            </DialogDescription>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'MY_ASSETS' | 'GLOBAL')}>
            <div className="flex items-center justify-between gap-4">
              <TabsList className="grid w-64 grid-cols-2">
                <TabsTrigger value="MY_ASSETS">My Assets</TabsTrigger>
                <TabsTrigger value="GLOBAL">Global</TabsTrigger>
              </TabsList>

              {activeTab === 'MY_ASSETS' && allowUpload ? (
                <Button size="sm" onClick={() => setIsUploadModalOpen(true)}>
                  <FiPlus className="mr-2 size-4" />
                  New Asset
                </Button>
              ) : null}
            </div>

            {/* Search and Filter */}
            <div className="mt-4 flex gap-4">
              <div className="relative flex-1">
                <FiSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search assets by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as AssetType | 'ALL')}
                className="rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <option value="ALL">All Types</option>
                {availableTypes.includes('ICON') && <option value="ICON">Icons</option>}
                {availableTypes.includes('IMAGE') && <option value="IMAGE">Images</option>}
                {availableTypes.includes('COVER') && <option value="COVER">Covers</option>}
                {availableTypes.includes('THEME_PRESET') && <option value="THEME_PRESET">Theme Presets</option>}
              </select>
            </div>

            <TabsContent value="MY_ASSETS" className="mt-4 flex-1 overflow-auto">
              <AssetGrid
                assets={assets}
                isPending={isPending}
                selectedAssetId={selectedAssetId}
                onSelect={handleSelect}
              />
            </TabsContent>

            <TabsContent value="GLOBAL" className="mt-4 flex-1 overflow-auto">
              <AssetGrid
                assets={assets}
                isPending={isPending}
                selectedAssetId={selectedAssetId}
                onSelect={handleSelect}
              />
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upload Modal */}
      <AssetUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />
    </>
  );
}

interface iAssetGridProps {
  assets: iAsset[];
  isPending: boolean;
  selectedAssetId?: string;
  onSelect: (assetId: string) => void;
}

function AssetGrid({ assets, isPending, selectedAssetId, onSelect }: iAssetGridProps) {
  if (isPending) {
    return (
      <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((i) => (
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
          <EmptyDescription>Try adjusting your search or filter criteria.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4 md:grid-cols-4 lg:grid-cols-5">
      {assets.map((asset) => (
        <button
          key={asset._id}
          type="button"
          className={`group relative aspect-square rounded-lg border-2 transition-all hover:border-primary hover:shadow-md ${
            selectedAssetId === asset._id ? 'border-primary bg-primary/10' : 'border-border'
          }`}
          onClick={() => onSelect(asset._id)}
        >
          {/* Asset Preview */}
          <div className="flex h-full flex-col items-center justify-center p-4">
            {(asset.iconUrl ?? asset.imageUrl) ? (
              <img
                src={asset.iconUrl ?? asset.imageUrl}
                alt={asset.name}
                className="max-h-full max-w-full object-contain"
              />
            ) : (
              <FiImage className="size-12 text-muted-foreground" />
            )}
          </div>

          {/* Asset Info */}
          <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/80 via-black/60 to-transparent p-2">
            <p className="truncate text-xs font-medium text-white">{asset.name}</p>
            <p className="text-[10px] text-gray-300">{asset.type}</p>
          </div>

          {/* Selected Indicator */}
          {selectedAssetId === asset._id && (
            <div className="absolute top-2 right-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <FiCheck className="size-4" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}
