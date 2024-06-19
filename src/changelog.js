import { parser as keepAChangelogParser } from 'keep-a-changelog';
import semver from 'semver';

import ChangelogValidationError from './changelogValidationError.js';

export default class Changelog {
  static INITIAL_VERSION = '0.0.0';
  static NO_CODE_CHANGES_REGEX = /^_Modifications made in this changeset do not add, remove or alter any behavior, dependency, API or functionality of the software. They only change non-functional parts of the repository, such as the README file or CI workflows._$/m;
  static FUNDER_REGEX = /^> Development of this release was (?:supported|made on a volunteer basis) by (.+)\.$/m;
  static UNRELEASED_REGEX = /## Unreleased[ ]+\[(major|minor|patch|no-release)\]/i;
  static CHANGESET_LINK_REGEX = /^_Full changeset and discussions: (.+)._$/m;
  static CHANGELOG_INTRO = 'All changes that impact users of this module are documented in this file, in the [Common Changelog](https://common-changelog.org) format with some additional specifications defined in the CONTRIBUTING file. This codebase adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).';

  constructor(rawContent, repository) {
    this.rawContent = rawContent;
    this.changelog = keepAChangelogParser(this.rawContent);
    this.changelog.description = Changelog.CHANGELOG_INTRO;
    this.changelog.format = 'markdownlint';
    this.CHANGESET_LINK_TEMPLATE = PRNumber => `_Full changeset and discussions: [#${PRNumber}](https://github.com/${repository}/pull/${PRNumber})._`;
    this.releaseType = this.extractReleaseType();
  }

  extractReleaseType() {
    const match = this.rawContent.match(Changelog.UNRELEASED_REGEX);

    if (match && match[1]) {
      return match[1].toLowerCase();
    }

    return null;
  }

  cleanUnreleased() {
    const index = this.changelog.releases.findIndex(release => !release.version);

    this.changelog.releases.splice(index, 1);
  }

  getVersionContent(version) {
    const release = this.changelog.findRelease(version);

    if (!release) {
      throw new Error(`Version ${version} not found in changelog`);
    }

    return release.toString(this.changelog);
  }

  release(PRNumber) {
    const unreleased = this.changelog.findRelease();

    if (!unreleased) {
      throw new Error('Missing "Unreleased" section');
    }

    if (this.releaseType == 'no-release') {
      this.cleanUnreleased();

      return {};
    }

    const latestVersion = semver.maxSatisfying(this.changelog.releases.map(release => release.version), '*') || Changelog.INITIAL_VERSION;

    const newVersion = semver.inc(latestVersion, this.releaseType);

    unreleased.setVersion(newVersion);
    unreleased.date = new Date();

    if (PRNumber && !Changelog.CHANGESET_LINK_REGEX.test(unreleased.description)) {
      unreleased.description = `${this.CHANGESET_LINK_TEMPLATE(PRNumber)}\n\n${unreleased.description}`;
    }

    return {
      version: newVersion,
      content: this.getVersionContent(newVersion),
    };
  }

  validateUnreleased() {
    const unreleased = this.changelog.findRelease();
    const errors = [];

    if (!unreleased) {
      errors.push(new Error('Missing "Unreleased" section'));
      throw new ChangelogValidationError(errors);
    }

    if (!this.releaseType) {
      errors.push(new Error('Invalid or missing release type for "Unreleased" section. Please ensure the section contains a valid release type (major, minor, patch or no-release)'));
    }

    if (this.releaseType == 'no-release') {
      if (!Changelog.NO_CODE_CHANGES_REGEX.test(unreleased.description)) {
        errors.push(new Error('Missing no release signature'));
      }
    } else {
      if (!Changelog.FUNDER_REGEX.test(unreleased.description)) {
        errors.push(new Error('Missing funder in the "Unreleased" section'));
      }

      if (!unreleased.changes || Array.from(unreleased.changes.values()).every(change => !change.length)) {
        errors.push(new Error('Missing or malformed changes in the "Unreleased" section'));
      }
    }

    if (errors.length) {
      throw new ChangelogValidationError(errors);
    }
  }

  toString() {
    return this.changelog.toString();
  }
}
