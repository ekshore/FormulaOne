





const buildHeaders = ($: any, contextSelector: string): string[] => {
  return $('thead > tr > th', contextSelector)
    .filter((_: any, element: any) => $(element).attr('class') !== 'limiter')
    .map((_: any, element: any) => {
      let abbr = $('abbr', element);
      if (abbr.length > 0) return $(abbr).attr('title');
      else return $(element).text();
    });
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
  buildHeaders,
  mapData
}