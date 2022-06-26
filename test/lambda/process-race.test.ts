const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

import { selectors } from './../../lambda/utility/selectors';
import { Testing } from './../../lambda/process-race';

let testData: String;
let $testData: any;
let $sessionData: any;

beforeAll(() => {
  try {
    testData = fs.readFileSync(path.join(__dirname, '../resources/test-page.txt').toString()).toString();
    let sessionData = fs.readFileSync(path.join(__dirname, '../resources/session-data.txt').toString()).toString();
    $testData = cheerio.load(testData);
    $sessionData = cheerio.load(sessionData);
  } catch (err) { 
    console.log('ErrorLoading test data from file', err);
  }
});

describe('Test data mapping', () => {
  test('Test buildHeaders()', () => {
    const expected = [ 'Grand Prix', 'Date', 'Winner', 'Car', 'Laps', 'Time'];
    const result = Testing.buildHeaders($testData, selectors.sessionData);
  });

  test('Test mapData()', () => {
    const headers = [ 'Grand Prix', 'Date', 'Winner', 'Car', 'Laps', 'Time'];
    const rows = $testData('tbody > tr', selectors.data).toArray();
    const expected =  JSON.parse('{ "Grand Prix" : "Bahrain", "Date" : "20 Mar 2022", "Winner" : { "firstName" : "Charles", "lastName" : "Leclerc", "abbr" : "LEC" }, "Car" : "Ferrari", "Laps" : "57", "Time" : "1:37:33.584" }');
    const result = Testing.mapData($testData, rows[0], headers);
    expect(result).toEqual(expected);
  });

  test('Test mapData() for session data', () => {
    const headers = ['Position', 'Number', 'Driver', 'Car', 'Laps', 'Time/Retired', 'Points'];
    const rows = $sessionData('tbody > tr',).toArray();
    const expected = JSON.parse('{"Position": "2","Number": "55","Driver": {"firstName": "Carlos","lastName": "Sainz","abbr": "SAI"},"Car": "Ferrari","Laps": "57","Time/Retired": "+5.598s","Points": "18"}');
    const result = Testing.mapData($sessionData, rows[1], headers);
    expect(result).toEqual(expected);
  });
});