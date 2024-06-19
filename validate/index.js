#! /usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';

import Changelog from '../src/changelog.js';

const ENCODING = 'UTF-8';
const DEFAULT_CHANGELOG_PATH = './CHANGELOG.md';

export async function run() {
  const env = { rootPath: process.env.GITHUB_WORKSPACE || process.cwd() };
  const options = { path: core.getInput('path') || DEFAULT_CHANGELOG_PATH };

  const changelogPath = path.join(env.rootPath, options.path);
  const changelog = new Changelog(await fs.readFile(changelogPath, ENCODING));

  core.setOutput('release-type', changelog.releaseType);
  changelog.validateUnreleased();
}

run().catch(err => {
  core.setFailed(err.message);
});
