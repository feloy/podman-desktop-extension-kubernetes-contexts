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
import type { ResourceCount, ContextPermission } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { fireEvent, render, screen } from '@testing-library/svelte';
import { expect, test } from 'vitest';
import ContextResources from '/@/component/ContextResources.svelte';

interface ResourcesTestCase {
  name: string;
  resourcesCount?: ResourceCount[];
  contextsPermissions?: ContextPermission[];
  expectedPodsOpacity60: boolean;
  expectedDeploymentsOpacity60: boolean;
  expectedPodsCount: string;
  expectedDeploymentsCount: string;
}

test.each<ResourcesTestCase>([
  {
    name: 'pods and deployments permitted',
    resourcesCount: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        count: 1,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        count: 2,
      },
    ],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: true,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: true,
      },
    ],
    expectedPodsOpacity60: false,
    expectedDeploymentsOpacity60: false,
    expectedPodsCount: '1',
    expectedDeploymentsCount: '2',
  },
  {
    name: 'pods permitted, deployments not permitted',
    resourcesCount: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        count: 1,
      },
    ],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: true,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: false,
      },
    ],
    expectedPodsOpacity60: false,
    expectedDeploymentsOpacity60: true,
    expectedPodsCount: '1',
    expectedDeploymentsCount: '-',
  },
  {
    name: 'pods not permitted, deployments permitted',
    resourcesCount: [
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        count: 2,
      },
    ],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: false,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: true,
      },
    ],
    expectedPodsOpacity60: true,
    expectedDeploymentsOpacity60: false,
    expectedPodsCount: '-',
    expectedDeploymentsCount: '2',
  },
  {
    name: 'pods and deployments are not permitted',
    resourcesCount: [],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: false,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: false,
      },
    ],
    expectedPodsOpacity60: true,
    expectedDeploymentsOpacity60: true,
    expectedPodsCount: '-',
    expectedDeploymentsCount: '-',
  },
])(
  'resources counts when $name',
  async ({
    resourcesCount,
    contextsPermissions,
    expectedPodsOpacity60,
    expectedDeploymentsOpacity60,
    expectedPodsCount,
    expectedDeploymentsCount,
  }) => {
    const { getByText, getByLabelText } = render(ContextResources, {
      props: {
        resourcesCount,
        contextsPermissions,
      },
    });
    expect(getByText('PODS').getAttribute('class')).toContain(expectedPodsOpacity60 ? 'opacity-60' : '');
    expect(getByText('DEPLOYMENTS').getAttribute('class')).toContain(expectedDeploymentsOpacity60 ? 'opacity-60' : '');

    expect(getByLabelText('Context Pods Count').textContent).toBe(expectedPodsCount);
    expect(getByLabelText('Context Deployments Count').textContent).toBe(expectedDeploymentsCount);
  },
);

test('no tooltip should be rendered when all resources are permitted', async () => {
  render(ContextResources, {
    props: {
      resourcesCount: [
        {
          contextName: 'ctx-1',
          resourceName: 'pods',
          count: 1,
        },
        {
          contextName: 'ctx-1',
          resourceName: 'deployments',
          count: 2,
        },
      ],
      contextsPermissions: [
        {
          contextName: 'ctx-1',
          resourceName: 'pods',
          permitted: true,
        },
        {
          contextName: 'ctx-1',
          resourceName: 'deployments',
          permitted: true,
        },
      ],
    },
  });
  expect(screen.queryByTestId('tooltip-trigger')).not.toBeInTheDocument();
});

interface TooltipTestCase {
  name: string;
  resourcesCount?: ResourceCount[];
  contextsPermissions?: ContextPermission[];
  expectedTooltip: string;
}

test.each<TooltipTestCase>([
  {
    name: 'pods permitted, deployments not permitted',
    resourcesCount: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        count: 1,
      },
    ],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: true,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: false,
      },
    ],
    expectedTooltip: 'Deployments are not accessible',
  },
  {
    name: 'pods not permitted, deployments permitted',
    resourcesCount: [
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        count: 2,
      },
    ],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: false,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: true,
      },
    ],
    expectedTooltip: 'Pods are not accessible',
  },
  {
    name: 'pods and deployments are not permitted',
    resourcesCount: [],
    contextsPermissions: [
      {
        contextName: 'ctx-1',
        resourceName: 'pods',
        permitted: false,
      },
      {
        contextName: 'ctx-1',
        resourceName: 'deployments',
        permitted: false,
      },
    ],
    expectedTooltip: 'Pods and Deployments are not accessible',
  },
])('tooltip when $name', async ({ resourcesCount, contextsPermissions, expectedTooltip }) => {
  const { getByText } = render(ContextResources, {
    props: {
      resourcesCount,
      contextsPermissions,
    },
  });
  const slot = screen.getByTestId('tooltip-trigger');
  await fireEvent.mouseEnter(slot);
  expect(getByText(expectedTooltip)).toBeInTheDocument();
});
