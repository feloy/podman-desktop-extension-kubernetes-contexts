/**********************************************************************
 * Copyright (C) 2025 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import '@testing-library/jest-dom/vitest';
import { beforeEach, expect, test, vi } from 'vitest';
import ContextStatus from '/@/component/ContextStatus.svelte';
import { fireEvent, render, screen, within } from '@testing-library/svelte';
import type { ContextHealth } from '@podman-desktop/kubernetes-dashboard-extension-api';

beforeEach(() => {
  vi.resetAllMocks();
});

interface TestCase {
  name: string;
  health: ContextHealth | undefined;
  expectedAriaLabel: string;
  expectedDisplayedText: string;
  expectedClass: string;
}

test.each<TestCase>([
  {
    name: 'unknown state',
    health: undefined,
    expectedAriaLabel: 'Context Unknown',
    expectedDisplayedText: 'UNKNOWN',
    expectedClass: '--pd-status-disconnected',
  },
  {
    name: 'reachable state',
    health: { contextName: 'ctx-1', checking: false, reachable: true, offline: false },
    expectedAriaLabel: 'Context Reachable',
    expectedDisplayedText: 'REACHABLE',
    expectedClass: '--pd-status-connected',
  },
  {
    name: 'unreachable state',
    health: { contextName: 'ctx-1', checking: false, reachable: false, offline: false },
    expectedAriaLabel: 'Context Unreachable',
    expectedDisplayedText: 'UNREACHABLE',
    expectedClass: '--pd-status-disconnected',
  },
  {
    name: 'offline state',
    health: { contextName: 'ctx-1', checking: false, reachable: false, offline: true },
    expectedAriaLabel: 'Context connection lost',
    expectedDisplayedText: 'CONNECTION LOST',
    expectedClass: '--pd-status-paused',
  },
])('$name', ({ health, expectedAriaLabel, expectedDisplayedText, expectedClass, name }) => {
  const { container, getByText } = render(ContextStatus, {
    props: {
      health,
    },
  });
  getByText(expectedDisplayedText);
  expect(within(container).getByLabelText(expectedAriaLabel).getAttribute('class')).toContain(
    `text-(${expectedClass})`,
  );

  expect(container).toMatchSnapshot(name);
});

test('a tooltip should be rendered when the error message is defined and the tooltip is hovered', async () => {
  const { container, getByText } = render(ContextStatus, {
    props: {
      health: {
        contextName: 'ctx-1',
        checking: false,
        reachable: false,
        offline: false,
        errorMessage: 'An error message',
      },
    },
  });

  getByText('ERROR');
  expect(within(container).getByLabelText('Error').getAttribute('class')).toContain(`text-(--pd-status-dead)`);

  const slot = screen.getByTestId('tooltip-trigger');
  await fireEvent.mouseEnter(slot);
  expect(getByText('An error message')).toBeInTheDocument();
});
