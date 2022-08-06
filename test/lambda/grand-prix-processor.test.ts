const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { selectors } from './../../lambda/utility/selectors';
import { Testing } from '../../lambda/grand-prix-processor';

let $testData: any;
let sessionData: string;
let $sessionData: any;

beforeAll(() => {
  try {
    let testData = fs.readFileSync(path.join(__dirname, '../resources/test-page.txt').toString()).toString();
    sessionData = fs.readFileSync(path.join(__dirname, '../resources/session-data.txt').toString()).toString();
    $testData = cheerio.load(testData);
    $sessionData = cheerio.load(sessionData);
  } catch (err) {
    console.log('ErrorLoading test data from file', err);
  }
});

let env = process.env;
let mock: MockAdapter;
beforeEach(() => {
  process.env = { ... env };
  process.env.F1_HOST = 'https://www.formula1.com';
  mock = new MockAdapter(axios);
});

afterEach(() => {
  process.env = env;
  mock.reset();
});

afterAll(() => mock.restore());

describe('Testing data processing', () => {
  test('Test handler()', async () => {
    mock.onAny().reply(200, sessionData);
    const gp = { year: '2022', name: 'Bahrain', dataEndpoint: '/en/results.html/2022/races/1124/bahrain/race-result.html' };
    const result = await Testing.handler(gp);
    // expect(result).resolves.not.toBe({ year: undefined, name: undefined, data: undefined });
    expect(result.sessions.length).toEqual(8);
    expect(result.sessions[0].data.length).toEqual(20);
    expect(result.sessions[0].name).toBe('race-result');
  });

  test('Test sessionProcessor()', async () => {
    const session = { label: 'race-results', pageData: sessionData };
    const result = Testing.sessionProcessor(session);
    expect(result.name).toEqual('race-results');
    expect(result.data.length).toBe(20);
  });
});

describe('Data Retrieval', () => {
  test('Test retrieveSessions()', async () => {
    mock.onAny().reply(200, sessionData);
    const resultPromise = await Testing.retrieveSessions('/en/results.html/2022/races/1124/bahrain/race-result.html');
    expect(resultPromise.length).toEqual(8);
  })
});

describe('Test data mapping', () => {
  test('Test buildHeaders()', () => {
    const expected = ['Grand Prix', 'Date', 'Winner', 'Car', 'Laps', 'Time'];
    const result = Testing.buildHeaders($testData, selectors.data);
    expect(result).toEqual(expected);
  });

  test('Test mapData()', () => {
    const headers = ['Grand Prix', 'Date', 'Winner', 'Car', 'Laps', 'Time'];
    const rows = $testData('tbody > tr', selectors.data).toArray();
    const expected = JSON.parse('{ "Grand Prix" : "Bahrain", "Date" : "20 Mar 2022", "Winner" : { "firstName" : "Charles", "lastName" : "Leclerc", "abbr" : "LEC" }, "Car" : "Ferrari", "Laps" : "57", "Time" : "1:37:33.584" }');
    const result = Testing.mapData($testData, rows[0], headers);
    expect(result).toEqual(expected);
  });

  test('Test mapData() for session data', () => {
    const headers = ['Position', 'Number', 'Driver', 'Car', 'Laps', 'Time/Retired', 'Points'];
    const rows = $sessionData('tbody > tr', selectors.data).toArray();
    const expected = JSON.parse('{"Position": "2","Number": "55","Driver": {"firstName": "Carlos","lastName": "Sainz","abbr": "SAI"},"Car": "Ferrari","Laps": "57","Time/Retired": "+5.598s","Points": "18"}');
    const result = Testing.mapData($sessionData, rows[1], headers);
    expect(result).toEqual(expected);
  });
});