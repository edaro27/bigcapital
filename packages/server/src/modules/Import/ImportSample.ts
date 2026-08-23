import { Workbook } from 'exceljs';
import { sanitizeResourceName } from './_utils';
import { Injectable } from '@nestjs/common';
import { ImportableRegistry } from './ImportableRegistry';

@Injectable()
export class ImportSampleService {
  constructor(private readonly importableRegistry: ImportableRegistry) {}

  public async sample(
    resource: string,
    format: 'csv' | 'xlsx',
  ): Promise<Buffer | string> {
    const importable = await this.importableRegistry.getImportable(
      sanitizeResourceName(resource),
    );
    const data = importable.sampleData();
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    const columns = data.length > 0 ? Object.keys(data[0]) : [];

    worksheet.addRow(columns);
    data.forEach((row) => worksheet.addRow(columns.map((key) => row[key])));

    if (format === 'csv') {
      return Buffer.from(await workbook.csv.writeBuffer()).toString('utf8');
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }
}
