import env from '@~/constants/env';
import populationService from '@~/services/population.service';

export default async function populationLoader() {
  await populationService.populate(env.POPULATE_ON_EMPTY);
}
