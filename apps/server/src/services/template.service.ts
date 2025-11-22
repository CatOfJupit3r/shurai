import { WorkspaceTemplateItemModel } from '@~/db/models/workspace-template-item.model';

export interface iTemplateItemWithChildren {
  _id: string;
  templateId: string;
  name: string;
  description?: string;
  assetId?: string;
  parentId?: string | null;
  children: iTemplateItemWithChildren[];
  createdAt: Date;
  updatedAt: Date;
}

interface iTemplateInputStructure {
  name: string;
  description?: string;
  assetId?: string;
  children?: iTemplateInputStructure[];
}

class TemplateService {
  async buildTemplateHierarchy(templateId: string): Promise<iTemplateItemWithChildren[]> {
    const allItems = await WorkspaceTemplateItemModel.find({ templateId }).lean();

    const itemMap = new Map<string, iTemplateItemWithChildren>();
    const rootItems: iTemplateItemWithChildren[] = [];

    for (const item of allItems) {
      itemMap.set(item._id, {
        ...item,
        children: [],
      });
    }

    for (const item of allItems) {
      const itemWithChildren = itemMap.get(item._id);
      if (!itemWithChildren) {
        // Item not found in map, skip
      } else if (!item.parentId) {
        rootItems.push(itemWithChildren);
      } else {
        const parent = itemMap.get(item.parentId);
        if (parent) {
          parent.children.push(itemWithChildren);
        } else {
          rootItems.push(itemWithChildren);
        }
      }
    }

    return rootItems;
  }

  async getRootTemplateItem(templateId: string): Promise<iTemplateItemWithChildren | null> {
    const hierarchy = await this.buildTemplateHierarchy(templateId);
    return hierarchy.length > 0 ? hierarchy[0] : null;
  }

  async deleteTemplateItems(templateId: string): Promise<boolean> {
    await WorkspaceTemplateItemModel.deleteMany({ templateId });
    return true;
  }

  async createTemplateItemsFromStructure(
    templateId: string,
    structure: iTemplateInputStructure,
    parentId?: string,
  ): Promise<string> {
    const createdItem = await WorkspaceTemplateItemModel.create({
      templateId,
      name: structure.name,
      description: structure.description,
      assetId: structure.assetId,
      parentId: parentId ?? null,
    });

    if (structure.children && Array.isArray(structure.children)) {
      const childPromises = structure.children.map(async (child) =>
        this.createTemplateItemsFromStructure(templateId, child, createdItem._id),
      );
      await Promise.all(childPromises);
    }

    return createdItem._id;
  }
}

export const templateService = new TemplateService();
