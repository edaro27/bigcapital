import { Workbook } from 'exceljs';
import { parseSheetData } from './sheet_utils';

describe('sheet_utils', () => {
  it('parses CSV headers, quoted values, and numeric values', async () => {
    const csv = Buffer.from('Name,Rate\n"Example, Inc.",1.2345\n');

    const [rows, columns] = await parseSheetData(csv);

    expect(columns).toEqual(['Name', 'Rate']);
    expect(rows).toEqual([{ Name: 'Example, Inc.', Rate: 1.2345 }]);
  });

  it('parses the first XLSX worksheet without losing numeric precision', async () => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Import');
    worksheet.addRow(['Name', 'Rate']);
    worksheet.addRow(['Example', 1.2345]);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const [rows, columns] = await parseSheetData(buffer);

    expect(columns).toEqual(['Name', 'Rate']);
    expect(rows).toEqual([{ Name: 'Example', Rate: 1.2345 }]);
  });
});
