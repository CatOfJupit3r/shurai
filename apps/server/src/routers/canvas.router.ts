import { canvasService } from '@~/services/canvas.service';

import { base, protectedProcedure, publicProcedure } from '../lib/orpc';

/**
 * Canvas router handles layout management for workspaces.
 * Provides endpoints for creating, retrieving, updating, and resetting canvas layouts.
 */
export const canvasRouter = base.canvas.router({
  getLayout: protectedProcedure.canvas.getLayout.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    return canvasService.getLayout(workspaceId, userId);
  }),

  saveLayout: protectedProcedure.canvas.saveLayout.handler(async ({ context, input }) => {
    const userId = context.session.user.id;

    return canvasService.saveLayout(input, userId);
  }),

  resetLayout: protectedProcedure.canvas.resetLayout.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    return canvasService.resetLayout(workspaceId, userId);
  }),

  getPublicLayout: publicProcedure.canvas.getPublicLayout.handler(async ({ input }) => {
    const { slug } = input;

    return canvasService.getPublicLayout(slug);
  }),

  getContentCanvas: protectedProcedure.canvas.getContentCanvas.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { contentCanvasId } = input;

    return canvasService.getContentCanvas(contentCanvasId, userId);
  }),
});
