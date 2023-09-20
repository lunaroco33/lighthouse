/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import Audit from '../../audits/content-width.js';
import * as constants from '../../config/constants.js';

/** @param {LH.SharedFlagsSettings['formFactor']} formFactor */
const getFakeContext = (formFactor = 'mobile') => ({
  computedCache: new Map(),
  settings: {
    formFactor: formFactor,
    screenEmulation: constants.screenEmulationMetrics[formFactor],
  },
});

describe('Mobile-friendly: content-width audit', () => {
  it('fails when scroll width differs from viewport width', () => {
    const product = Audit.audit({
      ViewportDimensions: {
        innerWidth: 100,
        outerWidth: 300,
      },
    }, getFakeContext());

    assert.equal(product.score, 0);
    assert.ok(product.explanation);
  });

  it('passes when widths match', () => {
    return assert.equal(Audit.audit({
      HostUserAgent: '',
      ViewportDimensions: {
        innerWidth: 300,
        outerWidth: 300,
      },
    }, getFakeContext()).score, 1);
  });

  it('not applicable when run on desktop', () => {
    const product = Audit.audit({
      ViewportDimensions: {
        innerWidth: 300,
        outerWidth: 450,
      },
    }, getFakeContext('desktop'));

    assert.equal(product.notApplicable, true);
  });
});
