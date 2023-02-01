const cheerio = require('cheerio');
import * as hf from './utility/helper-functions';
import { selectors } from './utility/selectors';

import * as dynamo from '@aws-sdk/client-dynamodb';
import { BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';

type Session = { name: string, data: SessionData [] }
type SessionData = { 
  Driver: { firstName: string, lastName: string, abbr: string }, 
  Number: string, Stops?: string, [key: string]: any 
}

export const handler = async (event: any) => {
  const promises = event.Records.map(async (record: any) => {
    const gp: GrandPrixLink = JSON.parse(record.Sns.Message);
    console.log('Processing Grand Prix: ' + JSON.stringify(gp));
    const dataPromises = await retrieveSessions(gp.dataEndpoint)
      .then(sessions => sessions.map(session => session.then(s => sessionProcessor(s))));
    const storePromises = dataPromises.map(promise => 
      promise.then(data => storeSession(data, gp.name, gp.year)));
    return Promise.all(storePromises);
  });
  return Promise.all(promises);
}

const client = new dynamo.DynamoDBClient({ region: 'us-east-2' });

const storeSession = async (session: Session, grandPrix: string, year: string) => {
  const items: dynamo.WriteRequest[] = session.data.map((entry: SessionData) => {
    const item = Object.keys(entry).reduce(mapWriteRequest(entry, grandPrix, year, session.name), {});
    return { PutRequest: { Item: item} };
  });
  const commands = batchRequests(items).map(itemBatch => new BatchWriteItemCommand({
    RequestItems: {
      'race-data-table': itemBatch
    }
  }));
  const commandPromises = commands.map(command => client.send(command)
    .catch(err => { 
      console.log({ Error: err, payload: JSON.stringify(command) });
      return Promise.reject(err);
    }));
  await Promise.all(commandPromises);
}

const batchRequests = (requests: dynamo.WriteRequest[]) => {
  let batches = [];
  for (let i = 0; i < requests.length; i += 25) {
    batches.push(requests.splice(i, i + 25));
  }
  return batches;
}

const mapWriteRequest = (data: SessionData, grandPrix: string, year: string, sessionName: string) =>
    (item: Record<string, dynamo.AttributeValue>, key: string, ): Record<string, dynamo.AttributeValue> => {
  if (key !== 'Driver') item[`${key}`] = { 'S' : `${(data[key] as string).trim()}`};
  else item[`${key}`] = { 'M' : {
    'firstName' : { 'S' : data.Driver.firstName.trim() }, 
    'lastName' : { 'S' : data.Driver.lastName.trim() }, 
    'abbr' : { 'S' : data.Driver.abbr }
  }};
  item['year_grandPrix'] = { 'S' : `${year}#${grandPrix.trim()}` };
  item['session_driver'] = { 'S' : `${sessionName}#${data.Driver.firstName.trim()}_${data.Driver.lastName.trim()}${data.Stops ? '#' + data.Stops : '' }` };
  return item;
}

const sessionProcessor = (session: any): Session => {
  let $session = cheerio.load(session.pageData);
  const headers = buildHeaders($session, selectors.sessionData);
  const sessionData = $session('tbody > tr', selectors.sessionData).toArray()
    .map((row: any) => mapData($session, row, headers));
  return { name: session.label, data: sessionData };
}

const retrieveSessions = async (endpoint: string): Promise<Promise<{ label: string, pageData: string}>[]> => {
  const sessionLinks = hf.scrapeLinks(await hf.makeRequest(endpoint), selectors.session, hf.dataSetLinkMapper);
  return sessionLinks.filter((link: Link) => link.label !== undefined)
    .map(async (sessionLink: Link, i: number, _: Link[]) => { 
      return { label: sessionLink.label, pageData: await hf.makeRequest(sessionLink.endpoint) }
    });
}

const buildHeaders = ($: any, contextSelector: string): string[] => {
  return $('thead > tr > th', contextSelector)
    .filter((_: any, element: any) => $(element).attr('class') !== 'limiter')
    .map((_: any, element: any) => {
      let abbr = $('abbr', element);
      if (abbr.length > 0) return $(abbr).attr('title');
      else return $(element).text();
    }).toArray();
}

const mapData = ($row: any, row: any, headers: string[]) => {
  let data: any = {};
  $row('td', row).filter((_: any, col: any) => $row(col).attr('class') !== 'limiter')
    .map((i: number, col: any) => {
      let item = $row(col).text();
      if ($row('span', col).text() !== '' && $row('span', col).text() !== 's' 
          && $row('span', col).text() !== ' lap' && $row('span', col).text() !== ' laps') item = {
        firstName: $row('span:nth-child(1)', col).text(),
        lastName: $row('span:nth-child(2)', col).text(),
        abbr: $row('span:nth-child(3)', col).text()
      }
      else if ($row('a', col).text() !== '') item = $row('a', col).text().replace(/\s/g, '');
      data[headers[i]] = item;
    });
  return data;
}

export const Testing = {
  handler,
  storeSession,
  mapWriteRequest,
  sessionProcessor,
  retrieveSessions,
  buildHeaders,
  mapData,
}