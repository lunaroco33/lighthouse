/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';

import {ViewportMeta} from '../../computed/viewport-meta.js';

describe('ViewportMeta computed artifact', () => {
  const makeMetaElements = viewport => [{name: 'viewport', content: viewport}];

  it('is not mobile optimized when page does not contain a viewport meta tag', async () => {
    const {hasViewportTag, isMobileOptimized} = await ViewportMeta.compute_([]);
    assert.equal(hasViewportTag, false);
    assert.equal(isMobileOptimized, false);
  });

  /* eslint-disable-next-line max-len */
  it('is not mobile optimized when HTML contains a non-mobile friendly viewport meta tag', async () => {
    const viewport = 'maximum-scale=1';
    const {hasViewportTag, isMobileOptimized} =
      await ViewportMeta.compute_(makeMetaElements(viewport));
    assert.equal(hasViewportTag, true);
    assert.equal(isMobileOptimized, false);
  });

  it('is not mobile optimized when HTML contains an invalid viewport meta tag key', async () => {
    const viewport = 'nonsense=true';
    const {hasViewportTag, isMobileOptimized} =
      await ViewportMeta.compute_(makeMetaElements(viewport));
    assert.equal(hasViewportTag, true);
    assert.equal(isMobileOptimized, false);
  });

  it('is not mobile optimized when HTML contains an invalid viewport meta tag value', async () => {
    const viewport = 'initial-scale=microscopic';
    const {isMobileOptimized, parserWarnings} =
      await ViewportMeta.compute_(makeMetaElements(viewport));
    assert.equal(isMobileOptimized, false);
    assert.equal(parserWarnings[0], 'Invalid values found: {"initial-scale":"microscopic"}');
  });

  /* eslint-disable-next-line max-len */
  it('is not mobile optimized when HTML contains an invalid viewport meta tag key and value', async () => {
    const viewport = 'nonsense=true, initial-scale=microscopic';
    const {isMobileOptimized, parserWarnings} =
      await ViewportMeta.compute_(makeMetaElements(viewport));
    assert.equal(isMobileOptimized, false);
    assert.equal(parserWarnings[0], 'Invalid properties found: {"nonsense":"true"}');
    assert.equal(parserWarnings[1], 'Invalid values found: {"initial-scale":"microscopic"}');
  });

  // eslint-disable-next-line max-len
  it('is not mobile optimized when a viewport contains an initial-scale value lower than 1', async () => {
    const viewport = 'width=device-width, initial-scale=0.9';
    const {isMobileOptimized} =
      await ViewportMeta.compute_(makeMetaElements(viewport));
    assert.equal(isMobileOptimized, false);
  });

  it('is mobile optimized when a valid viewport is provided', async () => {
    const viewports = [
      'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1',
      'width = device-width, initial-scale = 1',
      'initial-scale=1',
      'width=device-width     ',
    ];

    await Promise.all(viewports.map(async viewport => {
      const {isMobileOptimized} =
        await ViewportMeta.compute_(makeMetaElements(viewport));
      assert.equal(isMobileOptimized, true);
    }));
  });

  it('recognizes interactive-widget property', async () => {
    const viewport = 'width=device-width, interactive-widget=resizes-content';
    const {parserWarnings} = await ViewportMeta.compute_(makeMetaElements(viewport));
    assert.equal(parserWarnings[0], undefined);
  });

  it('doesn\'t throw when viewport contains "invalid" iOS properties', async () => {
    const viewports = [
      'width=device-width, shrink-to-fit=no',
      'width=device-width, viewport-fit=cover',
    ];
    await Promise.all(viewports.map(async viewport => {
      const {isMobileOptimized, parserWarnings} =
        await ViewportMeta.compute_(makeMetaElements(viewport));
      assert.equal(isMobileOptimized, true);
      assert.equal(parserWarnings[0], undefined);
    }));
  });
});

