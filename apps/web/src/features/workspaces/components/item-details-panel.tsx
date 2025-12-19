import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import { FiImage, FiTrash2, FiX } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@~/components/ui/dialog';
import { Input } from '@~/components/ui/input';
import { Label } from '@~/components/ui/label';
import { Separator } from '@~/components/ui/separator';
import { Skeleton } from '@~/components/ui/skeleton';
import { Textarea } from '@~/components/ui/textarea';
import { tanstackRPC } from '@~/utils/tanstack-orpc';

import { AssetSelectionModal } from './asset-selection-modal';

interface iItemDetailsPanelProps {
  workspaceId: string;
  itemId: string;
  onClose: () => void;
  onUpdate: (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      acquireDate?: Date;
      assetId?: string;
      parentId?: string | null;
    },
  ) => void;
  onDelete: (itemId: string) => void;
  isUpdating?: boolean;
  isDeleting?: boolean;
}

export function ItemDetailsPanel({
  workspaceId: _workspaceId,
  itemId,
  onClose,
  onUpdate,
  onDelete,
  isUpdating = false,
  isDeleting = false,
}: iItemDetailsPanelProps) {
  const { data: item, isPending } = useQuery(
    tanstackRPC.items.getItem.queryOptions({
      input: { itemId },
    }),
  );

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [acquireDate, setAcquireDate] = useState('');
  const [assetId, setAssetId] = useState<string | undefined>(undefined);
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Update local state when item changes
  useEffect(() => {
    if (item) {
      setName(item.name);
      setDescription(item.description ?? '');
      setAcquireDate(item.acquireDate ? new Date(item.acquireDate).toISOString().split('T')[0] : '');
      setAssetId(item.assetId);
      setHasChanges(false);
    }
  }, [item, itemId]);

  const handleSave = () => {
    if (!item) return;

    const updates: {
      name?: string;
      description?: string;
      acquireDate?: Date;
      assetId?: string;
    } = {};
    if (name !== item.name) updates.name = name;
    if (description !== (item.description ?? '')) updates.description = description;
    if (acquireDate !== (item.acquireDate ? new Date(item.acquireDate).toISOString().split('T')[0] : '')) {
      updates.acquireDate = acquireDate ? new Date(acquireDate) : undefined;
    }
    if (assetId !== item.assetId) updates.assetId = assetId;

    if (Object.keys(updates).length > 0) {
      onUpdate(itemId, updates);
      setHasChanges(false);
    }
  };

  const handleDelete = () => {
    onDelete(itemId);
    setIsDeleteDialogOpen(false);
    onClose();
  };

  const handleNameChange = (value: string) => {
    setName(value);
    setHasChanges(true);
  };

  const handleDescriptionChange = (value: string) => {
    setDescription(value);
    setHasChanges(true);
  };

  const handleDateChange = (value: string) => {
    setAcquireDate(value);
    setHasChanges(true);
  };

  const handleAssetSelect = (selectedAssetId: string) => {
    setAssetId(selectedAssetId);
    setHasChanges(true);
    setIsAssetModalOpen(false);
  };

  if (isPending) {
    return (
      <div className="w-96 border-l bg-card p-6">
        <div className="mb-6 flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="size-8" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  return (
    <>
      <div className="w-96 overflow-y-auto border-l bg-card">
        <div className="sticky top-0 z-10 border-b bg-card px-6 py-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Item Details</h2>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>
              <FiX />
            </Button>
          </div>
        </div>

        <div className="space-y-6 p-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" value={name} onChange={(e) => handleNameChange(e.target.value)} placeholder="Item name" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              placeholder="Item description..."
              rows={4}
            />
          </div>

          {/* Acquire Date */}
          <div className="space-y-2">
            <Label htmlFor="acquireDate">Acquire Date</Label>
            <Input
              id="acquireDate"
              type="date"
              value={acquireDate}
              onChange={(e) => handleDateChange(e.target.value)}
            />
          </div>

          {/* Asset Selection */}
          <div className="space-y-2">
            <Label htmlFor="asset-button">Asset</Label>
            <Button
              id="asset-button"
              type="button"
              variant="outline"
              className="w-full justify-start"
              onClick={() => setIsAssetModalOpen(true)}
            >
              <FiImage className="mr-2" />
              {assetId ? 'Change Asset' : 'Select Asset'}
            </Button>
            {!!assetId && <p className="text-xs text-muted-foreground">Asset ID: {assetId}</p>}
          </div>

          <Separator />

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" onClick={handleSave} disabled={!hasChanges || isUpdating}>
              Save Changes
            </Button>
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              <FiTrash2 className="mr-2" />
              Delete Item
            </Button>
          </div>
        </div>
      </div>

      {/* Asset Selection Modal */}
      <AssetSelectionModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSelect={handleAssetSelect}
        selectedAssetId={assetId}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Item</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete &ldquo;{item.name}&rdquo;? This will also delete all child items. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={isDeleting}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
