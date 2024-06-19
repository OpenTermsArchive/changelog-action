#! /usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';

import Changelog from '../src/changelog.js';

const ENCODING = 'UTF-8';

export async function run() {
  const options = { path: core.getInput('path') || 'CHANGELOG.md' };

  let changelog;
  const changelogPath = path.join(process.env.GITHUB_WORKSPACE || process.cwd(), options.path);

  try {
    const changelogContent = await fs.readFile(changelogPath, ENCODING);

    changelog = new Changelog(changelogContent);
  } catch (error) {
    console.log(error.message);
  }

  core.setOutput('release-type', changelog.releaseType || 'No release type found');
  changelog.validateUnreleased();
}

run().catch(err => {
  core.setFailed(err.message);
});
