import { Workbook } from 'exceljs';
import { ITableData } from '../types/Table.types';
import { FinancialTableStructure } from './FinancialTableStructure';

interface ITableSheet {
  convertToXLSX(): Workbook;
  convertToCSV(): string;
  convertToBuffer(
    workbook: Workbook,
    fileType: 'xlsx' | 'csv',
  ): Promise<Buffer>;
}

const escapeCsvValue = (value: unknown): string => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

export class TableSheet implements ITableSheet {
  constructor(private readonly table: ITableData) {}

  private get columns() {
    return this.table.columns.map((col) => col.label);
  }

  private get rowValues() {
    return FinancialTableStructure.flatNestedTree(this.table.rows).map((row) =>
      row.cells.map((cell) => cell.value),
    );
  }

  public convertToCSV(): string {
    return [this.columns, ...this.rowValues]
      .map((row) => row.map(escapeCsvValue).join(','))
      .join('\n');
  }

  public convertToXLSX(): Workbook {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Sheet1');
    const rows = this.rowValues;

    worksheet.addRow(this.columns);
    rows.forEach((row) => worksheet.addRow(row));
    worksheet.columns = this.computeXlsxColumnsWidths(rows).map((width) => ({
      width,
    }));
    return workbook;
  }

  public async convertToBuffer(
    workbook: Workbook,
    fileType: 'xlsx' | 'csv',
  ): Promise<Buffer> {
    if (fileType === 'csv') {
      return Buffer.from(await workbook.csv.writeBuffer());
    }
    return Buffer.from(await workbook.xlsx.writeBuffer());
  }

  private computeXlsxColumnsWidths(rows: unknown[][]): number[] {
    return this.columns.map((column, index) => {
      const longestValue = rows.reduce(
        (longest, row) => Math.max(longest, String(row[index] ?? '').length),
        column.length,
      );
      return Math.min(Math.max(longestValue + 2, 10), index === 0 ? 60 : 40);
    });
  }
}
