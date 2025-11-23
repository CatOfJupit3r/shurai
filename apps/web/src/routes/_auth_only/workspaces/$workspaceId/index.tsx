import { createFileRoute, Link } from '@tanstack/react-router';
import { FiEdit, FiExternalLink, FiEye, FiEyeOff, FiMaximize2, FiSettings } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { tryCatch } from '@shurai/shared/helpers/std-utils';

import { Badge } from '@~/components/ui/badge';
import { Button } from '@~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@~/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import { useItemHierarchy, useWorkspace } from '@~/features/workspaces';
import { formatDateLong } from '@~/utils/date';

export const Route = createFileRoute('/_auth_only/workspaces/$workspaceId/')({
  component: RouteComponent,
  notFoundComponent: EmptyWorkspace,
  beforeLoad: async ({ context, params }) => {
    await tryCatch(async () =>
      Promise.all([
        context.queryClient.ensureQueryData(
          context.tanstackRPC.workspaces.getWorkspace.queryOptions({
            input: { workspaceId: params.workspaceId },
          }),
        ),
        context.queryClient.ensureQueryData(
          context.tanstackRPC.items.getItemHierarchy.queryOptions({
            input: { workspaceId: params.workspaceId },
          }),
        ),
      ]),
    );
  },
});

function EmptyWorkspace() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Workspace not found</EmptyTitle>
          <EmptyDescription>This workspace doesn&apos;t exist or you don&apos;t have access to it.</EmptyDescription>
        </EmptyHeader>
        <Link to="/dashboard">
          <Button>Back to Dashboard</Button>
        </Link>
      </Empty>
    </div>
  );
}
function WorkspaceDetailSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Skeleton className="mb-4 h-12 w-3/4" />
        <Skeleton className="mb-8 h-6 w-1/2" />
        <div className="grid gap-6 md:grid-cols-2">
          <Skeleton className="h-64" />
          <Skeleton className="h-64" />
        </div>
      </div>
    </div>
  );
}

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const { workspace, isPending: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { items, isPending: isLoadingItems } = useItemHierarchy(workspaceId);

  if (isLoadingWorkspace || isLoadingItems) {
    return <WorkspaceDetailSkeleton />;
  }

  if (!workspace) return <EmptyWorkspace />;

  const isPublic = workspace.visibility === 'PUBLIC';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto max-w-6xl px-4 py-6">
          <div className="mb-6">
            <Link to="/dashboard">
              <Button variant="ghost" size="sm">
                ← Back to Dashboard
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-3">
                <h1 className="text-4xl font-bold tracking-tight">{workspace.title}</h1>
                <Badge variant={isPublic ? 'default' : 'secondary'}>
                  {isPublic ? <FiEye /> : <FiEyeOff />}
                  {workspace.visibility}
                </Badge>
              </div>
              {!!workspace.description && <p className="text-lg text-muted-foreground">{workspace.description}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Edit your workspace or view it in canvas mode</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="default" className="w-full justify-start" size="lg" asChild>
                <Link to="/workspaces/$workspaceId/builder" params={{ workspaceId }}>
                  <FiEdit className="mr-2" />
                  Open Builder
                  <span className="ml-auto text-xs text-muted-foreground">Edit items and structure</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link to="/workspaces/$workspaceId/canvas" params={{ workspaceId }}>
                  <FiMaximize2 className="mr-2" />
                  Open Canvas
                  <span className="ml-auto text-xs text-muted-foreground">Visual layout editor</span>
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" size="lg" asChild>
                <Link to="/workspaces/$workspaceId/edit" params={{ workspaceId }}>
                  <FiSettings className="mr-2" />
                  Workspace Settings
                  <span className="ml-auto text-xs text-muted-foreground">Edit title, visibility, etc.</span>
                </Link>
              </Button>
              {isPublic && workspace.shareableSlug ? (
                <Button
                  variant="secondary"
                  className="w-full justify-start"
                  size="lg"
                  onClick={() => window.open(`/workspaces/${workspace.shareableSlug}`, '_blank')}
                >
                  <FiExternalLink className="mr-2" />
                  View Public Page
                  <span className="ml-auto text-xs text-muted-foreground">See what others see</span>
                </Button>
              ) : null}
            </CardContent>
          </Card>

          {/* Workspace Info */}
          <Card>
            <CardHeader>
              <CardTitle>Workspace Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-muted-foreground">
                <HiOutlineCube className="size-5" />
                <div>
                  <p className="font-medium text-foreground">{items.length} Items</p>
                  <p className="text-sm">Total items in this workspace</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Visibility</h3>
                <p className="text-sm text-muted-foreground">
                  {isPublic
                    ? 'This workspace is publicly shared and can be accessed via a shareable link.'
                    : 'This workspace is private and only visible to you.'}
                </p>
              </div>
              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Last Updated</h3>
                <p className="text-sm text-muted-foreground">{formatDateLong(workspace.updatedAt)}</p>
              </div>
              <div className="border-t pt-4">
                <h3 className="mb-2 font-semibold">Created</h3>
                <p className="text-sm text-muted-foreground">{formatDateLong(workspace.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
