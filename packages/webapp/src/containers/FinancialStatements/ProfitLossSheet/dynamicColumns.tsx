import { isEmpty } from 'lodash';
import type { ProfitLossColumnKey } from '@bigcapital/sdk-ts';
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
  labelText?: string,
) =>
  getColumnWidth(
    data,
    accessor,
    { magicSpacing: 10, minWidth: 100 },
    labelText,
  );

const leafMoneyColumn = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  const accessor = getTableCellValueAccessor(column.cellIndex);

  return {
    Header: column.label,
    key: column.key,
    accessor,
    width: getReportColWidth(data, accessor, column.label),
    align: Align.Right,
    disableSortBy: true,
    textOverview: true,
    money: true,
  };
};

const totalColumn = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  if (isEmpty(column.children)) return leafMoneyColumn(data, column);

  return {
    key: column.key,
    Header: column.label,
    textOverview: true,
    disableSortBy: true,
    align: Align.Center,
    money: true,
    columns: (column.children ?? []).map((child) =>
      totalSubColumn(data, child),
    ),
  };
};

const totalSubColumn = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  const knownKey = column.key as ProfitLossColumnKey;
  switch (knownKey) {
    case 'total':
    case 'percentage_column':
    case 'percentage_row':
    case 'percentage_income':
    case 'percentage_expenses':
    case 'previous_year':
    case 'previous_year_change':
    case 'previous_year_percentage':
    case 'previous_period':
    case 'previous_period_change':
    case 'previous_period_percentage':
    default:
      return totalColumn(data, column);
  }
};

const accountNameColumn = (
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

const dateRangeColumn = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  if (isEmpty(column.children)) return leafMoneyColumn(data, column);

  return {
    Header: column.label,
    key: column.key,
    disableSortBy: true,
    textOverview: true,
    align: Align.Center,
    money: true,
    columns: (column.children ?? []).map((child) =>
      totalSubColumn(data, child),
    ),
  };
};

const dynamicColumnMapper = (
  data: unknown[],
  column: ReportTableColumn,
): TableColumn => {
  if (/^date-range/.test(column.key)) return dateRangeColumn(data, column);
  if (column.key === 'name') return accountNameColumn(data, column);
  return totalColumn(data, column);
};

export const dynamicColumns = (
  columns: ReportTableColumn[],
  data: unknown[],
): TableColumn[] => columns.map((column) => dynamicColumnMapper(data, column));
