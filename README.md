# GitHub Actions for Changelog Management

This repository contains two GitHub Actions to manage and validate your project's changelog. These actions help automate the process of validating changelog entries and releasing new versions based on changelog content.

## Actions

### 1. Validate Changelog

This action validates the `Unreleased` section of the changelog and extracts the declared release type.

#### Usage example

Inside your workflow file:

```yaml
# .github/workflows/changelog.yml
name: Changelog

on:
  pull_request:
  workflow_call:
    outputs:
      release-type:
        description: The release type extracted from changelog
        value: ${{ jobs.validate_changelog.outputs.release-type }}

jobs:
  validate_changelog:
    runs-on: [ ubuntu-latest ]
    outputs:
      release-type: ${{ steps.validate-changelog.outputs.release-type }}
    steps:
      - uses: actions/checkout@v4

      - name: Validate changelog
        id: validate-changelog
        uses: OpenTermsArchive/manage-changelog/validate@v1
```

#### Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| path | Path to the changelog file | No | `./CHANGELOG.md` |

#### Outputs

| Name | Description |
|------|-------------|
| release-type | The release type extracted from the changelog |

### 2. Release Changelog

This action releases the `Unreleased` section of the changelog and extracts the computed version and the content of that release.

#### Usage example

Inside your workflow file:

```yaml
# .github/workflows/release.yml
name: Release

on:
  push:
    branches: [ main ]

jobs:
  changelog:
    uses: "./.github/workflows/changelog.yml"
  release:
    if: needs.changelog.outputs.release-type != 'no-release'
    needs: [ changelog ]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git author
        run: |
          git config --global user.name "Open Terms Archive Release Bot"
          git config --global user.email "release-bot@opentermsarchive.org"

      - name: Release changelog
        id: release-changelog
        uses: OpenTermsArchive/manage-changelog/release@v1

      - name: Bump package version
        run: npm --no-git-tag-version version ${{ steps.release-changelog.outputs.version }}

      - name: Commit CHANGELOG.md and package.json changes and create tag
        run: |
          git add "package.json" "package-lock.json" "CHANGELOG.md"
          git commit -m "Release ${{ steps.release-changelog.outputs.version }}"
          git tag v${{ steps.release-changelog.outputs.version }}

      - name: Push changes to repository
        run: git push origin && git push --tags

      - name: Create GitHub release
        uses: softprops/action-gh-release@v1
        with:
          tag_name: v${{ steps.release-changelog.outputs.version }}
          body: ${{ steps.release-changelog.outputs.content }}
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Publish to NPM public repository
        uses: JS-DevTools/npm-publish@v1
        with:
          token: ${{ secrets.NPMJS_ACCESS_TOKEN }}

  clean_changelog:
    if: needs.changelog.outputs.release-type == 'no-release'
    needs: [ changelog ]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}

      - name: Configure Git author
        run: |
          git config --global user.name "Open Terms Archive Release Bot"
          git config --global user.email "release-bot@opentermsarchive.org"

      - name: Release changelog
        uses: OpenTermsArchive/manage-changelog/release@v1

      - name: Erase unreleased information from changelog
        run: |
          git commit -m "Clean changelog" CHANGELOG.md
          git push origin

```

#### Inputs

| Name | Description | Required | Default |
|------|-------------|----------|---------|
| path | Path to the changelog file | No | `./CHANGELOG.md` |

#### Outputs

| Name | Description |
|------|-------------|
| version | The version number extracted from the changelog |
| content | The content of the release extracted from the changelog |

## License

The code for this software is distributed under the [European Union Public Licence (EUPL) v1.2](https://joinup.ec.europa.eu/collection/eupl/eupl-text-eupl-12). In short, this [means](https://choosealicense.com/licenses/eupl-1.2/) you are allowed to read, use, modify and redistribute this source code, as long as you as you credit “Open Terms Archive Contributors” and make available any change you make to it under similar conditions.

Contact the core team over email at `contact@[project name without spaces].org` if you have any specific need or question regarding licensing.
