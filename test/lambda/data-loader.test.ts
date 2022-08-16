import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { Testing } from './../../lambda/data-loader';


var testPageData: string;
var testPageOneYearData: string;
var testData: any;
beforeAll(() => {
  testPageData = fs.readFileSync(path.join(__dirname, '../resources/test-page.txt').toString()).toString();
  testPageOneYearData = fs.readFileSync(path.join(__dirname, '../resources/test-page-one-year.txt').toString()).toString();
  testData = JSON.parse(fs.readFileSync(path.join(__dirname, '../resources/test-data.json').toString()).toString());
});

describe('Testing Data Loader', () => {
  let env = process.env;
  let mock = new MockAdapter(axios);

  beforeEach(() => {
    process.env = { ... env };
    process.env.ENDPOINT = '/en/results.html';
    process.env.F1_HOST = 'https://www.formula1.com';
  });

  afterEach(() => {
    process.env = env;
    mock.reset();
  });

  afterAll(() => mock.restore());

  test('Testing handler() with one year', async () => {
    mock.onAny().reply(200, testPageData);
    await Testing.handler([{ endpoint: '/en/results.html/2022/races.html', label: '2022' }])
  });

  test('Testing handler() with no year specified', async () => {
    mock.onAny().reply(200, testPageOneYearData);
    await Testing.handler();
    expect(await Testing.handler());
  })

  test('Testing retrieveGrandPrixs()', async () => {
    mock.onAny().reply(200, testPageData);
    const result = await Testing.retrieveSeasons(process.env.ENDPOINT!);
    expect(result).toEqual(testData.seasons);
  });

  test('Testing retrieveGrandPrixs()', async () => {
    mock.onAny().reply(200, testPageData);
    const result = await Testing.retrieveGrandPrixs({ label: '2022', endpoint: '/en/results.html/2022/races.html'});
    expect(result).toEqual(testData.grandPrixs);
  });
});
