const path = require('node:path');
const { execFile } = require('node:child_process');

function soundCommand(platform, soundPath) {
  if (platform === 'darwin') return ['/usr/bin/afplay', [soundPath]];
  if (platform === 'win32') return ['powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', `(New-Object System.Media.SoundPlayer '${soundPath.replaceAll("'", "''")}').PlaySync()`]];
  return ['paplay', [soundPath]];
}

function playSound(api) {
  // Audio on an SSH/container host would play in the wrong place.
  if (api.env.remoteName) return;
  const [command, args] = soundCommand(process.platform, path.join(__dirname, 'success.wav'));
  execFile(command, args, { timeout: 5000, windowsHide: true }, error => {
    if (error) console.warn('Commander V: optional completion sound unavailable:', error.message);
  });
}

function showSuccess(api, count, chars, skipped, sound) {
  const suffix = skipped ? ` (${skipped} excluded, binary, linked, or unsupported items skipped)` : '';
  return showNotification(api, `✌️ Commander copied ${count} ${count === 1 ? 'file' : 'files'} (${chars} chars) to your clipboard${suffix}`, sound);
}

function showTreeSuccess(api, count, chars, sound) {
  return showNotification(api, `🌳 Commander copied ${count} project ${count === 1 ? 'tree' : 'trees'} (${chars} chars) to your clipboard`, sound);
}

function showNotification(api, message, sound) {
  const notification = api.window.showInformationMessage(message, 'Manage Extension')
    .then(action => action === 'Manage Extension' && api.commands.executeCommand('extension.open', 'kerns.commander-v'));
  if (sound) playSound(api);
  return Promise.resolve(notification).catch(error => console.warn('Commander V: could not open extension details:', error.message));
}

module.exports = { showSuccess, showTreeSuccess, soundCommand };
