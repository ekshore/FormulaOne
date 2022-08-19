import { readFileSync } from 'fs';
import * as path from 'path';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
const cheerio = require('cheerio');

const sourceDir = path.join(__dirname, './../../../lambda/utility');

const helperFunctions = require(path.join(sourceDir, 'helper-functions.ts'));
const selectors = require(path.join(sourceDir, 'selectors.ts'));

let testPage: String;
let $: any;
beforeAll(() => {
  try {
    testPage = readFileSync(path.join(__dirname, '../../resources/test-page.txt').toString()).toString();
    $ = cheerio.load(testPage);
  } catch (err) { 
    console.log('ErrorLoading test data from file', err);
  }
});

let env = process.env;
beforeEach(() => {
  process.env = { ... env };
  process.env.F1_HOST = 'https://www.formula1.com';
});

afterEach(() => {
  process.env = env;
});

describe('Testing helper functions', () => {

  test('Testing buildUrl()', () => {
    const endpoint = "/sample/endpoint";
    const result = helperFunctions.buildUrl(endpoint);
    expect(result).toEqual('https://www.formula1.com/sample/endpoint');
  });

  test('Testing mapLinks()', () =>{
    const expected = [
      { endpoint: '/en/results.html/2022/races.html', label: 'Races' },
      { endpoint: '/en/results.html/2022/drivers.html', label: 'DRIVERS' },
      { endpoint: '/en/results.html/2022/team.html', label: 'Teams' },
      { endpoint: '/en/results.html/2022/fastest-laps.html', label: 'DHL FASTEST LAP AWARD' }
    ];
    const result = helperFunctions.mapLinks($, selectors.selectors.category, helperFunctions.linkMapper);
    expect(result).toEqual(expected);
  });

  test('Testing scrapeLinks()', () => {
    const expected = [
      { endpoint: '/en/results.html/2022/races.html', label: 'Races' },
      { endpoint: '/en/results.html/2022/drivers.html', label: 'DRIVERS' },
      { endpoint: '/en/results.html/2022/team.html', label: 'Teams' },
      { endpoint: '/en/results.html/2022/fastest-laps.html', label: 'DHL FASTEST LAP AWARD' }
    ];
    const result = helperFunctions.scrapeLinks(testPage, selectors.selectors.category, helperFunctions.linkMapper);
    expect(result).toEqual(expected);
  });
});

describe('Testing link mappers', () => {
  test('Testing default linkMapper()', () => {
    const expectedResult = {
      endpoint: '/en/results.html/2022/races.html',
      label: '2022'
    }
    const li = '<li class="resultsarchive-filter-item"><a href="/en/results.html/2022/races.html" class="resultsarchive-filter-item-link FilterTrigger selected" data-name="year" data-value="2022"><span class="clip">2022</span></a></li>'
    const result = helperFunctions.linkMapper($, li);
    expect(result).toEqual(expectedResult);
  });

  test('Testing dataSetLinkMapper', () =>{
    const li = '<li class="side-nav-item"><a href="/en/results.html/2021/races/1064/bahrain/race-result.html" data-ajax-url="/content/fom-website/en/results/jcr:content/resultsarchive.html/2021/races/1064/bahrain/race-result.html" class="side-nav-item-link ArchiveLink selected" data-name="resultType" data-value="race-result">Race result</a></li>'
    const expectedResult = {
      endpoint: '/en/results.html/2021/races/1064/bahrain/race-result.html',
      label: 'race-result'
    }
    const result = helperFunctions.dataSetLinkMapper($, li);
    expect(result).toEqual(expectedResult);
  });
});

describe('Testing makeRequest()', () => {
  let mock: MockAdapter;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  test('Testing makeRequest()', async () => {
    mock.onAny().reply(200, testPage);
    const result = await helperFunctions.makeRequest('/en/results.html/2021/races/1064/bahrain/race-result.html');
    expect(result).toEqual(testPage);
  });
});