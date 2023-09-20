/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import TagsBlockingFirstPaint from
  '../../../../gather/gatherers/dobetterweb/tags-blocking-first-paint.js';
import {createMockContext} from '../../../gather/mock-driver.js';
import {networkRecordsToDevtoolsLog} from '../../../network-records-to-devtools-log.js';

let tagsBlockingFirstPaint;

const networkRecords = [
  {
    url: 'http://google.com/css/style.css',
    mimeType: 'text/css',
    transferSize: 10,
    networkRequestTime: 10,
    networkEndTime: 10,
    finished: true,
    isLinkPreload: false,
    initiator: {type: 'parser'},
  },
  {
    url: 'http://google.com/wc/select.html',
    mimeType: 'text/html',
    transferSize: 11,
    networkRequestTime: 11,
    networkEndTime: 11,
    finished: true,
    isLinkPreload: false,
    initiator: {type: 'other'},
  },
  {
    url: 'http://google.com/js/app.json',
    mimeType: 'application/json',
    transferSize: 24,
    networkRequestTime: 24,
    networkEndTime: 24,
    finished: true,
    isLinkPreload: false,
    initiator: {type: 'script'},
  },
  {
    url: 'http://google.com/js/app.js',
    mimeType: 'text/javascript',
    transferSize: 12,
    networkRequestTime: 12,
    networkEndTime: 22,
    finished: true,
    isLinkPreload: false,
    initiator: {type: 'parser'},
  },
  {
    url: 'http://google.com/wc/import.html',
    mimeType: 'text/html',
    transferSize: 13,
    networkRequestTime: 13,
    networkEndTime: 13,
    finished: true,
    isLinkPreload: false,
    initiator: {type: 'script'},
  },
  {
    url: 'http://google.com/css/ignored.css',
    mimeType: 'text/css',
    transferSize: 16,
    networkRequestTime: 16,
    networkEndTime: 16,
    finished: true,
    isLinkPreload: true,
    initiator: {type: 'script'},
  },
  {
    url: 'http://google.com/js/ignored.js',
    mimeType: 'text/javascript',
    transferSize: 16,
    networkRequestTime: 16,
    networkEndTime: 16,
    finished: true,
    isLinkPreload: false,
    initiator: {type: 'script'},
  },
  {
    url: 'http://google.com/js/also-ignored.js',
    mimeType: 'text/javascript',
    networkRequestTime: 12,
    finished: false,
    isLinkPreload: false,
    initiator: {type: 'parser'},
  },
];

describe('First paint blocking tags', () => {
  // Reset the Gatherer before each test.
  beforeEach(() => {
    tagsBlockingFirstPaint = new TagsBlockingFirstPaint();
  });

  it('return filtered and indexed requests', () => {
    const actual = TagsBlockingFirstPaint
      ._filteredAndIndexedByUrl(networkRecords);
    return expect(Object.fromEntries(actual)).toMatchObject({
      'http://google.com/css/style.css': {
        isLinkPreload: false,
        transferSize: 10,
        networkRequestTime: 10,
        networkEndTime: 10,
      },
      'http://google.com/wc/select.html': {
        isLinkPreload: false,
        transferSize: 11,
        networkRequestTime: 11,
        networkEndTime: 11,
      },
      'http://google.com/js/app.js': {
        isLinkPreload: false,
        transferSize: 12,
        networkRequestTime: 12,
        networkEndTime: 22,
      },
      'http://google.com/wc/import.html': {
        isLinkPreload: false,
        transferSize: 13,
        networkRequestTime: 13,
        networkEndTime: 13,
      },
    });
  });

  it('returns an artifact', async () => {
    const linkDetails = {
      tagName: 'LINK',
      url: 'http://google.com/css/style.css',
      href: 'http://google.com/css/style.css',
      disabled: false,
      media: '',
      rel: 'stylesheet',
      mediaChanges: [],
    };

    const scriptDetails = {
      tagName: 'SCRIPT',
      url: 'http://google.com/js/app.js',
      src: 'http://google.com/js/app.js',
    };

    const mockContext = createMockContext();
    mockContext.driver._executionContext.evaluate
      .mockResolvedValue([linkDetails, linkDetails, scriptDetails]);
    mockContext.dependencies.DevtoolsLog = networkRecordsToDevtoolsLog(networkRecords);

    const artifact = await tagsBlockingFirstPaint.getArtifact(mockContext);

    const expected = [
      {
        tag: {tagName: 'LINK', url: linkDetails.url, mediaChanges: []},
        transferSize: 10,
        startTime: 10,
        endTime: 10,
      },
      {
        tag: {tagName: 'SCRIPT', url: scriptDetails.url, mediaChanges: undefined},
        transferSize: 12,
        startTime: 12,
        endTime: 22,
      },
    ];
    expect(artifact).toEqual(expected);
  });
});
