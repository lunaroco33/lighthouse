/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import GlobalListenerGatherer from '../../../gather/gatherers/global-listeners.js';
import {createMockDriver} from '../mock-driver.js';

describe('Global Listener Gatherer', () => {
  it('remove duplicate listeners from artifacts', async () => {
    const globalListenerGatherer = new GlobalListenerGatherer();
    const mockListeners = [
      {
        type: 'unload',
        scriptId: 4,
        lineNumber: 10,
        columnNumber: 15,
      },
      {
        type: 'unload',
        scriptId: 4,
        lineNumber: 10,
        columnNumber: 15,
      },
      {
        type: 'unload',
        scriptId: 4,
        lineNumber: 10,
        columnNumber: 13,
      },
      {
        type: 'unload',
        scriptId: 5,
        lineNumber: 10,
        columnNumber: 13,
      },
    ];

    const expectedOutput = [
      mockListeners[0],
      mockListeners[2],
      mockListeners[3],
    ];

    const driver = createMockDriver();
    driver._session.sendCommand
      .mockResponse('Runtime.evaluate', {result: {objectId: 10}})
      .mockResponse('DOMDebugger.getEventListeners', {listeners: mockListeners.slice(0)});

    const globalListeners = await globalListenerGatherer.getArtifact({driver});
    return expect(globalListeners).toMatchObject(expectedOutput);
  });
});
