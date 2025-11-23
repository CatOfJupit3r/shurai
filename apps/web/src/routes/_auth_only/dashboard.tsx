import { createFileRoute } from '@tanstack/react-router';
import { FiPlus } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { Button } from '@~/components/ui/button';
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Skeleton } from '@~/components/ui/skeleton';
import { useWorkspacesList } from '@~/features/workspaces';
import { WorkspaceCard } from '@~/features/workspaces/components/workspace-card';

export const Route = createFileRoute('/_auth_only/dashboard')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await context.queryClient.ensureQueryData(context.tanstackRPC.workspaces.listWorkspaces.queryOptions());
  },
});

function WorkspaceListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-start justify-between gap-3">
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-4 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-8 flex-1 rounded-md" />
              <Skeleton className="h-8 w-20 rounded-md" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyWorkspaces() {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HiOutlineCube className="size-10" />
        </EmptyMedia>
        <EmptyTitle>No workspaces yet</EmptyTitle>
        <EmptyDescription>
          Create your first workspace to start showcasing your PC setup.
          <br />
          Add items, customize the look, and share it with others.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="lg" onClick={() => console.log('Create workspace')}>
          <FiPlus />
          Create Workspace
        </Button>
      </EmptyContent>
    </Empty>
  );
}

function WorkspacesContent() {
  const { workspaces, isPending, error } = useWorkspacesList();

  if (isPending) {
    return <WorkspaceListSkeleton />;
  }

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyTitle>Failed to load workspaces</EmptyTitle>
          <EmptyDescription>There was an error loading your workspaces. Please try again later.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  if (workspaces.length === 0) {
    return <EmptyWorkspaces />;
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {workspaces.map((workspace) => (
        <WorkspaceCard key={workspace._id} workspace={workspace} />
      ))}
    </div>
  );
}

function RouteComponent() {
  const { workspaces, isPending } = useWorkspacesList();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Workspaces</h1>
              <p className="mt-1 text-muted-foreground">
                {!isPending && workspaces.length > 0
                  ? `Manage your ${workspaces.length} workspace${workspaces.length === 1 ? '' : 's'}`
                  : 'Create and manage your PC workspaces'}
              </p>
            </div>
            <Button onClick={() => console.log('Create workspace')}>
              <FiPlus />
              New Workspace
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <WorkspacesContent />
      </div>
    </div>
  );
}
