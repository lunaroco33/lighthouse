/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import {createMockContext, mockDriverSubmodules} from '../mock-driver.js';

const mocks = await mockDriverSubmodules();

// Some imports needs to be done dynamically, so that their dependencies will be mocked.
// https://github.com/GoogleChrome/lighthouse/blob/main/docs/hacking-tips.md#mocking-modules-with-testdouble
/** @typedef {import('../../../gather/gatherers/script-elements.js').default} ScriptElements */
const ScriptElements = (await import('../../../gather/gatherers/script-elements.js')).default;
const {NetworkRequest} = await import('../../../lib/network-request.js');

/**
 * @param {Partial<LH.Artifacts.NetworkRequest>=} partial
 * @return {LH.Artifacts.NetworkRequest}
 */
function mockRecord(partial) {
  const request = new NetworkRequest();
  request.resourceType = NetworkRequest.TYPES.Script;
  request.sessionTargetType = 'page';
  return Object.assign(request, partial);
}

/**
 * @param {Partial<LH.Artifacts.ScriptElement>=} partial
 * @return {LH.Artifacts.ScriptElement}
 */
function mockElement(partial) {
  return {
    type: null,
    src: null,
    id: null,
    async: false,
    defer: false,
    source: 'head',
    node: null,
    ...partial,
  };
}

describe('_getArtifact', () => {
  let mockContext = createMockContext();
  /** @type {ScriptElements} */
  let gatherer;
  /** @type {LH.Artifacts.ScriptElement[]} */
  let scriptElements;
  /** @type {LH.Artifacts.NetworkRequest[]} */
  let networkRecords;
  /** @type {LH.Artifacts.NetworkRequest} */
  let mainDocument;

  beforeEach(() => {
    mocks.reset();
    mockContext = createMockContext();
    gatherer = new ScriptElements();
    scriptElements = [];
    mainDocument = mockRecord({resourceType: NetworkRequest.TYPES.Document, requestId: '0'});
    networkRecords = [mainDocument];
    mockContext.driver._executionContext.evaluate.mockImplementation(() => scriptElements);
  });

  it('collects script elements', async () => {
    networkRecords = [
      mainDocument,
      mockRecord({url: 'https://example.com/script.js', requestId: '1'}),
    ];
    scriptElements = [
      mockElement({src: 'https://example.com/script.js'}),
      mockElement({src: null}),
    ];

    const artifact = await gatherer._getArtifact(mockContext.asContext(), networkRecords);

    expect(artifact).toEqual([
      mockElement({src: 'https://example.com/script.js'}),
      mockElement({src: null}),
    ]);
  });

  it('ignore OOPIF and worker records', async () => {
    networkRecords = [
      mainDocument,
      mockRecord({url: 'https://example.com/script.js', requestId: '1'}),
      mockRecord({url: 'https://oopif.com/script.js', requestId: '2', sessionTargetType: 'iframe'}),
      mockRecord({url: 'https://oopif.com/worker.js', requestId: '2', sessionTargetType: 'worker'}),
    ];
    // OOPIF would not produce script element
    scriptElements = [
      mockElement({src: 'https://example.com/script.js'}),
      mockElement({src: null}),
    ];

    const artifact = await gatherer._getArtifact(mockContext.asContext(), networkRecords);

    expect(artifact).toEqual([
      mockElement({src: 'https://example.com/script.js'}),
      mockElement({src: null}),
    ]);
  });

  it('create element if none found', async () => {
    networkRecords = [
      mainDocument,
      mockRecord({url: 'https://example.com/script.js', requestId: '1'}),
    ];

    const artifact = await gatherer._getArtifact(mockContext.asContext(), networkRecords);

    expect(artifact).toEqual([
      mockElement({src: 'https://example.com/script.js', source: 'network'}),
    ]);
  });
});
