/*******************************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 *******************************************************************************/

import type { ExtensionContext } from '@podman-desktop/api';
import { beforeEach, expect, test, vi } from 'vitest';
import { activate, deactivate } from '/@/main';
import { ContextsExtension } from './contexts-extension';

let extensionContextMock: ExtensionContext;

vi.mock(import('./contexts-extension'));

beforeEach(() => {
  vi.restoreAllMocks();
  vi.resetAllMocks();

  // Create a mock for the ExtensionContext
  extensionContextMock = {} as ExtensionContext;
});

test('should initialize and activate the Contexts Extension when activate is called', async () => {
  expect.assertions(1);

  // Call activate
  await activate(extensionContextMock);

  // Ensure that the Contexts Extension is instantiated and its activate method is called
  expect(ContextsExtension.prototype.activate).toHaveBeenCalledWith();
});

test('should call deactivate when deactivate is called', async () => {
  expect.assertions(1);

  // Call activate first to initialize IBM Cloud Extension
  await activate(extensionContextMock);

  // Call deactivate
  await deactivate();

  // Ensure that the deactivate method was called
  expect(ContextsExtension.prototype.deactivate).toHaveBeenCalledWith();
});

test('should set contextsExtension to undefined after deactivate is called', async () => {
  expect.assertions(2);

  // Call activate to initialize the extension
  await activate(extensionContextMock);

  // Call deactivate
  await deactivate();

  expect(global).toHaveProperty('contextsExtension');
  expect((global as Record<string, unknown>).contextsExtension).toBeUndefined();
});
