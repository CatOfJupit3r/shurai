import { Link } from '@tanstack/react-router';
import { FiEdit, FiExternalLink, FiEye, FiEyeOff } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import { Badge } from '@~/components/ui/badge';
import { Button } from '@~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@~/components/ui/card';

export interface iWorkspaceCardProps {
  workspace: {
    _id: string;
    title: string;
    description?: string;
    visibility: 'PUBLIC' | 'PRIVATE';
    shareableSlug?: string;
    itemCount: number;
    assetCount: number;
    updatedAt: Date;
  };
}

function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  if (diffMinutes > 0) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
  return 'just now';
}

export function WorkspaceCard({ workspace }: iWorkspaceCardProps) {
  const isPublic = workspace.visibility === 'PUBLIC';

  return (
    <Card className="group transition-shadow hover:shadow-md">
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <CardTitle className="truncate">{workspace.title}</CardTitle>
            <CardDescription className="mt-1 line-clamp-2">
              {workspace.description ?? 'No description provided'}
            </CardDescription>
          </div>
          <Badge variant={isPublic ? 'default' : 'secondary'} className="shrink-0">
            {isPublic ? <FiEye /> : <FiEyeOff />}
            {workspace.visibility}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <HiOutlineCube className="size-4" />
            <span>{workspace.itemCount} items</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <span>Updated {formatTimeAgo(workspace.updatedAt)}</span>
        </div>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Button variant="default" size="sm" className="flex-1" asChild>
          <Link to="/workspaces/$workspaceId/builder" params={{ workspaceId: workspace._id }}>
            <FiEdit />
            Edit
          </Link>
        </Button>
        {isPublic && workspace.shareableSlug ? (
          <Button
            variant="outline"
            size="sm"
            tooltip="View public page"
            onClick={() => window.open(`/public/${workspace.shareableSlug}`, '_blank')}
          >
            <FiExternalLink />
            Share
          </Button>
        ) : null}
      </CardFooter>
    </Card>
  );
}
