import { isEmpty } from 'lodash';
import type { BalanceSheetColumnKey } from '@bigcapital/sdk-ts';
import { Align } from '@/constants';
import { getColumnWidth } from '@/utils';

interface ReportTableColumn {
  key: string;
  label: string;
  cellIndex?: number;
  children?: ReportTableColumn[];
}

interface TableColumn {
  key: string;
  Header: string;
  accessor?: string;
  className?: string;
  textOverview?: boolean;
  width?: number;
  sticky?: string;
  align?: string;
  disableSortBy?: boolean;
  money?: boolean;
  columns?: TableColumn[];
}

const getTableCellValueAccessor = (index = 0) => `cells[${index}].value`;

const getReportColWidth = (
  data: unknown[],
  accessor: string,
  headerText?: string,
): number =>
  getColumnWidth(
    data,
    accessor,
    { magicSpacing: 12, minWidth: 100 },
    headerText,
  );

const accountNameMapper = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  const accessor = getTableCellValueAccessor(column.cellIndex);

  return {
    key: column.key,
    Header: column.label,
    accessor,
    className: column.key,
    textOverview: true,
    width: Math.max(getReportColWidth(data, accessor, column.label), 300),
    sticky: Align.Left,
  };
};

const leafMoneyColumn = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  const accessor = getTableCellValueAccessor(column.cellIndex);

  return {
    key: column.key,
    Header: column.label,
    accessor,
    width: getReportColWidth(data, accessor, column.label),
    align: Align.Right,
    disableSortBy: true,
    textOverview: true,
    money: true,
  };
};

const totalMapper = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  if (isEmpty(column.children)) return leafMoneyColumn(data, column);

  return {
    key: column.key,
    Header: column.label,
    align: Align.Center,
    disableSortBy: true,
    textOverview: true,
    money: true,
    columns: (column.children ?? []).map((child) =>
      totalSubColumnMapper(data, child),
    ),
  };
};

const totalSubColumnMapper = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  const knownKey = column.key as BalanceSheetColumnKey;
  switch (knownKey) {
    case 'total':
    case 'percentage_of_column':
    case 'percentage_of_row':
    case 'previous_year':
    case 'previous_year_change':
    case 'previous_year_percentage':
    case 'previous_period':
    case 'previous_period_change':
    case 'previous_period_percentage':
    default:
      return totalMapper(data, column);
  }
};

const dateRangeMapper = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  if (isEmpty(column.children)) return leafMoneyColumn(data, column);

  return {
    key: column.key,
    Header: column.label,
    align: Align.Center,
    disableSortBy: true,
    textOverview: true,
    money: true,
    columns: (column.children ?? []).map((child) =>
      totalSubColumnMapper(data, child),
    ),
  };
};

const dynamicColumnMapper = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  if (/^date-range/.test(column.key)) return dateRangeMapper(data, column);
  if (column.key === 'name') return accountNameMapper(data, column);
  return totalMapper(data, column);
};

export const dynamicColumns = (
  columns: ReportTableColumn[],
  data: unknown[],
): TableColumn[] => columns.map((column) => dynamicColumnMapper(data, column));
