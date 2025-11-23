/**
 * Canvas Nodes List Component
 * Accessible list view of canvas nodes with keyboard navigation
 */
import { useRef, useEffect } from 'react';
import { FiImage, FiBox, FiLayout } from 'react-icons/fi';

import useStableCallback from '@~/hooks/use-stable-callback';

import type { iCanvasNodeData } from './canvas-node';

interface iCanvasNodesListProps {
  nodes: iCanvasNodeData[];
  selectedNodeId: string | null;
  onSelectNode: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
  className?: string;
}

export function CanvasNodesList({
  nodes,
  selectedNodeId,
  onSelectNode,
  onDeleteNode,
  className = '',
}: iCanvasNodesListProps) {
  const selectedItemRef = useRef<HTMLButtonElement>(null);

  // Auto-scroll to selected item when it changes
  useEffect(() => {
    if (selectedNodeId && selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [selectedNodeId]);

  const getNodeIcon = useStableCallback((type: iCanvasNodeData['type']) => {
    switch (type) {
      case 'ASSET':
        return <FiImage className="size-4" aria-hidden="true" />;
      case 'ITEM':
        return <FiBox className="size-4" aria-hidden="true" />;
      case 'SUB_CANVAS':
        return <FiLayout className="size-4" aria-hidden="true" />;
      default:
        return <FiBox className="size-4" aria-hidden="true" />;
    }
  });

  const getNodeLabel = useStableCallback((node: iCanvasNodeData) => {
    const position = `at (${Math.round(node.position.x)}, ${Math.round(node.position.y)})`;
    const size = `${Math.round(node.size.width)}×${Math.round(node.size.height)}`;
    return `${node.type} node ${position}, size ${size}`;
  });

  const handleKeyDown = useStableCallback((e: React.KeyboardEvent<HTMLButtonElement>, nodeId: string) => {
    const currentIndex = nodes.findIndex((n) => n.id === nodeId);

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(currentIndex + 1, nodes.length - 1);
      if (nextIndex !== currentIndex) {
        onSelectNode(nodes[nextIndex].id);
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const prevIndex = Math.max(currentIndex - 1, 0);
      if (prevIndex !== currentIndex) {
        onSelectNode(nodes[prevIndex].id);
      }
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      e.preventDefault();
      if (onDeleteNode) {
        onDeleteNode(nodeId);
      }
    }
  });

  if (nodes.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <p className="text-sm text-muted-foreground">No nodes on canvas</p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="h-full overflow-y-auto">
        <div
          role="listbox"
          tabIndex={0}
          aria-label="Canvas nodes"
          aria-activedescendant={selectedNodeId ?? undefined}
          className="space-y-1 p-2"
        >
          {nodes.map((node) => {
            const isSelected = node.id === selectedNodeId;
            return (
              <button
                key={node.id}
                ref={isSelected ? selectedItemRef : null}
                type="button"
                id={node.id}
                role="option"
                aria-selected={isSelected}
                aria-label={getNodeLabel(node)}
                onClick={() => onSelectNode(node.id)}
                onKeyDown={(e) => handleKeyDown(e, node.id)}
                className={`flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left transition-colors focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:outline-none ${
                  isSelected
                    ? 'border-primary bg-primary/10 font-medium'
                    : 'border-border bg-card hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <div
                  className={`flex size-8 shrink-0 items-center justify-center rounded ${
                    isSelected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {getNodeIcon(node.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium">{node.type}</div>
                  <div className="text-xs text-muted-foreground">
                    {Math.round(node.position.x)}, {Math.round(node.position.y)} · {Math.round(node.size.width)}×
                    {Math.round(node.size.height)}
                  </div>
                </div>
                {isSelected ? (
                  <div className="text-xs text-primary" aria-hidden="true">
                    ●
                  </div>
                ) : null}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
