/**
 * @license Copyright 2022 The Lighthouse Authors. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 */
'use strict';

/**
 * @typedef ExportType
 * @property {import('./index.js')['startFlow']} startFlow
 * @property {import('./index.js')['navigation']} navigation
 * @property {import('./index.js')['startTimespan']} startTimespan
 * @property {import('./index.js')['snapshot']} snapshot
 */

/** @type {import('./index.js')['default'] & ExportType} */
const lighthouse = async function lighthouse(...args) {
  const {default: lighthouse} = await import('./index.js');
  return lighthouse(...args);
};

lighthouse.startFlow = async function startFlow(...args) {
  const {startFlow} = await import('./index.js');
  return startFlow(...args);
};

lighthouse.navigation = async function navigation(...args) {
  const {navigation} = await import('./index.js');
  return navigation(...args);
};

lighthouse.startTimespan = async function startTimespan(...args) {
  const {startTimespan} = await import('./index.js');
  return startTimespan(...args);
};

lighthouse.snapshot = async function snapshot(...args) {
  const {snapshot} = await import('./index.js');
  return snapshot(...args);
};

module.exports = lighthouse;
