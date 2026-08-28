import { Inject, Injectable } from '@nestjs/common';
import * as moment from 'moment';
import { AcceptType } from '@/constants/accept-type';
import { SaleInvoice } from '@/modules/SaleInvoices/models/SaleInvoice';
import { TenantModelProxy } from '@/modules/System/models/TenantBaseModel';
import { TenancyContext } from '@/modules/Tenancy/TenancyContext.service';
import { TableSheet } from '@/modules/FinancialStatements/common/TableSheet';
import { ITableData } from '@/modules/FinancialStatements/types/Table.types';
import {
  SalesByChannelQueryDto,
  SalesByChannelReportResponseDto,
  SalesByChannelRowDto,
} from './dtos/SalesByChannelReport.dto';
import { SalesChannelsService } from './SalesChannels.service';

const toAmount = (value: unknown) => Number(value ?? 0);

@Injectable()
export class SalesByChannelReportService {
  constructor(
    private readonly salesChannels: SalesChannelsService,
    private readonly tenancyContext: TenancyContext,
    @Inject(SaleInvoice.name)
    private readonly saleInvoiceModel: TenantModelProxy<typeof SaleInvoice>,
  ) {}

  public async report(
    query: SalesByChannelQueryDto,
  ): Promise<SalesByChannelReportResponseDto> {
    const normalizedQuery = {
      fromDate: query.fromDate ?? moment().startOf('year').format('YYYY-MM-DD'),
      toDate: query.toDate ?? moment().format('YYYY-MM-DD'),
      includeDrafts: query.includeDrafts ?? false,
      salesChannelId: query.salesChannelId ?? null,
    };

    const [channels, invoices, tenantMetadata] = await Promise.all([
      this.salesChannels.list(true),
      this.saleInvoiceModel()
        .query()
        .withGraphFetched('salesChannel')
        .modify(
          'filterDateRange',
          normalizedQuery.fromDate,
          normalizedQuery.toDate,
        )
        .onBuild((builder) => {
          if (!normalizedQuery.includeDrafts) builder.modify('published');
          if (normalizedQuery.salesChannelId) {
            builder.where('salesChannelId', normalizedQuery.salesChannelId);
          }
        }),
      this.tenancyContext.getTenantMetadata(),
    ]);

    const rows = new Map<string, SalesByChannelRowDto>();
    channels.forEach((channel) => {
      if (
        normalizedQuery.salesChannelId &&
        channel.id !== normalizedQuery.salesChannelId
      ) {
        return;
      }
      rows.set(
        String(channel.id),
        this.emptyRow(channel.id, channel.name, !channel.active),
      );
    });

    invoices.forEach((invoice) => {
      const key = invoice.salesChannelId
        ? String(invoice.salesChannelId)
        : 'unspecified';
      const name = invoice.salesChannel?.name ?? 'Unspecified';
      const row =
        rows.get(key) ??
        this.emptyRow(invoice.salesChannelId ?? null, name, false);

      row.invoiceCount += 1;
      row.subtotal += toAmount(invoice.subtotal);
      row.discounts += toAmount(invoice.discountAmount);
      row.tax += toAmount(invoice.taxAmountWithheld);
      row.total += toAmount(invoice.total);
      row.paid += toAmount(invoice.paymentAmount);
      row.due += toAmount(invoice.dueAmount);
      rows.set(key, row);
    });

    const data = [...rows.values()].sort((a, b) => {
      if (a.salesChannelId === null) return 1;
      if (b.salesChannelId === null) return -1;
      return a.name.localeCompare(b.name);
    });
    const total = data.reduce(
      (aggregate, row) => {
        aggregate.invoiceCount += row.invoiceCount;
        aggregate.subtotal += row.subtotal;
        aggregate.discounts += row.discounts;
        aggregate.tax += row.tax;
        aggregate.total += row.total;
        aggregate.paid += row.paid;
        aggregate.due += row.due;
        return aggregate;
      },
      this.emptyRow(null, 'Total', false),
    );

    return {
      data,
      total,
      query: normalizedQuery,
      meta: {
        baseCurrency: tenantMetadata.baseCurrency,
        sheetName: 'Sales by Channel',
      },
    };
  }

  public async export(
    query: SalesByChannelQueryDto,
    format:
      | typeof AcceptType.ApplicationCsv
      | typeof AcceptType.ApplicationXlsx,
  ): Promise<string | Buffer> {
    const report = await this.report(query);
    const tableSheet = new TableSheet(this.toTable(report));

    if (format === AcceptType.ApplicationCsv) return tableSheet.convertToCSV();
    return tableSheet.convertToBuffer(tableSheet.convertToXLSX(), 'xlsx');
  }

  private emptyRow(
    salesChannelId: number | null,
    name: string,
    archived: boolean,
  ): SalesByChannelRowDto {
    return {
      salesChannelId,
      name,
      archived,
      invoiceCount: 0,
      subtotal: 0,
      discounts: 0,
      tax: 0,
      total: 0,
      paid: 0,
      due: 0,
    };
  }

  private toTable(report: SalesByChannelReportResponseDto): ITableData {
    const columns = [
      { key: 'name', label: 'Sales channel' },
      { key: 'invoiceCount', label: 'Invoice count' },
      { key: 'subtotal', label: 'Subtotal' },
      { key: 'discounts', label: 'Discounts' },
      { key: 'tax', label: 'Tax' },
      { key: 'total', label: 'Total invoiced' },
      { key: 'paid', label: 'Amount paid' },
      { key: 'due', label: 'Amount due' },
    ];
    const data = [...report.data, report.total];

    return {
      columns,
      rows: data.map((row) => ({
        id: String(row.salesChannelId ?? row.name),
        rowTypes: row.name === 'Total' ? ['total'] : ['channel'],
        cells: columns.map((column) => ({
          key: column.key,
          value:
            column.key === 'name' || column.key === 'invoiceCount'
              ? String(row[column.key])
              : toAmount(row[column.key]).toFixed(2),
        })),
      })),
    };
  }
}
