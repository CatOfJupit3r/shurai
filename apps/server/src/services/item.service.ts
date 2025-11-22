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
  order: number;
  children: iItemWithChildren[];
  createdAt: Date;
  updatedAt: Date;
}

class ItemService {
  async buildItemHierarchy(workspaceId: string): Promise<iItemWithChildren[]> {
    const allItems = await WorkspaceItemModel.find({ workspaceId }).sort({ order: 1 }).lean();

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

    rootItems.sort((a, b) => a.order - b.order);
    for (const root of rootItems) {
      this.sortChildren(root);
    }

    return rootItems;
  }

  private sortChildren(item: iItemWithChildren) {
    item.children.sort((a, b) => a.order - b.order);
    for (const child of item.children) {
      this.sortChildren(child);
    }
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
    const order = await this.getNextOrderForParent(workspaceId, parentId ?? null);

    const createdItem = await WorkspaceItemModel.create({
      workspaceId,
      name: templateItem.name,
      description: templateItem.description,
      assetId: templateItem.assetId,
      parentId: parentId ?? null,
      order,
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
      order: createdItem.order,
      children,
      createdAt: createdItem.createdAt,
      updatedAt: createdItem.updatedAt,
    };
  }

  async getNextOrderForParent(workspaceId: string, parentId: string | null): Promise<number> {
    const lastItem = await WorkspaceItemModel.findOne({
      workspaceId,
      parentId: parentId ?? null,
    })
      .sort({ order: -1 })
      .lean();

    return lastItem ? lastItem.order + 1 : 0;
  }

  async reorderItems(
    workspaceId: string,
    parentId: string | null | undefined,
    itemOrders: Array<{ itemId: string; order: number }>,
  ) {
    const updatePromises = itemOrders.map(async ({ itemId, order }) => {
      await WorkspaceItemModel.updateOne(
        {
          _id: itemId,
          workspaceId,
          parentId: parentId ?? null,
        },
        { $set: { order } },
      );
    });

    await Promise.all(updatePromises);
  }
}

export const itemService = new ItemService();
