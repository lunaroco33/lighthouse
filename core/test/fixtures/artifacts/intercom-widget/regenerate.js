/**
 * @license Copyright 2023 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */

import {startFlow} from '../../../../index.js';
import {updateTestFixture} from '../update-test-fixture.js';

/**
 * @param {import('puppeteer').Page} page
 */
async function runUserFlow(page) {
  const flow = await startFlow(page);

  await flow.navigate('https://www.intercom.com/help/en/articles/170-integrate-intercom-in-a-single-page-app');

  return flow;
}

/**
 * @param {LH.Artifacts} artifacts
 */
function verify(artifacts) {
  const devtoolsLog = artifacts.DevtoolsLog;

  const facadeResourceEvents = devtoolsLog.filter(e =>
    /widget\.intercom\.io/.test(e.params?.request?.url)
  );

  if (facadeResourceEvents.length === 0) {
    throw new Error('expected a resource matching URL pattern "widget.intercom.io"');
  }
}

await updateTestFixture({
  name: 'intercom-widget',
  about: 'Page with a Intercom widget that can be replaced with a facade',
  saveTrace: true,
  saveDevtoolsLog: true,
  runUserFlow,
  verify,
});
