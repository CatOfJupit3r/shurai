import { useState } from 'react';
import { FiUpload } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@~/components/ui/dialog';
import { Input } from '@~/components/ui/input';
import { Label } from '@~/components/ui/label';
import { Textarea } from '@~/components/ui/textarea';

import useCreateAsset from '../hooks/use-create-asset';

type AssetType = 'ICON' | 'IMAGE' | 'COVER' | 'THEME_PRESET';

interface iAssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AssetUploadModal({ isOpen, onClose }: iAssetUploadModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<AssetType>('IMAGE');
  const [iconUrl, setIconUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('');
  const [secondaryColor, setSecondaryColor] = useState('');
  const [accentColor, setAccentColor] = useState('');

  const { createAsset, isPending } = useCreateAsset();

  const handleClose = () => {
    setName('');
    setDescription('');
    setType('IMAGE');
    setIconUrl('');
    setImageUrl('');
    setPrimaryColor('');
    setSecondaryColor('');
    setAccentColor('');
    onClose();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const themeConfig =
      primaryColor || secondaryColor || accentColor
        ? {
            primaryColor: primaryColor || undefined,
            secondaryColor: secondaryColor || undefined,
            accentColor: accentColor || undefined,
          }
        : undefined;

    createAsset(
      {
        name,
        description: description || undefined,
        type,
        iconUrl: iconUrl || undefined,
        imageUrl: imageUrl || undefined,
        themeConfig,
      },
      {
        onSuccess: () => {
          handleClose();
        },
      },
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription>
            Add a new asset to your library. Assets can be icons, images, covers, or theme presets used throughout your
            workspaces.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My awesome asset"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your asset..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type *</Label>
              <select
                id="type"
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                required
              >
                <option value="ICON">Icon</option>
                <option value="IMAGE">Image</option>
                <option value="COVER">Cover</option>
                <option value="THEME_PRESET">Theme Preset</option>
              </select>
            </div>
          </div>

          {/* URLs */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="iconUrl">Icon URL</Label>
              <Input
                id="iconUrl"
                type="url"
                value={iconUrl}
                onChange={(e) => setIconUrl(e.target.value)}
                placeholder="https://example.com/icon.png"
              />
              <p className="text-xs text-muted-foreground">URL to a small icon representation of this asset</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl">Image URL</Label>
              <Input
                id="imageUrl"
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
              />
              <p className="text-xs text-muted-foreground">URL to the full-size image or cover</p>
            </div>
          </div>

          {/* Theme Configuration */}
          {type === 'THEME_PRESET' && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium">Theme Colors</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={primaryColor || '#000000'}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      type="text"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secondaryColor">Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={secondaryColor || '#000000'}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      type="text"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accentColor">Accent Color</Label>
                  <div className="flex gap-2">
                    <Input
                      id="accentColor"
                      type="color"
                      value={accentColor || '#000000'}
                      onChange={(e) => setAccentColor(e.target.value)}
                      className="h-10 w-14 p-1"
                    />
                    <Input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Upload Info */}
          <div className="rounded-lg border border-dashed p-4 text-center">
            <FiUpload className="mx-auto mb-2 size-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              File upload coming soon! For now, please provide URLs to your assets.
            </p>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name}>
              Create Asset
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
