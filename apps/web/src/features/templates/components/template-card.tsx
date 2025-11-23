import { FiClock, FiGlobe, FiLock, FiTrash2 } from 'react-icons/fi';

import { TEMPLATE_SCOPE } from '@shurai/shared';
import type { TemplateScope } from '@shurai/shared';

import { Badge } from '@~/components/ui/badge';
import { Button } from '@~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@~/components/ui/card';
import { formatDateShort } from '@~/utils/date';

interface iTemplateCardProps {
  template: {
    _id: string;
    name: string;
    description?: string;
    scope: TemplateScope;
    rootItem: {
      name: string;
      children?: unknown[];
    };
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };
  currentUserId: string;
  onSelect: (templateId: string) => void;
  onDelete?: (templateId: string) => void;
  isDeleting?: boolean;
}

function countItems(item: { children?: unknown[] }): number {
  if (!item.children || item.children.length === 0) return 1;
  return 1 + item.children.reduce((sum: number, child) => sum + countItems(child as { children?: unknown[] }), 0);
}

export function TemplateCard({ template, currentUserId, onSelect, onDelete, isDeleting }: iTemplateCardProps) {
  const isOwner = template.userId === currentUserId;
  const itemCount = countItems(template.rootItem);

  return (
    <Card className="group relative overflow-hidden transition-all hover:border-primary/50 hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 space-y-1">
            <CardTitle className="text-lg">{template.name}</CardTitle>
            {!!template.description && (
              <CardDescription className="line-clamp-2">{template.description}</CardDescription>
            )}
          </div>
          <Badge variant={template.scope === TEMPLATE_SCOPE.COMMUNITY ? 'default' : 'secondary'} className="shrink-0">
            {template.scope === TEMPLATE_SCOPE.COMMUNITY ? (
              <>
                <FiGlobe className="mr-1 size-3" />
                Community
              </>
            ) : (
              <>
                <FiLock className="mr-1 size-3" />
                Personal
              </>
            )}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <FiClock className="size-4" />
          <span>Updated {formatDateShort(template.updatedAt)}</span>
        </div>

        <div className="flex items-center justify-between gap-3 pt-2">
          <div className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? 'item' : 'items'}
          </div>
          <div className="flex gap-2">
            {!!(isOwner && onDelete) && (
              <Button variant="ghost" size="sm" onClick={() => onDelete(template._id)} disabled={isDeleting}>
                <FiTrash2 />
              </Button>
            )}
            <Button size="sm" onClick={() => onSelect(template._id)}>
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
