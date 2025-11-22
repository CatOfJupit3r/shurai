import { useSortable } from '@dnd-kit/sortable';
import { FiChevronDown, FiChevronRight, FiMoreVertical, FiPlus } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { Button } from '@~/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@~/components/ui/dropdown-menu';

interface iSortableItemNodeProps {
  id: string;
  depth: number;
  isExpanded: boolean;
  isSelected: boolean;
  hasChildren: boolean;
  name: string;
  onToggleExpand: () => void;
  onSelect: () => void;
  onAddChild: () => void;
}

export function SortableItemNode({
  id,
  depth: _depth,
  isExpanded,
  isSelected,
  hasChildren,
  name,
  onToggleExpand,
  onSelect,
  onAddChild,
}: iSortableItemNodeProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group flex items-center gap-1 rounded-md px-2 py-1.5 transition-colors hover:bg-muted/50 ${
        isSelected ? 'bg-muted' : ''
      }`}
    >
      {/* Expand/Collapse Button */}
      <Button variant="ghost" size="sm" className="size-6 p-0" onClick={onToggleExpand} disabled={!hasChildren}>
        {hasChildren && !isExpanded ? <FiChevronRight className="size-3" /> : null}
        {hasChildren && isExpanded ? <FiChevronDown className="size-3" /> : null}
        {!hasChildren ? <span className="size-3" /> : null}
      </Button>

      {/* Drag Handle */}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <HiOutlineCube className="size-4 text-muted-foreground" />
      </div>

      {/* Item Name */}
      <button type="button" className="flex-1 truncate text-left text-sm" onClick={onSelect}>
        {name}
      </button>

      {/* Actions */}
      <div className="opacity-0 transition-opacity group-hover:opacity-100">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="size-6 p-0">
              <FiMoreVertical className="size-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onAddChild}>
              <FiPlus className="mr-2 size-4" />
              Add Child Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
