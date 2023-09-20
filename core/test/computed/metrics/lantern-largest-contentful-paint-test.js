/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import {LanternLargestContentfulPaint} from '../../../computed/metrics/lantern-largest-contentful-paint.js';
import {getURLArtifactFromDevtoolsLog, readJson} from '../../test-utils.js';

const trace = readJson('../../fixtures/traces/lcp-m78.json', import.meta);
const devtoolsLog = readJson('../../fixtures/traces/lcp-m78.devtools.log.json', import.meta);

const URL = getURLArtifactFromDevtoolsLog(devtoolsLog);
describe('Metrics: Lantern LCP', () => {
  it('should compute predicted value', async () => {
    const gatherContext = {gatherMode: 'navigation'};
    const settings = {};
    const computedCache = new Map();
    const result = await LanternLargestContentfulPaint.request(
      {trace, devtoolsLog, gatherContext, settings, URL},
      {computedCache}
    );

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs)}).
toMatchInlineSnapshot(`
Object {
  "optimistic": 2294,
  "pessimistic": 3233,
  "timing": 2764,
}
`);
    assert.equal(result.optimisticEstimate.nodeTimings.size, 12);
    assert.equal(result.pessimisticEstimate.nodeTimings.size, 19);
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });
});
