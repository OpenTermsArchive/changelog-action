const { execSync } = require('child_process');
const core = require('@actions/core');

try {
  const command = core.getInput('command');
  const prNumber = core.getInput('pr_number');
  const version = core.getInput('version');

  let cmd = `changelog ${command}`;
  if (prNumber) {
    cmd += ` ${prNumber}`;
  }
  if (version) {
    cmd += ` ${version}`;
  }

  console.log(`Executing command: ${cmd}`);
  const output = execSync(cmd, { encoding: 'utf-8' });
  console.log(output);

} catch (error) {
  core.setFailed(`Action failed with error ${error}`);
}
