/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {readJson} from '../test-utils.js';
import LongTasks from '../../audits/long-tasks.js';
import {createTestTrace} from '../create-test-trace.js';
import {networkRecordsToDevtoolsLog} from '../network-records-to-devtools-log.js';

const redirectTrace = readJson('../fixtures/artifacts/redirect/trace.json', import.meta);
const redirectDevtoolsLog = readJson('../fixtures/artifacts/redirect/devtoolslog.json', import.meta);

const BASE_TS = 12345e3;
const TASK_URL = 'https://pwa.rocks';

/**
 * @param {Number} count
 * @param {Number} duration
 * @param {Boolean} withChildTasks
 */
function generateTraceWithLongTasks({count, duration = 200, withChildTasks = false}) {
  const traceTasks = [{ts: BASE_TS, duration: 0}];
  for (let i = 1; i <= count; i++) {
    /* Generates a top-level task w/ the following breakdown:
    task -> {
      ts,
      duration,
      children -> [{ts, duration, url}, ...],
    }
    Child tasks should start after the parent task and end before it.
    Top-level tasks will take on the attributable URL from it's children.
    */
    const ts = BASE_TS + i * 1000;
    const task = {ts, duration};
    task.children = [];
    if (withChildTasks) {
      task.children.push({
        ts: ts + duration / 10,
        duration: duration / 3,
        url: TASK_URL,
      });
      task.children.push({
        ts: ts + duration / 2,
        duration: duration / 3,
        url: TASK_URL,
      });
    }
    traceTasks.push(task);
  }
  return createTestTrace({
    topLevelTasks: traceTasks,
    timeOrigin: BASE_TS,
  });
}

describe('Long tasks audit', () => {
  const devtoolsLog = networkRecordsToDevtoolsLog([{url: TASK_URL}]);
  const URL = {
    requestedUrl: TASK_URL,
    mainDocumentUrl: TASK_URL,
    finalDisplayedUrl: TASK_URL,
  };

  it('should pass if there are no long tasks', async () => {
    const artifacts = {
      URL,
      traces: {defaultPass: generateTraceWithLongTasks({count: 0})},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };
    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});
    expect(result.details.items).toHaveLength(0);
    expect(result.score).toBe(1);
    expect(result.displayValue).toBeUndefined();
  });

  it('should return a list of long tasks with duration >= 50 ms', async () => {
    const artifacts = {
      URL,
      traces: {defaultPass: generateTraceWithLongTasks({count: 4})},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };
    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});
    expect(result.details.items).toMatchObject([
      {url: 'Unattributable', duration: 200, startTime: 1000},
      {url: 'Unattributable', duration: 200, startTime: 2000},
      {url: 'Unattributable', duration: 200, startTime: 3000},
      {url: 'Unattributable', duration: 200, startTime: 4000},
    ]);
    expect(result.score).toBe(0);
    expect(result.displayValue).toBeDisplayString('4 long tasks found');
    expect(result.notApplicable).toBeFalsy();
  });

  it('should filter out tasks with duration less than 50 ms', async () => {
    const trace = createTestTrace({
      timeOrigin: BASE_TS,
      topLevelTasks: [
        {ts: BASE_TS, duration: 1},
        {ts: BASE_TS + 1000, duration: 30},
        {ts: BASE_TS + 2000, duration: 100},
        {ts: BASE_TS + 3000, duration: 25},
        {ts: BASE_TS + 4000, duration: 50},
      ],
    });
    const artifacts = {
      URL,
      traces: {defaultPass: trace},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };

    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});
    expect(result.details.items).toMatchObject([
      {url: 'Unattributable', duration: 100, startTime: 2000},
      {url: 'Unattributable', duration: 50, startTime: 4000},
    ]);
    expect(result.score).toBe(0);
    expect(result.displayValue).toBeDisplayString('2 long tasks found');
  });

  it('should not filter out tasks with duration >= 50 ms only after throttling', async () => {
    const artifacts = {
      URL,
      traces: {defaultPass: generateTraceWithLongTasks({count: 4, duration: 25})},
      devtoolsLogs: {defaultPass: networkRecordsToDevtoolsLog([
        {url: TASK_URL, timing: {connectEnd: 50, connectStart: 0.01, sslStart: 25, sslEnd: 40}},
      ])},
    };
    const context = {
      computedCache: new Map(),
      settings: {
        precomputedLanternData: {
          additionalRttByOrigin: {[TASK_URL]: 0},
          serverResponseTimeByOrigin: {[TASK_URL]: 100},
        },
        throttlingMethod: 'simulate',
        throttling: {
          rttMs: 100,
          throughputKbps: 10000,
          cpuSlowdownMultiplier: 4,
        },
      },
    };
    const result = await LongTasks.audit(artifacts, context);
    expect(result.details.items).toMatchObject([
      {duration: 100, startTime: 600},
      {duration: 100, startTime: 700},
      {duration: 100, startTime: 800},
      {duration: 100, startTime: 900},
    ]);
    expect(result.score).toBe(0);
    expect(result.details.items).toHaveLength(4);
    expect(result.displayValue).toBeDisplayString('4 long tasks found');
  });

  it('should populate url when tasks have an attributable url', async () => {
    const trace = generateTraceWithLongTasks({count: 1, duration: 300, withChildTasks: true});
    const artifacts = {
      URL,
      traces: {defaultPass: trace},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };
    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});
    expect(result.details.items).toMatchObject([
      {url: TASK_URL, duration: 300, startTime: 1000},
    ]);
    expect(result.score).toBe(0);
    expect(result.displayValue).toBeDisplayString('1 long task found');
  });

  it('should include more than 20 tasks in debugData', async () => {
    const numTasks = 50;
    const topLevelTasks = [];
    for (let i = 0; i < numTasks; i++) {
      topLevelTasks.push({
        ts: BASE_TS + i * 1000,
        duration: 55,
      });
    }

    const trace = createTestTrace({
      timeOrigin: BASE_TS,
      topLevelTasks,
    });
    const artifacts = {
      URL,
      traces: {defaultPass: trace},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };

    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});
    expect(result.details.items).toHaveLength(20);
    expect(result.score).toBe(0);
    expect(result.displayValue).toBeDisplayString('20 long tasks found');

    const debugData = result.details.debugData;
    expect(debugData).toMatchObject({
      type: 'debugdata',
      urls: ['Unattributable'],
    });

    expect(debugData.tasks).toHaveLength(numTasks);
    for (let i = 0; i < debugData.tasks.length; i++) {
      const task = debugData.tasks[i];
      expect(task).toStrictEqual({
        urlIndex: 0,
        startTime: i * 1000,
        duration: 55,
        other: 55,
      });
    }
  });

  it('should break down debugData time based on child tasks', async () => {
    const trace = generateTraceWithLongTasks({count: 1, duration: 300, withChildTasks: true});
    const artifacts = {
      URL,
      traces: {defaultPass: trace},
      devtoolsLogs: {defaultPass: devtoolsLog},
    };
    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});

    expect(result).toMatchObject({
      score: 0,
      displayValue: expect.toBeDisplayString('1 long task found'),
      details: {
        items: [
          {url: TASK_URL, duration: 300, startTime: 1000},
        ],
      },
    });

    const debugData = result.details.debugData;
    expect(debugData).toStrictEqual({
      type: 'debugdata',
      urls: [TASK_URL],
      tasks: [{
        urlIndex: 0,
        startTime: 1000,
        duration: 300,
        other: 100,
        scriptEvaluation: 200,
      }],
    });
  });

  it('should find long tasks from a real trace', async () => {
    const artifacts = {
      URL,
      traces: {defaultPass: redirectTrace},
      devtoolsLogs: {defaultPass: redirectDevtoolsLog},
    };
    const result = await LongTasks.audit(artifacts, {computedCache: new Map()});

    expect(result).toMatchObject({
      score: 0,
      displayValue: expect.toBeDisplayString('2 long tasks found'),
      details: {
        items: [{
          url: expect.stringContaining('https://'),
          startTime: expect.toBeApproximately(2150.4, 1),
          duration: expect.toBeApproximately(247.6, 1),
        }, {
          url: expect.stringContaining('https://'),
          startTime: expect.toBeApproximately(1957.1, 1),
          duration: expect.toBeApproximately(104.6, 1),
        }],
      },
    });

    const debugData = result.details.debugData;
    expect(debugData).toStrictEqual({
      type: 'debugdata',
      urls: [
        expect.stringContaining('https://'),
        expect.stringContaining('https://'),
      ],
      tasks: [{
        urlIndex: 0,
        startTime: 2150.4,
        duration: 247.6,
        garbageCollection: 2.7,
        other: 13.7,
        paintCompositeRender: 0.6,
        parseHTML: 0.5,
        scriptEvaluation: 212.9,
        scriptParseCompile: 4,
        styleLayout: 13.2,
      }, {
        urlIndex: 1,
        startTime: 1957.1,
        duration: 104.6,
        other: 0.6,
        parseHTML: 0.2,
        scriptEvaluation: 96.8,
        scriptParseCompile: 5.7,
        styleLayout: 1.2,
      }],
    });
  });
});
