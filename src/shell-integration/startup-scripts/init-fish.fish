function printSafeChainWarning
    set original_cmd $argv[1]
    
    # Fish equivalent of ANSI color codes: yellow background, black text for "Warning:"
    set_color -b yellow black
    printf "Warning:"
    set_color normal
    printf " safe-chain is not available to protect you from installing malware. %s will be run directly.\n" $original_cmd
    
    # Cyan text for the install command
    printf "Install safe-chain by using "
    set_color cyan
    printf "npm install -g @aikidosec/safe-chain"
    set_color normal
    printf ".\n"
end

function wrapSafeChainCommand
    set original_cmd $argv[1]
    set aikido_cmd $argv[2]
    set cmd_args $argv[3..-1]
    
    if type -q $aikido_cmd
        # If the aikido command is available, just run it with the provided arguments
        $aikido_cmd $cmd_args
    else
        # If the aikido command is not available, print a warning and run the original command
        printSafeChainWarning $original_cmd
        command $original_cmd $cmd_args
    end
end

function npx
    wrapSafeChainCommand "npx" "aikido-npx" $argv
end

function yarn
    wrapSafeChainCommand "yarn" "aikido-yarn" $argv
end

function pnpm
    wrapSafeChainCommand "pnpm" "aikido-pnpm" $argv
end

function pnpx
    wrapSafeChainCommand "pnpx" "aikido-pnpx" $argv
end

function npm
    if test (count $argv) -eq 1 -a \( "$argv[1]" = "-v" -o "$argv[1]" = "--version" \)
        # If args is just -v or --version and nothing else, just run the npm version command
        # This is because nvm uses this to check the version of npm
        command npm $argv
        return
    end

    wrapSafeChainCommand "npm" "aikido-npm" $argv
end
