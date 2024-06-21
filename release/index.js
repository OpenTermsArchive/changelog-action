import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';

import Changelog from '../src/changelog.js';

const ENCODING = 'UTF-8';
const DEFAULT_CHANGELOG_PATH = './CHANGELOG.md';

export async function run() {
  const env = {
    rootPath: process.env.GITHUB_WORKSPACE || process.cwd(),
    pullRequestNumber: process.env.GITHUB_EVENT_PATH ? JSON.parse(await fs.readFile(process.env.GITHUB_EVENT_PATH, ENCODING)).pull_request?.number : null,
    repository: process.env.GITHUB_REPOSITORY,
  };

  const options = {
    path: core.getInput('path') || DEFAULT_CHANGELOG_PATH,
    notice: core.getInput('notice') || null,
  };

  const changelog = new Changelog({ changelogPath: path.join(env.rootPath, options.path) });

  let { notice } = options;

  if (!notice) {
    notice = (env.pullRequestNumber && env.repository) ? `Full changeset and discussions: [#${env.pullRequestNumber}](https://github.com/${env.repository}/pull/${env.pullRequestNumber}).` : null;
  }

  const { version, content } = changelog.release(notice);

  core.setOutput('version', version);
  core.setOutput('content', content);
}

run().catch(error => {
  core.setFailed(error.message);
});
