/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['pwa'],
  },
};

/**
 * @type {Smokehouse.ExpectedRunnerResult}
 * Expected Lighthouse results for chromestatus.com.
 */
const expectations = {
  lhr: {
    requestedUrl: 'https://chromestatus.com/features',
    finalDisplayedUrl: 'https://chromestatus.com/features',
    audits: {
      'viewport': {
        score: 1,
      },
      'installable-manifest': {
        score: 0,
        details: {items: [{reason: 'Page has no manifest <link> URL'}]},
      },
      'splash-screen': {
        score: 0,
      },
      'themed-omnibox': {
        score: 0,
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
  id: 'pwa-chromestatus',
  expectations,
  config,
};
