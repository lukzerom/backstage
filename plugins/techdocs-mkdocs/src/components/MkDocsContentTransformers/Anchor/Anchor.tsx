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

import React, { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import parseGitUrl from 'git-url-parse';

import { Portal } from '@material-ui/core';
import FeedbackOutlinedIcon from '@material-ui/icons/FeedbackOutlined';

import {
  techdocsStorageApiRef,
  useTechDocsReader,
  useTechDocsShadowDom,
} from '@backstage/plugin-techdocs';
import { useApi } from '@backstage/core-plugin-api';
import { replaceGitHubUrlType } from '@backstage/integration';
import { scmIntegrationsApiRef } from '@backstage/integration-react';

const EDIT_LINK_SELECTOR = '[title="Edit this page"]';

const FeedbackLink = () => {
  const dom = useTechDocsShadowDom();
  const scmIntegrationsApi = useApi(scmIntegrationsApiRef);

  if (!dom) return null;

  // attempting to use selectors that are more likely to be static as MkDocs updates over time
  const editLink = dom.querySelector<HTMLAnchorElement>(EDIT_LINK_SELECTOR);

  // don't show if edit link not available in raw page
  if (!editLink?.href) return null;

  const sourceURL = new URL(editLink.href);
  const integration = scmIntegrationsApi.byUrl(sourceURL);

  // don't show if can't identify edit link hostname as a gitlab/github hosting
  if (integration?.type !== 'github' && integration?.type !== 'gitlab') {
    return null;
  }

  let feedbackLink = dom.querySelector('#git-feedback-link');

  if (!feedbackLink) {
    feedbackLink = document.createElement('div');
    feedbackLink?.setAttribute('id', 'git-feedback-link');
  }

  // topmost h1 only contains title for whole page
  const title = (dom.querySelector('article>h1') as HTMLElement).childNodes[0]
    .textContent;
  const issueTitle = encodeURIComponent(`Documentation Feedback: ${title}`);
  const issueDesc = encodeURIComponent(
    `Page source:\n${editLink.href}\n\nFeedback:`,
  );

  // Convert GitHub edit url to blob type so it can be parsed by git-url-parse correctly
  const gitUrl =
    integration?.type === 'github'
      ? replaceGitHubUrlType(sourceURL.href, 'blob')
      : sourceURL.href;

  const gitInfo = parseGitUrl(gitUrl);
  const repoPath = `/${gitInfo.organization}/${gitInfo.name}`;

  const params =
    integration?.type === 'github'
      ? `title=${issueTitle}&body=${issueDesc}`
      : `issue[title]=${issueTitle}&issue[description]=${issueDesc}`;
  const href = `${sourceURL.origin}${repoPath}/issues/new?${params}`;

  editLink?.insertAdjacentElement('beforebegin', feedbackLink);

  return (
    <Portal container={feedbackLink}>
      <a
        className="md-content__button md-icon"
        title="Leave feedback for this page"
        href={href}
        style={{ paddingLeft: '5px' }}
      >
        <FeedbackOutlinedIcon />
      </a>
    </Portal>
  );
};

export const AnchorTransformer = () => {
  const navigate = useNavigate();
  const dom = useTechDocsShadowDom();
  const { path, entityName } = useTechDocsReader();
  const techdocsStorageApi = useApi(techdocsStorageApiRef);

  const handler = useCallback(
    (anchor: HTMLAnchorElement) => (event: MouseEvent) => {
      const href = anchor.getAttribute('href');
      const download = anchor.hasAttribute('download');

      const origin = window.location.origin;
      if (!href || !href.startsWith(origin) || download) return;

      event.preventDefault();

      const { pathname, hash } = new URL(href);
      const url = pathname.concat(hash);

      // detect if CTRL or META keys are pressed
      // so that links can be opened in a new tab
      if (event.ctrlKey || event.metaKey) {
        window.open(url, '_blank');
        return;
      }

      navigate(url);
    },
    [navigate],
  );

  useEffect(() => {
    if (!dom) return () => {};

    const anchors = dom.getElementsByTagName('a');

    if (!anchors.length) return () => {};

    for (const anchor of anchors) {
      anchor.addEventListener('click', handler(anchor));

      const url = anchor.getAttribute('href');

      if (!url) continue;

      // if link is external, add target to open in a new window or tab
      if (url.match(/^https?:\/\//i)) {
        anchor.setAttribute('target', '_blank');
      }
    }

    return () => {
      for (const anchor of anchors) {
        anchor.removeEventListener('click', handler(anchor));
      }
    };
  }, [dom, navigate, handler, path, entityName, techdocsStorageApi]);

  return <FeedbackLink />;
};
