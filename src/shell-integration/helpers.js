const knownAikidoTools = [
  { tool: "npm", aikidoCommand: "aikido-npm" },
  { tool: "npx", aikidoCommand: "aikido-npx" },
  { tool: "yarn", aikidoCommand: "aikido-yarn" },
  { tool: "pnpm", aikidoCommand: "aikido-pnpm" },
  { tool: "pnpx", aikidoCommand: "aikido-pnpx" },
  // When adding a new tool here, also update the expected alias in the tests (setup.spec.js, teardown.spec.js)
  // and add the documentation for the new tool in the README.md
];

export function getAliases(fileName) {
  const fileExtension = fileName.split(".").pop().toLowerCase();

  let createAlias = pickCreateAliasFunction(fileExtension);

  const aliases = knownAikidoTools.map(({ tool, aikidoCommand }) =>
    createAlias(tool, aikidoCommand)
  );

  return aliases;
}

function pickCreateAliasFunction(fileExtension) {
  let createAlias;
  switch (fileExtension) {
    case "ps1":
      createAlias = createGeneralPowershellAlias;
      break;
    case "fish":
      createAlias = createGeneralFishAlias;
      break;
    default:
      createAlias = createGeneralPosixAlias;
  }
  return createAlias;
}

function createGeneralPosixAlias(tool, aikidoCommand) {
  return `alias ${tool}='${aikidoCommand}'`;
}
function createGeneralPowershellAlias(tool, aikidoCommand) {
  return `Set-Alias ${tool} ${aikidoCommand}`;
}
function createGeneralFishAlias(tool, aikidoCommand) {
  return `alias ${tool} "${aikidoCommand}"`;
}
