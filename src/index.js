#! /usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';
// import github from '@actions/github';
// import { program } from 'commander';

import Changelog from './changelog.js';

// program
//   .name('changelog')
//   .description('A command-line utility for managing the changelog file')
//   .option('--validate', 'Validate the changelog, ensuring it follows the expected format and contains required information')
//   .option('--release [PRNumber]', 'Convert the Unreleased section into a new release in the changelog, optionally linking to a pull request with the provided PRNumber')
//   .option('--clean-unreleased', 'Remove the Unreleased section')
//   .option('--get-release-type', 'Get the release type of the Unreleased section in the changelog')
//   .option('--get-version-content <version>', 'Get the content of the given version in the changelog');

// const options = program.parse(process.argv).opts();

const options = {
  validate: core.getInput('validate'),
  getReleaseType: core.getInput('get-release-type'),
  getVersionContent: core.getInput('get-version-content'),
  release: core.getInput('release'),
  cleanUnreleased: core.getInput('clean-unreleased'),
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
  console.log('getReleaseType');
  process.stdout.write(changelog.releaseType || 'No release type found');
}

if (options.validate) {
  console.log('Validation');
  changelog.validateUnreleased();
  console.log('Changelog valid!');
}

if (options.getVersionContent) {
  process.stdout.write(changelog.getVersionContent(options.getVersionContent));
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
