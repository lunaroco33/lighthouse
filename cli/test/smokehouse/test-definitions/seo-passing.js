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

const passHeaders = headersParam([[
  'link',
  '<http://localhost:10200/seo/>; rel="canonical"',
]]);

/**
 * @type {Smokehouse.ExpectedRunnerResult}
 * Expected Lighthouse audit values for a site that passes seo tests.
 */
const expectations = {
  lhr: {
    requestedUrl: BASE_URL + 'seo-tester.html?' + passHeaders,
    finalDisplayedUrl: BASE_URL + 'seo-tester.html?' + passHeaders,
    audits: {
      'viewport': {
        score: 1,
      },
      'document-title': {
        score: 1,
      },
      'meta-description': {
        score: 1,
      },
      'http-status-code': {
        score: 1,
      },
      'font-size': {
        score: 1,
        details: {
          items: [
            {
              source: {
                url: /seo-tester\.html.+$/,
                urlProvider: 'network',
                line: 23,
                column: 12,
              },
              selector: '.small',
              fontSize: '11px',
            },
            {
              source: {
                url: /seo-tester\.html.+$/,
                urlProvider: 'network',
                line: 27,
                column: 55,
              },
              selector: '.small-2',
              fontSize: '11px',
            },
            {
              source: {
                url: /seo-tester-inline-magic\.css$/,
                urlProvider: 'comment',
                line: 2,
                column: 14,
              },
              selector: '.small-3',
              fontSize: '6px',
            },
            {
              source: {
                url: /seo-tester-styles-magic\.css$/,
                urlProvider: 'comment',
                line: 2,
                column: 10,
              },
              selector: '.small-4',
              fontSize: '6px',
            },
            {
              source: {type: 'code', value: 'User Agent Stylesheet'},
              selector: 'h6',
              fontSize: '10.72px',
            },
            {
              source: {type: 'url', value: /seo-tester\.html.+$/},
              selector: {
                type: 'node',
                selector: 'body',
                snippet: '<font size="1">',
              },
              fontSize: '10px',
            },
            {
              source: {type: 'url', value: /seo-tester\.html.+$/},
              selector: {
                type: 'node',
                selector: 'font',
                snippet: '<b>',
              },
              fontSize: '10px',
            },
            {
              source: {type: 'url', value: /seo-tester\.html.+$/},
              selector: {
                type: 'node',
                selector: 'div',
                snippet: '<p style="font-size:10px">',
              },
              fontSize: '10px',
            },
            {
              source: {type: 'code', value: 'Legible text'},
              selector: '',
              fontSize: '≥ 12px',
            },
          ],
        },
      },
      'crawlable-anchors': {
        score: 0,
        details: {
          items: {
            length: 2,
          },
        },
      },
      'link-text': {
        score: 1,
      },
      'is-crawlable': {
        score: 1,
      },
      'hreflang': {
        score: 1,
      },
      'plugins': {
        score: 1,
      },
      'canonical': {
        score: 1,
      },
      'robots-txt': {
        score: 1,
      },
    },
  },
};

export default {
  id: 'seo-passing',
  expectations,
  config,
};
