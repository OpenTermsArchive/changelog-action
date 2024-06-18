#! /usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';
// import github from '@actions/github';
// import { program } from 'commander';

import Changelog from './changelog.js';

const options = {
  validate: core.getBooleanInput('validate'),
  getReleaseType: core.getBooleanInput('get-release-type'),
  getVersionContent: core.getInput('get-version-content'),
  release: core.getInput('release'),
  cleanUnreleased: core.getBooleanInput('clean-unreleased'),
};

console.log('options', options);

let changelog;

let changelogPath = core.getInput('changelog') || 'CHANGELOG.md';

if (!path.isAbsolute(changelogPath)) {
  const root = process.env.GITHUB_WORKSPACE || process.cwd();

  changelogPath = path.join(root, changelogPath);
}

const ENCODING = 'UTF-8';

console.log('Action called');
try {
  const changelogContent = await fs.readFile(changelogPath, ENCODING);

  console.log('changelogContent', changelogContent);

  changelog = new Changelog(changelogContent);
} catch (error) {
  console.log(error.message);
}

if (options.getReleaseType) {
  core.setOutput('type', changelog.releaseType || 'No release type found');
}

if (options.validate) {
  changelog.validateUnreleased();
  console.log('Changelog valid!');
}

if (options.getVersionContent) {
  core.setOutput('content', changelog.getVersionContent(options.getVersionContent));
}

if (options.release) {
  const PRNumber = typeof options.release == 'boolean' ? null : options.release;

  changelog.release(PRNumber);
  await fs.writeFile(changelogPath, changelog.toString(), ENCODING);
}

if (options.cleanUnreleased) {
  changelog.cleanUnreleased();
  await fs.writeFile(changelogPath, changelog.toString(), ENCODING);
}
