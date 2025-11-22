import achievementsContract from './achievements.contract';
import activityContract from './activity.contract';
import assetsContract from './assets.contract';
import badgesContract from './badges.contract';
import indexContract from './index.contract';
import itemsContract from './items.contract';
import templatesContract from './templates.contract';
import userContract from './user.contract';
import workspacesContract from './workspaces.contract';

export const CONTRACT = {
  user: userContract,
  index: indexContract,
  achievements: achievementsContract,
  badges: badgesContract,
  workspaces: workspacesContract,
  items: itemsContract,
  assets: assetsContract,
  templates: templatesContract,
  activity: activityContract,
};

export type AppContract = typeof CONTRACT;

export default CONTRACT;
