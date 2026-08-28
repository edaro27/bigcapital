import type { SalesByChannelQuery } from '@bigcapital/sdk-ts';

export const salesChannelsKeys = {
  all: ['sales-channels'] as const,
  list: (includeInactive: boolean) =>
    [...salesChannelsKeys.all, { includeInactive }] as const,
  reports: () => [...salesChannelsKeys.all, 'reports'] as const,
  report: (query: SalesByChannelQuery) =>
    [...salesChannelsKeys.reports(), query] as const,
};
