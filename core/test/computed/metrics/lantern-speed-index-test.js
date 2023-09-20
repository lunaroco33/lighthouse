/**
 * @license
 * Copyright 2018 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import * as constants from '../../../config/constants.js';
import {LanternSpeedIndex} from '../../../computed/metrics/lantern-speed-index.js';
import {getURLArtifactFromDevtoolsLog, readJson} from '../../test-utils.js';

const trace = readJson('../../fixtures/traces/progressive-app-m60.json', import.meta);
const devtoolsLog = readJson('../../fixtures/traces/progressive-app-m60.devtools.log.json', import.meta);

const defaultThrottling = constants.throttling.mobileSlow4G;
const URL = getURLArtifactFromDevtoolsLog(devtoolsLog);

describe('Metrics: Lantern Speed Index', () => {
  const gatherContext = {gatherMode: 'navigation'};
  it('should compute predicted value', async () => {
    const settings = {throttlingMethod: 'simulate', throttling: defaultThrottling};
    const context = {settings, computedCache: new Map()};
    const result = await LanternSpeedIndex.request(
      {trace, devtoolsLog, gatherContext, settings, URL},
      context);

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs),
    }).toMatchInlineSnapshot(`
      Object {
        "optimistic": 605,
        "pessimistic": 1661,
        "timing": 1676,
      }
    `);
  });

  it('should compute predicted value for different settings', async () => {
    const settings = {throttlingMethod: 'simulate', throttling: {...defaultThrottling, rttMs: 300}};
    const context = {settings, computedCache: new Map()};
    const result = await LanternSpeedIndex.request(
      {trace, devtoolsLog, gatherContext, settings, URL},
      context);

    expect({
      timing: Math.round(result.timing),
      optimistic: Math.round(result.optimisticEstimate.timeInMs),
      pessimistic: Math.round(result.pessimisticEstimate.timeInMs)}).
toMatchInlineSnapshot(`
Object {
  "optimistic": 605,
  "pessimistic": 2440,
  "timing": 3008,
}
`);
  });

  it('should not scale coefficients at default', async () => {
    const result = LanternSpeedIndex.getScaledCoefficients(defaultThrottling.rttMs);
    expect(result).toEqual(LanternSpeedIndex.COEFFICIENTS);
  });

  it('should scale coefficients back', async () => {
    const result = LanternSpeedIndex.getScaledCoefficients(5);
    expect(result).toEqual({intercept: -0, pessimistic: 0.5, optimistic: 0.5});
  });

  it('should scale coefficients forward', async () => {
    const result = LanternSpeedIndex.getScaledCoefficients(300);
    expect(result).toMatchInlineSnapshot(`
      Object {
        "intercept": -562.5,
        "optimistic": 2.525,
        "pessimistic": 0.8375,
      }
    `);
  });
});
