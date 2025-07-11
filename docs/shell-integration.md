# Shell Integration

## Overview

The shell integration automatically wraps common package manager commands (`npm`, `npx`, `yarn`) with Aikido's security scanning functionality. This is achieved by adding shell aliases that redirect these commands to their Aikido-wrapped equivalents.

## Supported Shells

Aikido Safe Chain supports integration with the following shells.

| Shell                  | Startup File                 | Alias Format               |
| ---------------------- | ---------------------------- | -------------------------- |
| **Bash**               | `~/.bashrc`                  | `alias npm='aikido-npm'`   |
| **Zsh**                | `~/.zshrc`                   | `alias npm='aikido-npm'`   |
| **Fish**               | `~/.config/fish/config.fish` | `alias npm "aikido-npm"`   |
| **PowerShell Core**    | `$PROFILE`                   | `Set-Alias npm aikido-npm` |
| **Windows PowerShell** | `$PROFILE`                   | `Set-Alias npm aikido-npm` |

## Commands

### Setup Shell Integration

```bash
safe-chain setup
```

This command:

- Detects all supported shells on your system
- Adds aliases for `npm`, `npx`, and `yarn` to each shell's startup file

❗ After running this command, **you must restart your terminal** for the changes to take effect. This ensures that the aliases are loaded correctly.

### Remove Shell Integration

```bash
safe-chain teardown
```

This command:

- Detects all supported shells on your system
- Removes Aikido aliases from each shell's startup file

❗ After running this command, **you must restart your terminal** to restore the original commands.

## File Locations

The system modifies the following files based on your shell configuration:

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

**Aliases not working after setup:**

- Make sure to restart your terminal
- Check that the startup file was actually modified
- Verify your shell is reading the correct startup file

**Getting 'command not found: aikido-npm' error:**

This means the aliases are working but the Aikido commands aren't installed or available in your PATH:

- Make sure Aikido Safe Chain is properly installed on your system
- Verify the `aikido-npm`, `aikido-npx`, and `aikido-yarn` commands exist
- Check that these commands are in your system's PATH

### Manual Verification

To verify the integration is working, follow these steps:

1. **Check if aliases were added to your shell startup file:**

   - **For Bash**: Open `~/.bashrc` in your text editor
   - **For Zsh**: Open `~/.zshrc` in your text editor
   - **For Fish**: Open `~/.config/fish/config.fish` in your text editor
   - **For PowerShell**: Open your PowerShell profile file (run `$PROFILE` in PowerShell to see the path)

   Look for lines like:

   - `alias npm='aikido-npm'` (Bash/Zsh)
   - `alias npm "aikido-npm"` (Fish)
   - `Set-Alias npm aikido-npm` (PowerShell)

2. **Test that aliases are active in your terminal:**

   After restarting your terminal, run these commands:

   - `which npm` - Should show the path to `aikido-npm` instead of the original npm
   - `npm --version` - Should show output from the Aikido-wrapped version
   - `type npm` - Alternative way to check what command `npm` resolves to

3. **If you need to remove aliases manually:**

   Edit the same startup file from step 1 and delete any lines containing `aikido-npm`, `aikido-npx`, or `aikido-yarn`.
