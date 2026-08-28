import {
  archiveSalesChannel,
  createSalesChannel,
  editSalesChannel,
  fetchSalesByChannel,
  fetchSalesByChannelExport,
  fetchSalesChannels,
  restoreSalesChannel,
} from '@bigcapital/sdk-ts';
import type {
  CreateSalesChannelBody,
  EditSalesChannelBody,
  SalesByChannelQuery,
} from '@bigcapital/sdk-ts';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useApiFetcher } from '../../useRequest';
import { salesChannelsKeys } from './query-keys';

export function useSalesChannels(includeInactive = false) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    queryKey: salesChannelsKeys.list(includeInactive),
    queryFn: () => fetchSalesChannels(fetcher, { includeInactive }),
  });
}

export function useCreateSalesChannel() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateSalesChannelBody) =>
      createSalesChannel(fetcher, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelsKeys.all }),
  });
}

export function useEditSalesChannel() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, body }: { id: number; body: EditSalesChannelBody }) =>
      editSalesChannel(fetcher, id, body),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelsKeys.all }),
  });
}

export function useArchiveSalesChannel() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => archiveSalesChannel(fetcher, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelsKeys.all }),
  });
}

export function useRestoreSalesChannel() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => restoreSalesChannel(fetcher, id),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: salesChannelsKeys.all }),
  });
}

export function useSalesByChannel(query: SalesByChannelQuery) {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useQuery({
    queryKey: salesChannelsKeys.report(query),
    queryFn: () => fetchSalesByChannel(fetcher, query),
  });
}

export function useSalesByChannelExport() {
  const fetcher = useApiFetcher({ enableCamelCaseTransform: true });
  return useMutation({
    mutationFn: ({
      query,
      format,
    }: {
      query: SalesByChannelQuery;
      format: 'csv' | 'xlsx';
    }) => fetchSalesByChannelExport(fetcher, query, format),
  });
}
