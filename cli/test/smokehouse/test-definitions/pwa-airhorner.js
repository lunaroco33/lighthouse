/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import pwaDetailsExpectations from './pwa-expectations-details.js';

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['pwa'],
  },
};

/**
 * @type {Smokehouse.ExpectedRunnerResult}
 * Expected Lighthouse results for airhorner.com.
 */
const expectations = {
  lhr: {
    requestedUrl: 'https://airhorner.com',
    finalDisplayedUrl: 'https://airhorner.com/',
    audits: {
      'viewport': {
        score: 1,
      },
      'installable-manifest': {
        score: 1,
        details: {items: [], debugData: {manifestUrl: 'https://airhorner.com/manifest.json'}},
      },
      'splash-screen': {
        score: 1,
        details: {items: [pwaDetailsExpectations]},
      },
      'themed-omnibox': {
        score: 1,
        details: {items: [{...pwaDetailsExpectations, themeColor: '#2196F3'}]},
      },
      'content-width': {
        score: 1,
      },

      // "manual" audits. Just verify in the results.
      'pwa-cross-browser': {
        score: null,
        scoreDisplayMode: 'manual',
      },
      'pwa-page-transitions': {
        score: null,
        scoreDisplayMode: 'manual',
      },
      'pwa-each-page-has-url': {
        score: null,
        scoreDisplayMode: 'manual',
      },
    },
  },
};

export default {
  id: 'pwa-airhorner',
  expectations,
  config,
};
