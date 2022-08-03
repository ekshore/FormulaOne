const cheerio = require('cheerio');
import * as hf from './utility/helper-functions';
import { selectors } from './utility/selectors';

export const handler = async (gp: GrandPrixEvent) => {
  const sessions = await retrieveSessions(gp.dataEndpoint);
  const data = await processor(sessions);
  let gpData = { year: gp.year, name: gp.name, data: data }
  return gpData;
}

const processor = async (sessions: Promise<any>[]): Promise<any> => {
  let sessionResults = sessions.map((session: Promise<any>) => {
    return session.then(session => {
      // console.log('Processing data for session:', session.label);
      let $session = cheerio.load(session.data);
      const headers = buildHeaders($session, selectors.sessionData);
      let sessionData = $session('tbody > tr', selectors.sessionData).toArray().map((row: any)=> mapData($session, row, headers));
      return { session: session.label, data: sessionData };
    }).catch(err => console.error('An error occured during session processing:', err));
  });
  const data = await Promise.all(sessionResults);
  return data;
}

const retrieveSessions = async (endpoint: string) => {
  const sessionLinks = hf.scrapeLinks(await hf.makeRequest(endpoint), selectors.session, hf.dataSetLinkMapper);
  return sessionLinks.filter((link: Link) => link.label !== undefined)
    .map(async (sessionLink: Link, i: number, _: Link[]) => { return { label: sessionLink.label, data: await hf.makeRequest(sessionLink.endpoint) }});
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
      if ($row('span', col).text() !== '' && $row('span', col).text() !== 's') item = {
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
  processor,
  retrieveSessions,
  buildHeaders,
  mapData,
}