/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @fileoverview Config used for generating the sample_v2 golden LHR.
 */

/** @type {LH.Config} */
const budgetedConfig = {
  extends: 'lighthouse:default',
  settings: {
    throttlingMethod: 'devtools',
    budgets: [{
      path: '/',
      resourceCounts: [
        {resourceType: 'total', budget: 10},
        {resourceType: 'stylesheet', budget: 2},
        {resourceType: 'image', budget: 2},
        {resourceType: 'media', budget: 0},
        {resourceType: 'font', budget: 1},
        {resourceType: 'script', budget: 2},
        {resourceType: 'document', budget: 1},
        {resourceType: 'other', budget: 2},
        {resourceType: 'third-party', budget: 1},
      ],
      resourceSizes: [
        {resourceType: 'total', budget: 100},
        {resourceType: 'stylesheet', budget: 5},
        {resourceType: 'image', budget: 30},
        {resourceType: 'media', budget: 0},
        {resourceType: 'font', budget: 20},
        {resourceType: 'script', budget: 30},
        {resourceType: 'document', budget: 15},
        {resourceType: 'other', budget: 5},
        {resourceType: 'third-party', budget: 25},
      ],
      timings: [
        {metric: 'first-contentful-paint', budget: 3000},
        {metric: 'interactive', budget: 2900},
        {metric: 'first-meaningful-paint', budget: 2000},
        {metric: 'max-potential-fid', budget: 100},
      ],
    }],
  },
};

export default budgetedConfig;
