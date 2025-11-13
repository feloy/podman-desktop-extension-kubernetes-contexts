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
import { render } from '@testing-library/svelte';
import ContextCard from '/@/component/ContextCard.svelte';
import SetCurrentContextAction from '/@/component/actions/SetCurrentContextAction.svelte';

vi.mock(import('/@/component/actions/SetCurrentContextAction.svelte'));

beforeEach(() => {
  vi.resetAllMocks();
});

test('ContextCard should render with current context', () => {
  const { queryByText } = render(ContextCard, {
    props: {
      cluster: {
        name: 'Test Cluster',
        server: 'https://test.cluster',
        skipTLSVerify: false,
      },
      user: {
        name: 'Test User',
      },
      name: 'Test Context',
      namespace: 'Test Namespace',
      currentContext: true,
      icon: '/my/icon',
    },
  });
  expect(queryByText('Current Context')).toBeInTheDocument();
  expect(queryByText('Test Context')).toBeInTheDocument();
  expect(queryByText('Test Namespace')).toBeInTheDocument();
  expect(queryByText('Test User')).toBeInTheDocument();
  expect(queryByText('Test Cluster')).toBeInTheDocument();
  expect(queryByText('https://test.cluster')).toBeInTheDocument();
  expect(SetCurrentContextAction).not.toHaveBeenCalled();
});

test('ContextCard should render with no current context', () => {
  const { queryByText } = render(ContextCard, {
    props: {
      cluster: {
        name: 'Test Cluster',
        server: 'https://test.cluster',
        skipTLSVerify: false,
      },
      user: {
        name: 'Test User',
      },
      name: 'Test Context',
      namespace: 'Test Namespace',
      currentContext: false,
      icon: '/my/icon',
    },
  });
  expect(queryByText('Current Context')).not.toBeInTheDocument();
  expect(queryByText('Test Context')).toBeInTheDocument();
  expect(queryByText('Test Namespace')).toBeInTheDocument();
  expect(queryByText('Test User')).toBeInTheDocument();
  expect(queryByText('Test Cluster')).toBeInTheDocument();
  expect(queryByText('https://test.cluster')).toBeInTheDocument();
  expect(SetCurrentContextAction).toHaveBeenCalledWith(expect.anything(), { name: 'Test Context' });
});
