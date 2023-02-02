import * as hf from './utility/helper-functions';
import { selectors } from './utility/selectors';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const snsClient = new SNSClient({ region: 'us-east-2' });

export const handler = async (years?: Link[]) => {
  let seasons: Link[]  = years?.length ? years : await retrieveSeasons(process.env.ENDPOINT!);
  for (const  season of seasons) {
    const gps = await retrieveGrandPrixs(season);
    const promises = gps.map(async gp => {
      const command = new PublishCommand({
        TopicArn: process.env.GP_TOPIC_ARN,
        Message: JSON.stringify(gp)
      });
      return await snsClient.send(command)
        .then(val => console.log('Published Event: ' + JSON.stringify(val)))
        .catch(err => {
          console.log('Error Publishing Event: ' + JSON.stringify(err))
          throw err;
        });
    });
    await Promise.all(promises);
  }
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