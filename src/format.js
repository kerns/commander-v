const { relativePath } = require('./files');

function wrapCodeBlock(content) {
  const runs = content.match(/`+/g) ?? [];
  const length = runs.reduce((max, run) => Math.max(max, run.length + 1), 3);
  const fence = '`'.repeat(length);
  return `${fence}\n${content}\n${fence}`;
}

function formatTreeOutput(trees, config) {
  const content = trees.map(tree => tree.replace(/\n$/, '')).join('\n\n');
  if (!content) return '';
  return config.wrapTreeInCodeBlock || config.wrapInCodeBlock ? wrapCodeBlock(content) : content;
}

function formatOutput(groups, files, trees, config) {
  const labels = new Map();
  for (const group of groups) {
    for (const file of group.files) {
      const relative = relativePath(group.root, file.uri);
      labels.set(file.uri.toString(), groups.length > 1 ? `${group.name}/${relative}` : relative);
    }
  }
  const contents = files.map(file => {
    const label = labels.get(file.uri.toString());
    // Function replacement keeps literal '$&' in filenames intact.
    const begin = config.commentAtFileBegin.replaceAll('$file', () => label);
    const end = config.commentAtFileEnd.replaceAll('$file', () => label);
    return `${begin}\n${file.content}\n${end}`;
  });
  const separator = config.includeSeparator ? `\n${config.separatorCharacter.repeat(config.separatorLength)}\n\n` : '\n\n';
  // An outer payload fence already preserves the tree; avoid nested fences.
  const tree = formatTreeOutput(trees, config.wrapInCodeBlock
    ? { ...config, wrapInCodeBlock: false, wrapTreeInCodeBlock: false } : config);
  let result = [tree, ...contents].filter(Boolean).join(separator);
  if (config.wrapInCodeBlock) {
    result = wrapCodeBlock(result);
  }
  return result;
}

module.exports = { formatOutput, formatTreeOutput };
