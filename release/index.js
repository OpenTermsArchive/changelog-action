#! /usr/bin/env node

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
  const options = { path: core.getInput('path') || DEFAULT_CHANGELOG_PATH };

  const changelogPath = path.join(env.rootPath, options.path);
  const changelog = new Changelog(await fs.readFile(changelogPath, ENCODING), env.repository);

  const { version, content } = changelog.release(env.pullRequestNumber);

  await fs.writeFile(changelogPath, changelog.toString(), ENCODING);

  core.setOutput('version', version);
  core.setOutput('content', content);
}

run().catch(error => {
  core.setFailed(error.message);
});
