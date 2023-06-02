/**
 * @license Copyright 2019 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {import('./common.js').Summary} Summary */

import fs from 'fs';

import * as common from './common.js';

/**
 * @param {string} filename
 * @return {LH.Result}
 */
function loadLhr(filename) {
  return JSON.parse(fs.readFileSync(`${common.collectFolder}/${filename}`, 'utf-8'));
}

/**
 * @param {common.ProgressLogger} log
 * @param {Summary} summary
 */
function makeGolden(log, summary) {
  const goldenSites = [];
  for (const [index, result] of Object.entries(summary.results)) {
    const {url, wpt, unthrottled, wptRetries, unthrottledRetries} = result;
    // If something failed, or we had to retry... just drop from the golden dataset.
    if (!wpt || !unthrottled || wptRetries || unthrottledRetries) {
      log.log(`excluding ${url}`);
      continue;
    }
    // Should never happen.
    if (!unthrottled.devtoolsLog) throw new Error(`missing devtoolsLog for ${url}`);

    log.progress(`getting metrics ${Number(index) + 1} / ${summary.results.length}`);
    const mobileMetrics = common.getMetrics(loadLhr(wpt.lhr));
    if (!mobileMetrics) {
      throw new Error('expected mobileMetrics');
    }
    goldenSites.push({
      url,
      wpt3g: {
        firstContentfulPaint: mobileMetrics.firstContentfulPaint,
        firstMeaningfulPaint: mobileMetrics.firstMeaningfulPaint,
        timeToConsistentlyInteractive: mobileMetrics.interactive,
        speedIndex: mobileMetrics.speedIndex,
        largestContentfulPaint: mobileMetrics.largestContentfulPaint,
        timeToFirstByte: mobileMetrics.timeToFirstByte,
        lcpLoadStart: mobileMetrics.lcpLoadStart,
        lcpLoadEnd: mobileMetrics.lcpLoadEnd,
      },
      unthrottled: {
        tracePath: unthrottled.trace,
        devtoolsLogPath: unthrottled.devtoolsLog,
        lhrPath: unthrottled.lhr,
      },
    });
  }

  common.saveGolden({sites: goldenSites});
}

export {
  makeGolden,
};
