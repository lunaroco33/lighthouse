/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import * as td from 'testdouble';

import {fnAny} from '../../test-utils.js';

const getServiceWorkerVersions = fnAny();
const getServiceWorkerRegistrations = fnAny();

await td.replaceEsm('../../../gather/driver/service-workers.js', {
  getServiceWorkerVersions,
  getServiceWorkerRegistrations,
});

// Some imports needs to be done dynamically, so that their dependencies will be mocked.
// https://github.com/GoogleChrome/lighthouse/blob/main/docs/hacking-tips.md#mocking-modules-with-testdouble
const ServiceWorkerGather = (await import('../../../gather/gatherers/service-worker.js')).default;

describe('service worker gatherer', () => {
  it('obtains the active service worker registration', async () => {
    const url = 'https://example.com/';
    const versions = [{
      registrationId: '123',
      status: 'activated',
      scriptURL: url,
    }];
    const registrations = [{
      registrationId: '123',
      scopeUrl: url,
      isDeleted: false,
    }];
    getServiceWorkerVersions.mockResolvedValue({versions});
    getServiceWorkerRegistrations.mockResolvedValue({registrations});

    const serviceWorkerGatherer = new ServiceWorkerGather();
    const artifact = await serviceWorkerGatherer.getArtifact({
      driver: {},
      url,
    });

    assert.deepEqual(artifact.versions, versions);
    assert.deepEqual(artifact.registrations, registrations);
  });
});
