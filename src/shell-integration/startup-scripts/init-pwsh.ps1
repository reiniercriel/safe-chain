function Test-CommandAvailable {
    param([string]$Command)
    
    try {
        Get-Command $Command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

function Invoke-RealCommand {
    param(
        [string]$Command,
        [string[]]$Arguments
    )
    
    # Find the real executable to avoid calling our wrapped functions
    $realCommand = Get-Command -Name $Command -CommandType Application | Select-Object -First 1
    if ($realCommand) {
        & $realCommand.Source @Arguments
    } else {
        # Fallback: try to call the .cmd version directly
        & "$Command.cmd" @Arguments
    }
}

function Install-IfCommandNotFound {
    param([string]$Command)
    
    # Check if the command already exists
    if (Test-CommandAvailable $Command) {
        return 0
    }
    
    # Check if Node.js version is below 18
    # Safe-chain requires Node.js 18 or higher
    try {
        $nodeVersion = (node -v) -replace 'v', '' | ForEach-Object { $_.Split('.')[0] }
        if ([int]$nodeVersion -lt 18) {
            return 2
        }
    } catch {
        return 2
    }
    
    # Command not found, ask user if they want to install safe-chain
    $response = Read-Host "The command '$Command' is not available. Do you want to install safe-chain to provide it? (y/N)"
    
    if ($response -match '^[Yy]$') {
        Write-Host "Installing safe-chain..."
        $installResult = Install-SafeChain
        
        if ($installResult -ne 0) {
            Write-Host "`nFailed to install safe-chain. Exiting."
            return 1
        }
        
        return 0
    } else {
        Write-Host "Skipping safe-chain installation. Using original command instead."
        return 2
    }
}

function Install-SafeChain {
    try {
        Invoke-RealCommand "npm" @("install", "-g", "@aikidosec/safe-chain") | Out-Null
        
        if ($LASTEXITCODE -ne 0) {
            return 1
        }
        
        Write-Host "------"
        return 0
    } catch {
        return 1
    }
}

function Invoke-WrappedCommand {
    param(
        [string]$OriginalCmd,
        [string]$AikidoCmd,
        [string[]]$Arguments
    )
    
    $installResult = Install-IfCommandNotFound $AikidoCmd
    
    if ($installResult -eq 2) {
        Invoke-RealCommand $OriginalCmd $Arguments
    } else {
        & $AikidoCmd @Arguments
    }
}

function npx {
    Invoke-WrappedCommand "npx" "aikido-npx" $args
}

function yarn {
    Invoke-WrappedCommand "yarn" "aikido-yarn" $args
}

function pnpm {
    Invoke-WrappedCommand "pnpm" "aikido-pnpm" $args
}

function pnpx {
    Invoke-WrappedCommand "pnpx" "aikido-pnpx" $args
}

function npm {
    # If args is just -v or --version and nothing else, just run the npm version command
    # This is because nvm uses this to check the version of npm
    if (($args.Length -eq 1) -and (($args[0] -eq "-v") -or ($args[0] -eq "--version"))) {
        Invoke-RealCommand "npm" $args
        return
    }
    
    Invoke-WrappedCommand "npm" "aikido-npm" $args
}