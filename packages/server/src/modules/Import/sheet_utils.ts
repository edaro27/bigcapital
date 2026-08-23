import { Readable } from 'stream';
import { CellValue, Workbook, Worksheet } from 'exceljs';

const isXlsxBuffer = (buffer: Buffer) =>
  buffer.length >= 4 &&
  buffer[0] === 0x50 &&
  buffer[1] === 0x4b &&
  buffer[2] === 0x03 &&
  buffer[3] === 0x04;

const normalizeCellValue = (value: CellValue): unknown => {
  if (value === null || value === undefined) return '';
  if (value instanceof Date) return value;
  if (typeof value !== 'object') return value;
  if ('result' in value) return normalizeCellValue(value.result as CellValue);
  if ('text' in value) return value.text;
  if ('richText' in value) {
    return value.richText.map((part) => part.text).join('');
  }
  if ('error' in value) return value.error;
  return String(value);
};

/** Parses a CSV or XLSX buffer and returns its first worksheet. */
export async function parseFirstSheet(buffer: Buffer): Promise<Worksheet> {
  const workbook = new Workbook();

  if (isXlsxBuffer(buffer)) {
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) throw new Error('The workbook does not contain a sheet');
    return worksheet;
  }
  return workbook.csv.read(Readable.from(buffer));
}

/** Extracts non-empty labels from the first row. */
export function extractSheetColumns(worksheet: Worksheet): string[] {
  const values = worksheet.getRow(1).values;
  const cells = Array.isArray(values) ? values.slice(1) : [];

  return cells
    .map((value) => String(normalizeCellValue(value as CellValue)).trim())
    .filter(Boolean);
}

/** Converts worksheet rows to objects keyed by the first-row labels. */
export function parseSheetToJson(
  worksheet: Worksheet,
): Array<Record<string, unknown>> {
  const columns = extractSheetColumns(worksheet);
  const rows: Array<Record<string, unknown>> = [];

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const record = columns.reduce<Record<string, unknown>>(
      (result, column, index) => {
        result[column] = normalizeCellValue(row.getCell(index + 1).value);
        return result;
      },
      {},
    );
    if (Object.values(record).some((value) => value !== '')) rows.push(record);
  });
  return rows;
}

/** Parses a sheet buffer and returns its row data and column labels. */
export async function parseSheetData(
  buffer: Buffer,
): Promise<[Array<Record<string, unknown>>, string[]]> {
  const worksheet = await parseFirstSheet(buffer);
  return [parseSheetToJson(worksheet), extractSheetColumns(worksheet)];
}
