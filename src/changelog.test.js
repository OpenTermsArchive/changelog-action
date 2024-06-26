import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { expect } from 'chai';
import sinon from 'sinon';

import Changelog from './changelog.js';
import ChangelogValidationError from './changelogValidationError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Changelog', () => {
  let changelog;
  const changelogOptions = fileName => ({ changelogPath: path.resolve(__dirname, `./fixtures/${fileName}`) });

  before(() => {
    sinon.stub(fs, 'writeFileSync');
  });

  after(() => {
    sinon.restore();
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

  describe('#release', () => {
    const generatedDate = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getDate()).padStart(2, '0')}`;
    const expectedVersion = '1.0.0';
    const expectedContent = `## 1.0.0 - ${generatedDate}

_Full changeset and discussions: [#123](https://github.com/owner/repo/pull/123)._

> Development of this release was supported by a funder.

### Added

- New feature 1`;

    context('with a properly formed changelog', () => {
      it('returns an updated version of the changelog', () => {
        changelog = new Changelog(changelogOptions('changelog.md'));
        let expectedResult = fs.readFileSync(path.resolve(__dirname, './fixtures/changelog-released.md'), 'UTF-8');
        const result = changelog.release('Full changeset and discussions: [#123](https://github.com/owner/repo/pull/123).');

        expectedResult = expectedResult.replace('<DATE_OF_THE_DAY_PLACEHOLDER>', generatedDate);
        expect(changelog.toString()).to.equal(expectedResult);
        expect(result).to.have.property('version').that.is.equal(expectedVersion);
        expect(result).to.have.property('content').that.is.equal(expectedContent);
      });
    });

    context('with a changelog without intro', () => {
      it('returns an updated version of the changelog withtout default introduction', () => {
        changelog = new Changelog(changelogOptions('changelog-without-intro.md'));
        let expectedResult = fs.readFileSync(path.resolve(__dirname, './fixtures/changelog-without-intro-released.md'), 'UTF-8');
        const result = changelog.release('Full changeset and discussions: [#123](https://github.com/owner/repo/pull/123).');

        expectedResult = expectedResult.replace('<DATE_OF_THE_DAY_PLACEHOLDER>', generatedDate);
        expect(changelog.toString()).to.equal(expectedResult);
        expect(result).to.have.property('version').that.is.equal(expectedVersion);
        expect(result).to.have.property('content').that.is.equal(expectedContent);
      });
    });

    context('when release type is no-release', () => {
      it('removes the "Unreleased" section without updating the version', () => {
        changelog = new Changelog(changelogOptions('changelog-with-unreleased-no-release.md'));
        const result = changelog.release();

        const updatedChangelog = changelog.toString();

        expect(updatedChangelog).to.not.include('## Unreleased');
        expect(result).to.have.property('version').that.is.undefined;
        expect(result).to.have.property('content').that.is.undefined;
      });
    });

    context('when "Unreleased" section does not exist', () => {
      it('does not throw any error', () => {
        changelog = new Changelog(changelogOptions('changelog-without-unreleased.md'));
        expect(() => changelog.release()).to.not.throw();
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
        expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, `Invalid or missing release type for "Unreleased" section. Please ensure the section contains a valid release type (major, minor, patch or ${Changelog.NO_RELEASE_TAG})`);
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

    context('when custom noReleaseSignatureRegex is provided', () => {
      context('with valid changelog', () => {
        it('does not throw any error', () => {
          const customNoReleaseSignatureRegex = /^_No functional changes made._$/m;

          changelog = new Changelog({ ...changelogOptions('changelog-with-unreleased-no-release.md'), noReleaseSignatureRegex: customNoReleaseSignatureRegex });
          expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Missing no release signature');
        });
      });
      context('with invalid changelog', () => {
        it('throws a ChangelogValidationError error with proper message', () => {
          const customNoReleaseSignatureRegex = /^_No functional changes made._$/m;

          changelog = new Changelog({ ...changelogOptions('changelog-with-unreleased-no-release.md'), noReleaseSignatureRegex: customNoReleaseSignatureRegex });
          expect(() => changelog.validateUnreleased()).to.throw(ChangelogValidationError, 'Missing no release signature');
        });
      });
    });

    context('when custom fundersRegex is provided', () => {
      context('with valid changelog', () => {
        it('does not throw any error', () => {
          const customfundersRegex = /^> This release was sponsored by (.+)\.$/m;

          changelog = new Changelog({ ...changelogOptions('changelog-with-custom-funder.md'), fundersRegex: customfundersRegex });
          expect(() => changelog.validateUnreleased()).to.not.throw();
        });
      });

      context('with invalid changelog', () => {
        it('throws a ChangelogValidationError error with proper message', () => {
          const customfundersRegex = /^> This release was sponsored by (.+)\.$/m;

          changelog = new Changelog({ ...changelogOptions('changelog.md'), fundersRegex: customfundersRegex });
          expect(() => changelog.validateUnreleased()).to.throw('Missing funder in the "Unreleased" section');
        });
      });
    });

    context('when fundersRegex is explicitly set to false', () => {
      it('skips the funder validation', () => {
        changelog = new Changelog({ ...changelogOptions('changelog-without-funder.md'), fundersRegex: false });
        expect(() => changelog.validateUnreleased()).to.not.throw('Missing funder in the "Unreleased" section');
      });
    });

    context('when noReleaseSignatureRegex is explicitly set to false', () => {
      it('skips the no-release signature validation', () => {
        changelog = new Changelog({ ...changelogOptions('changelog-without-no-release-signature.md'), noReleaseSignatureRegex: false });
        expect(() => changelog.validateUnreleased()).to.not.throw('Missing no release signature');
      });
    });
  });

  describe('#getNextVersion', () => {
    context('with a properly formed "Unreleased" section', () => {
      it('returns the computed next version', () => {
        changelog = new Changelog(changelogOptions('changelog.md'));
        expect(changelog.getNextVersion()).to.equal('1.0.0');
      });
    });

    context('without "Unreleased" section', () => {
      it('returns the current latest version', () => {
        changelog = new Changelog(changelogOptions('changelog-without-unreleased.md'));
        expect(changelog.getNextVersion()).to.equal(null);
      });
    });

    context('with no-release "Unreleased" section', () => {
      it('returns the current latest version', () => {
        changelog = new Changelog(changelogOptions('changelog-with-unreleased-no-release.md'));
        expect(changelog.getNextVersion()).to.equal('0.0.1');
      });
    });
  });
});
