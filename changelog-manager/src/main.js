#! /usr/bin/env node

import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';

import Changelog from './changelog.js';

const ENCODING = 'UTF-8';

export const AVAILABLE_ACTIONS = {
  VALIDATE: 'validate',
  GET_RELEASE_TYPE: 'get-release-type',
  GET_VERSION_CONTENT: 'get-version-content',
  RELEASE: 'release',
  CLEAN_UNRELEASED: 'clean-unreleased',
};

export async function run() {
  const options = {
    action: core.getInput('action'),
    version: core.getInput('version'),
    changelogPath: core.getInput('changelogPath') || 'CHANGELOG.md',
    PRNumber: core.getInput('PRNumber'),
  };

  let changelog;
  const changelogPath = path.join(process.env.GITHUB_WORKSPACE || process.cwd(), options.changelogPath);

  try {
    const changelogContent = await fs.readFile(changelogPath, ENCODING);

    changelog = new Changelog(changelogContent);
  } catch (error) {
    console.log(error.message);
  }

  switch (options.action) {
  case AVAILABLE_ACTIONS.GET_RELEASE_TYPE:
    console.log('changelog.releaseType', changelog.releaseType);
    core.setOutput('type', changelog.releaseType || 'No release type found');
    break;

  case AVAILABLE_ACTIONS.GET_VERSION_CONTENT:
    core.setOutput('content', changelog.getVersionContent(options.version));
    break;

  case AVAILABLE_ACTIONS.VALIDATE:
    changelog.validateUnreleased();
    break;

  case AVAILABLE_ACTIONS.RELEASE:
    changelog.release(options.PRNumber);
    await fs.writeFile(changelogPath, changelog.toString(), ENCODING);
    break;

  case AVAILABLE_ACTIONS.CLEAN_UNRELEASED:
    changelog.cleanUnreleased();
    await fs.writeFile(changelogPath, changelog.toString(), ENCODING);
    break;

  default:
    console.log('please define one of valid action see: TODO');
    break;
  }
}
