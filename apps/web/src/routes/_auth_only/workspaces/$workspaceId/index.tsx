import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_auth_only/workspaces/$workspaceId/')({
  component: RouteComponent,
  beforeLoad: async ({ context, params }) => {
    await context.queryClient.ensureQueryData(
      context.tanstackRPC.workspaces.getWorkspace.queryOptions({
        input: { workspaceId: params.workspaceId },
      }),
    );
  },
});

function RouteComponent() {
  return <Outlet />;
}
