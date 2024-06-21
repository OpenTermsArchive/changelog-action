# Changelog

All changes that impact users of this module are documented in this file, in the [Common Changelog](https://common-changelog.org) format with some additional specifications defined in the CONTRIBUTING file. This codebase adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## Unreleased [minor]

### Fixed

- Prevent the insertion of the default changelog introduction when it is not present with the `release` action
- Return only the version content rather than the entire changelog content as `content` output of the `release` action

### Added

- Expose `next-version` in `validate` action output

## 0.3.0 - 2024-06-21

_Full changeset and discussions: [#10](https://github.com/OpenTermsArchive/changelog-action/pull/10)._

> Development of this release was supported by the [French DINUM’s Opérateur de produits interministériels](https://numerique.gouv.fr) and the European Union under [grant n°101121918](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/projects-details/43152860/101121918/DIGITAL) through the [GovTech4All](https://joinup.ec.europa.eu/collection/govtechconnect/govtech4all) consortium.

### Added

- **Breaking:** Disable funders validation by default
- Add `funders` option to the `validate` action, allowing users to enable, disable, or provide a custom JavaScript Regex for validation
- Add `no-release-signature` option to the `validate` action, allowing users to enable, disable, or provide a custom JavaScript Regex for validation
- Add `notice` option to the `release` action, allowing users to provide a custom release notice string

## 0.2.0 - 2024-06-19

_Full changeset and discussions: [#5](https://github.com/OpenTermsArchive/changelog-action/pull/5)._

> Development of this release was supported by the [French DINUM’s Opérateur de produits interministériels](https://numerique.gouv.fr) and the European Union under [grant n°101121918](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/projects-details/43152860/101121918/DIGITAL) through the [GovTech4All](https://joinup.ec.europa.eu/collection/govtechconnect/govtech4all) consortium.

### Changed

- **Breaking:** Change no-release default signature

## 0.1.0 - 2024-06-19

_Full changeset and discussions: [#3](https://github.com/OpenTermsArchive/changelog-action/pull/3)._

> Development of this release was supported by the [French DINUM’s Opérateur de produits interministériels](https://numerique.gouv.fr) and the European Union under [grant n°101121918](https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/projects-details/43152860/101121918/DIGITAL) through the [GovTech4All](https://joinup.ec.europa.eu/collection/govtechconnect/govtech4all) consortium.

### Added

- Create validate action
- Create release action
