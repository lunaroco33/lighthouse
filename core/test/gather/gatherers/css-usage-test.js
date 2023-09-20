/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import CSSUsage from '../../../gather/gatherers/css-usage.js';
import {defaultSettings} from '../../../config/constants.js';
import {createMockDriver, createMockBaseArtifacts} from '../mock-driver.js';
import {flushAllTimersAndMicrotasks, timers} from '../../test-utils.js';

describe('.getArtifact', () => {
  before(() => timers.useFakeTimers());
  after(() => timers.dispose());

  it('gets CSS usage', async () => {
    const driver = createMockDriver();
    driver.defaultSession.on
      .mockEvent('CSS.styleSheetAdded', {header: {styleSheetId: '1'}})
      .mockEvent('CSS.styleSheetAdded', {header: {styleSheetId: '2'}});
    driver.defaultSession.sendCommand
      .mockResponse('DOM.enable')
      // @ts-expect-error - Force events to emit.
      .mockResponse('CSS.enable', flushAllTimersAndMicrotasks)
      .mockResponse('CSS.startRuleUsageTracking')
      .mockResponse('CSS.getStyleSheetText', {text: 'CSS text 1'})
      .mockResponse('CSS.getStyleSheetText', {text: 'CSS text 2'})
      .mockResponse('CSS.stopRuleUsageTracking', {
        ruleUsage: [
          {styleSheetId: '1', used: true},
          {styleSheetId: '2', used: false},
        ],
      })
      .mockResponse('CSS.disable')
      .mockResponse('DOM.disable');

    /** @type {LH.Gatherer.Context} */
    const context = {
      driver: driver.asDriver(),
      page: driver._page.asPage(),
      gatherMode: 'snapshot',
      computedCache: new Map(),
      baseArtifacts: createMockBaseArtifacts(),
      dependencies: {},
      settings: defaultSettings,
    };
    const gatherer = new CSSUsage();
    const artifact = await gatherer.getArtifact(context);

    expect(artifact).toEqual({
      stylesheets: [
        {
          header: {styleSheetId: '1'},
          content: 'CSS text 1',
        },
        {
          header: {styleSheetId: '2'},
          content: 'CSS text 2',
        },
      ],
      rules: [
        {
          styleSheetId: '1',
          used: true,
        },
        {
          styleSheetId: '2',
          used: false,
        },
      ],
    });
  });

  it('ignores sheet if there was an error fetching content', async () => {
    const driver = createMockDriver();
    driver.defaultSession.on
      .mockEvent('CSS.styleSheetAdded', {header: {styleSheetId: '1'}})
      .mockEvent('CSS.styleSheetAdded', {header: {styleSheetId: '2'}});
    driver.defaultSession.sendCommand
      .mockResponse('DOM.enable')
      .mockResponse('CSS.enable')
      .mockResponse('CSS.startRuleUsageTracking')
      .mockResponse('CSS.getStyleSheetText', () => {
        throw new Error('Sheet not found');
      })
      .mockResponse('CSS.getStyleSheetText', {text: 'CSS text 2'})
      .mockResponse('CSS.stopRuleUsageTracking', {
        ruleUsage: [
          {styleSheetId: '2', used: false},
        ],
      })
      .mockResponse('CSS.disable')
      .mockResponse('DOM.disable');

    /** @type {LH.Gatherer.Context} */
    const context = {
      driver: driver.asDriver(),
      page: driver._page.asPage(),
      gatherMode: 'timespan',
      computedCache: new Map(),
      baseArtifacts: createMockBaseArtifacts(),
      dependencies: {},
      settings: defaultSettings,
    };

    const gatherer = new CSSUsage();
    await gatherer.startInstrumentation(context);

    // Force events to emit.
    await flushAllTimersAndMicrotasks(1);

    await gatherer.stopInstrumentation(context);
    const artifact = await gatherer.getArtifact(context);

    expect(artifact).toEqual({
      stylesheets: [
        {
          header: {styleSheetId: '2'},
          content: 'CSS text 2',
        },
      ],
      rules: [
        {
          styleSheetId: '2',
          used: false,
        },
      ],
    });
  });

  it('dedupes stylesheets', async () => {
    const driver = createMockDriver();
    driver.defaultSession.on
      .mockEvent('CSS.styleSheetAdded', {header: {styleSheetId: '1'}})
      .mockEvent('CSS.styleSheetAdded', {header: {styleSheetId: '1'}});
    driver.defaultSession.sendCommand
      .mockResponse('DOM.enable')
      // @ts-expect-error - Force events to emit.
      .mockResponse('CSS.enable', flushAllTimersAndMicrotasks)
      .mockResponse('CSS.startRuleUsageTracking')
      .mockResponse('CSS.getStyleSheetText', {text: 'CSS text 1'})
      .mockResponse('CSS.getStyleSheetText', {text: 'CSS text 1'})
      .mockResponse('CSS.stopRuleUsageTracking', {
        ruleUsage: [
          {styleSheetId: '1', used: true},
        ],
      })
      .mockResponse('CSS.disable')
      .mockResponse('DOM.disable');

    /** @type {LH.Gatherer.Context} */
    const context = {
      driver: driver.asDriver(),
      page: driver._page.asPage(),
      gatherMode: 'snapshot',
      computedCache: new Map(),
      baseArtifacts: createMockBaseArtifacts(),
      dependencies: {},
      settings: defaultSettings,
    };
    const gatherer = new CSSUsage();
    const artifact = await gatherer.getArtifact(context);

    expect(artifact).toEqual({
      stylesheets: [
        {
          header: {styleSheetId: '1'},
          content: 'CSS text 1',
        },
      ],
      rules: [
        {
          styleSheetId: '1',
          used: true,
        },
      ],
    });
  });
});
