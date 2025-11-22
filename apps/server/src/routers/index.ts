import { base } from '../lib/orpc';
import { achievementsRouter } from './achievements.router';
import { activityRouter } from './activity.router';
import { assetsRouter } from './assets.router';
import { badgesRouter } from './badges.router';
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
  activity: activityRouter,
});

export type AppRouter = typeof appRouter;
