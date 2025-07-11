# Aikido Safe Chain

The Aikido Safe Chain **prevents developers from installing malware** on their workstations through npm, npx, or yarn.

The Aikido Safe Chain wraps around the [npm cli](https://github.com/npm/cli), [npx](https://github.com/npm/cli/blob/latest/docs/content/commands/npx.md), and [yarn](https://yarnpkg.com/) to provide extra checks before installing new packages. This tool will detect when a package contains malware and prompt you to exit, preventing npm, npx, or yarn from downloading or running the malware.

![demo](https://aikido-production-staticfiles-public.s3.eu-west-1.amazonaws.com/safe-pkg.gif)

Aikido Safe Chain works on Node.js version 18 and above and supports the following package managers:

- ✅ **npm**
- ✅ **npx**
- ✅ **yarn**
- 🚧 **pnpm** Coming soon

# Usage

## Installation

Installing the Aikido Safe Chain is easy. You just need 3 simple steps:

1. **Install the Aikido Safe Chain package globally** using npm:
   ```shell
   npm install -g @aikidosec/safe-chain
   ```
2. **Setup the shell integration** by running:
   ```shell
   safe-chain setup
   ```
3. **❗Restart your terminal** to start using the Aikido Safe Chain.
   - This step is crucial as it ensures that the shell aliases for npm, npx, and yarn are loaded correctly. If you do not restart your terminal, the aliases will not be available.
4. **Verify the installation** by running:
   ```shell
   npm install eslint-js
   ```
   - The output should show that Aikido Safe Chain is blocking the installation of this package as it is flagged as malware.

When running `npm`, `npx`, or `yarn` commands, the Aikido Safe Chain will automatically check for malware in the packages you are trying to install. If any malware is detected, it will prompt you to exit the command.

## How it works

The Aikido Safe Chain works by intercepting the npm, npx, and yarn commands and verifying the packages against **[Aikido Intel - Open Sources Threat Intelligence](https://intel.aikido.dev/?tab=malware)**.

The Aikido Safe Chain integrates with your shell to provide a seamless experience when using npm, npx, and yarn commands. It sets up aliases for these commands so that they are wrapped by the Aikido Safe Chain commands, which perform malware checks before executing the original commands. We currently support:

- ✅ **Bash**
- ✅ **Zsh**
- ✅ **Fish**
- ✅ **PowerShell**
- ✅ **PowerShell Core**

More information about the shell integration can be found in the [shell integration documentation](docs/shell-integration.md).

## Uninstallation

To uninstall the Aikido Safe Chain, you can run the following command:

1. **Remove all aliases from your shell** by running:
   ```shell
   safe-chain teardown
   ```
2. **Uninstall the Aikido Safe Chain package** using npm:
   ```shell
   npm uninstall -g @aikidosec/safe-chain
   ```
3. **❗Restart your terminal** to remove the aliases.

# Usage in CI/CD

🚧 Support for CI/CD environments is coming soon...
