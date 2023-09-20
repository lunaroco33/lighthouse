/**
 * @license Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  plugins: ['lighthouse-plugin-publisher-ads'],
};

/**
  * @type {Smokehouse.ExpectedRunnerResult}
  */
const expectations = {
  lhr: {
    requestedUrl: 'http://localhost:10200/online-only.html',
    finalDisplayedUrl: 'http://localhost:10200/online-only.html',
    // We should receive warnings about no ads being on the page.
    runWarnings: {length: '>0'},
    audits: {
      // We just want to ensure the plugin had a chance to run without error.
      'tag-load-time': {scoreDisplayMode: 'notApplicable'},
      'bid-request-from-page-start': {scoreDisplayMode: 'notApplicable'},
      'ad-request-from-page-start': {scoreDisplayMode: 'notApplicable'},
      'first-ad-render': {scoreDisplayMode: 'notApplicable'},
      'cumulative-ad-shift': {scoreDisplayMode: 'notApplicable'},
      'total-ad-blocking-time': {scoreDisplayMode: 'notApplicable'},
      'gpt-bids-parallel': {scoreDisplayMode: 'notApplicable'},
      'serial-header-bidding': {scoreDisplayMode: 'notApplicable'},
      'bottleneck-requests': {scoreDisplayMode: 'notApplicable'},
      'script-injected-tags': {scoreDisplayMode: 'notApplicable'},
      'blocking-load-events': {scoreDisplayMode: 'notApplicable'},
      'ad-render-blocking-resources': {scoreDisplayMode: 'notApplicable'},
      'ad-blocking-tasks': {scoreDisplayMode: 'notApplicable'},
      'ad-request-critical-path': {scoreDisplayMode: 'notApplicable'},
      'ads-in-viewport': {scoreDisplayMode: 'notApplicable'},
      'async-ad-tags': {scoreDisplayMode: 'notApplicable'},
      'loads-ad-tag-over-https': {scoreDisplayMode: 'notApplicable'},
      'loads-gpt-from-official-source': {scoreDisplayMode: 'notApplicable'},
      'viewport-ad-density': {scoreDisplayMode: 'notApplicable'},
      'ad-top-of-viewport': {scoreDisplayMode: 'notApplicable'},
      'duplicate-tags': {scoreDisplayMode: 'notApplicable'},
      'deprecated-gpt-api-usage': {scoreDisplayMode: 'notApplicable'},
      'gpt-errors-overall': {scoreDisplayMode: 'notApplicable'},
    },
  },
};

export default {
  id: 'pubads',
  expectations,
  config,
};
