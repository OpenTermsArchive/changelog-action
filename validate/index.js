import path from 'path';

import core from '@actions/core';

import Changelog from '../src/changelog.js';
import { parseInput, parseRegexString } from '../utils/index.js';

const DEFAULT_CHANGELOG_PATH = './CHANGELOG.md';

export async function run() {
  const env = { rootPath: process.env.GITHUB_WORKSPACE || process.cwd() };
  const options = {
    path: core.getInput('path') || DEFAULT_CHANGELOG_PATH,
    fundersRegex: parseInput(core.getInput('funders')) || false,
    noReleaseSignatureRegex: parseInput(core.getInput('no-release-signature')) || true,
  };

  const changelog = new Changelog({
    changelogPath: path.join(env.rootPath, options.path),
    fundersRegex: typeof options.fundersRegex === 'boolean' ? options.fundersRegex : parseRegexString(options.fundersRegex),
    noReleaseSignatureRegex: typeof options.noReleaseSignatureRegex === 'boolean' ? options.noReleaseSignatureRegex : parseRegexString(options.noReleaseSignatureRegex),
  });

  core.setOutput('release-type', changelog.releaseType);
  changelog.validateUnreleased();
}

run().catch(error => {
  core.setFailed(error.message);
});
