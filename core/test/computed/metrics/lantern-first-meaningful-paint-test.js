/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import {LanternFirstMeaningfulPaint} from '../../../computed/metrics/lantern-first-meaningful-paint.js';
import {getURLArtifactFromDevtoolsLog, readJson} from '../../test-utils.js';

const trace = readJson('../../fixtures/traces/progressive-app-m60.json', import.meta);
const devtoolsLog = readJson('../../fixtures/traces/progressive-app-m60.devtools.log.json', import.meta);

const URL = getURLArtifactFromDevtoolsLog(devtoolsLog);
describe('Metrics: Lantern FMP', () => {
  it('should compute predicted value', async () => {
    const gatherContext = {gatherMode: 'navigation'};
    const computedCache = new Map();
    const result = await LanternFirstMeaningfulPaint.request({trace, devtoolsLog, gatherContext,
      settings: {}, URL}, {computedCache});

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    }).toMatchSnapshot();
    assert.equal(result.optimisticEstimate.nodeTimings.size, 6);
    assert.equal(result.pessimisticEstimate.nodeTimings.size, 9);
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });
});
