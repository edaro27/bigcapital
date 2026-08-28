/**
 * Compile-time compatibility for SDK helpers belonging to features that this
 * lightweight self-hosted build no longer mounts (commercial subscription,
 * SMS, branches, warehouses and multicurrency management).
 *
 * The helpers remain exported so older consumers still compile, but these
 * declarations intentionally do not claim a live server contract. New code
 * must not use them.
 */
import "./schema";

type RetiredOperation = {
  parameters: {
    query?: Record<string, unknown>;
    path?: Record<string, unknown>;
    header?: never;
    cookie?: never;
  };
  requestBody?: {
    content: { "application/json": Record<string, unknown> };
  };
  responses: {
    200: { content: { "application/json": any } };
    201: { content: { "application/json": any } };
  };
};

type RetiredPath = {
  get: RetiredOperation;
  post: RetiredOperation;
  put: RetiredOperation;
  patch: RetiredOperation;
  delete: RetiredOperation;
};

declare module "./schema" {
  interface paths {
    "/api/branches": RetiredPath;
    "/api/branches/{id}": RetiredPath;
    "/api/branches/activate": RetiredPath;
    "/api/branches/{id}/mark-as-primary": RetiredPath;
    "/api/warehouses": RetiredPath;
    "/api/warehouses/{id}": RetiredPath;
    "/api/warehouses/activate": RetiredPath;
    "/api/warehouses/{id}/mark-primary": RetiredPath;
    "/api/items/{id}/warehouses": RetiredPath;
    "/api/warehouse-transfers": RetiredPath;
    "/api/warehouse-transfers/{id}": RetiredPath;
    "/api/warehouse-transfers/{id}/initiate": RetiredPath;
    "/api/warehouse-transfers/{id}/transferred": RetiredPath;
    "/api/currencies": RetiredPath;
    "/api/currencies/{id}": RetiredPath;
    "/api/currencies/{code}": RetiredPath;
    "/api/currencies/{currencyCode}": RetiredPath;
    "/api/sale-estimates/{id}/notify-sms": RetiredPath;
    "/api/sale-estimates/{id}/sms-details": RetiredPath;
    "/api/subscription": RetiredPath;
    "/api/subscription/lemon": RetiredPath;
    "/api/subscription/lemon/checkout_url": RetiredPath;
    "/api/subscription/cancel": RetiredPath;
    "/api/subscription/resume": RetiredPath;
    "/api/subscription/change": RetiredPath;
  }
}

export {};
