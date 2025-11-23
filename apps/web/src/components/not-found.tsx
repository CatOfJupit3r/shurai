import { Link } from '@tanstack/react-router';
import { HiOutlineHome, HiOutlineSearch } from 'react-icons/hi';

import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
              <HiOutlineSearch className="size-5" />
            </div>
            <div>
              <CardTitle>Page Not Found</CardTitle>
              <CardDescription>404 - The page you&apos;re looking for doesn&apos;t exist</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            The page you&apos;re trying to access doesn&apos;t exist or may have been moved. Please check the URL or
            return to the home page.
          </p>

          <Button variant="default" asChild>
            <Link to="/">
              <HiOutlineHome className="mr-2 size-4" />
              Go Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
