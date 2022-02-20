/*
 * Copyright 2021 The Backstage Authors
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

import useAsync from 'react-use/lib/useAsync';

import {
  techdocsStorageApiRef,
  useTechDocsReader,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';

const attributes: Record<string, string> = {
  IMG: 'src',
  SCRIPT: 'src',
  SOURCE: 'src',
  LINK: 'href',
  A: 'href',
};

const selector = Object.keys(attributes).toString().toLocaleUpperCase('en-US');

/** Make sure that the input url always ends with a '/' */
const normalizeUrl = (url: string) => {
  const value = new URL(url);

  if (!value.pathname.endsWith('/') && !value.pathname.endsWith('.html')) {
    value.pathname += '/';
  }

  return value.toString();
};

type BaseUrlTransformerProps = {
  children: JSX.Element | null;
};

export const BaseUrlTransformer = ({ children }: BaseUrlTransformerProps) => {
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);

  const { loading } = useAsync(async () => {
    if (!dom) return;

    const elements = dom.querySelectorAll(selector);

    if (!elements.length) return;

    for await (const element of elements) {
      const attributeName = attributes[element.tagName];
      const attributeValue = element.getAttribute(attributeName);

      if (!attributeValue) continue;

      const baseUrl = await techdocsStorageApi.getBaseUrl(
        attributeValue,
        entityName,
        path,
      );

      if (element.tagName === 'A' && !element.hasAttribute('download')) {
        const base = normalizeUrl(window.location.href);
        const href = new URL(attributeValue, base).toString();
        element.setAttribute('href', href);
      } else {
        element.setAttribute(attributeName, baseUrl);
      }
    }
  }, [dom, path, entityName, techdocsStorageApi]);

  return loading ? null : children;
};
