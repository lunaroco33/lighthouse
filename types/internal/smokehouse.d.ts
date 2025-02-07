/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {Artifacts} from '../artifacts.js';
import Config from '../config.js';
import LHResult from '../lhr/lhr.js';

declare global {
  module Smokehouse {
    interface ExpectedLHR {
      audits: Record<string, any>;
      requestedUrl: string;
      finalDisplayedUrl: string | RegExp;
      userAgent?: string | RegExp;
      runWarnings?: any;
      runtimeError?: {
        code?: any;
        message?: any;
      };
      timing?: {
        entries?: any
      };
      fullPageScreenshot?: any;
    }

    export type ExpectedRunnerResult = {
      lhr: ExpectedLHR,
      artifacts?: Partial<Record<keyof Artifacts|'_maxChromiumVersion'|'_minChromiumVersion', any>>
      networkRequests?: any;
    }

    export interface TestDfn {
      /** Identification of test. Can be used for group selection (e.g. `yarn smoke pwa` will run all tests with `id.includes('pwa')`). */
      id: string;
      /** Expected test results. */
      expectations: ExpectedRunnerResult;
      /** An optional custom config. If none is present, uses the default Lighthouse config. */
      config?: Config;
      /** If test is performance sensitive, set to true so that it won't be run parallel to other tests. */
      runSerially?: boolean;
    }

    /**
     * A TestDefn type that's compatible with the old array of `expectations` type and the current TestDefn type.
     * COMPAT: remove when no long needed.
     * @deprecated
     */
    export type BackCompatTestDefn =
      Omit<Smokehouse.TestDfn, 'expectations'> &
      {expectations: Smokehouse.ExpectedRunnerResult | Array<Smokehouse.ExpectedRunnerResult>}

    export type LighthouseRunner =
      {runnerName?: string} & ((url: string, config?: Config, runnerOptions?: {isDebug?: boolean}) => Promise<{lhr: LHResult, artifacts: Artifacts, log: string}>);

    export interface SmokehouseOptions {
      /** If true, performs extra logging from the test runs. */
      isDebug?: boolean;
      /** Manually set the number of jobs to run at once. `1` runs all tests serially. */
      jobs?: number;
      /** The number of times to retry failing tests before accepting. Defaults to 0. */
      retries?: number;
      /** A function that runs Lighthouse with the given options. Defaults to running Lighthouse via the CLI. */
      lighthouseRunner?: LighthouseRunner;
      /** A function that gets a list of URLs requested to the server since the last fetch. */
      takeNetworkRequestUrls?: () => string[];
      /** A function run once before all smoke tests. */
      setup?: () => Promise<void>;
    }

    export interface SmokehouseLibOptions extends SmokehouseOptions {
      urlFilterRegex?: RegExp;
      skip?: (test: TestDfn, expectation: ExpectedRunnerResult) => string | false;
      modify?: (test: TestDfn, expectation: ExpectedRunnerResult) => void;
      /** String of form `shardNumber/shardTotal`, e.g. `'1/4'`. */
      shardArg: string | undefined;
    }
  }
}
