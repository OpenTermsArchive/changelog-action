import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';

import Changelog from './changelog.js';
import ChangelogValidationError from './changelogValidationError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Changelog', () => {
  let changelog;
  const REPOSITORY = 'owner/repo';
  const changelogOptions = fileName => ({
    changelogPath: path.resolve(__dirname, `./fixtures/${fileName}`),
    repository: REPOSITORY,
  });

  describe('#releaseType', () => {
    context('with a properly formed changelog', () => {
      it('returns the correct release type', () => {
        changelog = new Changelog(changelogOptions('changelog.md'));
        expect(changelog.releaseType).to.equal('major');
      });
    });

    context('when "Unreleased" section does not exist', () => {
      it('returns null', () => {
        changelog = new Changelog(changelogOptions('changelog-without-unreleased.md'));
        expect(changelog.releaseType).to.be.null;
      });
    });

    context('when "Unreleased" section has a malformed release type', () => {
      it('returns null', () => {
        changelog = new Changelog(changelogOptions('changelog-with-unreleased-malformed.md'));
        expect(changelog.releaseType).to.be.null;
      });
    });
  });

  describe('#getVersionContent', () => {
    context('when getting an existing version', () => {
      it('returns the content of the specified version', () => {
        changelog = new Changelog(changelogOptions('changelog.md'));
        const versionContent = changelog.getVersionContent('0.0.1');

        expect(versionContent).to.equal(`## 0.0.1 - 2024-02-20

_Full changeset and discussions: [#122](https://github.com/owner/repo/pull/122)._

> Development of this release was made on a volunteer basis by a contributor.

### Added

- Initial release`);
      });
    });

    context('when getting a non-existing version', () => {
      it('throws an error', () => {
        expect(() => changelog.getVersionContent('2.0.0')).to.throw(Error);
      });
    });
  });

  describe('#cleanUnreleased', () => {
    context('when "Unreleased" section exists', () => {
      it('removes the section', () => {
        changelog = new Changelog(changelogOptions('changelog-with-unreleased-no-release.md'));
        changelog.cleanUnreleased();
        const updatedChangelog = changelog.toString();

        expect(updatedChangelog).to.not.include('## Unreleased');
      });
    });

    context('when "Unreleased" section does not exist', () => {
      it('does not throw any error', () => {
        changelog = new Changelog(changelogOptions('changelog-without-unreleased.md'));
        expect(() => changelog.cleanUnreleased()).to.not.throw();
      });
    });
  });

  describe('#release', () => {
    context('with a properly formed changelog', () => {
      it('returns an updated version of the changelog', async () => {
        changelog = new Changelog(changelogOptions('changelog.md'));
        const result = changelog.release(123);
        let expectedResult = await fs.readFile(path.resolve(__dirname, './fixtures/changelog-released.md'), 'UTF-8');

        expectedResult = expectedResult.replace('<DATE_OF_THE_DAY_PLACEHOLDER>', `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`);
        expect(changelog.toString()).to.equal(expectedResult);
        expect(result).to.have.property('version');
        expect(result).to.have.property('content');
      });
    });

    context('when release type is no-release', () => {
      it('removes the "Unreleased" section without updating the version', () => {
        changelog = new Changelog(changelogOptions('changelog-with-unreleased-no-release.md'));
        const result = changelog.release();

        const updatedChangelog = changelog.toString();

        expect(updatedChangelog).to.not.include('## Unreleased');
        expect(result).to.be.empty;
      });
    });

    context('when there is a validation error on the "Unreleased" section', () => {
      it('throws an error', () => {
        changelog = new Changelog(changelogOptions('changelog-without-unreleased.md'));
        expect(() => changelog.release(124)).to.throw(Error, 'Missing "Unreleased" section');
      });
    });
  });

  describe('#validateUnreleased', () => {
    context('with a properly formed "Unreleased" section', () => {
      it('does not throw any error', () => {
        changelog = new Changelog(changelogOptions('changelog.md'));
        expect(() => changelog.validateUnreleased()).to.not.throw();
      });
    });

    context('when "Unreleased" section is missing', () => {
      it('throws a ChangelogValidationError error with proper message', () => {
        changelog = new Changelog(changelogOptions('changelog-without-unreleased.md'));
        expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Missing "Unreleased" section');
      });
    });

    context('when release type is invalid or missing', () => {
      it('throws a ChangelogValidationError error with proper message', () => {
        changelog = new Changelog(changelogOptions('changelog-with-unreleased-malformed.md'));
        expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Invalid or missing release type for "Unreleased" section. Please ensure the section contains a valid release type (major, minor, patch or no-release)');
      });
    });

    context('when funder is missing', () => {
      it('throws a ChangelogValidationError error with proper message', () => {
        changelog = new Changelog(changelogOptions('changelog-without-funder.md'));
        expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Missing funder in the "Unreleased" section');
      });
    });

    context('when changes are missing or malformed', () => {
      it('throws a ChangelogValidationError error with proper message', () => {
        changelog = new Changelog(changelogOptions('changelog-without-changes.md'));
        expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Missing or malformed changes in the "Unreleased" section');
      });
    });

    context('when no-release signature is missing', () => {
      it('throws a ChangelogValidationError error with proper message', () => {
        changelog = new Changelog(changelogOptions('changelog-without-no-release-signature.md'));
        expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Missing no release signature');
      });
    });
  });

  describe('Custom regex and template options', () => {
    context('when custom noReleaseSignatureRegex is provided', () => {
      it('uses the custom regex for validation', () => {
        const customNoReleaseSignatureRegex = /^_No functional changes made._$/m;

        changelog = new Changelog({ ...changelogOptions('changelog-with-custom-no-release-signature.md'), noReleaseSignatureRegex: customNoReleaseSignatureRegex });
        expect(() => changelog.validateUnreleased()).to.not.throw();
      });
    });

    context('when custom funderRegex is provided', () => {
      it('uses the custom regex for validation', () => {
        const customFunderRegex = /^> This release was sponsored by (.+)\.$/m;

        changelog = new Changelog({ ...changelogOptions('changelog-with-custom-funder.md'), funderRegex: customFunderRegex });
        expect(() => changelog.validateUnreleased()).to.not.throw();
      });
    });

    context('when custom intro is provided', () => {
      it('uses the custom intro in the changelog', () => {
        const customIntro = 'This is a custom changelog intro.';

        changelog = new Changelog({ ...changelogOptions('changelog.md'), intro: customIntro });
        expect(changelog.changelog.description).to.equal(customIntro);
      });
    });

    context('when custom changesetLinkTemplate is provided', () => {
      it('uses the custom template for generating changeset links', () => {
        const customChangesetLinkTemplate = '_Changeset: [#PULL_REQUEST_NUMBER](https://REPOSITORY/pull/PULL_REQUEST_NUMBER)._';

        changelog = new Changelog({ ...changelogOptions('changelog-without-changeset-link.md'), changesetLinkTemplate: customChangesetLinkTemplate });
        const pullRequestNumber = 12;
        const { content } = changelog.release(pullRequestNumber);

        expect(content).to.include(`_Changeset: [#${pullRequestNumber}](https://${REPOSITORY}/pull/${pullRequestNumber})._`);
      });
    });
  });
});
