import type { OpArgType } from "openapi-typescript-fetch";
import type { ApiFetcher } from "./fetch-utils";
import type { paths } from "./schema";
import {
  OpForPath,
  OpQueryParams,
  OpRequestBody,
  OpResponseBody,
} from "./utils";

export const SALES_CHANNELS_ROUTE =
  "/api/sales-channels" as const satisfies keyof paths;
export const SALES_CHANNEL_ROUTE =
  "/api/sales-channels/{id}" as const satisfies keyof paths;
export const SALES_CHANNEL_ARCHIVE_ROUTE =
  "/api/sales-channels/{id}/archive" as const satisfies keyof paths;
export const SALES_CHANNEL_RESTORE_ROUTE =
  "/api/sales-channels/{id}/restore" as const satisfies keyof paths;
export const SALES_BY_CHANNEL_ROUTE =
  "/api/reports/sales-by-channel" as const satisfies keyof paths;

type ListOp = OpForPath<typeof SALES_CHANNELS_ROUTE, "get">;
type CreateOp = OpForPath<typeof SALES_CHANNELS_ROUTE, "post">;
type EditOp = OpForPath<typeof SALES_CHANNEL_ROUTE, "put">;
type ReportOp = OpForPath<typeof SALES_BY_CHANNEL_ROUTE, "get">;

export type SalesChannel = OpResponseBody<CreateOp>;
export type SalesChannelsList = OpResponseBody<ListOp>;
export type SalesChannelsQuery = OpQueryParams<ListOp>;
export type CreateSalesChannelBody = OpRequestBody<CreateOp>;
export type EditSalesChannelBody = OpRequestBody<EditOp>;
export type SalesByChannelQuery = OpQueryParams<ReportOp>;
export type SalesByChannelReport = OpResponseBody<ReportOp>;

export async function fetchSalesChannels(
  fetcher: ApiFetcher,
  query: SalesChannelsQuery = {},
): Promise<SalesChannelsList> {
  const get = fetcher.path(SALES_CHANNELS_ROUTE).method("get").create();
  const { data } = await get(query);
  return data;
}

export async function createSalesChannel(
  fetcher: ApiFetcher,
  body: CreateSalesChannelBody,
): Promise<SalesChannel> {
  const post = fetcher.path(SALES_CHANNELS_ROUTE).method("post").create();
  const { data } = await post(body);
  return data;
}

export async function editSalesChannel(
  fetcher: ApiFetcher,
  id: number,
  body: EditSalesChannelBody,
): Promise<SalesChannel> {
  const put = fetcher.path(SALES_CHANNEL_ROUTE).method("put").create();
  const { data } = await put({ id, ...body });
  return data;
}

export async function archiveSalesChannel(
  fetcher: ApiFetcher,
  id: number,
): Promise<SalesChannel> {
  const put = fetcher.path(SALES_CHANNEL_ARCHIVE_ROUTE).method("put").create();
  const { data } = await put({ id });
  return data;
}

export async function restoreSalesChannel(
  fetcher: ApiFetcher,
  id: number,
): Promise<SalesChannel> {
  const put = fetcher.path(SALES_CHANNEL_RESTORE_ROUTE).method("put").create();
  const { data } = await put({ id });
  return data;
}

export async function fetchSalesByChannel(
  fetcher: ApiFetcher,
  query: SalesByChannelQuery,
): Promise<SalesByChannelReport> {
  const get = fetcher.path(SALES_BY_CHANNEL_ROUTE).method("get").create();
  const { data } = await get(query as OpArgType<ReportOp>);
  return data;
}

export async function fetchSalesByChannelExport(
  fetcher: ApiFetcher,
  query: SalesByChannelQuery,
  format: "csv" | "xlsx",
): Promise<Blob> {
  const get = fetcher.path(SALES_BY_CHANNEL_ROUTE).method("get").create();
  const response = await get(query as OpArgType<ReportOp>, {
    headers: {
      accept: format === "csv" ? "application/csv" : "application/xlsx",
    },
  });
  return response.data as unknown as Blob;
}
