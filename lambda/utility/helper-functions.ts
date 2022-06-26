const axios = require('axios');
const cheerio = require('cheerio');

const host = 'https://www.formula1.com';

export const buildUrl = (enpoint: string) => host + enpoint;
export const mapLinks = ($: any, selector: string, mapper: Function): Link[] => $('li', selector).map((_: number, i: any) => mapper($, i)).toArray();
export const scrapeLinks = (pageData: string, selector: string, mapper: Function): Link[] => mapLinks(cheerio.load(pageData), selector, mapper);

export const dataSetLinkMapper = ($: any, li: any): Link => ({ endpoint: $('a', li).attr('href'), label: $('a', li).attr('data-value') });
export const linkMapper = ($: any, li: any): Link => ({ endpoint: $('a', li).attr('href'), label: $('span.clip', li).text() });

export async function makeRequest(endpoint: string) {
  let { data } = await axios.get(buildUrl(endpoint)).catch((err: any) => {
    console.log(`Recieved ${err.message} when making http requets for ${endpoint}`);
    throw err;
  });
  return data;
}

export class Link {
  endpoint: string;
  label: string;
}