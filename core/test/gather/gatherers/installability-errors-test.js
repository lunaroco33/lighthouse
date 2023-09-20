/**
 * @license
 * Copyright 2021 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

import InstallabilityErrors from '../../../gather/gatherers/installability-errors.js';
import {createMockSession} from '../mock-driver.js';

describe('.getInstallabilityErrors', () => {
  let session = createMockSession();

  beforeEach(() => {
    session = createMockSession();
  });

  it('should return the response from the protocol', async () => {
    session.sendCommand
      .mockResponse('Page.getInstallabilityErrors', {
        installabilityErrors: [{errorId: 'no-icon-available', errorArguments: []}],
      });

    const result = await InstallabilityErrors.getInstallabilityErrors(session.asSession());
    expect(result).toEqual({
      errors: [{errorId: 'no-icon-available', errorArguments: []}],
    });
  });
});
