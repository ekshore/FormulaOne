import * as hf from './utility/helper-functions';
import { selectors } from './utility/selectors';

export const handler = async (years?: Link[]) => {
  let seasons = years ?? await retrieveSeasons(process.env.ENDPOINT!);
  const gps = seasons.map((season: Link) => retrieveGrandPrixs(season).then((value: GrandPrixEvent[]) => console.log(value)));
  await Promise.all(gps);
}

const retrieveGrandPrixs = async (year: Link): Promise<GrandPrixEvent[]> => {
  const gps = hf.scrapeLinks(await hf.makeRequest(year.endpoint), selectors.dataSet, hf.linkMapper);
  return gps.map((gp: Link) => { 
    return {
      name: gp.label,
      year: year.label,
      dataEndpoint: gp.endpoint
    }
  });
}

const retrieveSeasons = async (endpoint: string): Promise<Link[]> => {
  const seasons = hf.scrapeLinks(await hf.makeRequest(endpoint), selectors.year, hf.linkMapper);
  return seasons;
}

export const Testing = {
  handler,
  retrieveGrandPrixs,
  retrieveSeasons
}