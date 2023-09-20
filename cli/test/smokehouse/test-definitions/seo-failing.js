/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const BASE_URL = 'http://localhost:10200/seo/';

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['seo'],
  },
};

/**
 * @param {[string, string][]} headers
 * @return {string}
 */
function headersParam(headers) {
  const headerString = new URLSearchParams(headers).toString();
  return new URLSearchParams([['extra_header', headerString]]).toString();
}

const failureHeaders = headersParam([[
  'x-robots-tag',
  'none',
], [
  'link',
  '<http://example.com>;rel="alternate";hreflang="xx"',
], [
  'link',
  '<https://example.com>; rel="canonical"',
]]);


/**
 * @type {Smokehouse.ExpectedRunnerResult}
 * Expected Lighthouse audit values for a site that fails seo tests.
 */
const expectations = {
  lhr: {
    requestedUrl: BASE_URL + 'seo-failure-cases.html?' + failureHeaders,
    finalDisplayedUrl: BASE_URL + 'seo-failure-cases.html?' + failureHeaders,
    audits: {
      'viewport': {
        score: 0,
      },
      'document-title': {
        score: 0,
      },
      'meta-description': {
        score: 0,
      },
      'http-status-code': {
        score: 1,
      },
      'font-size': {
        score: 0,
        explanation:
        'Text is illegible because there\'s no viewport meta tag optimized for mobile screens.',
      },
      'crawlable-anchors': {
        score: 0,
        details: {
          items: {
            length: 4,
          },
        },
      },
      'link-text': {
        score: 0,
        displayValue: '4 links found',
        details: {
          items: {
            length: 4,
          },
        },
      },
      'is-crawlable': {
        score: 0,
        details: {
          items: {
            length: 2,
          },
        },
      },
      'hreflang': {
        score: 0,
        details: {
          items: {
            length: 5,
          },
        },
      },
      'plugins': {
        score: 0,
        details: {
          items: {
            length: 3,
          },
        },
      },
      'canonical': {
        score: 0,
        explanation: 'Multiple conflicting URLs (https://example.com/other, https://example.com/)',
      },
    },
  },
};

export default {
  id: 'seo-failing',
  expectations,
  config,
};
