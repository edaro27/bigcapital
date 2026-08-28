import type { ApiFetcher } from "./fetch-utils";
import { paths } from "./schema";
import {
  OpForPath,
  OpQueryParams,
  OpRequestBody,
  OpResponseBody,
} from "./utils";

export const WAREHOUSE_TRANSFERS_ROUTES = {
  LIST: "/api/warehouse-transfers",
  BY_ID: "/api/warehouse-transfers/{id}",
  INITIATE: "/api/warehouse-transfers/{id}/initiate",
  TRANSFERRED: "/api/warehouse-transfers/{id}/transferred",
} as const satisfies Record<string, keyof paths>;

export interface WarehouseTransfer {
  id: number;
  transactionNumber: string;
  formattedDate?: string;
  isInitiated: boolean;
  isTransferred: boolean;
  entries: any[];
  fromWarehouse?: { id: number; name: string };
  toWarehouse?: { id: number; name: string };
  [key: string]: unknown;
}
export type WarehouseTransfersListResponse = {
  data: WarehouseTransfer[];
  pagination: { total: number; page?: number; pageSize?: number };
};
export type CreateWarehouseTransferBody = Record<string, unknown>;
export type EditWarehouseTransferBody = Record<string, unknown>;
export type GetWarehouseTransfersQuery = Record<string, unknown>;

export async function fetchWarehouseTransfers(
  fetcher: ApiFetcher,
  query?: GetWarehouseTransfersQuery,
): Promise<WarehouseTransfersListResponse> {
  const get = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.LIST)
    .method("get")
    .create();
  const { data } = await (
    get as (
      params: GetWarehouseTransfersQuery,
    ) => Promise<{ data: WarehouseTransfersListResponse }>
  )(query ?? {});
  return data;
}

export async function fetchWarehouseTransfer(
  fetcher: ApiFetcher,
  id: number,
): Promise<WarehouseTransfer> {
  const get = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.BY_ID)
    .method("get")
    .create();
  const { data } = await get({ id });
  return data;
}

export async function createWarehouseTransfer(
  fetcher: ApiFetcher,
  values: CreateWarehouseTransferBody,
): Promise<void> {
  const post = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.LIST)
    .method("post")
    .create();
  await post(values);
}

export async function editWarehouseTransfer(
  fetcher: ApiFetcher,
  id: number,
  values: EditWarehouseTransferBody,
): Promise<void> {
  const put = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.BY_ID)
    .method("put")
    .create();
  await put({ id, ...(values as object) } as never);
}

export async function deleteWarehouseTransfer(
  fetcher: ApiFetcher,
  id: number,
): Promise<void> {
  const del = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.BY_ID)
    .method("delete")
    .create();
  await (del as unknown as (params: { id: number }) => Promise<void>)({ id });
}

export async function initiateWarehouseTransfer(
  fetcher: ApiFetcher,
  id: number,
): Promise<void> {
  const put = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.INITIATE)
    .method("put")
    .create();
  await (put as unknown as (params: { id: number }) => Promise<void>)({ id });
}

export async function transferredWarehouseTransfer(
  fetcher: ApiFetcher,
  id: number,
): Promise<void> {
  const put = fetcher
    .path(WAREHOUSE_TRANSFERS_ROUTES.TRANSFERRED)
    .method("put")
    .create();
  await (put as unknown as (params: { id: number }) => Promise<void>)({ id });
}
