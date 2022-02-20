/*
 * Copyright 2022 The Backstage Authors
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
 */

import React, { FC } from 'react';
import useAsync from 'react-use/lib/useAsync';

import {
  techdocsStorageApiRef,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';

import * as RULES from './rules';
import { useCssRules } from '../hooks';

export const StylesTransformer: FC = ({ children }) => {
  const dom = useTechDocsShadowDom();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);
  const rules = useCssRules(Object.values(RULES));

  useAsync(async () => {
    if (!dom) return;

    dom
      .getElementsByTagName('head')[0]
      .insertAdjacentHTML('beforeend', `<style>${rules}</style>`);

    const links = dom.querySelectorAll('head > link[rel="stylesheet"]');

    if (!links.length) return;

    const apiOrigin = await techdocsStorageApi.getApiOrigin();

    const stylesheets = Array.from(links).filter(link => {
      const href = link.getAttribute('href');
      return href?.startsWith(apiOrigin);
    });

    let count = stylesheets.length;

    if (count === 0) return;

    (dom as HTMLElement).style.setProperty('opacity', '0');

    stylesheets.forEach(link => {
      const handler = () => {
        --count;
        if (!count) {
          link.removeEventListener('load', handler);
          (dom as HTMLElement).style.removeProperty('opacity');
        }
      };
      link.addEventListener('load', handler);
    });
  }, [dom, techdocsStorageApi]);

  return <>{children}</>;
};
