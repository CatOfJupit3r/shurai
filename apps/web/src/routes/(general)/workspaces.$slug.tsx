import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { FiChevronDown, FiChevronRight } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { tryCatch } from '@shurai/shared/helpers/std-utils';

import { CopyButton } from '@~/components/copy-button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@~/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import { WorkspaceNotFound } from '@~/components/workspace-not-found';
import { usePublicItemHierarchy, usePublicWorkspace } from '@~/features/workspaces';

export const Route = createFileRoute('/(general)/workspaces/$slug')({
  component: RouteComponent,
  notFoundComponent: WorkspaceNotFound,
  beforeLoad: async ({ context, params }) => {
    await tryCatch(async () =>
      Promise.all([
        context.queryClient.ensureQueryData(
          context.tanstackRPC.workspaces.getWorkspaceBySlug.queryOptions({
            input: { slug: params.slug },
          }),
        ),
        context.queryClient.ensureQueryData(
          context.tanstackRPC.items.getPublicItemHierarchy.queryOptions({
            input: { slug: params.slug },
          }),
        ),
      ]),
    );
  },
});

interface iItemNodeProps {
  item: {
    _id: string;
    name: string;
    description?: string;
    acquireDate?: Date;
    children: iItemNodeProps['item'][];
  };
  level: number;
}

function ItemNode({ item, level }: iItemNodeProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = item.children && item.children.length > 0;

  return (
    <div className="space-y-1">
      <div
        className="flex items-center gap-2 rounded-md px-3 py-2 hover:bg-muted/50"
        style={{ paddingLeft: `${level * 1.5 + 0.75}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-muted-foreground hover:text-foreground"
          >
            {isExpanded ? <FiChevronDown className="size-4" /> : <FiChevronRight className="size-4" />}
          </button>
        ) : (
          <div className="size-4" />
        )}
        <HiOutlineCube className="size-4 text-muted-foreground" />
        <div className="flex-1">
          <p className="text-sm font-medium">{item.name}</p>
          {!!item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
          {!!item.acquireDate && (
            <p className="text-xs text-muted-foreground">Acquired: {new Date(item.acquireDate).toLocaleDateString()}</p>
          )}
        </div>
      </div>
      {!!(hasChildren && isExpanded) && (
        <div className="space-y-1">
          {item.children.map((child) => (
            <ItemNode key={child._id} item={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

function PublicWorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-4 h-12 w-3/4" />
        <Skeleton className="mb-8 h-6 w-1/2" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-96" />
          <Skeleton className="h-96" />
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { slug } = Route.useParams();
  const { workspace, isPending: isLoadingWorkspace, error: workspaceError } = usePublicWorkspace(slug);
  const { items, isPending: isLoadingItems, error: itemsError } = usePublicItemHierarchy(slug);

  if (isLoadingWorkspace || isLoadingItems) {
    return <PublicWorkspaceSkeleton />;
  }

  if (workspaceError ?? itemsError) {
    throw workspaceError ?? itemsError;
  }

  if (!workspace) {
    throw new Error('Workspace not found');
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="mb-2 text-4xl font-bold tracking-tight">{workspace.title}</h1>
              {!!workspace.description && <p className="text-lg text-muted-foreground">{workspace.description}</p>}
            </div>
            <CopyButton variant="outline" value={window.location.href}>
              Copy Link
            </CopyButton>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        {items.length === 0 ? (
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <HiOutlineCube className="size-10" />
              </EmptyMedia>
              <EmptyTitle>No items yet</EmptyTitle>
              <EmptyDescription>This workspace doesn&apos;t have any items to display.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Item Tree View */}
            <Card>
              <CardHeader>
                <CardTitle>Items</CardTitle>
                <CardDescription>
                  {items.length} {items.length === 1 ? 'item' : 'items'} in this workspace
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-1">
                  {items.map((item) => (
                    <ItemNode key={item._id} item={item} level={0} />
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Workspace Info */}
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="mb-2 font-semibold">Visibility</h3>
                  <p className="text-sm text-muted-foreground">This workspace is publicly shared</p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Last Updated</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(workspace.updatedAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <div>
                  <h3 className="mb-2 font-semibold">Created</h3>
                  <p className="text-sm text-muted-foreground">
                    {new Date(workspace.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
