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

import { useContext, useState } from 'react';
import useAsync from 'react-use/lib/useAsync';

import { useTheme } from '@material-ui/core';

import {
  techdocsStorageApiRef,
  useTechDocsReader,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import {
  SidebarPinStateContext,
  SidebarPinStateContextType,
} from '@backstage/core-components';
import { BackstageTheme } from '@backstage/theme';
import { useApi } from '@backstage/core-plugin-api';

export type RuleParams = {
  theme: BackstageTheme;
  sidebar: Pick<SidebarPinStateContextType, 'isPinned'>;
};

export type RuleFunction = (params: RuleParams) => string;

export const useCssRules = (values: RuleFunction[]) => {
  const theme = useTheme<BackstageTheme>();
  const sidebar = useContext(SidebarPinStateContext);
  return values.reduce<string>(
    (rules, rule) => rules.concat(rule({ theme, sidebar })),
    '',
  );
};

const LINK_SELECTOR = 'head > link[rel="stylesheet"]';

export const useCssLoading = () => {
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);
  const [loading, setLoading] = useState(true);

  useAsync(async () => {
    const apiOrigin = await techdocsStorageApi.getApiOrigin();

    const links = Array.from(dom.querySelectorAll(LINK_SELECTOR));

    const stylesheets = await links.filter(async link => {
      const href = link.getAttribute('href');
      if (!href) return false;
      const baseUrl = await techdocsStorageApi.getBaseUrl(
        href,
        entityName,
        path,
      );
      return baseUrl.startsWith(apiOrigin);
    });

    let count = stylesheets.length;

    if (count === 0) {
      setLoading(false);
      return;
    }

    (dom as HTMLElement).style.setProperty('opacity', '0');

    stylesheets.forEach(stylesheet => {
      const handler = () => {
        --count;
        if (!count) {
          setLoading(false);
          (dom as HTMLElement).style.removeProperty('opacity');
          stylesheet.removeEventListener('load', handler);
        }
      };
      stylesheet.addEventListener('load', handler);
    });
  }, [dom, techdocsStorageApi]);

  return loading;
};
