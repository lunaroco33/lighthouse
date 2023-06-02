/**
 * @license Copyright 2019 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

/** @typedef {import('./common.js').Result} Result */
/** @typedef {import('./common.js').ResultsForUrl} ResultsForUrl */
/** @typedef {import('./common.js').Summary} Summary */

import fs from 'fs';
import {execFile, execFileSync} from 'child_process';
import {promisify} from 'util';

import defaultTestUrls from './urls.js';
import * as common from './common.js';
import {LH_ROOT} from '../../../../root.js';
import {makeGolden} from './golden.js';

const execFileAsync = promisify(execFile);

const TEST_URLS = process.env.TEST_URLS ? process.env.TEST_URLS.split(' ') : defaultTestUrls;

const log = new common.ProgressLogger();

/** @type {Summary} */
let summary;

/**
 * @param {string} filename
 * @param {string} data
 */
function saveData(filename, data) {
  fs.mkdirSync(common.collectFolder, {recursive: true});
  fs.writeFileSync(`${common.collectFolder}/${filename}`, data);
  return filename;
}

/**
 * @param {string} url
 * @return {Promise<Result>}
 */
async function runUnthrottledLocally(url) {
  const artifactsFolder = `${LH_ROOT}/.tmp/collect-traces-artifacts`;
  const {stdout} = await execFileAsync('node', [
    `${LH_ROOT}/cli`,
    url,
    '--throttling-method=provided',
    '--output=json',
    `-AG=${artifactsFolder}`,
    process.env.OOPIFS === '1' ? '' : '--chrome-flags=--disable-features=site-per-process',
  ], {
    // Default (1024 * 1024) is too small.
    maxBuffer: 10 * 1024 * 1024,
  });
  const lhr = JSON.parse(stdout);
  assertLhr(lhr);
  const devtoolsLog = fs.readFileSync(`${artifactsFolder}/defaultPass.devtoolslog.json`, 'utf-8');
  const trace = fs.readFileSync(`${artifactsFolder}/defaultPass.trace.json`, 'utf-8');
  return {
    devtoolsLog,
    lhr: JSON.stringify(lhr),
    trace,
  };
}

function enableLinkConditioner() {
  execFileSync('osascript', ['link-conditioner.applescript', 'true', 'LighthouseCustom'], {
    cwd: `${LH_ROOT}/core/scripts/lantern/collect`,
  });
  return () => {
    execFileSync('osascript', ['link-conditioner.applescript', 'false', 'LighthouseCustom'], {
      cwd: `${LH_ROOT}/core/scripts/lantern/collect`,
    });
  };
}

/**
 * @param {string} url
 * @return {Promise<Result>}
 */
async function runThrottledMobileDevice(url) {
  const disableLinkConditioner = enableLinkConditioner();
  try {
    return await runUnthrottledLocally(url);
  } finally {
    disableLinkConditioner();
  }
}

/**
 * Repeats the async function a maximum of maxAttempts times until it passes.
 * @param {() => Promise<Result>} asyncFn
 * @param {number} [maxAttempts]
 * @return {Promise<{result: Result|null, retries: number, errors: string[]}>}
 */
async function repeatUntilPassOrNull(asyncFn, maxAttempts = 3) {
  const errors = [];

  for (let i = 0; i < maxAttempts; i++) {
    try {
      return {result: await asyncFn(), retries: i, errors};
    } catch (err) {
      log.log(err.toString());
      errors.push(err.toString());
    }
  }

  return {result: null, retries: maxAttempts - 1, errors};
}

/**
 * @param {LH.Result=} lhr
 */
function assertLhr(lhr) {
  if (!lhr) throw new Error('missing lhr');
  if (lhr.runtimeError) throw new Error(`runtime error: ${lhr.runtimeError}`);
  const metrics = common.getMetrics(lhr);
  console.log(metrics);
  if (metrics &&
      metrics.cumulativeLayoutShift !== undefined &&
      metrics.firstContentfulPaint !== undefined &&
      metrics.firstMeaningfulPaint !== undefined &&
      metrics.interactive !== undefined &&
      metrics.largestContentfulPaint !== undefined &&
      metrics.maxPotentialFID !== undefined &&
      metrics.speedIndex !== undefined &&
      metrics.timeToFirstByte !== undefined
  ) return;
  throw new Error('run failed to get metrics');
}

async function main() {
  // Resume state from previous invocation of script.
  summary = common.loadSummary();

  // Remove data if no longer in TEST_URLS.
  summary.results = summary.results
    .filter(urlSet => TEST_URLS.includes(urlSet.url));

  fs.mkdirSync(common.collectFolder, {recursive: true});

  // Traces are collected for one URL at a time, in series, so all traces are from a small time
  // frame, reducing the chance of a site change affecting results.
  for (const url of TEST_URLS) {
    // This URL has been done on a previous script invocation. Skip it.
    if (summary.results.find((urlResultSet) => urlResultSet.url === url)) {
      log.log(`already collected for ${url}`);
      continue;
    }

    log.log(`collecting for ${url}`);
    const sanitizedUrl = url.replace(/[^a-z0-9]/gi, '-');

    /** @type {Awaited<ReturnType<typeof repeatUntilPassOrNull>> | null} */
    let unthrottledRun = null;
    /** @type {Awaited<ReturnType<typeof repeatUntilPassOrNull>> | null} */
    let mobileRun = null;

    // The closure this makes is too convenient to decompose.
    // eslint-disable-next-line no-inner-declarations
    function updateProgress() {
      const index = TEST_URLS.indexOf(url);
      log.progress([
        `${url} (${index + 1} / ${TEST_URLS.length})`,
        'unthrottled, local machine',
        (unthrottledRun ? (unthrottledRun.result ? '✅' : '❌') : '…'),
        'throttled, mobile device',
        (mobileRun ? (mobileRun.result ? '✅' : '❌') : '…'),
      ].join(' '));
    }

    updateProgress();
    unthrottledRun = await repeatUntilPassOrNull(() => runUnthrottledLocally(url));
    updateProgress();
    mobileRun = await repeatUntilPassOrNull(() => runThrottledMobileDevice(url));
    updateProgress();
    if (!unthrottledRun.result) log.log('failed to get wpt result');
    if (!mobileRun.result) log.log('failed to get unthrottled result');

    const unthrottledResult = unthrottledRun.result;
    const wptResult = mobileRun.result;

    let errors;
    if (unthrottledRun.errors || mobileRun.errors) {
      errors = [...unthrottledRun.errors, ...mobileRun.errors];
    }

    const mobilePrefix = `${sanitizedUrl}-mobile-throttled`;
    const unthrottledPrefix = `${sanitizedUrl}-desktop-unthrottled`;
    /** @type {ResultsForUrl} */
    const urlResultSet = {
      url,
      wpt: wptResult ? {
        devtoolsLog: saveData(`${mobilePrefix}-devtoolsLog.json`, wptResult.devtoolsLog),
        lhr: saveData(`${mobilePrefix}-lhr.json`, wptResult.lhr),
        trace: saveData(`${mobilePrefix}-trace.json`, wptResult.trace),
      } : null,
      wptRetries: mobileRun.retries,
      unthrottled: unthrottledResult ? {
        devtoolsLog:
          saveData(`${unthrottledPrefix}-devtoolsLog.json`, unthrottledResult.devtoolsLog),
        lhr: saveData(`${unthrottledPrefix}-lhr.json`, unthrottledResult.lhr),
        trace: saveData(`${unthrottledPrefix}-trace.json`, unthrottledResult.trace),
      } : null,
      unthrottledRetries: unthrottledRun.retries,
      errors,
    };

    log.log(`collected results for ${url}`);
    summary.results.push(urlResultSet);
    log.log('saving progress');
    common.saveSummary(summary);
  }

  log.log('saving progress');
  common.saveSummary(summary);

  log.log('making golden ...');
  makeGolden(log, summary);

  log.progress('archiving ...');
  await common.archive(common.collectFolder);
  log.closeProgress();
}

try {
  await main();
} finally {
  if (log) log.closeProgress();
}
