/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/** @type {LH.Config} */
const config = {
  extends: 'lighthouse:default',
  settings: {
    onlyCategories: ['performance'],
  },
};

/**
 * @type {Smokehouse.ExpectedRunnerResult}
 */
const expectations = {
  artifacts: {
    ViewportDimensions: {
      innerWidth: 824,
      innerHeight: 1646,
      outerWidth: 412,
      outerHeight: 823,
      devicePixelRatio: 1.75,
    },
  },
  lhr: {
    requestedUrl: 'http://localhost:10200/scaled-content.html',
    finalDisplayedUrl: 'http://localhost:10200/scaled-content.html',
    audits: {},
    fullPageScreenshot: {
      nodes: {
        _includes: [
          [
            /-BODY$/,
            {
              top: 0,
              bottom: 2000,
              left: 0,
              right: 824,
              width: 824,
              height: 2000,
            },
          ],
        ],
      },
      screenshot: {
        height: 2000,
        width: 824,
      },
    },
  },
};

export default {
  id: 'fps-scaled',
  expectations,
  config,
};

