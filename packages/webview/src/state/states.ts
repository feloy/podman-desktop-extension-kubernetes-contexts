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

import { inject, injectable } from 'inversify';
import { StateAvailableContextsInfo } from './available-contexts.svelte';
import { StateContextsHealthsInfo } from '/@/state/contexts-healths.svelte';
import { StateResourcesCountInfo } from '/@/state/resources-count.svelte';

@injectable()
export class States {
  @inject(StateAvailableContextsInfo)
  private _stateAvailableContextsInfoUI: StateAvailableContextsInfo;

  get stateAvailableContextsInfoUI(): StateAvailableContextsInfo {
    return this._stateAvailableContextsInfoUI;
  }

  @inject(StateContextsHealthsInfo)
  private _stateContextsHealthsInfoUI: StateContextsHealthsInfo;

  get stateContextsHealthsInfoUI(): StateContextsHealthsInfo {
    return this._stateContextsHealthsInfoUI;
  }

  @inject(StateResourcesCountInfo)
  private _stateResourcesCountInfoUI: StateResourcesCountInfo;

  get stateResourcesCountInfoUI(): StateResourcesCountInfo {
    return this._stateResourcesCountInfoUI;
  }
}
