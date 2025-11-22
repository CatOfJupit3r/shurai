import { errorCodes } from '@shurai/shared';

import { ORPCNotFoundError } from '@~/lib/orpc-error-wrapper';

import { base, protectedProcedure, publicProcedure } from '../lib/orpc';

/**
 * Canvas router handles layout management for workspaces.
 * Currently provides stub implementations that will be filled out
 * when the canvas layout model is implemented.
 */
export const canvasRouter = base.canvas.router({
  getLayout: protectedProcedure.canvas.getLayout.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    // TODO: Implement actual canvas layout retrieval
    // For now, return a stub layout to satisfy the contract
    throw ORPCNotFoundError(errorCodes.CANVAS_LAYOUT_NOT_FOUND);
  }),

  saveLayout: protectedProcedure.canvas.saveLayout.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    // TODO: Implement actual canvas layout saving
    // For now, throw not found error
    throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
  }),

  resetLayout: protectedProcedure.canvas.resetLayout.handler(async ({ context, input }) => {
    const userId = context.session.user.id;
    const { workspaceId } = input;

    // TODO: Implement actual canvas layout reset
    // For now, throw not found error
    throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
  }),

  getPublicLayout: publicProcedure.canvas.getPublicLayout.handler(async ({ input }) => {
    const { slug } = input;

    // TODO: Implement actual public canvas layout retrieval
    // For now, throw not found error
    throw ORPCNotFoundError(errorCodes.WORKSPACE_NOT_FOUND);
  }),
});
