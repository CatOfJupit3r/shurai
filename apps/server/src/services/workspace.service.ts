import { generatePublicCode } from '@~/db/helpers';
import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';

class WorkspaceService {
  async generateUniqueSlug(): Promise<string> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
      const slug = generatePublicCode();
      // eslint-disable-next-line no-await-in-loop
      const existing = await WorkspaceModel.findOne({ shareableSlug: slug });

      if (!existing) {
        return slug;
      }
    }

    throw new Error('Failed to generate unique shareable slug');
  }

  async getWorkspaceWithStats(workspaceId: string) {
    const workspace = await WorkspaceModel.findById(workspaceId);
    if (!workspace) return null;

    const itemCount = await WorkspaceItemModel.countDocuments({ workspaceId });

    return {
      _id: workspace._id,
      userId: workspace.userId,
      title: workspace.title,
      description: workspace.description,
      coverAssetId: workspace.coverAssetId,
      visibility: workspace.visibility,
      shareableSlug: workspace.shareableSlug,
      createdAt: workspace.createdAt,
      updatedAt: workspace.updatedAt,
      itemCount,
      assetCount: 0,
    };
  }

  async deleteWorkspaceWithItems(workspaceId: string): Promise<boolean> {
    await WorkspaceItemModel.deleteMany({ workspaceId });
    await WorkspaceModel.findByIdAndDelete(workspaceId);
    return true;
  }
}

export const workspaceService = new WorkspaceService();
