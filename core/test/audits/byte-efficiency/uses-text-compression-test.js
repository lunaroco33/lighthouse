/**
 * @license
 * Copyright 2017 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

const KB = 1024;
import assert from 'assert/strict';

import ResponsesAreCompressedAudit from '../../../audits/byte-efficiency/uses-text-compression.js';

function generateResponse(options) {
  return Object.assign({
    url: `http://google.com/${options.file}`,
    transferSize: options.resourceSize || 0,
    resourceSize: 0,
    gzipSize: 0,
  }, options);
}

describe('Page uses optimized responses', () => {
  it('fails when responses are collectively unoptimized', () => {
    const auditResult = ResponsesAreCompressedAudit.audit_({
      ResponseCompression: [
        generateResponse({file: 'index.js', resourceSize: 100 * KB, gzipSize: 90 * KB}), // 10kb & 10%
        generateResponse({file: 'index.css', resourceSize: 50 * KB, gzipSize: 37 * KB}), //  13kb & 26% (hit)
        generateResponse({file: 'index.json', resourceSize: 2048 * KB, gzipSize: 1024 * KB}), // 1024kb & 50% (hit)
      ],
    });

    assert.equal(auditResult.items.length, 2);
  });

  it('passes when all responses are sufficiently optimized', () => {
    const auditResult = ResponsesAreCompressedAudit.audit_({
      ResponseCompression: [
        generateResponse({file: 'index.js', resourceSize: 1000 * KB, gzipSize: 910 * KB}), // 90kb & 9%
        generateResponse({file: 'index.css', resourceSize: 6 * KB, gzipSize: 4.5 * KB}), // 1,5kb & 25% (hit)
        generateResponse({file: 'index.json', resourceSize: 10 * KB, gzipSize: 10 * KB}), // 0kb & 0%
        generateResponse({file: 'compressed.json', resourceSize: 10 * KB, transferSize: 3 * KB,
          gzipSize: 6 * KB}), // 0kb & 0%
      ],
    });

    assert.equal(auditResult.items.length, 1);
  });
});
