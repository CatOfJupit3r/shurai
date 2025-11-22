import { createFileRoute } from '@tanstack/react-router';

import { AssetLibraryPanel } from '@~/features/assets';

export const Route = createFileRoute('/_auth_only/assets')({
  component: AssetsPage,
});

function AssetsPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Asset Library</h1>
        <p className="mt-2 text-muted-foreground">
          Manage your assets - icons, images, covers, and theme presets used across your workspaces.
        </p>
      </div>

      <AssetLibraryPanel />
    </div>
  );
}
