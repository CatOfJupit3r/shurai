import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { FiChevronLeft } from 'react-icons/fi';

import { tryCatch } from '@shurai/shared/helpers/std-utils';

import { Button } from '@~/components/ui/button';
import { TemplateGallery } from '@~/features/templates/components/template-gallery';
import { TemplatePreviewModal } from '@~/features/templates/components/template-preview-modal';
import { useMe } from '@~/features/user';

export const Route = createFileRoute('/_auth_only/templates')({
  component: RouteComponent,
  beforeLoad: async ({ context }) => {
    await tryCatch(async () =>
      Promise.all([
        context.queryClient.ensureQueryData(
          context.tanstackRPC.templates.listTemplates.queryOptions({
            input: {},
          }),
        ),
      ]),
    );
  },
});

function RouteComponent() {
  const navigate = Route.useNavigate();
  const { user } = useMe();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

  const handleBack = () => {
    void navigate({ to: '/dashboard' });
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const handleClosePreview = () => {
    setSelectedTemplateId(null);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <FiChevronLeft />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground">Templates</h1>
                <p className="mt-1 text-muted-foreground">Browse and manage your workspace templates</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <TemplateGallery currentUserId={user.id} onSelectTemplate={handleSelectTemplate} />
      </div>

      {/* Template Preview Modal */}
      {!!selectedTemplateId && (
        <TemplatePreviewModal
          isOpen={!!selectedTemplateId}
          onClose={handleClosePreview}
          templateId={selectedTemplateId}
          showApplyButton={false}
        />
      )}
    </div>
  );
}
