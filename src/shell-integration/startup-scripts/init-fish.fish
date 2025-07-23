function installIfCommandNotFound
    set cmd $argv[1]
    
    # Check if the command already exists
    if type -q $cmd
        return 0
    end
    
    # Check if Node.js version is below 18
    # Safe-chain requires Node.js 18 or higher
    set node_version (node -v | sed 's/v//' | cut -d'.' -f1)
    if test $node_version -lt 18
        return 2
    end
    
    # Command not found, ask user if they want to install safe-chain
    read -l response -P "The command '$cmd' is not available. Do you want to install safe-chain to provide it? (y/N): "
    
    if string match -qi 'y*' $response
        printf "Installing safe-chain...\n"
        installSafeChain
        
        if test $status -ne 0
            printf "\nFailed to install safe-chain. Exiting.\n"
            return 1
        end
        
        return 0
    else
        printf "Skipping safe-chain installation. Using original command instead.\n"
        return 2
    end
end

function installSafeChain
    command npm install -g @aikidosec/safe-chain
    
    if test $status -ne 0
        return 1
    end

    printf "------\n"
end

function wrapCommand
    set original_cmd $argv[1]
    set aikido_cmd $argv[2]
    set cmd_args $argv[3..-1]
    
    installIfCommandNotFound $aikido_cmd
    set install_result $status
    
    if test $install_result -eq 2
        command $original_cmd $cmd_args
    else
        $aikido_cmd $cmd_args
    end
end

function npx
    wrapCommand "npx" "aikido-npx" $argv
end

function yarn
    wrapCommand "yarn" "aikido-yarn" $argv
end

function pnpm
    wrapCommand "pnpm" "aikido-pnpm" $argv
end

function pnpx
    wrapCommand "pnpx" "aikido-pnpx" $argv
end

function npm
    if test (count $argv) -eq 1 -a \( "$argv[1]" = "-v" -o "$argv[1]" = "--version" \)
        # If args is just -v or --version and nothing else, just run the npm version command
        # This is because nvm uses this to check the version of npm
        command npm $argv
        return
    end

    wrapCommand "npm" "aikido-npm" $argv
end