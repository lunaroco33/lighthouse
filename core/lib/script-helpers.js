/**
 * @license
 * Copyright 2022 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * @param {LH.Artifacts.Script} script
 * @return {boolean}
 */
function isInline(script) {
  return Boolean(script.startLine || script.startColumn);
}

/**
 * @param {LH.Artifacts.NetworkRequest[]} networkRecords
 * @param {LH.Artifacts.Script} script
 * @return {LH.Artifacts.NetworkRequest|undefined}
 */
function getRequestForScript(networkRecords, script) {
  let networkRequest = networkRecords.find(request => request.url === script.url);
  while (networkRequest?.redirectDestination) {
    networkRequest = networkRequest.redirectDestination;
  }
  return networkRequest;
}

export {
  getRequestForScript,
  isInline,
};
