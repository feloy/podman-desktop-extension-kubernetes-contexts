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

export const KEEP_BOTH = 'keep-both';
export const REPLACE = 'replace';

export type ConflictResolution = typeof KEEP_BOTH | typeof REPLACE;

export interface Props {
  name: string;
  cluster: string;
  user: string;
  server?: string;
  namespace?: string;
  selected: boolean;
  hasConflict: boolean;
  conflictResolution: ConflictResolution;
  onConflictResolutionChange: (resolution: ConflictResolution) => void;
}
