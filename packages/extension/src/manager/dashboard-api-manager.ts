/**********************************************************************
 * Copyright (C) 2026 Red Hat, Inc.
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

import type { KubernetesDashboardExtensionApi } from '@podman-desktop/kubernetes-dashboard-extension-api';
import { extensions } from '@podman-desktop/api';
import { injectable } from 'inversify';

@injectable()
export class DashboardApiManager {
  /**
   * @returns The Kubernetes Dashboard extension API or undefined if the extension is not installed
   */
  getApi(): KubernetesDashboardExtensionApi | undefined {
    return extensions.getExtension<KubernetesDashboardExtensionApi>('podman-desktop.kubernetes-dashboard')?.exports;
  }
}
