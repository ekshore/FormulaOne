const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

import { mockClient } from 'aws-sdk-client-mock';
import { BatchWriteItemCommand, DynamoDBClient } from '@aws-sdk/client-dynamodb';
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
const dynamoMock = mockClient(DynamoDBClient);

beforeEach(() => {
  process.env = { ... env };
  process.env.F1_HOST = 'https://www.formula1.com';
  mock = new MockAdapter(axios);
  dynamoMock.reset();
});

afterEach(() => {
  process.env = env;
  mock.reset();
});

afterAll(() => mock.restore());

describe('Testing data processing', () => {
  
  beforeEach(() => {
    dynamoMock.on(BatchWriteItemCommand).resolves({});
  });

  test('Test handler()', async () => {
    mock.onAny().reply(200, sessionData);
    let callCnt = 0;
    dynamoMock.on(BatchWriteItemCommand).callsFake(() => {
      callCnt++;
      return Promise.resolve();
    });
    const gp = {
      Records: [{ Sns: { Message: JSON.stringify({ 
        year: '2022', 
        name: 'Bahrain', 
        dataEndpoint: '/en/results.html/2022/races/1124/bahrain/race-result.html' 
      })}}]
    };
    await Testing.handler(gp);
    expect(callCnt).toBe(8);
  });

  test('Test storeSession() Failure', async () => {
    dynamoMock.on(BatchWriteItemCommand).rejects();
    const session = { name: 'Q1', data: [ 
      { Driver: { firstName: 'Max', lastName: 'Verstappen', abbr: 'ver' }, Number: '1', Car: 'RedBull', Laps: 57 }
    ] };
    expect(() => Testing.storeSession(session, 'Bahrain', '2022')).rejects;
  });

  test('Test sessionProcessor()', async () => {
    const session = { label: 'race-results', pageData: sessionData };
    const result = Testing.sessionProcessor(session);
    expect(result.name).toEqual('race-results');
    expect(result.data.length).toBe(20);
    expect(result.data[15]['Time/Retired']).toEqual('+61.795s');
    expect(result.data[16]['Time/Retired']).toEqual('+4 laps');
  });
});

describe('Test Data storage', () => {
  let data: any;
  const item = {
    Position: { S: '1' },
    year_grandPrix: { S: '2022#Bahrain' },
    session_driver: { S: 'race-results#Charles_Leclerc' },
    Number: { S: '16' },
    Driver: { 
      M: {
        firstName: { S: 'Charles' },
        lastName: { S: 'Leclerc' },
        abbr: { S: 'LEC' }
      }
    },
    Car: { S: 'Ferrari' },
    Laps: { S: '57' },
    'Time/Retired': { S: '1:37:33.584' },
    Points: { S: '26' }
  }

  beforeAll(() => {
    data = Testing.sessionProcessor({ label: 'race-results', pageData: sessionData });
  });

  test('Test mapWriteRequest()', async () => {
    const mappingFn = Testing.mapWriteRequest(data.data[0], 'Bahrain', '2022', data.name);
    const result = Object.keys(data.data[0]).reduce(mappingFn, {});
    expect(result).toEqual(item);
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