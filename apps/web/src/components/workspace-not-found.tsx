import { Link } from '@tanstack/react-router';
import { HiOutlineCube, HiOutlineHome } from 'react-icons/hi';

import { Button } from './ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from './ui/empty';

export function WorkspaceNotFound() {
  return (
    <div className="flex h-full items-center justify-center bg-background">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HiOutlineCube className="size-10" />
          </EmptyMedia>
          <EmptyTitle>Workspace not found</EmptyTitle>
          <EmptyDescription>
            This workspace doesn&apos;t exist or is private.
            <br />
            Please check the link and try again.
          </EmptyDescription>
        </EmptyHeader>
        <div className="flex gap-2">
          <Button asChild>
            <Link to="/">
              <HiOutlineHome className="mr-2 size-4" />
              Go Home
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
        </div>
      </Empty>
    </div>
  );
}
