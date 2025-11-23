import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useEffect, useState } from 'react';
import { FiChevronLeft, FiEye, FiEyeOff, FiRefreshCw, FiTrash2 } from 'react-icons/fi';
import { LuTriangleAlert } from 'react-icons/lu';
import z from 'zod';

import { WORKSPACE_VISIBILITY } from '@shurai/shared/enums/workspace.enums';
import { tryCatch } from '@shurai/shared/helpers/std-utils';

import { toastORPCError } from '@~/components/toastifications';
import { Alert, AlertDescription } from '@~/components/ui/alert';
import { Badge } from '@~/components/ui/badge';
import { Button } from '@~/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@~/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@~/components/ui/empty';
import { useAppForm } from '@~/components/ui/field';
import { Label } from '@~/components/ui/label';
import { SingleSelect } from '@~/components/ui/select';
import { Skeleton } from '@~/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@~/components/ui/tabs';
import { useUpdateWorkspace, useWorkspace } from '@~/features/workspaces';

export const Route = createFileRoute('/_auth_only/workspaces/$workspaceId/edit')({
  component: RouteComponent,
  notFoundComponent: EmptyWorkspace,
  beforeLoad: async ({ context, params }) => {
    await tryCatch(async () =>
      context.queryClient.ensureQueryData(
        context.tanstackRPC.workspaces.getWorkspace.queryOptions({
          input: { workspaceId: params.workspaceId },
        }),
      ),
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

function WorkspaceEditSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <Skeleton className="mb-4 h-10 w-64" />
          <Skeleton className="h-6 w-48" />
        </div>
      </div>
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Skeleton className="mb-6 h-[400px] w-full" />
      </div>
    </div>
  );
}

function RouteComponent() {
  const { workspaceId } = Route.useParams();
  const navigate = useNavigate();
  const { tanstackRPC: rpc } = Route.useRouteContext();

  const { workspace, isPending: isLoadingWorkspace } = useWorkspace(workspaceId);
  const { updateWorkspace, isPending: isUpdating } = useUpdateWorkspace();

  const [isDeleteConfirmShown, setIsDeleteConfirmShown] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);

  const form = useAppForm({
    defaultValues: {
      title: workspace?.title ?? '',
      description: workspace?.description ?? '',
      visibility: workspace?.visibility ?? WORKSPACE_VISIBILITY.PRIVATE,
    },
    onSubmit: async ({ value }) => {
      updateWorkspace(
        {
          workspaceId,
          title: value.title,
          description: value.description || undefined,
          visibility: value.visibility,
        },
        {
          onSuccess: () => {
            void navigate({ to: '/workspaces/$workspaceId', params: { workspaceId } });
          },
        },
      );
    },
    validators: {
      onSubmit: z.object({
        title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
        description: z.string().max(1000, 'Description must be 1000 characters or less'),
        visibility: z.enum(['PUBLIC', 'PRIVATE']),
      }),
    },
  });

  useEffect(() => {
    if (workspace) {
      form.setFieldValue('title', workspace.title);
      form.setFieldValue('description', workspace.description ?? '');
      form.setFieldValue('visibility', workspace.visibility);
    }
  }, [workspace, form]);

  const handleRegenerateSlug = async () => {
    setIsRegenerating(true);
    try {
      await rpc.workspaces.regenerateSlug.call({ workspaceId });
    } catch (error) {
      toastORPCError('Failed to regenerate slug', error);
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteWorkspace = async () => {
    try {
      await rpc.workspaces.deleteWorkspace.call({ workspaceId });
      void navigate({ to: '/dashboard' });
    } catch (error) {
      toastORPCError('Failed to delete workspace', error);
    }
  };

  if (isLoadingWorkspace) {
    return <WorkspaceEditSkeleton />;
  }

  if (!workspace) return <EmptyWorkspace />;

  const isPublic = workspace.visibility === 'PUBLIC';

  const visibilityOptions = [
    { label: 'Private - Only visible to you', value: WORKSPACE_VISIBILITY.PRIVATE },
    { label: 'Public - Share via link', value: WORKSPACE_VISIBILITY.PUBLIC },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4">
            <Link to="/workspaces/$workspaceId" params={{ workspaceId }}>
              <Button variant="ghost" size="sm" className="gap-2">
                <FiChevronLeft className="h-4 w-4" />
                Back to Workspace
              </Button>
            </Link>
          </div>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">Edit Workspace</h1>
              <p className="mt-1 text-muted-foreground">Update workspace settings and visibility</p>
            </div>
            <Badge variant={isPublic ? 'default' : 'secondary'}>
              {isPublic ? <FiEye /> : <FiEyeOff />}
              {workspace.visibility}
            </Badge>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="danger">Danger Zone</TabsTrigger>
          </TabsList>

          {/* General Tab */}
          <TabsContent value="general" className="mt-6 space-y-4">
            <form.AppForm>
              <form.Form className="space-y-4 p-0 md:p-0">
                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Link to="/workspaces/$workspaceId" params={{ workspaceId }} className="flex-1">
                    <Button variant="outline" className="w-full">
                      Cancel
                    </Button>
                  </Link>
                  <form.SubmitButton className="flex-1" isDisabled={isUpdating}>
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </form.SubmitButton>
                </div>

                {/* Basic Information */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Basic Information</CardTitle>
                    <CardDescription className="text-xs">Update your workspace title and description</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <form.AppField name="title">
                      {(field) => (
                        <field.TextField
                          label="Title"
                          placeholder="My Gaming Setup"
                          maxLength={100}
                          required
                          description={`${field.state.value.length}/100 characters`}
                        />
                      )}
                    </form.AppField>
                    <form.AppField name="description">
                      {(field) => (
                        <field.TextareaField
                          label="Description"
                          placeholder="A brief description of your workspace..."
                          maxLength={1000}
                          rows={4}
                          description={`${field.state.value.length}/1000 characters`}
                        />
                      )}
                    </form.AppField>
                  </CardContent>
                </Card>

                {/* Visibility Settings */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Visibility</CardTitle>
                    <CardDescription className="text-xs">Control who can see your workspace</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <Label htmlFor="visibility">Visibility</Label>
                      <form.AppField name="visibility">
                        {(field) => (
                          <SingleSelect
                            options={visibilityOptions}
                            value={field.state.value}
                            onValueChange={(value) => field.handleChange(value as 'PUBLIC' | 'PRIVATE')}
                            placeholder="Select visibility"
                          />
                        )}
                      </form.AppField>
                    </div>
                    {isPublic && workspace.shareableSlug ? (
                      <div className="rounded-lg border bg-muted/30 p-4">
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium">Public Link</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleRegenerateSlug}
                            disabled={isRegenerating}
                          >
                            <FiRefreshCw className={isRegenerating ? 'animate-spin' : ''} />
                            Regenerate
                          </Button>
                        </div>
                        <code className="block rounded bg-background px-3 py-2 text-sm text-foreground">
                          {window.location.origin}/workspaces/{workspace.shareableSlug}
                        </code>
                        <p className="mt-2 text-xs text-muted-foreground">
                          Share this link to let others view your workspace
                        </p>
                      </div>
                    ) : null}
                  </CardContent>
                </Card>
              </form.Form>
            </form.AppForm>
          </TabsContent>

          {/* Danger Zone Tab */}
          <TabsContent value="danger" className="mt-6">
            <Card className="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-red-900 dark:text-red-400">
                  <LuTriangleAlert className="h-5 w-5" />
                  Delete Workspace
                </CardTitle>
                <CardDescription className="text-xs text-red-800 dark:text-red-300">
                  This action cannot be undone. Please be certain before proceeding.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <LuTriangleAlert />
                  <AlertDescription className="text-sm">
                    Deleting this workspace will permanently remove all items, assets, and settings. This cannot be
                    reversed.
                  </AlertDescription>
                </Alert>

                {!isDeleteConfirmShown ? (
                  <Button variant="destructive" onClick={() => setIsDeleteConfirmShown(true)} className="w-full">
                    <FiTrash2 />
                    Delete Workspace
                  </Button>
                ) : (
                  <div className="space-y-3 pt-2">
                    <p className="text-sm font-medium text-foreground">
                      Are you absolutely sure? This action cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={() => setIsDeleteConfirmShown(false)} className="flex-1">
                        Cancel
                      </Button>
                      <Button variant="destructive" onClick={handleDeleteWorkspace} className="flex-1">
                        <FiTrash2 />
                        Permanently Delete
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
