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

import type { Context } from '@kubernetes/client-node';
import type { ImportContextInfo } from '/@/model/import-context-info';

export const ContextsApi = Symbol.for('ContextsApi');

export interface ConnectOptions {
  resources?: string[];
}

export interface ContextsApi {
  setCurrentContext(contextName: string): Promise<void>;
  deleteContext(contextName: string): Promise<void>;
  duplicateContext(contextName: string): Promise<void>;
  editContext(contextName: string, newContext: Context): Promise<void>;
  getImportContexts(filePath: string): Promise<ImportContextInfo[]>;
  importContextsFromFile(
    filePath: string,
    selectedContexts: string[],
    conflictResolutions: Record<string, 'keep-both' | 'replace'>,
  ): Promise<void>;
  connectToContext(contextName: string, options?: ConnectOptions): Promise<void>;
}
