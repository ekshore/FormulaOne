import axios from 'axios';
const cheerio = require('cheerio');

export const buildUrl = (enpoint: string) => process.env.F1_HOST + enpoint;
export const mapLinks = ($: any, selector: string, mapper: Function): Link[] => $('li', selector).map((_: number, i: any) => mapper($, i)).toArray();
export const scrapeLinks = (pageData: string, selector: string, mapper: Function): Link[] => mapLinks(cheerio.load(pageData), selector, mapper);

export const dataSetLinkMapper = ($: any, li: any): Link => ({ endpoint: $('a', li).attr('href'), label: $('a', li).attr('data-value') });
export const linkMapper = ($: any, li: any): Link => ({ endpoint: $('a', li).attr('href'), label: $('span.clip', li).text() });

export async function makeRequest(endpoint: string) {
  let { data } = await axios.get(buildUrl(endpoint)).catch((err: any) => {
    console.log(`Recieved '${err.message}' when making http requets for ${endpoint}`);
    console.log(err);
    throw err;
  });
  return data;
}