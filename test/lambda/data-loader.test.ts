import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';
import { mockClient } from 'aws-sdk-client-mock';
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
  const mock = new MockAdapter(axios);
  const snsMock = mockClient(SNSClient);

  beforeEach(() => {
    process.env = { ... env };
    process.env.ENDPOINT = '/en/results.html';
    process.env.F1_HOST = 'https://www.formula1.com';
    process.env.GP_PROCESSING_FUNC = 'grand-prix-processor';

    snsMock.resolves({});
  });

  afterEach(() => {
    process.env = env;
    mock.reset();
    snsMock.reset();
  });

  afterAll(() => {
    mock.restore()
  });

  test('Testing handler() with one year', async () => {
    let callCount = 0;
    snsMock.on(PublishCommand).callsFake(()=> {
      callCount++;
      return Promise.resolve('Successful return from Mock SNS Client.');
    });
    mock.onAny().reply(200, testPageData);
    await Testing.handler([{ endpoint: '/en/results.html/2022/races.html', label: '2022' }]);
    expect(callCount).toBe(23);
  });

  test('Testing handler() with no year specified', async () => {
    let callCount = 0;
    snsMock.on(PublishCommand).callsFake(()=> {
      callCount++;
      return Promise.resolve('Successful return from Mock SNS Client.');
    });
    mock.onAny().reply(200, testPageOneYearData);
    await Testing.handler();
    expect(callCount).toBe(1679);
  });

  test('Testing handler() with SNS publishing failure', () => {
    snsMock.on(PublishCommand).rejects('Failed return from Mock SNS Client.');
    mock.onAny().reply(200, testPageOneYearData);
    expect(() => Testing.handler()).rejects.toThrowError();
  });

  test('Testing retrieveGrandPrixs()', async () => {
    mock.onAny().reply(200, testPageData);
    const result = await Testing.retrieveSeasons(process.env.ENDPOINT!);
    expect(result).toEqual(testData.seasons);
  });

  test('Testing retrieveGrandPrixs()', async () => {
    mock.onAny().reply(200, testPageData);
    const result = await Testing.retrieveGrandPrixs({ label: '2022', endpoint: '/en/results.html/2022/races.html' });
    expect(result).toEqual(testData.grandPrixs);
  });
});
