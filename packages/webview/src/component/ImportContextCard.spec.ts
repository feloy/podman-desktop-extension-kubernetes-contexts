/**********************************************************************
 * Copyright (C) 2025-2026 Red Hat, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * SPDX-License-Identifier: Apache-2.0
 ***********************************************************************/

import '@testing-library/jest-dom/vitest';

import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, test, vi } from 'vitest';

import ImportContextCard from './ImportContextCard.svelte';
import { StatesMocks } from '/@/tests/state-mocks';
import { FakeStateObject } from '/@/state/util/fake-state-object.svelte';
import type { AvailableContextsInfo } from '@kubernetes-contexts/channels';
import { KEEP_BOTH, REPLACE, type Props } from '/@/component/ImportContextCard';

const statesMocks = new StatesMocks();
let availableContextsMock: FakeStateObject<AvailableContextsInfo, void>;

const defaultProps = {
  name: 'test-context',
  cluster: 'test-cluster',
  user: 'test-user',
  server: 'https://test-server:6443',
  namespace: 'default',
  selected: true,
  hasConflict: false,
  conflictResolution: KEEP_BOTH,
  onConflictResolutionChange: vi.fn(),
} as Props;

beforeEach(() => {
  vi.resetAllMocks();
  statesMocks.reset();
  availableContextsMock = new FakeStateObject();
  statesMocks.mock<AvailableContextsInfo, void>('stateAvailableContextsInfoUI', availableContextsMock);
  availableContextsMock.setData({
    clusters: [{ name: 'existing-cluster', server: 'https://existing-cluster:6443', skipTLSVerify: false }],
    users: [{ name: 'existing-user' }],
    contexts: [{ name: 'existing-context', cluster: 'existing-cluster', user: 'existing-user', namespace: 'default' }],
    currentContext: 'existing-context',
  });
});

describe('ImportContextCard', () => {
  test('renders context name', () => {
    render(ImportContextCard, { props: defaultProps });

    expect(screen.getByLabelText('Context Name')).toHaveTextContent('test-context');
  });

  test('renders context details (cluster, server, user, namespace)', () => {
    render(ImportContextCard, { props: defaultProps });

    expect(screen.getByLabelText('Context Cluster')).toHaveTextContent('test-cluster');
    expect(screen.getByLabelText('Context Server')).toHaveTextContent('https://test-server:6443');
    expect(screen.getByLabelText('Context User')).toHaveTextContent('test-user');
    expect(screen.getByLabelText('Context Namespace')).toHaveTextContent('default');
  });

  test('does not render server when not provided', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        server: undefined,
      },
    });

    expect(screen.queryByLabelText('Context Server')).not.toBeInTheDocument();
  });

  test('does not render namespace when not provided', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        namespace: undefined,
      },
    });

    expect(screen.queryByLabelText('Context Namespace')).not.toBeInTheDocument();
  });

  test('renders checkbox when selected', () => {
    render(ImportContextCard, { props: defaultProps });

    const checkbox = screen.getByTitle('Select context test-context');
    expect(checkbox).toBeInTheDocument();
  });

  test('renders checkbox when not selected', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        selected: false,
      },
    });

    const checkbox = screen.getByTitle('Select context test-context');
    expect(checkbox).toBeInTheDocument();
  });

  test('applies opacity when deselected', () => {
    const { container } = render(ImportContextCard, {
      props: {
        ...defaultProps,
        selected: false,
      },
    });

    // The grow div should have opacity-50 class
    const cardContent = container.querySelector('.grow.opacity-50');
    expect(cardContent).toBeInTheDocument();
  });

  test('does not show conflict warning when no conflict', () => {
    render(ImportContextCard, { props: defaultProps });

    expect(screen.queryByText('⚠ A context with this name already exists')).not.toBeInTheDocument();
  });

  test('shows conflict warning when hasConflict is true and selected', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        hasConflict: true,
      },
    });

    expect(screen.getByText('⚠ A context with this name already exists')).toBeInTheDocument();
  });

  test('does not show conflict warning when hasConflict but not selected', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        hasConflict: true,
        selected: false,
      },
    });

    expect(screen.queryByText('⚠ A context with this name already exists')).not.toBeInTheDocument();
  });

  test('shows conflict resolution options when hasConflict and selected', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        hasConflict: true,
      },
    });

    expect(screen.getByText('Keep both')).toBeInTheDocument();
    expect(screen.getByText('Replace existing')).toBeInTheDocument();
  });

  test('shows preview name in keep-both option', () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        hasConflict: true,
      },
    });

    expect(screen.getByText('test-context-1')).toBeInTheDocument();
  });

  test('calls onConflictResolutionChange when keep-both is selected', async () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        hasConflict: true,
        conflictResolution: REPLACE,
      },
    });

    const keepBothRadio = screen.getByLabelText('keep-both-conflict-resolution-select');
    await userEvent.click(keepBothRadio);

    expect(defaultProps.onConflictResolutionChange).toHaveBeenCalledWith(KEEP_BOTH);
  });

  test('calls onConflictResolutionChange when replace is selected', async () => {
    render(ImportContextCard, {
      props: {
        ...defaultProps,
        hasConflict: true,
        conflictResolution: KEEP_BOTH,
      },
    });

    const replaceRadio = screen.getByLabelText('replace-conflict-resolution-select');
    await userEvent.click(replaceRadio);

    expect(defaultProps.onConflictResolutionChange).toHaveBeenCalledWith(REPLACE);
  });

  test('has correct aria-label on row', () => {
    render(ImportContextCard, { props: defaultProps });

    expect(screen.getByRole('row', { name: 'test-context' })).toBeInTheDocument();
  });
});
