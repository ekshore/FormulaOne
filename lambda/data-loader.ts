import * as hf from './utility/helper-functions';
import { selectors } from './utility/selectors';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';

const lambdaClient = new LambdaClient({ region: 'us-east-2' });

export const handler = async (years?: Link[]) => {
  let seasons = years ?? await retrieveSeasons(process.env.ENDPOINT!);
  const gps = seasons.map((season: Link) => retrieveGrandPrixs(season).then((grandPrixs: GrandPrixLink[]) => {
    // const commands = grandPrixs.map(gp => new InvokeCommand({
    //   FunctionName: process.env.GP_PROCESSING_FUNC,
    //   InvocationType: 'Event',
    //   Payload: JSON.stringify(gp)
    // }));
    // console.log(JSON.stringify(commands));
    // return commands.map(command => lambdaClient.send(command));
  }))
  await Promise.all(gps);
}

const retrieveGrandPrixs = async (year: Link): Promise<GrandPrixLink[]> => {
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