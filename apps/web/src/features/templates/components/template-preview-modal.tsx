import { useState } from 'react';
import { FiBox, FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { Button } from '@~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@~/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import { useTemplate } from '@~/features/templates';

interface iTemplatePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  onApply?: (templateId: string) => void;
  isApplying?: boolean;
  showApplyButton?: boolean;
}

interface iTemplateItemNode {
  name: string;
  description?: string;
  assetId?: string;
  children?: iTemplateItemNode[];
}

function TemplateItemNode({ item, level = 0 }: { item: iTemplateItemNode; level?: number }) {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted/50"
        style={{ paddingLeft: `${level * 1.5 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-center rounded-xs p-0.5 hover:bg-muted"
          >
            {isExpanded ? <FiChevronDown className="size-4" /> : <FiChevronRight className="size-4" />}
          </button>
        ) : (
          <div className="size-5" />
        )}
        <FiBox className="size-4 text-muted-foreground" />
        <span className="flex-1 text-sm">{item.name}</span>
        {!!hasChildren && (
          <span className="text-xs text-muted-foreground">
            {item.children?.length ?? 0} {(item.children?.length ?? 0) === 1 ? 'item' : 'items'}
          </span>
        )}
      </div>
      {!!(isExpanded && hasChildren && item.children) && (
        <div className="space-y-1">
          {item.children.map((child) => (
            <TemplateItemNode key={`${item.name}-${child.name}`} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function TemplatePreviewModal({
  isOpen,
  onClose,
  templateId,
  onApply,
  isApplying,
  showApplyButton = true,
}: iTemplatePreviewModalProps) {
  const { template, isPending, error } = useTemplate(templateId);

  const handleApply = () => {
    if (onApply) {
      onApply(templateId);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col">
        <DialogHeader>
          <DialogTitle>Template Preview</DialogTitle>
          <DialogDescription>Review the template structure before applying it to your workspace</DialogDescription>
        </DialogHeader>

        <div className="flex-1 space-y-4 overflow-y-auto">
          {!!isPending && (
            <div className="space-y-3">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
              <div className="space-y-2 pt-4">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-8 w-full" />
                ))}
              </div>
            </div>
          )}

          {!!error && (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant="icon">
                  <HiOutlineCube className="size-10" />
                </EmptyMedia>
                <EmptyTitle>Failed to load template</EmptyTitle>
                <EmptyDescription>There was an error loading the template details.</EmptyDescription>
              </EmptyHeader>
            </Empty>
          )}

          {!!template && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{template.name}</h3>
                {!!template.description && <p className="text-sm text-muted-foreground">{template.description}</p>}
              </div>

              <div className="rounded-lg border bg-card p-4">
                <h4 className="mb-3 text-sm font-medium">Template Structure</h4>
                <div className="space-y-1">
                  <TemplateItemNode item={template.rootItem} />
                </div>
              </div>

              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 dark:border-blue-900 dark:bg-blue-950">
                <p className="text-sm text-blue-900 dark:text-blue-100">
                  <strong>Note:</strong> Applying this template will create {countItems(template.rootItem)}{' '}
                  {countItems(template.rootItem) === 1 ? 'item' : 'items'} in your workspace.
                </p>
              </div>
            </div>
          )}
        </div>

        {!!showApplyButton && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose} disabled={isApplying}>
              Cancel
            </Button>
            <Button onClick={handleApply} disabled={(isApplying ?? false) || !template}>
              {isApplying ? 'Applying...' : 'Apply Template'}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

function countItems(item: { children?: unknown[] }): number {
  if (!item.children || item.children.length === 0) return 1;
  return 1 + item.children.reduce((sum: number, child) => sum + countItems(child as { children?: unknown[] }), 0);
}
