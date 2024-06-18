import core from '@actions/core';
import { expect } from 'chai';
import sinon from 'sinon';

import main from './main.js';

// Mock the GitHub Actions core library
let debugMock; let getInputMock; let setFailedMock; let setOutputMock; let
  runMock;

// Other utilities
const timeRegex = /^\d{2}:\d{2}:\d{2}/;

describe('action', () => {
  beforeEach(() => {
    debugMock = sinon.stub(core, 'debug');
    getInputMock = sinon.stub(core, 'getInput');
    setFailedMock = sinon.stub(core, 'setFailed');
    setOutputMock = sinon.stub(core, 'setOutput');
    runMock = sinon.stub(main, 'run');
  });

  afterEach(() => {
    sinon.restore();
  });

  it('sets the time output', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.callsFake(name => {
      switch (name) {
      case 'milliseconds':
        return '500';
      default:
        return '';
      }
    });

    await main.run();
    expect(runMock.called).to.be.true;

    // Verify that all of the core library functions were called correctly
    expect(debugMock.getCall(0).args[0]).to.equal('Waiting 500 milliseconds ...');
    expect(debugMock.getCall(1).args[0]).to.match(timeRegex);
    expect(debugMock.getCall(2).args[0]).to.match(timeRegex);
    expect(setOutputMock.getCall(0).args[0]).to.equal('time');
    expect(setOutputMock.getCall(0).args[1]).to.match(timeRegex);
  });

  it('sets a failed status', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.callsFake(name => {
      switch (name) {
      case 'milliseconds':
        return 'this is not a number';
      default:
        return '';
      }
    });

    await main.run();
    expect(runMock.called).to.be.true;

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock.getCall(0).args[0]).to.equal('milliseconds not a number');
  });

  it('fails if no input is provided', async () => {
    // Set the action's inputs as return values from core.getInput()
    getInputMock.callsFake(name => {
      switch (name) {
      case 'milliseconds':
        throw new Error('Input required and not supplied: milliseconds');
      default:
        return '';
      }
    });

    await main.run();
    expect(runMock.called).to.be.true;

    // Verify that all of the core library functions were called correctly
    expect(setFailedMock.getCall(0).args[0]).to.equal('Input required and not supplied: milliseconds');
  });
});
