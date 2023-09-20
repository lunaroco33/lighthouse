/**
 * @license
 * Copyright 2020 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import MaskableIconAudit from '../../audits/maskable-icon.js';
import {parseManifest} from '../../lib/manifest-parser.js';
import {readJson} from '../test-utils.js';

const manifest = readJson('../fixtures/manifest.json', import.meta);
const manifestWithoutMaskable = readJson('../fixtures/manifest-no-maskable-icon.json', import.meta);

const manifestSrc = JSON.stringify(manifest);
const manifestWithoutMaskableSrc = JSON.stringify(manifestWithoutMaskable);
const EXAMPLE_MANIFEST_URL = 'https://example.com/manifest.json';
const EXAMPLE_DOC_URL = 'https://example.com/index.html';

/**
 * @param {string}
 */
function generateMockArtifacts(src = manifestSrc) {
  const exampleManifest = parseManifest(src, EXAMPLE_MANIFEST_URL, EXAMPLE_DOC_URL);

  return {
    WebAppManifest: exampleManifest,
    InstallabilityErrors: {errors: []},
  };
}

function generateMockAuditContext() {
  return {
    computedCache: new Map(),
  };
}

describe('Maskable Icon Audit', () => {
  const context = generateMockAuditContext();

  it('fails when the manifest fails to be parsed', async () => {
    const artifacts = generateMockArtifacts();
    artifacts.WebAppManifest = null;

    const auditResult = await MaskableIconAudit.audit(artifacts, context);
    expect(auditResult.score).toEqual(0);
  });

  it('fails when the manifest contains no maskable icons', async () => {
    const artifacts = generateMockArtifacts(manifestWithoutMaskableSrc);

    const auditResult = await MaskableIconAudit.audit(artifacts, context);
    expect(auditResult.score).toEqual(0);
  });

  it('passes when the manifest contains at least one maskable icon', async () => {
    const artifacts = generateMockArtifacts();

    const auditResult = await MaskableIconAudit.audit(artifacts, context);
    expect(auditResult.score).toEqual(1);
  });
});
