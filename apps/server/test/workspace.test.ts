import { call } from '@orpc/server';
import { it, expect, describe, beforeEach } from 'bun:test';

import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceModel } from '@~/db/models/workspace.model';

import { appRouter } from './helpers/instance';
import { createUser } from './helpers/utilities';

describe('Workspace API', () => {
  describe('createWorkspace', () => {
    it('should create a workspace with valid input', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'My Gaming Setup',
          description: 'My awesome gaming workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      expect(workspace).not.toBeNil();
      expect(workspace.title).toBe('My Gaming Setup');
      expect(workspace.description).toBe('My awesome gaming workspace');
      expect(workspace.visibility).toBe('PRIVATE');
      expect(workspace._id).toBeDefined();
      expect(workspace.createdAt).toBeDefined();
    });

    it('should create a public workspace with shareable slug', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Public Setup',
          visibility: 'PUBLIC',
        },
        ctx(),
      );

      expect(workspace.visibility).toBe('PUBLIC');
      expect(workspace.shareableSlug).toBeDefined();
      expect(workspace.shareableSlug!.length).toBeGreaterThan(0);
    });

    it('should fail if title is empty', async () => {
      const { ctx } = await createUser();

      try {
        await call(
          appRouter.workspaces.createWorkspace,
          {
            title: '',
            visibility: 'PRIVATE',
          },
          ctx(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('listWorkspaces', () => {
    it('should list all workspaces for user', async () => {
      const { ctx, user } = await createUser();

      await call(appRouter.workspaces.createWorkspace, { title: 'Workspace 1', visibility: 'PRIVATE' }, ctx());
      await call(appRouter.workspaces.createWorkspace, { title: 'Workspace 2', visibility: 'PUBLIC' }, ctx());

      const workspaces = await call(appRouter.workspaces.listWorkspaces, null, ctx());

      expect(workspaces.length).toBeGreaterThanOrEqual(2);
      expect(workspaces[0].title).toBeDefined();
      expect(workspaces[0].itemCount).toBeDefined();
      expect(workspaces[0].assetCount).toBeDefined();
    });

    it('should return empty array for user with no workspaces', async () => {
      const { ctx } = await createUser();

      const workspaces = await call(appRouter.workspaces.listWorkspaces, null, ctx());

      expect(workspaces).toBeArray();
      expect(workspaces.length).toBe(0);
    });
  });

  describe('getWorkspace', () => {
    it('should get workspace by ID for owner', async () => {
      const { ctx } = await createUser();

      const created = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test Workspace', visibility: 'PRIVATE' },
        ctx(),
      );

      const fetched = await call(appRouter.workspaces.getWorkspace, { workspaceId: created._id }, ctx());

      expect(fetched._id).toBe(created._id);
      expect(fetched.title).toBe('Test Workspace');
    });

    it('should fail to get private workspace of another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Private Workspace', visibility: 'PRIVATE' },
        ctx1(),
      );

      try {
        await call(appRouter.workspaces.getWorkspace, { workspaceId: workspace._id }, ctx2());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should allow access to public workspace of another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Public Workspace', visibility: 'PUBLIC' },
        ctx1(),
      );

      const fetched = await call(appRouter.workspaces.getWorkspace, { workspaceId: workspace._id }, ctx2());

      expect(fetched._id).toBe(workspace._id);
    });
  });

  describe('updateWorkspace', () => {
    it('should update workspace title', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Original Title', visibility: 'PRIVATE' },
        ctx(),
      );

      const updated = await call(
        appRouter.workspaces.updateWorkspace,
        {
          workspaceId: workspace._id,
          title: 'Updated Title',
        },
        ctx(),
      );

      expect(updated.title).toBe('Updated Title');
    });

    it('should generate slug when changing visibility to PUBLIC', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      expect(workspace.shareableSlug).toBeUndefined();

      const updated = await call(
        appRouter.workspaces.updateWorkspace,
        {
          workspaceId: workspace._id,
          visibility: 'PUBLIC',
        },
        ctx(),
      );

      expect(updated.shareableSlug).toBeDefined();
    });

    it('should not allow updating another users workspace', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx1(),
      );

      try {
        await call(
          appRouter.workspaces.updateWorkspace,
          {
            workspaceId: workspace._id,
            title: 'Hacked',
          },
          ctx2(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('deleteWorkspace', () => {
    it('should delete workspace and its items', async () => {
      const { ctx, user } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'To Delete', visibility: 'PRIVATE' },
        ctx(),
      );

      await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'Item to delete',
        },
        ctx(),
      );

      const result = await call(appRouter.workspaces.deleteWorkspace, { workspaceId: workspace._id }, ctx());

      expect(result.success).toBe(true);

      const workspaces = await WorkspaceModel.find({ _id: workspace._id });
      expect(workspaces.length).toBe(0);

      const items = await WorkspaceItemModel.find({ workspaceId: workspace._id });
      expect(items.length).toBe(0);
    });

    it('should not allow deleting another users workspace', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx1(),
      );

      try {
        await call(appRouter.workspaces.deleteWorkspace, { workspaceId: workspace._id }, ctx2());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('regenerateSlug', () => {
    it('should regenerate slug for public workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PUBLIC' },
        ctx(),
      );

      const originalSlug = workspace.shareableSlug;

      const updated = await call(appRouter.workspaces.regenerateSlug, { workspaceId: workspace._id }, ctx());

      expect(updated.shareableSlug).toBeDefined();
      expect(updated.shareableSlug).not.toBe(originalSlug);
    });

    it('should fail for private workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Test', visibility: 'PRIVATE' },
        ctx(),
      );

      try {
        await call(appRouter.workspaces.regenerateSlug, { workspaceId: workspace._id }, ctx());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('getWorkspaceBySlug', () => {
    it('should get public workspace by slug without authentication', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        { title: 'Public Test', visibility: 'PUBLIC' },
        ctx(),
      );

      const fetched = await call(
        appRouter.workspaces.getWorkspaceBySlug,
        {
          slug: workspace.shareableSlug!,
        },
        { context: { session: null } },
      );

      expect(fetched._id).toBe(workspace._id);
      expect(fetched.title).toBe('Public Test');
    });

    it('should fail for non-existent slug', async () => {
      try {
        await call(appRouter.workspaces.getWorkspaceBySlug, { slug: 'nonexistent' }, { context: { session: null } });
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });
});
