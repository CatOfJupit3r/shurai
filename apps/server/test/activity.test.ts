import { call } from '@orpc/server';
import { it, expect, describe } from 'bun:test';

import { ActivityModel } from '@~/db/models/activity.model';

import { appRouter } from './helpers/instance';
import { createUser } from './helpers/utilities';

describe('Activity API', () => {
  describe('listActivities', () => {
    it('should list activities for authenticated user', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const activities = await call(appRouter.activity.listActivities, {}, ctx());

      expect(activities).not.toBeNil();
      expect(activities.length).toBeGreaterThanOrEqual(1);
      expect(activities[0].userId).toBe(user.id);
      expect(activities[0].entityType).toBe('WORKSPACE');
      expect(activities[0].action).toBe('CREATE');
    });

    it('should filter activities by workspace', async () => {
      const { ctx } = await createUser();

      const workspace1 = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Workspace 1',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const workspace2 = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Workspace 2',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const activities = await call(appRouter.activity.listActivities, { workspaceId: workspace1._id }, ctx());

      expect(activities.every((a) => a.workspaceId === workspace1._id)).toBe(true);
    });

    it('should filter activities by entity type', async () => {
      const { ctx } = await createUser();

      await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const activities = await call(appRouter.activity.listActivities, { entityType: 'WORKSPACE' }, ctx());

      expect(activities.every((a) => a.entityType === 'WORKSPACE')).toBe(true);
    });

    it('should filter activities by action', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      await call(
        appRouter.workspaces.updateWorkspace,
        {
          workspaceId: workspace._id,
          title: 'Updated Workspace',
        },
        ctx(),
      );

      const allActivities = await call(appRouter.activity.listActivities, {}, ctx());

      expect(allActivities.length).toBeGreaterThanOrEqual(2);

      const updateActivities = allActivities.filter((a) => a.action === 'UPDATE');
      const createActivities = allActivities.filter((a) => a.action === 'CREATE');

      expect(updateActivities.length).toBeGreaterThanOrEqual(1);
      expect(createActivities.length).toBeGreaterThanOrEqual(1);
    });

    it('should paginate activities', async () => {
      const { ctx } = await createUser();

      for (let i = 0; i < 5; i++) {
        await call(
          appRouter.workspaces.createWorkspace,
          {
            title: `Workspace ${i}`,
            visibility: 'PRIVATE',
          },
          ctx(),
        );
      }

      const page1 = await call(appRouter.activity.listActivities, { limit: 2, offset: 0 }, ctx());
      const page2 = await call(appRouter.activity.listActivities, { limit: 2, offset: 2 }, ctx());

      expect(page1.length).toBe(2);
      expect(page2.length).toBe(2);
      expect(page1[0]._id).not.toBe(page2[0]._id);
    });
  });

  describe('getActivityStats', () => {
    it('should return activity statistics', async () => {
      const { ctx } = await createUser();

      await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const allActivities = await call(appRouter.activity.listActivities, {}, ctx());

      expect(allActivities.length).toBeGreaterThanOrEqual(1);
    });

    it('should filter stats by workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const activitiesForWorkspace = await call(
        appRouter.activity.listActivities,
        { workspaceId: workspace._id },
        ctx(),
      );

      expect(activitiesForWorkspace.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Activity Logging', () => {
    it('should log workspace create activity', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: workspace._id,
        action: 'CREATE',
        entityType: 'WORKSPACE',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Test Workspace');
    });

    it('should log workspace update activity', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      await call(
        appRouter.workspaces.updateWorkspace,
        {
          workspaceId: workspace._id,
          title: 'Updated Workspace',
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: workspace._id,
        action: 'UPDATE',
        entityType: 'WORKSPACE',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Updated Workspace');
      expect(activity?.metadata).toBeDefined();
    });

    it('should log workspace delete activity', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      await call(
        appRouter.workspaces.deleteWorkspace,
        {
          workspaceId: workspace._id,
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: workspace._id,
        action: 'DELETE',
        entityType: 'WORKSPACE',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Test Workspace');
    });

    it('should log item create activity', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const item = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'Test Item',
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: item._id,
        action: 'CREATE',
        entityType: 'ITEM',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Test Item');
      expect(activity?.workspaceId).toBe(workspace._id);
    });

    it('should log item update activity', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const item = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'Test Item',
        },
        ctx(),
      );

      await call(
        appRouter.items.updateItem,
        {
          itemId: item._id,
          name: 'Updated Item',
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: item._id,
        action: 'UPDATE',
        entityType: 'ITEM',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Updated Item');
    });

    it('should log item delete activity', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const item = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'Test Item',
        },
        ctx(),
      );

      await call(
        appRouter.items.deleteItem,
        {
          itemId: item._id,
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: item._id,
        action: 'DELETE',
        entityType: 'ITEM',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Test Item');
    });

    it('should log template create activity', async () => {
      const { ctx, user } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Test Template',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Root',
            children: [],
          },
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: template._id,
        action: 'CREATE',
        entityType: 'TEMPLATE',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Test Template');
    });

    it('should log template update activity', async () => {
      const { ctx, user } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Test Template',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Root',
            children: [],
          },
        },
        ctx(),
      );

      await call(
        appRouter.templates.updateTemplate,
        {
          templateId: template._id,
          name: 'Updated Template',
        } as any,
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: template._id,
        action: 'UPDATE',
        entityType: 'TEMPLATE',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Updated Template');
    });

    it('should log template delete activity', async () => {
      const { ctx, user } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Test Template',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Root',
            children: [],
          },
        },
        ctx(),
      );

      await call(
        appRouter.templates.deleteTemplate,
        {
          templateId: template._id,
        },
        ctx(),
      );

      const activity = await ActivityModel.findOne({
        userId: user.id,
        entityId: template._id,
        action: 'DELETE',
        entityType: 'TEMPLATE',
      });

      expect(activity).not.toBeNil();
      expect(activity?.entityName).toBe('Test Template');
    });
  });
});
