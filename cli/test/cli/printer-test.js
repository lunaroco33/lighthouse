/**
 * @license
 * Copyright 2016 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'assert/strict';
import fs from 'fs';

import {readJson} from '../../../core/test/test-utils.js';
import * as Printer from '../../printer.js';

const sampleResults = readJson('../../../core/test/results/sample_v2.json', import.meta);

describe('Printer', () => {
  it('accepts valid output paths', () => {
    const path = '/path/to/output';
    assert.equal(Printer.checkOutputPath(path), path);
  });

  it('rejects invalid output paths', () => {
    const path = /** @type {any} */ (undefined);
    assert.notEqual(Printer.checkOutputPath(path), path);
  });

  it('writes file for results', () => {
    const path = './.test-file.json';
    const report = JSON.stringify(sampleResults);
    return Printer.write(report, 'json', path).then(_ => {
      const fileContents = fs.readFileSync(path, 'utf8');
      assert.ok(/lighthouseVersion/gim.test(fileContents));
      fs.unlinkSync(path);
    });
  });

  it('throws for invalid paths', () => {
    const path = '!/#@.json';
    const report = JSON.stringify(sampleResults);
    return Printer.write(report, 'html', path).catch(err => {
      assert.ok(err.code === 'ENOENT');
    });
  });

  it('returns output modes', () => {
    const modes = Printer.getValidOutputOptions();
    assert.ok(Array.isArray(modes));
    assert.ok(modes.length > 1);
    modes.forEach(mode => {
      assert.strictEqual(typeof mode, 'string');
    });
  });
});
