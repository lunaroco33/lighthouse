/**
 * @license Copyright 2017 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import assert from 'assert/strict';

import DOMSize from '../../../audits/dobetterweb/dom-size.js';
import {createTestTrace} from '../../create-test-trace.js';
import {networkRecordsToDevtoolsLog} from '../../network-records-to-devtools-log.js';

const options = DOMSize.defaultOptions;

describe('DOMSize audit', () => {
  let artifacts;
  let context;

  beforeEach(() => {
    const mainDocumentUrl = 'https://example.com/';

    const trace = createTestTrace({
      topLevelTasks: [
        {ts: 1000, duration: 1000, children: [
          {ts: 1100, duration: 200, eventName: 'ScheduleStyleRecalculation'},
        ]},
      ],
    });

    const devtoolsLog = networkRecordsToDevtoolsLog([{
      url: mainDocumentUrl,
      priority: 'High',
    }]);

    artifacts = {
      DOMStats: {
        totalBodyElements: 1500,
        depth: {max: 1},
        width: {max: 2},
      },
      GatherContext: {gatherMode: 'navigation'},
      URL: {
        requestedUrl: mainDocumentUrl,
        mainDocumentUrl,
        finalDisplayedUrl: mainDocumentUrl,
      },
      traces: {defaultPass: trace},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };
    context = {
      options,
      settings: {throttlingMethod: 'simulate'},
      computedCache: new Map(),
    };
  });

  it('calculates score hitting mid distribution', async () => {
    const auditResult = await DOMSize.audit(artifacts, context);
    assert.equal(auditResult.score, 0.43);
    assert.equal(auditResult.numericValue, 1500);
    expect(auditResult.displayValue).toBeDisplayString('1,500 elements');
    assert.equal(auditResult.details.items[0].value.value, 1500);
    assert.equal(auditResult.details.items[1].value.value, 1);
    assert.equal(auditResult.details.items[2].value.value, 2);

    // 200 (dur) * 4 (throttling) - 50 (blocking threshold) * 200 (dur) / 1000 (top level dur)
    expect(auditResult.metricSavings).toEqual({TBT: 790});
  });

  it('works in snapshot mode', async () => {
    artifacts.GatherContext.gatherMode = 'snapshot';
    const auditResult = await DOMSize.audit(artifacts, context);
    expect(auditResult.score).toEqual(0.43);
    expect(auditResult.metricSavings).toEqual({});
  });

  it('works if missing trace/dtlog in navigation mode', async () => {
    artifacts.devtoolsLogs = undefined;
    artifacts.traces = undefined;
    const auditResult = await DOMSize.audit(artifacts, context);
    expect(auditResult.score).toEqual(0.43);
    expect(auditResult.metricSavings).toEqual({TBT: 0});
  });

  it('works if tbt impact throws an error', async () => {
    // Empty array will cause an error.
    artifacts.traces.defaultPass = [];

    const auditResult = await DOMSize.audit(artifacts, context);
    expect(auditResult.score).toEqual(0.43);
    expect(auditResult.metricSavings).toEqual({TBT: 0});
  });

  it('calculates score hitting top distribution', async () => {
    artifacts.DOMStats.totalBodyElements = 400;
    const auditResult = await DOMSize.audit(artifacts, context);
    assert.equal(auditResult.score, 1);
  });

  it('calculates score hitting bottom of distribution', async () => {
    artifacts.DOMStats.totalBodyElements = 5970;
    const auditResult = await DOMSize.audit(artifacts, context);
    assert.equal(auditResult.score, 0);
  });
});
