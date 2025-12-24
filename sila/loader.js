const fs = require('fs');
const path = require('path');

function loadCommands() {
    const commands = {};
    const baseDir = __dirname;
    
    // Function to load commands from a directory
    function loadFromDir(dirPath, category = '') {
        if (!fs.existsSync(dirPath)) return;
        
        const items = fs.readdirSync(dirPath);
        
        items.forEach(item => {
            const fullPath = path.join(dirPath, item);
            const stat = fs.statSync(fullPath);
            
            if (stat.isDirectory()) {
                // Recursively load from subdirectories
                loadFromDir(fullPath, item);
            } else if (item.endsWith('.js') && item !== 'loader.js') {
                try {
                    const commandModule = require(fullPath);
                    if (commandModule.commands && commandModule.execute) {
                        commandModule.commands.forEach(cmd => {
                            commands[cmd] = commandModule;
                        });
                    }
                } catch (error) {
                    console.error(`Error loading command from ${fullPath}:`, error.message);
                }
            }
        });
    }
    
    // Load from all subdirectories
    const subDirs = ['downloaders', 'group', 'ai', 'tools', 'system', 'owner'];
    subDirs.forEach(dir => {
        const dirPath = path.join(baseDir, dir);
        loadFromDir(dirPath, dir);
    });
    
    // Also load from root of sila directory
    loadFromDir(baseDir, 'general');
    
    console.log(`╔► ✅ Loaded ${Object.keys(commands).length} commands`);
    console.log('╚► → Categories: ' + subDirs.join(', '));
    
    return commands;
}

function getCommand(commandName) {
    const commands = loadCommands();
    return commands[commandName];
}

module.exports = {
    loadCommands,
    getCommand
};