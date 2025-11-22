import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import { useState } from 'react';
import { FiPlus } from 'react-icons/fi';

import { Button } from '@~/components/ui/button';
import type { ORPCOutputs } from '@~/utils/orpc';

import { SortableItemNode } from './sortable-item-node';

type ItemWithChildren = ORPCOutputs['items']['getItemHierarchy'][number];

interface iItemTreeViewProps {
  items: ItemWithChildren[];
  selectedItemId: string | null;
  onSelectItem: (itemId: string) => void;
  onAddItem: (parentId?: string) => void;
  onMoveItem: (itemId: string, newParentId: string | null) => void;
  onReorderItems: (parentId: string | null, itemOrders: Array<{ itemId: string; order: number }>) => void;
  isLoading?: boolean;
}

export function ItemTreeView({
  items,
  selectedItemId,
  onSelectItem,
  onAddItem,
  onMoveItem: _onMoveItem,
  onReorderItems: _onReorderItems,
  isLoading: _isLoading = false,
}: iItemTreeViewProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor),
  );

  const toggleExpanded = (itemId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      return next;
    });
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // For now, we'll handle simple reordering within the same parent
    // More complex drag-and-drop with parent changes can be added later
    console.log('Drag ended:', active.id, 'over', over.id);
  };

  const findItemById = (itemsList: ItemWithChildren[], id: string): ItemWithChildren | null => {
    for (const item of itemsList) {
      if (item._id === id) return item;
      const found = findItemById(item.children, id);
      if (found) return found;
    }
    return null;
  };

  const activeItem = activeId ? findItemById(items, activeId) : null;

  const renderItem = (item: ItemWithChildren, depth = 0) => {
    const isExpanded = expandedIds.has(item._id);
    const isSelected = selectedItemId === item._id;
    const hasChildren = item.children.length > 0;

    return (
      <div key={item._id}>
        <SortableItemNode
          id={item._id}
          depth={depth}
          isExpanded={isExpanded}
          isSelected={isSelected}
          hasChildren={hasChildren}
          name={item.name}
          onToggleExpand={() => toggleExpanded(item._id)}
          onSelect={() => onSelectItem(item._id)}
          onAddChild={() => onAddItem(item._id)}
        />
        {!!(hasChildren && isExpanded) && (
          <div className="ml-4">{item.children.map((child: ItemWithChildren) => renderItem(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-muted-foreground">ITEMS</h2>
        <Button variant="ghost" size="sm" onClick={() => onAddItem()}>
          <FiPlus className="size-4" />
        </Button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        modifiers={[restrictToVerticalAxis]}
      >
        <div className="space-y-1">{items.map((item) => renderItem(item))}</div>

        <DragOverlay>
          {activeItem ? (
            <div className="rounded-md border bg-card p-2 shadow-lg">
              <span className="text-sm font-medium">{activeItem.name}</span>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {items.length === 0 && (
        <div className="py-8 text-center">
          <p className="text-sm text-muted-foreground">No items yet</p>
        </div>
      )}
    </div>
  );
}
