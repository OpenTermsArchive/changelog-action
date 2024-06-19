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

  const { version, content } = changelog.release(options.PRNumber);

  await fs.writeFile(changelogPath, changelog.toString(), ENCODING);

  core.setOutput('version', version);
  core.setOutput('content', content);
}

run().catch(err => {
  core.setFailed(err.message);
});
