/**
 * @license
 * Copyright 2023 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

declare module 'rxjs' {
  export * from 'rxjs/index.js';

  // Puppeteer uses a later version of rxjs as a dev dep.
  // We don't need it for normal execution, but these types are necessary
  // when we reach into puppeteer internals in `lightrider-entry.js`
  export const catchError: any;
  export const defaultIfEmpty: any;
  export const filter: any;
  export const first: any;
  export const ignoreElements: any;
  export const map: any;
  export const mergeMap: any;
  export const raceWith: any;
  export const retry: any;
  export const tap: any;
  export const throwIfEmpty: any;
  export const firstValueFrom: any;
}

