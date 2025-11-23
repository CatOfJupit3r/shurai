import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';

import { WORKSPACE_VISIBILITY } from '@shurai/shared/enums/workspace.enums';

import { Button } from '@~/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@~/components/ui/dialog';
import { Input } from '@~/components/ui/input';
import { Label } from '@~/components/ui/label';
import { SingleSelect } from '@~/components/ui/select';
import { Textarea } from '@~/components/ui/textarea';
import { useCreateWorkspace } from '@~/features/workspaces';

interface iCreateWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateWorkspaceModal({ isOpen, onClose }: iCreateWorkspaceModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [visibility, setVisibility] = useState<'PUBLIC' | 'PRIVATE'>(WORKSPACE_VISIBILITY.PRIVATE);

  const { createWorkspace, isPending } = useCreateWorkspace();
  const navigate = useNavigate();

  const visibilityOptions = [
    { label: 'Private - Only visible to you', value: WORKSPACE_VISIBILITY.PRIVATE },
    { label: 'Public - Share via link', value: WORKSPACE_VISIBILITY.PUBLIC },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) return;

    createWorkspace(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        visibility,
      },
      {
        onSuccess: (workspace) => {
          setTitle('');
          setDescription('');
          setVisibility(WORKSPACE_VISIBILITY.PRIVATE);
          onClose();
          void navigate({ to: '/workspaces/$workspaceId/builder', params: { workspaceId: workspace._id } });
        },
      },
    );
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setVisibility(WORKSPACE_VISIBILITY.PRIVATE);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Workspace</DialogTitle>
            <DialogDescription>
              Create a new workspace to showcase your PC setup. Add items, customize the look, and share it with others.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="My Gaming Setup"
                maxLength={100}
                autoFocus
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your workspace..."
                maxLength={1000}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <SingleSelect
                options={visibilityOptions}
                value={visibility}
                onValueChange={(value) => setVisibility(value as 'PUBLIC' | 'PRIVATE')}
                placeholder="Select visibility"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleCancel} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isPending}>
              {isPending ? 'Creating...' : 'Create Workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
