import type { AgingSummaryColumnKey } from '@bigcapital/sdk-ts';
import { Align } from '@/constants';
import { getColumnWidth } from '@/utils';

interface AgingSummaryColumn {
  key: string;
  label: string;
  cellIndex?: number;
}

const getTableCellValueAccessor = (index: number) => `cells[${index}].value`;

const contactNameAccessor = (data: unknown[], column: AgingSummaryColumn) => ({
  key: column.key,
  Header: column.label,
  accessor: getTableCellValueAccessor(column.cellIndex!),
  sticky: 'left',
  width: 240,
  textOverview: true,
});

const currentAccessor = (data: unknown[], column: AgingSummaryColumn) => {
  const accessor = getTableCellValueAccessor(column.cellIndex!);

  return {
    key: column.key,
    Header: column.label,
    accessor,
    className: column.key,
    width: getColumnWidth(data, accessor, { minWidth: 120 }),
    align: Align.Right,
    money: true,
  };
};

const totalAccessor = (data: unknown[], column: AgingSummaryColumn) => {
  const accessor = getTableCellValueAccessor(column.cellIndex!);

  return {
    Header: column.label,
    id: column.key,
    accessor: getTableCellValueAccessor(column.cellIndex!),
    className: column.key,
    width: getColumnWidth(data, accessor, { minWidth: 120 }),
    align: Align.Right,
    money: true,
  };
};

const agingPeriodAccessor = (data: unknown[], column: AgingSummaryColumn) => {
  const accessor = getTableCellValueAccessor(column.cellIndex!);

  return {
    Header: column.label,
    id: `${column.key}-${column.cellIndex}`,
    accessor,
    className: column.key,
    width: getColumnWidth(data, accessor, { minWidth: 120 }),
    align: Align.Right,
    money: true,
  };
};

const dynamicColumnMapper = (data: unknown[], column: AgingSummaryColumn) => {
  switch (column.key as AgingSummaryColumnKey) {
    case 'total':
      return totalAccessor(data, column);
    case 'current':
      return currentAccessor(data, column);
    case 'customer_name':
    case 'vendor_name':
      return contactNameAccessor(data, column);
    case 'aging_period':
      return agingPeriodAccessor(data, column);
    default:
      return column;
  }
};

export const agingSummaryDynamicColumns = (
  columns: AgingSummaryColumn[],
  data: unknown[],
) => {
  return columns.map((column) => dynamicColumnMapper(data, column));
};
