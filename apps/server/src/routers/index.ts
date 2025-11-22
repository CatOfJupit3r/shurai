import { base } from '../lib/orpc';
import { achievementsRouter } from './achievements.router';
import { assetsRouter } from './assets.router';
import { badgesRouter } from './badges.router';
import { canvasRouter } from './canvas.router';
import { indexRouter } from './index.router';
import { itemsRouter } from './items.router';
import { templatesRouter } from './templates.router';
import { userRouter } from './user.router';
import { workspacesRouter } from './workspaces.router';

export const appRouter = base.router({
  user: userRouter,
  index: indexRouter,
  achievements: achievementsRouter,
  badges: badgesRouter,
  workspaces: workspacesRouter,
  items: itemsRouter,
  assets: assetsRouter,
  templates: templatesRouter,
  canvas: canvasRouter,
});

export type AppRouter = typeof appRouter;
