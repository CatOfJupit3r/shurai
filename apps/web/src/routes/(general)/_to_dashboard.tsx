import { createFileRoute, Navigate, Outlet, redirect } from '@tanstack/react-router';
import z from 'zod';

import { tryCatch } from '@shurai/shared/helpers/std-utils';

import PseudoPage from '@~/components/pseudo-page';
import { useMe, meQueryOptions } from '@~/features/user';

const toDashboardSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/(general)/_to_dashboard')({
  validateSearch: (search) => toDashboardSearchSchema.parse(search),
  beforeLoad: async ({ context, location }) => {
    const { data, error } = await tryCatch(async () => context.queryClient.ensureQueryData(meQueryOptions));
    if (error) throw redirect({ to: '/' });

    // If user is logged in, redirect to dashboard or the specified redirect location
    if (data?.session) {
      const searchParams = toDashboardSearchSchema.parse(location.search);
      const redirectTo = searchParams.redirect;
      if (redirectTo?.startsWith('/')) {
        throw redirect({ to: redirectTo });
      }
      throw redirect({ to: '/dashboard' });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { isLoggedIn, isPending } = useMe();
  const search = Route.useSearch();

  if (isPending) return <PseudoPage />;

  if (isLoggedIn) {
    const redirectTo = search.redirect;
    if (redirectTo?.startsWith('/')) {
      return <Navigate to={redirectTo} />;
    }
    return <Navigate to="/dashboard" />;
  }

  return <Outlet />;
}
