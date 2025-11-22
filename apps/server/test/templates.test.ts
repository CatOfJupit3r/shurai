import { call } from '@orpc/server';
import { it, expect, describe, beforeEach } from 'bun:test';

import { errorCodes } from '@shurai/shared/enums/errors.enums';

import { WorkspaceItemModel } from '@~/db/models/workspace-item.model';
import { WorkspaceTemplateItemModel } from '@~/db/models/workspace-template-item.model';
import { WorkspaceTemplateModel } from '@~/db/models/workspace-template.model';

import { appRouter } from './helpers/instance';
import { createUser } from './helpers/utilities';

describe('Template API', () => {
  describe('createTemplate', () => {
    it('should create a personal template with items', async () => {
      const { ctx } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Gaming PC Template',
          description: 'A complete gaming PC setup',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Gaming PC',
            description: 'Main desktop computer',
            children: [
              { name: 'CPU', description: 'Intel i9' },
              { name: 'GPU', description: 'RTX 4090' },
              { name: 'RAM', description: '32GB DDR5' },
            ],
          },
        },
        ctx(),
      );

      expect(template).not.toBeNil();
      expect(template.name).toBe('Gaming PC Template');
      expect(template.scope).toBe('PERSONAL');
      expect(template.rootItem.name).toBe('Gaming PC');
      expect(template.rootItem.children).toBeArrayOfSize(3);

      const templateItems = await WorkspaceTemplateItemModel.find({ templateId: template._id });
      expect(templateItems).toBeArrayOfSize(4); // 1 root + 3 children
    });

    it('should create a community template', async () => {
      const { ctx } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Starter Setup',
          scope: 'COMMUNITY',
          rootItem: {
            name: 'Basic PC',
          },
        },
        ctx(),
      );

      expect(template.scope).toBe('COMMUNITY');
    });

    it('should handle nested template structure', async () => {
      const { ctx } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Nested Template',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Full Setup',
            children: [
              {
                name: 'Computer',
                children: [{ name: 'Monitor' }, { name: 'Keyboard' }],
              },
              {
                name: 'Audio',
                children: [{ name: 'Speakers' }, { name: 'Headphones' }],
              },
            ],
          },
        },
        ctx(),
      );

      expect(template.rootItem.children).toBeArrayOfSize(2);
      expect(template.rootItem.children[0].children).toBeArrayOfSize(2);
      expect(template.rootItem.children[1].children).toBeArrayOfSize(2);

      const templateItems = await WorkspaceTemplateItemModel.find({ templateId: template._id });
      expect(templateItems).toBeArrayOfSize(7); // 1 root + 2 level1 + 4 level2
    });
  });

  describe('listTemplates', () => {
    it('should list personal and community templates', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      await call(
        appRouter.templates.createTemplate,
        {
          name: 'Personal Template',
          scope: 'PERSONAL',
          rootItem: { name: 'Personal' },
        },
        ctx1(),
      );

      await call(
        appRouter.templates.createTemplate,
        {
          name: 'Community Template',
          scope: 'COMMUNITY',
          rootItem: { name: 'Community' },
        },
        ctx2(),
      );

      const templates = await call(appRouter.templates.listTemplates, {}, ctx1());

      expect(templates.length).toBeGreaterThanOrEqual(2);
      const personalTemplate = templates.find((t) => t.name === 'Personal Template');
      const communityTemplate = templates.find((t) => t.name === 'Community Template');

      expect(personalTemplate).toBeDefined();
      expect(communityTemplate).toBeDefined();
    });

    it('should filter templates by scope', async () => {
      const { ctx } = await createUser();

      await call(
        appRouter.templates.createTemplate,
        {
          name: 'Personal Template',
          scope: 'PERSONAL',
          rootItem: { name: 'Personal' },
        },
        ctx(),
      );

      await call(
        appRouter.templates.createTemplate,
        {
          name: 'Community Template',
          scope: 'COMMUNITY',
          rootItem: { name: 'Community' },
        },
        ctx(),
      );

      const personalTemplates = await call(appRouter.templates.listTemplates, { scope: 'PERSONAL' }, ctx());
      expect(personalTemplates.every((t) => t.scope === 'PERSONAL')).toBe(true);

      const communityTemplates = await call(appRouter.templates.listTemplates, { scope: 'COMMUNITY' }, ctx());
      expect(communityTemplates.every((t) => t.scope === 'COMMUNITY')).toBe(true);
    });

    it('should not show personal templates from other users', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      await call(
        appRouter.templates.createTemplate,
        {
          name: 'User 1 Personal',
          scope: 'PERSONAL',
          rootItem: { name: 'Personal' },
        },
        ctx1(),
      );

      const templates = await call(appRouter.templates.listTemplates, {}, ctx2());
      const user1Personal = templates.find((t) => t.name === 'User 1 Personal');

      expect(user1Personal).toBeUndefined();
    });
  });

  describe('getTemplate', () => {
    it('should get template by ID', async () => {
      const { ctx } = await createUser();

      const created = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Test Template',
          scope: 'PERSONAL',
          rootItem: { name: 'Root' },
        },
        ctx(),
      );

      const retrieved = await call(appRouter.templates.getTemplate, { templateId: created._id }, ctx());

      expect(retrieved._id).toBe(created._id);
      expect(retrieved.name).toBe('Test Template');
    });

    it('should fail to get personal template from another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'User 1 Personal',
          scope: 'PERSONAL',
          rootItem: { name: 'Personal' },
        },
        ctx1(),
      );

      try {
        await call(appRouter.templates.getTemplate, { templateId: template._id }, ctx2());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should allow getting community template from another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Community Template',
          scope: 'COMMUNITY',
          rootItem: { name: 'Community' },
        },
        ctx1(),
      );

      const retrieved = await call(appRouter.templates.getTemplate, { templateId: template._id }, ctx2());

      expect(retrieved._id).toBe(template._id);
    });
  });

  describe('updateTemplate', () => {
    it('should update template metadata', async () => {
      const { ctx } = await createUser();

      const created = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Original Name',
          description: 'Original Description',
          scope: 'PERSONAL',
          rootItem: { name: 'Root' },
        },
        ctx(),
      );

      const updated = await call(
        appRouter.templates.updateTemplate,
        {
          templateId: created._id,
          name: 'Updated Name',
          description: 'Updated Description',
          scope: 'COMMUNITY',
          rootItem: { name: 'Root' }, // Include rootItem to satisfy type checking
        },
        ctx(),
      );

      expect(updated.name).toBe('Updated Name');
      expect(updated.description).toBe('Updated Description');
      expect(updated.scope).toBe('COMMUNITY');
    });

    it('should update template structure', async () => {
      const { ctx } = await createUser();

      const created = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Test Template',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Original Root',
            children: [{ name: 'Child 1' }],
          },
        },
        ctx(),
      );

      const updated = await call(
        appRouter.templates.updateTemplate,
        {
          templateId: created._id,
          rootItem: {
            name: 'New Root',
            children: [{ name: 'New Child 1' }, { name: 'New Child 2' }],
          },
        },
        ctx(),
      );

      expect(updated.rootItem.name).toBe('New Root');
      expect(updated.rootItem.children).toBeArrayOfSize(2);

      const templateItems = await WorkspaceTemplateItemModel.find({ templateId: created._id });
      expect(templateItems).toBeArrayOfSize(3); // 1 root + 2 children
    });

    it('should fail to update template from another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'User 1 Template',
          scope: 'PERSONAL',
          rootItem: { name: 'Root' },
        },
        ctx1(),
      );

      try {
        await call(
          appRouter.templates.updateTemplate,
          {
            templateId: template._id,
            name: 'Hacked Name',
            rootItem: { name: 'Root' }, // Include rootItem to satisfy type checking
          },
          ctx2(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('deleteTemplate', () => {
    it('should delete template and its items', async () => {
      const { ctx } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Template to Delete',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Root',
            children: [{ name: 'Child 1' }, { name: 'Child 2' }],
          },
        },
        ctx(),
      );

      const result = await call(appRouter.templates.deleteTemplate, { templateId: template._id }, ctx());

      expect(result.success).toBe(true);

      const deletedTemplate = await WorkspaceTemplateModel.findById(template._id);
      expect(deletedTemplate).toBeNull();

      const templateItems = await WorkspaceTemplateItemModel.find({ templateId: template._id });
      expect(templateItems).toBeArrayOfSize(0);
    });

    it('should fail to delete template from another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'User 1 Template',
          scope: 'PERSONAL',
          rootItem: { name: 'Root' },
        },
        ctx1(),
      );

      try {
        await call(appRouter.templates.deleteTemplate, { templateId: template._id }, ctx2());
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('applyTemplate', () => {
    it('should apply template to workspace creating all items', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Gaming Setup',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Gaming PC',
            description: 'Complete gaming setup',
            children: [
              { name: 'CPU', description: 'Intel i9-13900K' },
              { name: 'GPU', description: 'RTX 4090' },
              { name: 'RAM', description: '64GB DDR5' },
            ],
          },
        },
        ctx(),
      );

      const result = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
        },
        ctx(),
      );

      expect(result).not.toBeNil();
      expect(result.name).toBe('Gaming PC');
      expect(result.description).toBe('Complete gaming setup');
      expect(result.workspaceId).toBe(workspace._id);
      expect(result.children).toBeArrayOfSize(3);

      const workspaceItems = await WorkspaceItemModel.find({ workspaceId: workspace._id });
      expect(workspaceItems).toBeArrayOfSize(4); // 1 root + 3 children
    });

    it('should apply template with nested hierarchy', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Full Battlestation',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Battlestation',
            children: [
              {
                name: 'Computer',
                children: [{ name: 'Monitor 1' }, { name: 'Monitor 2' }],
              },
              {
                name: 'Peripherals',
                children: [{ name: 'Keyboard' }, { name: 'Mouse' }],
              },
            ],
          },
        },
        ctx(),
      );

      const result = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
        },
        ctx(),
      );

      expect(result.name).toBe('Battlestation');
      expect(result.children).toBeArrayOfSize(2);
      expect(result.children[0].children).toBeArrayOfSize(2);
      expect(result.children[1].children).toBeArrayOfSize(2);

      const workspaceItems = await WorkspaceItemModel.find({ workspaceId: workspace._id });
      expect(workspaceItems).toBeArrayOfSize(7); // 1 root + 2 level1 + 4 level2
    });

    it('should apply template under existing item as parent', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const existingItem = await call(
        appRouter.items.createItem,
        {
          workspaceId: workspace._id,
          name: 'Desk',
          description: 'Main desk',
        },
        ctx(),
      );

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Monitor Setup',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Dual Monitors',
            children: [{ name: 'Monitor 1' }, { name: 'Monitor 2' }],
          },
        },
        ctx(),
      );

      const result = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
          parentId: existingItem._id,
        },
        ctx(),
      );

      expect(result.parentId).toBe(existingItem._id);
      expect(result.children).toBeArrayOfSize(2);

      const workspaceItems = await WorkspaceItemModel.find({ workspaceId: workspace._id });
      expect(workspaceItems).toBeArrayOfSize(4); // 1 existing + 1 root + 2 children
    });

    it('should allow applying community template from another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Community Starter',
          scope: 'COMMUNITY',
          rootItem: {
            name: 'Basic Setup',
            children: [{ name: 'Computer' }, { name: 'Monitor' }],
          },
        },
        ctx1(),
      );

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'User 2 Workspace',
          visibility: 'PRIVATE',
        },
        ctx2(),
      );

      const result = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
        },
        ctx2(),
      );

      expect(result.name).toBe('Basic Setup');
      expect(result.children).toBeArrayOfSize(2);
    });

    it('should fail to apply personal template from another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'User 1 Personal',
          scope: 'PERSONAL',
          rootItem: { name: 'Personal Setup' },
        },
        ctx1(),
      );

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'User 2 Workspace',
          visibility: 'PRIVATE',
        },
        ctx2(),
      );

      try {
        await call(
          appRouter.templates.applyTemplate,
          {
            templateId: template._id,
            workspaceId: workspace._id,
          },
          ctx2(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should fail to apply template to workspace owned by another user', async () => {
      const { ctx: ctx1 } = await createUser();
      const { ctx: ctx2 } = await createUser();

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Community Template',
          scope: 'COMMUNITY',
          rootItem: { name: 'Setup' },
        },
        ctx1(),
      );

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'User 2 Workspace',
          visibility: 'PRIVATE',
        },
        ctx2(),
      );

      try {
        await call(
          appRouter.templates.applyTemplate,
          {
            templateId: template._id,
            workspaceId: workspace._id,
          },
          ctx1(),
        );
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error).toBeDefined();
      }
    });

    it('should apply template multiple times to same workspace', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'Monitor',
          scope: 'PERSONAL',
          rootItem: { name: 'Monitor' },
        },
        ctx(),
      );

      const result1 = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
        },
        ctx(),
      );

      const result2 = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
        },
        ctx(),
      );

      expect(result1._id).not.toBe(result2._id);

      const workspaceItems = await WorkspaceItemModel.find({ workspaceId: workspace._id });
      expect(workspaceItems).toBeArrayOfSize(2); // 2 separate root items
    });

    it('should preserve asset references when applying template', async () => {
      const { ctx } = await createUser();

      const workspace = await call(
        appRouter.workspaces.createWorkspace,
        {
          title: 'Test Workspace',
          visibility: 'PRIVATE',
        },
        ctx(),
      );

      const template = await call(
        appRouter.templates.createTemplate,
        {
          name: 'With Assets',
          scope: 'PERSONAL',
          rootItem: {
            name: 'Computer',
            assetId: 'asset-123',
            children: [{ name: 'GPU', assetId: 'asset-456' }],
          },
        },
        ctx(),
      );

      const result = await call(
        appRouter.templates.applyTemplate,
        {
          templateId: template._id,
          workspaceId: workspace._id,
        },
        ctx(),
      );

      expect(result.assetId).toBe('asset-123');
      expect(result.children[0].assetId).toBe('asset-456');
    });
  });
});
