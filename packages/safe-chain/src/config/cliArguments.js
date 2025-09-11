const state = {
  malwareAction: undefined,
};

const SAFE_CHAIN_ARG_PREFIX = "--safe-chain-";

export function initializeCliArguments(args) {
  // Reset state on each call
  state.malwareAction = undefined;

  const safeChainArgs = [];
  const remainingArgs = [];

  for (const arg of args) {
    if (arg.startsWith(SAFE_CHAIN_ARG_PREFIX)) {
      safeChainArgs.push(arg);

      if (arg.startsWith(SAFE_CHAIN_ARG_PREFIX + "malware-action=")) {
        state.malwareAction = arg.substring(
          (SAFE_CHAIN_ARG_PREFIX + "malware-action=").length
        );
      }
    } else {
      remainingArgs.push(arg);
    }
  }

  return remainingArgs;
}

export function getMalwareAction() {
  return state.malwareAction;
}
