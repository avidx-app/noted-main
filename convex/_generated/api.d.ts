/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aiSettings from "../aiSettings.js";
import type * as aiSettingsActions from "../aiSettingsActions.js";
import type * as coworkerAdology from "../coworkerAdology.js";
import type * as coworkerConfig from "../coworkerConfig.js";
import type * as coworkerMessages from "../coworkerMessages.js";
import type * as documents from "../documents.js";
import type * as files from "../files.js";
import type * as storage from "../storage.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  aiSettings: typeof aiSettings;
  aiSettingsActions: typeof aiSettingsActions;
  coworkerAdology: typeof coworkerAdology;
  coworkerConfig: typeof coworkerConfig;
  coworkerMessages: typeof coworkerMessages;
  documents: typeof documents;
  files: typeof files;
  storage: typeof storage;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
