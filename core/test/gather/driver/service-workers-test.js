/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createMockSession} from '../mock-driver.js';
import {makePromiseInspectable, flushAllTimersAndMicrotasks, timers} from '../../test-utils.js';
import * as serviceWorkers from '../../../gather/driver/service-workers.js';

/** @type {ReturnType<typeof createMockSession>} */
let sessionMock;

describe('Service Worker driver functions', () => {
  beforeEach(() => {
    timers.useRealTimers();
    sessionMock = createMockSession();
  });
  after(() => timers.dispose());

  describe('.getServiceWorkerVersions', () => {
    it('returns the data from service worker events', async () => {
      sessionMock.sendCommand
        .mockResponse('ServiceWorker.enable')
        .mockResponse('ServiceWorker.disable');
      sessionMock.on.mockEvent('ServiceWorker.workerVersionUpdated', {
        versions: [{registrationId: '1', status: 'activated'}],
      });

      const results = await serviceWorkers.getServiceWorkerVersions(sessionMock.asSession());
      expect(results).toEqual({versions: [{registrationId: '1', status: 'activated'}]});
    });

    it('returns when there are no active candidates', async () => {
      sessionMock.sendCommand
        .mockResponse('ServiceWorker.enable')
        .mockResponse('ServiceWorker.disable');
      sessionMock.on.mockEvent('ServiceWorker.workerVersionUpdated', {
        versions: [{registrationId: '1', status: 'redundant'}],
      });

      const results = await serviceWorkers.getServiceWorkerVersions(sessionMock.asSession());
      expect(results).toEqual({versions: [{registrationId: '1', status: 'redundant'}]});
    });

    it('waits for currently installing workers', async () => {
      timers.useFakeTimers();
      after(() => timers.dispose());

      sessionMock.sendCommand
        .mockResponse('ServiceWorker.enable')
        .mockResponse('ServiceWorker.disable');

      const resultPromise = makePromiseInspectable(
        serviceWorkers.getServiceWorkerVersions(sessionMock.asSession())
      );
      await flushAllTimersAndMicrotasks();
      expect(resultPromise.isDone()).toBe(false);

      const workerVersionUpdated =
        sessionMock.on.findListener('ServiceWorker.workerVersionUpdated');
      workerVersionUpdated({versions: [{status: 'installing'}]});
      await flushAllTimersAndMicrotasks();
      expect(resultPromise.isDone()).toBe(false);

      const versions = {versions: [{registrationId: '3', status: 'activated'}]};
      workerVersionUpdated(versions);
      await flushAllTimersAndMicrotasks();
      expect(resultPromise.isDone()).toBe(true);
      expect(await resultPromise).toEqual(versions);
    });
  });

  describe('.getServiceWorkerRegistrations', () => {
    it('returns the data from service worker events', async () => {
      sessionMock.sendCommand
        .mockResponse('ServiceWorker.enable')
        .mockResponse('ServiceWorker.disable');
      sessionMock.once.mockEvent('ServiceWorker.workerRegistrationUpdated', {
        registrations: [{registrationId: '2'}],
      });

      const results = await serviceWorkers.getServiceWorkerRegistrations(sessionMock.asSession());
      expect(results).toEqual({registrations: [{registrationId: '2'}]});
    });
  });
});
