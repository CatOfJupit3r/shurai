import { FiUpload } from 'react-icons/fi';
import z from 'zod';

import { ASSET_TYPE } from '@shurai/shared';

import { Button } from '@~/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@~/components/ui/dialog';
import { useAppForm } from '@~/components/ui/field';

import useCreateAsset from '../hooks/use-create-asset';

interface iAssetUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ASSET_UPLOAD_SCHEMA = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum([ASSET_TYPE.ICON, ASSET_TYPE.IMAGE, ASSET_TYPE.COVER, ASSET_TYPE.THEME_PRESET]),
  iconUrl: z.union([z.string().url('Icon URL must be a valid URL'), z.literal('')]).optional(),
  imageUrl: z.union([z.string().url('Image URL must be a valid URL'), z.literal('')]).optional(),
  primaryColor: z.string().optional(),
  secondaryColor: z.string().optional(),
  accentColor: z.string().optional(),
});

type AssetUploadFormValues = z.infer<typeof ASSET_UPLOAD_SCHEMA>;

export function AssetUploadModal({ isOpen, onClose }: iAssetUploadModalProps) {
  const { createAsset, isPending } = useCreateAsset();

  const form = useAppForm({
    defaultValues: {
      name: '',
      description: '',
      type: ASSET_TYPE.IMAGE,
      iconUrl: '',
      imageUrl: '',
      primaryColor: '',
      secondaryColor: '',
      accentColor: '',
    } satisfies AssetUploadFormValues as AssetUploadFormValues,
    validators: {
      onSubmit: ASSET_UPLOAD_SCHEMA,
    },
    onSubmit: async ({ value, formApi }) => {
      const themeConfig =
        value.primaryColor || value.secondaryColor || value.accentColor
          ? {
              primaryColor: value.primaryColor ?? undefined,
              secondaryColor: value.secondaryColor ?? undefined,
              accentColor: value.accentColor ?? undefined,
            }
          : undefined;

      await createAsset({
        name: value.name,
        description: value.description ?? undefined,
        type: value.type,
        iconUrl: value.iconUrl ?? undefined,
        imageUrl: value.imageUrl ?? undefined,
        themeConfig,
      });
      formApi.reset();
      onClose();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Asset</DialogTitle>
          <DialogDescription>
            Add a new asset to your library. Assets can be icons, images, covers, or theme presets used throughout your
            workspaces.
          </DialogDescription>
        </DialogHeader>

        <form.AppForm>
          <form.Form>
            <form.AppField name="name">
              {(field) => <field.TextField label="Name" required disabled={isPending} />}
            </form.AppField>
            <form.AppField name="description">
              {(field) => (
                <field.TextareaField
                  label="Description"
                  disabled={isPending}
                  rows={3}
                  placeholder="Describe your asset..."
                />
              )}
            </form.AppField>
            <form.AppField name="type">
              {(field) => (
                <field.SelectField
                  label="Type"
                  options={[
                    { label: 'Icon', value: ASSET_TYPE.ICON },
                    { label: 'Image', value: ASSET_TYPE.IMAGE },
                    { label: 'Cover', value: ASSET_TYPE.COVER },
                    { label: 'Theme Preset', value: ASSET_TYPE.THEME_PRESET },
                  ]}
                  required
                  isDisabled={isPending}
                  isDOMTarget
                />
              )}
            </form.AppField>
            <form.AppField name="iconUrl">
              {(field) => (
                <field.TextField
                  label="Icon URL"
                  type="url"
                  placeholder="https://example.com/icon.png"
                  disabled={isPending}
                />
              )}
            </form.AppField>
            <form.AppField name="imageUrl">
              {(field) => (
                <field.TextField
                  label="Image URL"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  disabled={isPending}
                />
              )}
            </form.AppField>

            <form.Subscribe>
              {({ values }) =>
                values.type === ASSET_TYPE.THEME_PRESET ? (
                  <>
                    <form.AppField name="primaryColor">
                      {(field) => <field.TextField label="Primary Color" type="color" disabled={isPending} />}
                    </form.AppField>
                    <form.AppField name="secondaryColor">
                      {(field) => <field.TextField label="Secondary Color" type="color" disabled={isPending} />}
                    </form.AppField>
                    <form.AppField name="accentColor">
                      {(field) => <field.TextField label="Accent Color" type="color" disabled={isPending} />}
                    </form.AppField>
                  </>
                ) : null
              }
            </form.Subscribe>

            {/* Upload Info */}
            <div className="rounded-lg border border-dashed p-4 text-center">
              <FiUpload className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">
                File upload coming soon! For now, please provide URLs to your assets.
              </p>
            </div>
          </form.Form>
        </form.AppForm>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" disabled={isPending}>
              Close
            </Button>
          </DialogClose>
          <Button
            disabled={isPending}
            onClick={async () => {
              await form.handleSubmit();
            }}
          >
            {isPending ? 'Creating...' : 'Create Asset'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
