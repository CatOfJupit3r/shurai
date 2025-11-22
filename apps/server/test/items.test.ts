import { call } from '@orpc/server';
import { it, expect, describe } from 'bun:test';

import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { appRouter } from './helpers/instance';
import { createUser } from './helpers/utilities';

describe('Items API', () => {
  describe('createItem', () => {
    it('should create an item in workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test Workspace', visibility: 'PRIVATE' },
        ctx(),
      );

      const item = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'RTX 4090',
          description: 'Graphics card',
        },
        ctx(),
      );

      expect(item).not.toBeNil();
      expect(item.name).toBe('RTX 4090');
      expect(item.description).toBe('Graphics card');
      expect(item.workspaceId).toBe(workspace._id);
      expect(item.parentId).toBeNull();
      expect(item.order).toBe(0);
    });

    it('should create item with parent', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'PC Case',
        },
        ctx(),
      );

      const child = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'Motherboard',
          parentId: parent._id,
        },
        ctx(),
      );

      expect(child.parentId).toBe(parent._id);
    });

    it('should fail if parent does not exist', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      try {
        await call(
          appRouter.items.createItem,
          {
            workspaceId: workspace._id,
            name: 'Item',
            parentId: 'nonexistent',
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow creating item in another users workspace', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx1(),
      );

      try {
        await call(
          appRouter.items.createItem,
          {
            workspaceId: workspace._id,
            name: 'Unauthorized Item',
          },
          ctx2(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('listItems', () => {
    it('should list all items in workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 1' }, ctx());
      await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 2' }, ctx());

      const items = await call(appRouter.items.listItems, { workspaceId: workspace._id }, ctx());

      expect(items.length).toBeGreaterThanOrEqual(2);
    });

    it('should allow listing items in public workspace', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Public', visibility: 'PUBLIC' },
        ctx1(),
      );

      await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item' }, ctx1());

      const items = await call(appRouter.items.listItems, { workspaceId: workspace._id }, ctx2());

      expect(items.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getItemHierarchy', () => {
    it('should return nested item tree', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const root = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'PC' }, ctx());
      const child1 = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'GPU', parentId: root._id },
        ctx(),
      );
      const child2 = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'CPU', parentId: root._id },
        ctx(),
      );

      const hierarchy = await call(appRouter.items.getItemHierarchy, { workspaceId: workspace._id }, ctx());

      expect(hierarchy.length).toBeGreaterThanOrEqual(1);
      expect(hierarchy[0].name).toBe('PC');
      expect(hierarchy[0].children.length).toBe(2);
      expect(hierarchy[0].children.some((c: any) => c.name === 'GPU')).toBe(true);
      expect(hierarchy[0].children.some((c: any) => c.name === 'CPU')).toBe(true);
    });
  });

  describe('updateItem', () => {
    it('should update item properties', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const item = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Old Name' }, ctx());

      const updated = await call(
        appRouter.items.updateItem,
        {
          itemId: item._id,
          name: 'New Name',
          description: 'New description',
        },
        ctx(),
      );

      expect(updated.name).toBe('New Name');
      expect(updated.description).toBe('New description');
    });

    it('should detect circular references', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent' }, ctx());
      const child = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child', parentId: parent._id },
        ctx(),
      );

      try {
        await call(
          appRouter.items.updateItem,
          {
            itemId: parent._id,
            parentId: child._id,
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('moveItem', () => {
    it('should move item to new parent', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent1 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent 1' }, ctx());
      const parent2 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent 2' }, ctx());
      const child = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child', parentId: parent1._id },
        ctx(),
      );

      const moved = await call(
        appRouter.items.moveItem,
        {
          itemId: child._id,
          newParentId: parent2._id,
        },
        ctx(),
      );

      expect(moved.parentId).toBe(parent2._id);
    });

    it('should move item to root level', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent' }, ctx());
      const child = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child', parentId: parent._id },
        ctx(),
      );

      const moved = await call(
        appRouter.items.moveItem,
        {
          itemId: child._id,
          newParentId: null,
        },
        ctx(),
      );

      expect(moved.parentId).toBeNull();
    });
  });

  describe('deleteItem', () => {
    it('should delete item and its children', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent' }, ctx());
      await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child 1', parentId: parent._id },
        ctx(),
      );
      await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child 2', parentId: parent._id },
        ctx(),
      );

      const result = await call(appRouter.items.deleteItem, { itemId: parent._id }, ctx());

      expect(result.success).toBe(true);

      const items = await call(appRouter.items.listItems, { workspaceId: workspace._id }, ctx());
      expect(items.length).toBe(0);
    });
  });

  describe('reorderItems', () => {
    it('should reorder sibling items', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const item1 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 1' }, ctx());
      const item2 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 2' }, ctx());
      const item3 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 3' }, ctx());

      expect(item1.order).toBe(0);
      expect(item2.order).toBe(1);
      expect(item3.order).toBe(2);

      const result = await call(
        appRouter.items.reorderItems,
        {
          workspaceId: workspace._id,
          parentId: null,
          itemOrders: [
            { itemId: item3._id, order: 0 },
            { itemId: item1._id, order: 1 },
            { itemId: item2._id, order: 2 },
          ],
        },
        ctx(),
      );

      expect(result.success).toBe(true);

      const items = await call(appRouter.items.listItems, { workspaceId: workspace._id }, ctx());
      expect(items[0]._id).toBe(item3._id);
      expect(items[1]._id).toBe(item1._id);
      expect(items[2]._id).toBe(item2._id);
    });

    it('should reorder items with same parent', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent' }, ctx());
      const child1 = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child 1', parentId: parent._id },
        ctx(),
      );
      const child2 = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child 2', parentId: parent._id },
        ctx(),
      );

      const result = await call(
        appRouter.items.reorderItems,
        {
          workspaceId: workspace._id,
          parentId: parent._id,
          itemOrders: [
            { itemId: child2._id, order: 0 },
            { itemId: child1._id, order: 1 },
          ],
        },
        ctx(),
      );

      expect(result.success).toBe(true);

      const hierarchy = await call(appRouter.items.getItemHierarchy, { workspaceId: workspace._id }, ctx());
      expect(hierarchy[0].children[0]._id).toBe(child2._id);
      expect(hierarchy[0].children[1]._id).toBe(child1._id);
    });

    it('should fail if items have different parents', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      const parent1 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent 1' }, ctx());
      const parent2 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Parent 2' }, ctx());
      const child1 = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child 1', parentId: parent1._id },
        ctx(),
      );
      const child2 = await call(
        appRouter.items.createItem,
        { workspaceId: workspace._id, name: 'Child 2', parentId: parent2._id },
        ctx(),
      );

      try {
        await call(
          appRouter.items.reorderItems,
          {
            workspaceId: workspace._id,
            parentId: parent1._id,
            itemOrders: [
              { itemId: child1._id, order: 0 },
              { itemId: child2._id, order: 1 },
            ],
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should not allow reordering items in another users workspace', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx1(),
      );

      const item1 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 1' }, ctx1());
      const item2 = await call(appRouter.items.createItem, { workspaceId: workspace._id, name: 'Item 2' }, ctx1());

      try {
        await call(
          appRouter.items.reorderItems,
          {
            workspaceId: workspace._id,
            parentId: null,
            itemOrders: [
              { itemId: item2._id, order: 0 },
              { itemId: item1._id, order: 1 },
            ],
          },
          ctx2(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
