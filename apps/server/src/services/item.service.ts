import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';

import type { iTemplateItemWithChildren } from './template.service';

export interface iItemWithChildren {
  _id: string;
  workspaceId: string;
  name: string;
  description?: string;
  acquireDate?: Date;
  assetId?: string;
  parentId?: string | null;
  children: iItemWithChildren[];
  createdAt: Date;
  updatedAt: Date;
}

class ItemService {
  async buildItemHierarchy(workspaceId: string): Promise<iItemWithChildren[]> {
    const allItems = await WorkspaceItemModel.find({ workspaceId }).lean();

    const itemMap = new Map<string, iItemWithChildren>();
    const rootItems: iItemWithChildren[] = [];

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

  async checkCircularReference(itemId: string, newParentId: string): Promise<boolean> {
    const visited = new Set<string>();
    let currentId: string | null | undefined = newParentId;

    while (currentId) {
      if (currentId === itemId) {
        return true;
      }

      if (visited.has(currentId)) {
        break;
      }

      visited.add(currentId);

      const parent: { parentId?: string | null } | null =
        // eslint-disable-next-line no-await-in-loop
        await WorkspaceItemModel.findById(currentId).lean();
      currentId = parent?.parentId;
    }

    return false;
  }

  async deleteItemWithChildren(itemId: string): Promise<boolean> {
    const children = await WorkspaceItemModel.find({ parentId: itemId });

    const deletePromises = children.map(async (child) => this.deleteItemWithChildren(child._id));
    await Promise.all(deletePromises);

    await WorkspaceItemModel.findByIdAndDelete(itemId);
    return true;
  }

  async instantiateTemplateFromHierarchy(
    workspaceId: string,
    templateItem: iTemplateItemWithChildren,
    parentId?: string,
  ): Promise<iItemWithChildren> {
    const createdItem = await WorkspaceItemModel.create({
      workspaceId,
      name: templateItem.name,
      description: templateItem.description,
      assetId: templateItem.assetId,
      parentId: parentId ?? null,
    });

    const children: iItemWithChildren[] = [];

    if (templateItem.children && Array.isArray(templateItem.children)) {
      const childPromises = templateItem.children.map(async (childTemplate) =>
        this.instantiateTemplateFromHierarchy(workspaceId, childTemplate, createdItem._id),
      );
      children.push(...(await Promise.all(childPromises)));
    }

    return {
      _id: createdItem._id,
      workspaceId: createdItem.workspaceId,
      name: createdItem.name,
      description: createdItem.description,
      acquireDate: createdItem.acquireDate,
      assetId: createdItem.assetId,
      parentId: createdItem.parentId,
      children,
      createdAt: createdItem.createdAt,
      updatedAt: createdItem.updatedAt,
    };
  }
}

export const itemService = new ItemService();
