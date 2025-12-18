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

import type { ContextsApi } from './interface/contexts-api';
import { createRpcChannel } from '@kubernetes-contexts/rpc';
import type { AvailableContextsInfo } from '/@/model/available-contexts-info';
import type { ContextsHealthsInfo } from '@podman-desktop/kubernetes-dashboard-extension-api';
import type { SubscribeApi, OpenDialogApi } from '/@/interface';
import type { OpenDialogResult } from '/@/model/open-dialog-result';

// RPC channels (used by the webview to send requests to the extension)
export const API_CONTEXTS = createRpcChannel<ContextsApi>('ContextsApi');
export const API_SUBSCRIBE = createRpcChannel<SubscribeApi>('SubscribeApi');

// Broadcast events (sent by extension and received by the webview)
export const AVAILABLE_CONTEXTS = createRpcChannel<AvailableContextsInfo>('AvailableContexts');
export const CONTEXT_HEALTHS = createRpcChannel<ContextsHealthsInfo>('ContextsHealths');

// Channels for requests expecting responses
export const API_OPEN_DIALOG = createRpcChannel<OpenDialogApi>('OpenDialogApi');
export const OPEN_DIALOG_RESULTS = createRpcChannel<OpenDialogResult>('OpenDialogResult');
