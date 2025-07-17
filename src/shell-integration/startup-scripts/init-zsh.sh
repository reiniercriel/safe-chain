
function installIfCommandNotFound() {
  local cmd="$1"
  
  # Check if the command already exists
  if command -v "$cmd" > /dev/null 2>&1; then
    return 0
  fi
  
  # Check if Node.js version is below 18
  # Safe-chain requires Node.js 18 or higher
  local node_version=$(node -v | sed 's/v//' | cut -d'.' -f1)
  if [ "$node_version" -lt 18 ]; then
    return 2
  fi
  
  # Command not found, ask user if they want to install safe-chain
  printf "The command '%s' is not available. Do you want to install safe-chain to provide it? (y/N): " "$cmd"
  read -r response
  
  if [[ "$response" =~ ^[Yy]$ ]]; then
    printf "Installing safe-chain...\n"
    installSafeChain
    
    if [ $? -ne 0 ]; then
      printf "\nFailed to install safe-chain. Exiting.\n"
      return 1
    fi
    
    return 0
  else
    printf "Skipping safe-chain installation. Using original command instead.\n"
    return 2
  fi
}

function installSafeChain() {
  command npm install -g @aikidosec/safe-chain
  
  if [ $? -ne 0 ]; then
    return 1
  fi

  printf "------\n"
}

function wrapCommand() {
  local original_cmd="$1"
  local aikido_cmd="$2"

  # Remove the first 2 arguments (original_cmd and aikido_cmd) from $@
  # so that "$@" now contains only the arguments passed to the original command
  shift 2
  
  installIfCommandNotFound "$aikido_cmd"
  local install_result=$?
  if [ $install_result -eq 2 ]; then
    command "$original_cmd" "$@"
  else
    "$aikido_cmd" "$@"
  fi
}

function npx() {
  wrapCommand "npx" "aikido-npx" "$@"
}

function yarn() {
  wrapCommand "yarn" "aikido-yarn" "$@"
}

function npm() {
  if [[ "$1" == "-v" || "$1" == "--version" ]] && [[ $# -eq 1 ]]; then
    # If args is just -v or --version and nothing else, just run the npm version command
    # This is because nvm uses this to check the version of npm
    command npm "$@"
    return
  fi

  wrapCommand "npm" "aikido-npm" "$@"
}
