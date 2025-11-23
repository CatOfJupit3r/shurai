import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import z from 'zod';

import { SignInForm, SignUpForm } from '@~/features/auth';

const authSearchSchema = z.object({
  redirect: z.string().optional().catch(undefined),
});

export const Route = createFileRoute('/(general)/_to_dashboard/auth')({
  component: RouteComponent,
  validateSearch: (search) => authSearchSchema.parse(search),
});

function RouteComponent() {
  const [shouldShowSignIn, setShouldShowSignIn] = useState(true);

  return shouldShowSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShouldShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShouldShowSignIn(true)} />
  );
}
