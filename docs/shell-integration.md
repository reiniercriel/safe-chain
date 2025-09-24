# Shell Integration

## Overview

The shell integration automatically wraps common package manager commands (`npm`, `npx`, `yarn`, `pnpm`, `pnpx`) with Aikido's security scanning functionality. This is achieved by sourcing startup scripts that define shell functions to wrap these commands with their Aikido-protected equivalents.

## Supported Shells

Aikido Safe Chain supports integration with the following shells.

| Shell                  | Startup File                 |
| ---------------------- | ---------------------------- |
| **Bash**               | `~/.bashrc`                  |
| **Zsh**                | `~/.zshrc`                   |
| **Fish**               | `~/.config/fish/config.fish` |
| **PowerShell Core**    | `$PROFILE`                   |
| **Windows PowerShell** | `$PROFILE`                   |

## Setup Commands

### Setup Shell Integration

```bash
safe-chain setup
```

This command:

- Copies necessary startup scripts to Safe Chain's installation directory (`~/.safe-chain/scripts`)
- Detects all supported shells on your system
- Sources each shell's startup file to add Safe Chain functions for `npm`, `npx`, `yarn`, `pnpm`, and `pnpx`

❗ After running this command, **you must restart your terminal** for the changes to take effect. This ensures that the startup scripts are sourced correctly.

### Remove Shell Integration

```bash
safe-chain teardown
```

This command:

- Detects all supported shells on your system
- Removes the Safe Chain scripts from each shell's startup file, restoring the original commands

❗ After running this command, **you must restart your terminal** to restore the original commands.

## File Locations

The system modifies the following files to source Safe Chain startup scripts:

### Unix/Linux/macOS

- **Bash**: `~/.bashrc`
- **Zsh**: `~/.zshrc`
- **Fish**: `~/.config/fish/config.fish`
- **PowerShell Core**: `$PROFILE` (usually `~/.config/powershell/profile.ps1`)

### Windows

- **PowerShell**: Determined by `$PROFILE` variable
- **PowerShell Core**: Also determined by `$PROFILE` variable

## Troubleshooting

### Common Issues

**Shell functions not working after setup:**

- Make sure to restart your terminal
- Check that the startup file was modified to source Safe Chain scripts
- Check the sourced file exists at `~/.safe-chain/scripts/`
- Verify your shell is reading the correct startup file

**Getting 'command not found: aikido-npm' error:**

This means the shell functions are working but the Aikido commands aren't installed or available in your PATH:

- Make sure Aikido Safe Chain is properly installed on your system
- Verify the `aikido-npm`, `aikido-npx`, `aikido-yarn`, `aikido-pnpm` and `aikido-pnpx` commands exist
- Check that these commands are in your system's PATH

### Manual Verification

To verify the integration is working, follow these steps:

1. **Check if startup scripts were sourced in your shell startup file:**

   - **For Bash**: Open `~/.bashrc` in your text editor
   - **For Zsh**: Open `~/.zshrc` in your text editor
   - **For Fish**: Open `~/.config/fish/config.fish` in your text editor
   - **For PowerShell**: Open your PowerShell profile file (run `$PROFILE` in PowerShell to see the path)

   Look for lines that source the Safe Chain startup scripts from `~/.safe-chain/scripts/`

2. **Test that shell functions are active in your terminal:**

   After restarting your terminal, run these commands:

   - `npm --version` - Should show output from the Aikido-wrapped version
   - `type npm` - Should show that `npm` is a function

3. **If you need to remove the integration manually:**

   Edit the same startup file from step 1 and delete any lines that source Safe Chain scripts from `~/.safe-chain/scripts/`.

## Manual Setup

For advanced users who prefer manual configuration, you can create wrapper functions directly in your shell's startup file. Shell functions take precedence over commands in PATH, so defining an `npm` function will intercept all `npm` calls:

```bash
# Example for Bash/Zsh
npm() {
  if command -v aikido-npm > /dev/null 2>&1; then
    aikido-npm "$@"
  else
    echo "Warning: safe-chain is not installed. npm will run without protection."
    command npm "$@"
  fi
}
```

Repeat this pattern for `npx`, `yarn`, `pnpm`, and `pnpx` using their respective `aikido-*` commands. After adding these functions, restart your terminal to apply the changes.
