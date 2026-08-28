import type { ApiFetcher } from "./fetch-utils";
import { paths } from "./schema";
import { OpForPath, OpRequestBody, OpResponseBody } from "./utils";

export const SUBSCRIPTION_ROUTES = {
  LIST: "/api/subscription",
  LEMON: "/api/subscription/lemon",
  CHECKOUT_URL: "/api/subscription/lemon/checkout_url",
  CANCEL: "/api/subscription/cancel",
  RESUME: "/api/subscription/resume",
  CHANGE: "/api/subscription/change",
} as const satisfies Record<string, keyof paths>;

export interface RetiredSubscription {
  slug: string;
  active?: boolean;
  inactive?: boolean;
  onTrial?: boolean;
  [key: string]: unknown;
}
export type SubscriptionsListResponse = {
  subscriptions: RetiredSubscription[];
};
export type LemonSubscriptionsListResponse = {
  lemonSubscriptions: RetiredSubscription[];
};
export type ChangeSubscriptionPlanBody = Record<string, unknown>;
export type GetLemonCheckoutUrlBody = Record<string, unknown>;
export type GetLemonCheckoutUrlResponse = { checkoutUrl?: string };

export async function fetchSubscriptions(
  fetcher: ApiFetcher,
): Promise<SubscriptionsListResponse> {
  const get = fetcher.path(SUBSCRIPTION_ROUTES.LIST).method("get").create();
  const { data } = await get({});
  return data;
}

export async function fetchLemonSubscriptions(
  fetcher: ApiFetcher,
): Promise<LemonSubscriptionsListResponse> {
  const get = fetcher.path(SUBSCRIPTION_ROUTES.LEMON).method("get").create();
  const { data } = await get({});
  return data;
}

export async function getLemonCheckoutUrl(
  fetcher: ApiFetcher,
  body: GetLemonCheckoutUrlBody,
): Promise<GetLemonCheckoutUrlResponse> {
  const post = fetcher
    .path(SUBSCRIPTION_ROUTES.CHECKOUT_URL)
    .method("post")
    .create();
  const { data } = await post(body as never);
  return data;
}

export async function cancelSubscription(fetcher: ApiFetcher): Promise<void> {
  const post = fetcher.path(SUBSCRIPTION_ROUTES.CANCEL).method("post").create();
  await post({});
}

export async function resumeSubscription(fetcher: ApiFetcher): Promise<void> {
  const post = fetcher.path(SUBSCRIPTION_ROUTES.RESUME).method("post").create();
  await post({});
}

export async function changeSubscriptionPlan(
  fetcher: ApiFetcher,
  body: ChangeSubscriptionPlanBody,
): Promise<void> {
  const post = fetcher.path(SUBSCRIPTION_ROUTES.CHANGE).method("post").create();
  await post(body as never);
}
