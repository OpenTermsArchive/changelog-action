import fs from 'fs/promises';
import path from 'path';

import core from '@actions/core';
import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import sinon from 'sinon';

import Changelog from './changelog.js';
import { run, AVAILABLE_ACTIONS } from './main.js';

chai.use(chaiAsPromised);
describe('main', () => {
  let coreStubs;
  let changelogStubs;
  let writeFileStub;

  beforeEach(() => {
    coreStubs = {
      getBooleanInput: sinon.stub(core, 'getBooleanInput'),
      getInput: sinon.stub(core, 'getInput'),
      setOutput: sinon.stub(core, 'setOutput'),
    };

    coreStubs.getInput.withArgs('changelogPath').returns('./src/fixtures/changelog.md');

    changelogStubs = {
      getVersionContent: sinon.stub(Changelog.prototype, 'getVersionContent'),
      validateUnreleased: sinon.stub(Changelog.prototype, 'validateUnreleased'),
      release: sinon.stub(Changelog.prototype, 'release'),
      cleanUnreleased: sinon.stub(Changelog.prototype, 'cleanUnreleased'),
      toString: sinon.stub(Changelog.prototype, 'toString'),
    };

    writeFileStub = sinon.stub(fs, 'writeFile');
  });

  afterEach(() => {
    sinon.restore();
  });

  context('getReleaseType', () => {
    it('shoutodo', async () => {
      coreStubs.getInput.withArgs('action').returns(AVAILABLE_ACTIONS.GET_RELEASE_TYPE);

      await run();

      expect(coreStubs.setOutput.lastCall.firstArg).to.equal('type');
      expect(coreStubs.setOutput.lastCall.lastArg).to.equal('major');
    });
  });

  context('getVersionContent', () => {
    it('todo', async () => {
      coreStubs.getInput.withArgs('action').returns(AVAILABLE_ACTIONS.GET_VERSION_CONTENT);
      coreStubs.getInput.withArgs('version').returns('0.0.1');

      await run();
      expect(changelogStubs.getVersionContent.calledOnce).to.be.true;
      expect(changelogStubs.getVersionContent.lastCall.firstArg).to.equal('0.0.1');
      expect(coreStubs.setOutput.lastCall.firstArg).to.equal('content');
    });
  });

  context('release', () => {
    it('todo', async () => {
      coreStubs.getInput.withArgs('action').returns(AVAILABLE_ACTIONS.RELEASE);
      coreStubs.getInput.withArgs('PRNumber').returns('5');

      changelogStubs.toString.returns('content');

      await run();
      expect(changelogStubs.release.calledOnce).to.be.true;
      expect(changelogStubs.release.lastCall.firstArg).to.equal('5');
      expect(writeFileStub.calledOnceWith(path.join(process.cwd(), './src/fixtures/changelog.md'), 'content', 'UTF-8')).to.be.true;
    });
  });

  context('CLEAN_UNRELEASED', () => {
    it('todo', async () => {
      coreStubs.getInput.withArgs('action').returns(AVAILABLE_ACTIONS.CLEAN_UNRELEASED);

      changelogStubs.toString.returns('content');

      await run();
      expect(changelogStubs.cleanUnreleased.calledOnce).to.be.true;
      expect(writeFileStub.calledOnceWith(path.join(process.cwd(), './src/fixtures/changelog.md'), 'content', 'UTF-8')).to.be.true;
    });
  });

  context('VALIDATE', () => {
    it('todo', async () => {
      coreStubs.getInput.withArgs('action').returns(AVAILABLE_ACTIONS.VALIDATE);

      await run();
      expect(changelogStubs.validateUnreleased.calledOnce).to.be.true;
    });
  });

  context('VALIDATE with invalid changelog', () => {
    it('todo', async () => {
      coreStubs.getInput.withArgs('changelogPath').returns('./src/fixtures/changelog-with-changes-malformed.md');
      coreStubs.getInput.withArgs('action').returns(AVAILABLE_ACTIONS.VALIDATE);
      changelogStubs.validateUnreleased.throws('Invalid changelog');

      await expect(run()).to.be.rejectedWith('Invalid changelog');
      expect(changelogStubs.validateUnreleased.calledOnce).to.be.true;
    });
  });
});
