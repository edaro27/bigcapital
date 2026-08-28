import {
  Button,
  Card,
  Checkbox,
  Classes,
  HTMLSelect,
  HTMLTable,
  InputGroup,
  NavbarGroup,
  Spinner,
  Tag,
} from '@blueprintjs/core';
import moment from 'moment';
import React from 'react';
import styled from 'styled-components';
import type {
  SalesByChannelQuery,
  SalesByChannelReport as SalesByChannelReportType,
} from '@bigcapital/sdk-ts';
import { DashboardActionsBar, DashboardPageContent, Icon } from '@/components';
import {
  useSalesByChannel,
  useSalesByChannelExport,
  useSalesChannels,
} from '@/hooks/query/sales-channels';
import { downloadFile } from '@/hooks/useDownloadFile';

type ReportRow = SalesByChannelReportType['data'][number];

const initialQuery: SalesByChannelQuery = {
  fromDate: moment().startOf('year').format('YYYY-MM-DD'),
  toDate: moment().format('YYYY-MM-DD'),
  includeDrafts: false,
};

export function SalesByChannelReport() {
  const [draftQuery, setDraftQuery] = React.useState(initialQuery);
  const [query, setQuery] = React.useState(initialQuery);
  const { data: channels = [] } = useSalesChannels(true);
  const { data: report, isLoading, isFetching } = useSalesByChannel(query);
  const { mutateAsync: exportReport, isPending: isExporting } =
    useSalesByChannelExport();

  const currencyFormatter = React.useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'currency',
        currency: report?.meta.baseCurrency ?? 'USD',
      }),
    [report?.meta.baseCurrency],
  );

  const handleExport = async (format: 'csv' | 'xlsx') => {
    const blob = await exportReport({ query, format });
    downloadFile(blob, `sales_by_channel.${format}`);
  };

  const renderRow = (row: ReportRow, total = false) => (
    <tr key={total ? 'total' : (row.salesChannelId ?? 'unspecified')}>
      <td>
        <strong>{row.name}</strong>{' '}
        {!total && row.archived && <Tag minimal>Archived</Tag>}
      </td>
      <td className="number">{row.invoiceCount}</td>
      <td className="number">{currencyFormatter.format(row.subtotal)}</td>
      <td className="number">{currencyFormatter.format(row.discounts)}</td>
      <td className="number">{currencyFormatter.format(row.tax)}</td>
      <td className="number">{currencyFormatter.format(row.total)}</td>
      <td className="number">{currencyFormatter.format(row.paid)}</td>
      <td className="number">{currencyFormatter.format(row.due)}</td>
    </tr>
  );

  return (
    <>
      <DashboardActionsBar>
        <NavbarGroup>
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon="file-export-16" iconSize={16} />}
            text="Export CSV"
            onClick={() => handleExport('csv')}
            disabled={isExporting}
          />
          <Button
            className={Classes.MINIMAL}
            icon={<Icon icon="file-export-16" iconSize={16} />}
            text="Export Excel"
            onClick={() => handleExport('xlsx')}
            disabled={isExporting}
          />
        </NavbarGroup>
      </DashboardActionsBar>

      <DashboardPageContent>
        <ReportCard elevation={0}>
          <h2>Sales by Channel</h2>
          <p className={Classes.TEXT_MUTED}>
            Internal invoice classification. Delivered invoices are included by
            default; this does not change accounting totals.
          </p>

          <Filters>
            <label>
              <span>From</span>
              <InputGroup
                type="date"
                value={String(draftQuery.fromDate ?? '')}
                onChange={(event) =>
                  setDraftQuery((current) => ({
                    ...current,
                    fromDate: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>To</span>
              <InputGroup
                type="date"
                value={String(draftQuery.toDate ?? '')}
                onChange={(event) =>
                  setDraftQuery((current) => ({
                    ...current,
                    toDate: event.target.value,
                  }))
                }
              />
            </label>
            <label>
              <span>Channel</span>
              <HTMLSelect
                value={String(draftQuery.salesChannelId ?? '')}
                onChange={(event) =>
                  setDraftQuery((current) => ({
                    ...current,
                    salesChannelId: event.target.value
                      ? Number(event.target.value)
                      : undefined,
                  }))
                }
              >
                <option value="">All channels</option>
                {channels.map((channel) => (
                  <option value={channel.id} key={channel.id}>
                    {channel.name}
                    {channel.active ? '' : ' (Archived)'}
                  </option>
                ))}
              </HTMLSelect>
            </label>
            <Checkbox
              checked={draftQuery.includeDrafts ?? false}
              label="Include draft invoices"
              onChange={(event) =>
                setDraftQuery((current) => ({
                  ...current,
                  includeDrafts: event.currentTarget.checked,
                }))
              }
            />
            <Button
              intent="primary"
              text="Run report"
              onClick={() => setQuery(draftQuery)}
              loading={isFetching}
            />
          </Filters>

          {isLoading || !report ? (
            <LoadingRow>
              <Spinner size={28} />
            </LoadingRow>
          ) : (
            <ReportTable striped>
              <thead>
                <tr>
                  <th>Sales channel</th>
                  <th className="number">Invoices</th>
                  <th className="number">Subtotal</th>
                  <th className="number">Discounts</th>
                  <th className="number">Tax</th>
                  <th className="number">Total invoiced</th>
                  <th className="number">Paid</th>
                  <th className="number">Due</th>
                </tr>
              </thead>
              <tbody>{report.data.map((row) => renderRow(row))}</tbody>
              <tfoot>{renderRow(report.total, true)}</tfoot>
            </ReportTable>
          )}
        </ReportCard>
      </DashboardPageContent>
    </>
  );
}

const ReportCard = styled(Card)`
  padding: 24px;
  overflow-x: auto;

  h2 {
    margin: 0 0 8px;
  }
`;

const Filters = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: flex-end;
  margin: 24px 0;

  label:not(.bp4-control) {
    display: grid;
    gap: 5px;
    font-size: 12px;
    font-weight: 500;
  }

  .bp4-control {
    margin-bottom: 7px;
  }
`;

const ReportTable = styled(HTMLTable)`
  width: 100%;
  min-width: 980px;

  .number {
    text-align: right;
    white-space: nowrap;
  }

  tfoot td {
    border-top: 2px solid rgba(17, 20, 24, 0.25);
    font-weight: 600;
  }
`;

const LoadingRow = styled.div`
  display: flex;
  justify-content: center;
  padding: 48px;
`;
