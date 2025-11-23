import { useState } from 'react';

import { TEMPLATE_SCOPE } from '@shurai/shared';
import type { TemplateScope } from '@shurai/shared';

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
import { SingleSelect } from '@~/components/ui/select';
import { Textarea } from '@~/components/ui/textarea';
import { useCreateTemplate } from '@~/features/templates';

interface iCreateTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: Array<{
    _id: string;
    name: string;
    description?: string;
    assetId?: string;
    children?: unknown[];
    [key: string]: unknown;
  }>;
}

function convertItemToTemplateStructure(item: {
  _id: string;
  name: string;
  description?: string;
  assetId?: string;
  children?: unknown[];
}): {
  name: string;
  description?: string;
  assetId?: string;
  children?: unknown[];
} {
  return {
    name: item.name,
    description: item.description,
    assetId: item.assetId,
    children:
      item.children && item.children.length > 0
        ? item.children.map((child) =>
            convertItemToTemplateStructure(
              child as {
                _id: string;
                name: string;
                description?: string;
                assetId?: string;
                children?: unknown[];
              },
            ),
          )
        : undefined,
  };
}

export function CreateTemplateModal({ isOpen, onClose, items }: iCreateTemplateModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [scope, setScope] = useState<TemplateScope>(TEMPLATE_SCOPE.PERSONAL);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);

  const { createTemplate, isPending } = useCreateTemplate();

  const itemOptions = items.map((item) => ({
    label: `${item.name}${item.children && item.children.length > 0 ? ` (${countItems(item)} ${countItems(item) === 1 ? 'item' : 'items'})` : ''}`,
    value: item._id,
  }));

  const scopeOptions = [
    { label: 'Personal - Only visible to you', value: TEMPLATE_SCOPE.PERSONAL },
    { label: 'Community - Visible to all users', value: TEMPLATE_SCOPE.COMMUNITY },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !selectedItemId) return;

    const selectedItem = findItemById(items, selectedItemId);
    if (!selectedItem) return;

    const rootItem = convertItemToTemplateStructure(selectedItem);

    createTemplate(
      {
        name: name.trim(),
        description: description.trim() || undefined,
        scope,
        rootItem,
      },
      {
        onSuccess: () => {
          setName('');
          setDescription('');
          setScope(TEMPLATE_SCOPE.PERSONAL);
          setSelectedItemId(null);
          onClose();
        },
      },
    );
  };

  const handleClose = () => {
    if (!isPending) {
      setName('');
      setDescription('');
      setScope(TEMPLATE_SCOPE.PERSONAL);
      setSelectedItemId(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Template from Workspace</DialogTitle>
          <DialogDescription>
            Select an item to create a template. The selected item and all its children will be included in the
            template.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-select">Root Item *</Label>
            <SingleSelect
              id="item-select"
              options={itemOptions}
              value={selectedItemId}
              onValueChange={(value) => setSelectedItemId(value ?? null)}
              placeholder="Select an item to template"
              isDisabled={isPending || items.length === 0}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-name">Template Name *</Label>
            <Input
              id="template-name"
              placeholder="e.g., Gaming Setup, Workstation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-description">Description</Label>
            <Textarea
              id="template-description"
              placeholder="Describe what this template is for..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="template-scope">Scope *</Label>
            <SingleSelect
              id="template-scope"
              options={scopeOptions}
              value={scope}
              onValueChange={(value: string | null) => setScope((value as TemplateScope) ?? TEMPLATE_SCOPE.PERSONAL)}
              isDisabled={isPending}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending || !name.trim() || !selectedItemId}>
              {isPending ? 'Creating...' : 'Create Template'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function findItemById(
  items: Array<{ _id: string; children?: unknown[] }>,
  itemId: string,
): { _id: string; name: string; description?: string; assetId?: string; children?: unknown[] } | null {
  for (const item of items) {
    if (item._id === itemId) {
      return item as { _id: string; name: string; description?: string; assetId?: string; children?: unknown[] };
    }
    if (item.children && item.children.length > 0) {
      const found = findItemById(item.children as Array<{ _id: string; children?: unknown[] }>, itemId);
      if (found) return found;
    }
  }
  return null;
}

function countItems(item: { children?: unknown[] }): number {
  if (!item.children || item.children.length === 0) return 1;
  return 1 + item.children.reduce((sum: number, child) => sum + countItems(child as { children?: unknown[] }), 0);
}
