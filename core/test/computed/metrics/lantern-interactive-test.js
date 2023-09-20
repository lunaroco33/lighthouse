/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import {LanternInteractive} from '../../../computed/metrics/lantern-interactive.js';
import {getURLArtifactFromDevtoolsLog, readJson} from '../../test-utils.js';

const trace = readJson('../../fixtures/traces/progressive-app-m60.json', import.meta);
const devtoolsLog = readJson('../../fixtures/traces/progressive-app-m60.devtools.log.json', import.meta);
const iframeTrace = readJson('../../fixtures/traces/iframe-m79.trace.json', import.meta);
const iframeDevtoolsLog = readJson('../../fixtures/traces/iframe-m79.devtoolslog.json', import.meta);

describe('Metrics: Lantern TTI', () => {
  const gatherContext = {gatherMode: 'navigation'};

  it('should compute predicted value', async () => {
    const settings = {};
    const context = {settings, computedCache: new Map()};
    const URL = getURLArtifactFromDevtoolsLog(devtoolsLog);
    const result = await LanternInteractive.request({trace, devtoolsLog, gatherContext,
      settings, URL}, context);

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    }).toMatchSnapshot();
    assert.equal(result.optimisticEstimate.nodeTimings.size, 20);
    assert.equal(result.pessimisticEstimate.nodeTimings.size, 80);
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });

  it('should compute predicted value on iframes with substantial layout', async () => {
    const settings = {};
    const context = {settings, computedCache: new Map()};
    const URL = getURLArtifactFromDevtoolsLog(iframeDevtoolsLog);
    const result = await LanternInteractive.request({
      trace: iframeTrace,
      devtoolsLog: iframeDevtoolsLog,
      gatherContext,
      settings,
      URL,
    }, context);

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    }).toMatchSnapshot();
    assert.ok(result.optimisticGraph, 'should have created optimistic graph');
    assert.ok(result.pessimisticGraph, 'should have created pessimistic graph');
  });
});
