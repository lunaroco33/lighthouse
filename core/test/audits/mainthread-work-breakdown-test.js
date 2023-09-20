/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import PageExecutionTimings from '../../audits/mainthread-work-breakdown.js';
import {readJson} from '../test-utils.js';

const acceptableTrace = readJson('../fixtures/traces/progressive-app-m60.json', import.meta);
const siteWithRedirectTrace = readJson('../fixtures/artifacts/redirect/trace.json', import.meta);
const loadTraceOld = readJson('../fixtures/traces/load.json', import.meta);
const loadTrace = readJson('../fixtures/artifacts/animation/trace.json', import.meta);
const errorTrace = readJson('../fixtures/traces/no_fmp_event.json', import.meta);

const options = PageExecutionTimings.defaultOptions;

const acceptableTraceExpectations = {
  parseHTML: 14,
  styleLayout: 308,
  paintCompositeRender: 87,
  scriptEvaluation: 215,
  scriptParseCompile: 25,
  garbageCollection: 48,
  other: 663,
};
const loadTraceExpectations = {
  parseHTML: 25,
  styleLayout: 131,
  paintCompositeRender: 44,
  scriptEvaluation: 347,
  garbageCollection: 3,
  other: 382,
};

describe('Performance: page execution timings audit', () => {
  function keyOutput(output) {
    const keyedOutput = {};
    for (const item of output.details.items) {
      keyedOutput[item.group] = Math.round(item.duration);
    }
    return keyedOutput;
  }

  it('should compute the correct pageExecutionTiming values for the pwa trace', async () => {
    const artifacts = {traces: {defaultPass: acceptableTrace}};

    const output = await PageExecutionTimings.audit(artifacts, {options, computedCache: new Map()});
    assert.deepStrictEqual(keyOutput(output), acceptableTraceExpectations);
    assert.equal(Math.round(output.numericValue), 1360);
    assert.equal(output.details.items.length, 7);
    assert.equal(output.score, 0.98);
  });

  it('should compute the correct values when simulated', async () => {
    const artifacts = {traces: {defaultPass: acceptableTrace}};

    const settings = {throttlingMethod: 'simulate', throttling: {cpuSlowdownMultiplier: 3}};
    const context = {options, settings, computedCache: new Map()};
    const output = await PageExecutionTimings.audit(artifacts, context);

    const keyedOutput = keyOutput(output);
    for (const key of Object.keys(acceptableTraceExpectations)) {
      const actual = keyedOutput[key];
      const expected = acceptableTraceExpectations[key] * 3;
      assert.ok(Math.abs(actual - expected) <= 2, `expected ${expected} got ${actual}`);
    }

    assert.equal(Math.round(output.numericValue), 4081);
    assert.equal(output.details.items.length, 7);
    assert.equal(output.score, 0.48);
  });

  it('should compute the correct values for the redirect trace', async () => {
    const artifacts = {traces: {defaultPass: siteWithRedirectTrace}};

    const output = await PageExecutionTimings.audit(artifacts, {options, computedCache: new Map()});
    expect(keyOutput(output)).toMatchInlineSnapshot(`
Object {
  "garbageCollection": 14,
  "other": 188,
  "paintCompositeRender": 11,
  "parseHTML": 52,
  "scriptEvaluation": 577,
  "scriptParseCompile": 67,
  "styleLayout": 70,
}
`);
    expect(Math.round(output.numericValue)).toMatchInlineSnapshot(`979`);
    assert.equal(output.details.items.length, 7);
    assert.equal(output.score, 1);
  });

  it('should compute the correct values for the load trace (legacy)', async () => {
    assert(loadTraceOld.find(e => e.name === 'TracingStartedInPage'));
    const artifacts = {traces: {defaultPass: {traceEvents: loadTraceOld}}};

    const output = await PageExecutionTimings.audit(artifacts, {options, computedCache: new Map()});
    assert.deepStrictEqual(keyOutput(output), loadTraceExpectations);
    assert.equal(Math.round(output.numericValue), 933);
    assert.equal(output.details.items.length, 6);
    assert.equal(output.score, 1);
  });

  it('should compute the correct values for the load trace', async () => {
    assert(loadTrace.traceEvents.find(e => e.name === 'TracingStartedInBrowser'));
    const artifacts = {traces: {defaultPass: loadTrace}};

    const output = await PageExecutionTimings.audit(artifacts, {options, computedCache: new Map()});
    expect(keyOutput(output)).toMatchInlineSnapshot(`
Object {
  "other": 59,
  "paintCompositeRender": 48,
  "parseHTML": 3,
  "scriptEvaluation": 11,
  "scriptParseCompile": 1,
  "styleLayout": 103,
}
`);
    expect(Math.round(output.numericValue)).toMatchInlineSnapshot(`224`);
    assert.equal(output.details.items.length, 6);
    assert.equal(output.score, 1);
  });

  it('should get no data when no events are present', () => {
    const artifacts = {traces: {defaultPass: errorTrace}};

    const context = {options, computedCache: new Map()};
    return PageExecutionTimings.audit(artifacts, context).then(output => {
      assert.equal(output.details.items.length, 0);
      assert.equal(output.score, 1);
      assert.equal(Math.round(output.numericValue), 0);
    });
  });
});
