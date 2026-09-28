const path = require('node:path');
const fs = require('node:fs/promises');
const properties = require('../package.json').contributes.configuration.properties;

function validateConfiguration(values) {
  const config = {};
  for (const [id, schema] of Object.entries(properties)) {
    const key = id.slice('commanderV.'.length);
    const value = values[key] ?? schema.default;
    const validType = schema.type === 'integer' ? Number.isInteger(value) : typeof value === schema.type;
    if (!validType || (schema.minimum !== undefined && value < schema.minimum) ||
      (schema.maximum !== undefined && value > schema.maximum) ||
      (schema.maxLength !== undefined && value.length > schema.maxLength) ||
      (schema.enum && !schema.enum.includes(value))) {
      throw new Error(`Invalid Commander V setting: ${key}`);
    }
    config[key] = value;
  }
  return config;
}

async function loadLocalConfiguration(root, trusted) {
  if (!root || root.scheme !== 'file' || !trusted) return {};
  const configPath = path.join(root.fsPath, 'v.config.js');
  try { await fs.access(configPath); } catch (error) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
  // Reload on each command; syntax and nested import errors must be reported.
  delete require.cache[require.resolve(configPath)];
  const local = require(configPath);
  if (!local || typeof local !== 'object' || Array.isArray(local)) throw new Error('v.config.js must export a configuration object');
  return local;
}

async function fetchConfiguration(api, uri) {
  const global = api.workspace.getConfiguration('commanderV', uri);
  const values = {};
  for (const id of Object.keys(properties)) {
    const key = id.slice('commanderV.'.length);
    values[key] = global.get(key);
  }
  const root = api.workspace.getWorkspaceFolder(uri)?.uri;
  return validateConfiguration({ ...values, ...await loadLocalConfiguration(root, api.workspace.isTrusted) });
}

module.exports = { fetchConfiguration, validateConfiguration, loadLocalConfiguration };
