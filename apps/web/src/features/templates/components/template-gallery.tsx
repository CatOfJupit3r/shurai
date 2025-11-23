import { useState } from 'react';
import { FiSearch } from 'react-icons/fi';
import { HiOutlineCube } from 'react-icons/hi';

import type { TemplateScope } from '@shurai/shared';

import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@~/components/ui/empty';
import { Input } from '@~/components/ui/input';
import { Skeleton } from '@~/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@~/components/ui/tabs';
import { useDeleteTemplate, useTemplatesList } from '@~/features/templates';

import { TemplateCard } from './template-card';

interface iTemplateGalleryProps {
  currentUserId: string;
  onSelectTemplate: (templateId: string) => void;
}

function TemplateListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 space-y-2">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-full" />
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

function getEmptyTitle(searchQuery: string, activeTab: 'ALL' | TemplateScope) {
  if (searchQuery) return 'No templates found';
  if (activeTab === 'ALL') return 'No templates yet';
  return `No ${activeTab.toLowerCase()} templates`;
}

export function TemplateGallery({ currentUserId, onSelectTemplate }: iTemplateGalleryProps) {
  const [activeTab, setActiveTab] = useState<'ALL' | TemplateScope>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const scope = activeTab === 'ALL' ? undefined : activeTab;
  const { templates, isPending, error } = useTemplatesList(scope);
  const { deleteTemplate, isPending: isDeleting } = useDeleteTemplate();

  const filteredTemplates = searchQuery
    ? templates.filter(
        (template) =>
          template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          template.description?.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : templates;

  const handleDelete = (templateId: string) => {
    // eslint-disable-next-line no-alert
    if (window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      deleteTemplate({ templateId });
    }
  };

  if (isPending) {
    return <TemplateListSkeleton />;
  }

  if (error) {
    return (
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <HiOutlineCube className="size-10" />
          </EmptyMedia>
          <EmptyTitle>Failed to load templates</EmptyTitle>
          <EmptyDescription>There was an error loading templates. Please try again later.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'ALL' | TemplateScope)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-96">
            <TabsTrigger value="ALL">All Templates</TabsTrigger>
            <TabsTrigger value="PERSONAL">Personal</TabsTrigger>
            <TabsTrigger value="COMMUNITY">Community</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="relative w-full sm:w-64">
          <FiSearch className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {filteredTemplates.length === 0 ? (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <HiOutlineCube className="size-10" />
            </EmptyMedia>
            <EmptyTitle>{getEmptyTitle(searchQuery, activeTab)}</EmptyTitle>
            <EmptyDescription>
              {searchQuery
                ? 'Try adjusting your search query'
                : 'Create templates from your workspaces to reuse item structures'}
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template._id}
              template={template}
              currentUserId={currentUserId}
              onSelect={onSelectTemplate}
              onDelete={handleDelete}
              isDeleting={isDeleting}
            />
          ))}
        </div>
      )}
    </div>
  );
}
