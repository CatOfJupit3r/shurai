import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { FiChevronLeft, FiCopy, FiPlus, FiMaximize2 } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { Button } from '@~/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import { useApplyTemplate } from '@~/features/templates';
import { CreateTemplateModal } from '@~/features/templates/components/create-template-modal';
import { TemplatePreviewModal } from '@~/features/templates/components/template-preview-modal';
import {
  useCreateItem,
  useDeleteItem,
  useItemHierarchy,
  useMoveItem,
  useReorderItems,
  useUpdateItem,
  useWorkspace,
} from '@~/features/workspaces';
import { ItemDetailsPanel } from '@~/features/workspaces/components/item-details-panel';
import { ItemTreeView } from '@~/features/workspaces/components/item-tree-view';

export const Route = createFileRoute('/_auth_only/workspaces/$workspaceId/builder')({
  component: RouteComponent,
  beforeLoad: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.tanstackRPC.items.getItemHierarchy.queryOptions({
        input: { workspaceId: params.workspaceId },
      }),
    );
  },
});

function BuilderSkeleton() {
  return (
    <div className="flex h-[calc(100vh-64px)] gap-4">
      <div className="w-80 border-r bg-card p-4">
        <Skeleton className="mb-4 h-8 w-full" />
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      <div className="flex-1 p-6">
        <Skeleton className="h-full w-full rounded-lg" />
      </div>
    </div>
  );
}

function EmptyItems({ onAddItem }: { onAddItem: () => unknown }) {
  return (
    <Empty className="h-full">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HiOutlineCube className="size-10" />
        </EmptyMedia>
        <EmptyTitle>No items yet</EmptyTitle>
        <EmptyDescription>
          Start building your workspace by adding items.
          <br />
          Items can represent hardware, peripherals, or any custom elements.
        </EmptyDescription>
      </EmptyHeader>
      <Button size="lg" onClick={onAddItem}>
        <FiPlus />
        Add First Item
      </Button>
    </Empty>
  );
}

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const navigate = Route.useNavigate();

  const { workspace, isPending: isLoadingWorkspace, error: workspaceError } = useWorkspace(workspaceId);
  const { items, isPending: isLoadingItems, error: itemsError } = useItemHierarchy(workspaceId);

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [isDetailsPanelOpen, setIsDetailsPanelOpen] = useState(false);
  const [isCreateTemplateModalOpen, setIsCreateTemplateModalOpen] = useState(false);
  const [isApplyTemplateModalOpen, setIsApplyTemplateModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const { createItem } = useCreateItem();
  const { updateItem, isPending: isUpdating } = useUpdateItem();
  const { deleteItem, isPending: isDeleting } = useDeleteItem();
  const { moveItem, isPending: isMoving } = useMoveItem();
  const { reorderItems, isPending: isReordering } = useReorderItems();
  const { applyTemplate, isPending: isApplyingTemplate } = useApplyTemplate();

  const handleAddItem = (parentId?: string) => {
    createItem({
      workspaceId,
      name: 'New Item',
      parentId,
    });
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItemId(itemId);
    setIsDetailsPanelOpen(true);
  };

  const handleUpdateItem = (
    itemId: string,
    updates: {
      name?: string;
      description?: string;
      acquireDate?: Date;
      assetId?: string;
      parentId?: string | null;
    },
  ) => {
    updateItem({
      itemId,
      ...updates,
    });
  };

  const handleDeleteItem = (itemId: string) => {
    if (selectedItemId === itemId) {
      setSelectedItemId(null);
      setIsDetailsPanelOpen(false);
    }
    deleteItem({ itemId });
  };

  const handleMoveItem = (itemId: string, newParentId: string | null) => {
    moveItem({
      itemId,
      newParentId,
    });
  };

  const handleReorderItems = (parentId: string | null, itemOrders: Array<{ itemId: string; order: number }>) => {
    reorderItems({
      workspaceId,
      parentId,
      itemOrders,
    });
  };

  const handleBack = () => {
    void navigate({ to: '/dashboard' });
  };

  const handleApplyTemplate = (templateId: string) => {
    applyTemplate(
      {
        templateId,
        workspaceId,
      },
      {
        onSuccess: () => {
          setIsApplyTemplateModalOpen(false);
          setSelectedTemplateId(null);
        },
      },
    );
  };

  const handleOpenTemplateGallery = () => {
    void navigate({ to: '/templates' });
  };

  if (isLoadingWorkspace || isLoadingItems) {
    return (
      <div className="min-h-screen bg-background">
        <BuilderSkeleton />
      </div>
    );
  }

  if (workspaceError || itemsError || !workspace) {
    return (
      <div className="min-h-screen bg-background">
        <Empty>
          <EmptyHeader>
            <EmptyTitle>Failed to load workspace</EmptyTitle>
            <EmptyDescription>There was an error loading the workspace. Please try again later.</EmptyDescription>
          </EmptyHeader>
          <Button onClick={handleBack}>
            <FiChevronLeft />
            Back to Dashboard
          </Button>
        </Empty>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={handleBack}>
              <FiChevronLeft />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">{workspace.title}</h1>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={async () => navigate({ to: '/workspaces/$workspaceId/canvas', params: { workspaceId } })}
            >
              <FiMaximize2 />
              Canvas View
            </Button>
            {items.length > 0 && (
              <Button variant="outline" onClick={() => setIsCreateTemplateModalOpen(true)}>
                <FiCopy />
                Create Template
              </Button>
            )}
            <Button variant="outline" onClick={handleOpenTemplateGallery}>
              Apply Template
            </Button>
            <Button onClick={() => handleAddItem()}>
              <FiPlus />
              Add Item
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-73px)]">
        {/* Item Tree Sidebar */}
        <div className="w-80 overflow-y-auto border-r bg-card">
          {items.length === 0 ? (
            <div className="p-6">
              <EmptyItems onAddItem={() => handleAddItem()} />
            </div>
          ) : (
            <ItemTreeView
              items={items}
              selectedItemId={selectedItemId}
              onSelectItem={handleSelectItem}
              onAddItem={handleAddItem}
              onMoveItem={handleMoveItem}
              onReorderItems={handleReorderItems}
              isLoading={isMoving || isReordering}
            />
          )}
        </div>

        {/* Canvas/Preview Area */}
        <div className="flex-1 overflow-y-auto bg-muted/20 p-6">
          {items.length === 0 ? (
            <EmptyItems onAddItem={() => handleAddItem()} />
          ) : (
            <div className="mx-auto max-w-4xl">
              <div className="rounded-lg border bg-card p-6 shadow-sm">
                <h2 className="mb-4 text-lg font-semibold">Workspace Preview</h2>
                <p className="text-muted-foreground">
                  Select an item from the tree to view and edit its details.
                  <br />
                  You can drag and drop items to reorganize the hierarchy.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Details Panel */}
        {!!(isDetailsPanelOpen && selectedItemId) && (
          <ItemDetailsPanel
            workspaceId={workspaceId}
            itemId={selectedItemId}
            onClose={() => {
              setIsDetailsPanelOpen(false);
              setSelectedItemId(null);
            }}
            onUpdate={handleUpdateItem}
            onDelete={handleDeleteItem}
            isUpdating={isUpdating}
            isDeleting={isDeleting}
          />
        )}
      </div>

      {/* Create Template Modal */}
      <CreateTemplateModal
        isOpen={isCreateTemplateModalOpen}
        onClose={() => setIsCreateTemplateModalOpen(false)}
        items={items}
      />

      {/* Apply Template Preview Modal */}
      {!!selectedTemplateId && (
        <TemplatePreviewModal
          isOpen={isApplyTemplateModalOpen}
          onClose={() => {
            setIsApplyTemplateModalOpen(false);
            setSelectedTemplateId(null);
          }}
          templateId={selectedTemplateId}
          onApply={handleApplyTemplate}
          isApplying={isApplyingTemplate}
        />
      )}
    </div>
  );
}
