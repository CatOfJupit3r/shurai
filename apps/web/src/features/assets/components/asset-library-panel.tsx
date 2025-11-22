import { useState } from 'react';
import { FiEdit2, FiImage, FiPlus, FiSearch, FiTrash2 } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@~/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@~/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@~/components/ui/empty';
import { Input } from '@~/components/ui/input';
import { Skeleton } from '@~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@~/components/ui/tabs';

import useAssetsList from '../hooks/use-assets-list';
import useDeleteAsset from '../hooks/use-delete-asset';
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

export function AssetLibraryPanel() {
  const [activeTab, setActiveTab] = useState<'MY_ASSETS' | 'GLOBAL'>('MY_ASSETS');
  const [filterType, setFilterType] = useState<AssetType | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [assetToDelete, setAssetToDelete] = useState<iAsset | null>(null);

  const { assets: myAssets, isPending: isLoadingMyAssets } = useAssetsList(
    filterType !== 'ALL' ? filterType : undefined,
  );
  const { assets: globalAssets, isPending: isLoadingGlobalAssets } = useGlobalAssetsList(
    filterType !== 'ALL' ? filterType : undefined,
  );
  const { deleteAsset, isPending: isDeleting } = useDeleteAsset();

  const getActiveAssets = () => {
    const assets = activeTab === 'MY_ASSETS' ? myAssets : globalAssets;
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

  const handleDeleteAsset = (asset: iAsset) => {
    setAssetToDelete(asset);
  };

  const confirmDelete = () => {
    if (assetToDelete) {
      deleteAsset({ assetId: assetToDelete._id });
      setAssetToDelete(null);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Asset Library</CardTitle>
              <CardDescription>Manage your assets - icons, images, covers, and theme presets</CardDescription>
            </div>
            {activeTab === 'MY_ASSETS' && (
              <Button onClick={() => setIsUploadModalOpen(true)}>
                <FiPlus className="mr-2" />
                Create Asset
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'MY_ASSETS' | 'GLOBAL')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="MY_ASSETS">My Assets</TabsTrigger>
              <TabsTrigger value="GLOBAL">Global Library</TabsTrigger>
            </TabsList>

            <div className="mt-4 space-y-4">
              {/* Search and Filter */}
              <div className="flex gap-4">
                <div className="relative flex-1">
                  <FiSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Search assets..."
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
                  <option value="ICON">Icons</option>
                  <option value="IMAGE">Images</option>
                  <option value="COVER">Covers</option>
                  <option value="THEME_PRESET">Theme Presets</option>
                </select>
              </div>

              <TabsContent value="MY_ASSETS" className="mt-0">
                <AssetGrid
                  assets={assets}
                  isPending={isPending}
                  onDelete={handleDeleteAsset}
                  showActions
                  emptyMessage="You haven't created any assets yet"
                />
              </TabsContent>

              <TabsContent value="GLOBAL" className="mt-0">
                <AssetGrid
                  assets={assets}
                  isPending={isPending}
                  showActions={false}
                  emptyMessage="No global assets available"
                />
              </TabsContent>
            </div>
          </Tabs>
        </CardContent>
      </Card>

      {/* Upload Modal */}
      <AssetUploadModal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} />

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!assetToDelete} onOpenChange={() => setAssetToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Asset</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{assetToDelete?.name}&rdquo;? This action cannot be undone. Note
              that you cannot delete assets that are currently in use.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssetToDelete(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface iAssetGridProps {
  assets: iAsset[];
  isPending: boolean;
  onDelete?: (asset: iAsset) => void;
  showActions: boolean;
  emptyMessage: string;
}

function AssetGrid({ assets, isPending, onDelete, showActions, emptyMessage }: iAssetGridProps) {
  if (isPending) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
          <EmptyDescription>{emptyMessage}</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {assets.map((asset) => (
        <AssetCard key={asset._id} asset={asset} onDelete={onDelete} showActions={showActions} />
      ))}
    </div>
  );
}

interface iAssetCardProps {
  asset: iAsset;
  onDelete?: (asset: iAsset) => void;
  showActions: boolean;
}

function AssetCard({ asset, onDelete, showActions }: iAssetCardProps) {
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  return (
    <div
      className="group relative aspect-square rounded-lg border bg-card transition-all hover:shadow-md"
      onMouseEnter={() => setIsMenuVisible(true)}
      onMouseLeave={() => setIsMenuVisible(false)}
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
          <FiImage className="size-16 text-muted-foreground" />
        )}
      </div>

      {/* Asset Info */}
      <div className="absolute right-0 bottom-0 left-0 rounded-b-lg bg-gradient-to-t from-black/80 via-black/60 to-transparent p-3">
        <p className="truncate text-sm font-medium text-white">{asset.name}</p>
        <p className="text-xs text-gray-300">{asset.type}</p>
      </div>

      {/* Actions */}
      {showActions && isMenuVisible ? (
        <div className="absolute top-2 right-2 flex gap-1">
          <Button type="button" size="sm" variant="secondary" className="size-8 p-0">
            <FiEdit2 className="size-4" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="destructive"
            className="size-8 p-0"
            onClick={() => onDelete?.(asset)}
          >
            <FiTrash2 className="size-4" />
          </Button>
        </div>
      ) : null}
    </div>
  );
}
