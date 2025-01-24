import * as fs from 'fs';
import * as path from 'path';

// Enhanced interface to include full relative filepath
interface DirectoryNode {
    type: 'file' | 'directory';
    name: string;
    path: string;               // Relative path from root
    fullPath: string;          // Absolute path for internal use
    children?: DirectoryNode[];
}

class StructureScanner {
    // Configuration for filtering
    private readonly ignorePatterns = new Set([
        'node_modules',
        'dist',
        'build',
        'coverage',
        '.git',
        '.cache',
        '.next',
        '__pycache__',
        '.DS_Store',
        'package-lock.json'
    ]);

    private readonly includeExtensions = new Set([
        '.ts',
        '.tsx',
        '.txt',
        '.js',
        '.jsx',
        '.json',
        '.d.ts'
    ]);

    private generateInstructionPrompt(structure: string): string {
        return `Hey here's my current directory structure:

${structure}

I want you to tell me what files you need to see in detail to help complete my task. 

I have a script that can pull those files into one document for analysis. It requires an input.csv file formatted like:

package.json,simple
tsconfig.json,simple
src/services/tracks/track.service.ts,simple
src/__tests__/tracks.test.ts,simple

Please provide:
1. The list of file patterns needed (in CSV format)
2. Any specific code sections to focus on
3. Particular areas where you need context

I'll generate the input.csv and provide the consolidated code context!

please be conservative in your file selection as they may be rather large files and you aren't that good at pulling a ton into context yet`;
    }

    /**
     * Determines if a path should be excluded from scanning
     * @param pathToCheck - Path to evaluate
     * @param isDirectory - Whether the path is a directory
     */
    private shouldIgnore(pathToCheck: string, isDirectory: boolean = false): boolean {
        const basename = path.basename(pathToCheck);
        // Never ignore the docs directory
        if (isDirectory && basename === 'docs') {
            return false;
        }
        return this.ignorePatterns.has(basename);
    }

    /**
     * Recursively scans a directory and builds an enhanced tree structure
     * @param dirPath - Current directory path
     * @param relativeTo - Root directory for relative path calculation
     */
    private scanDirectory(dirPath: string, relativeTo: string): DirectoryNode {
        const baseName = path.basename(dirPath);
        const relativePath = path.relative(relativeTo, dirPath);
        
        const node: DirectoryNode = {
            type: 'directory',
            name: baseName,
            path: relativePath,
            fullPath: dirPath,
            children: []
        };

        try {
            const entries = fs.readdirSync(dirPath, { withFileTypes: true });
            
            // Process files with enhanced path information
            const files = entries
                .filter(entry => 
                    entry.isFile() && 
                    this.includeExtensions.has(path.extname(entry.name)) &&
                    !this.shouldIgnore(entry.name)
                )
                .map(entry => {
                    const fullFilePath = path.join(dirPath, entry.name);
                    return {
                        type: 'file' as const,
                        name: entry.name,
                        path: path.relative(relativeTo, fullFilePath),
                        fullPath: fullFilePath
                    };
                });

            // Process directories recursively
            const directories = entries
                .filter(entry => 
                    entry.isDirectory() && 
                    !this.shouldIgnore(entry.name, true)  // Pass true for directories
                )
                .map(entry => 
                    this.scanDirectory(
                        path.join(dirPath, entry.name),
                        relativeTo
                    )
                );

            // Combine and sort entries
            node.children = [
                ...directories.sort((a, b) => a.name.localeCompare(b.name)),
                ...files.sort((a, b) => a.name.localeCompare(b.name))
            ];
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }

        return node;
    }

    /**
     * Generates a formatted string representation with enhanced path information
     * @param node - Directory node to format
     * @param level - Current indentation level
     */
    private formatTree(node: DirectoryNode, level: number = 0): string {
        const indent = '  '.repeat(level);
        const prefix = node.type === 'directory' ? '📁 ' : '📄 ';
        
        // Include relative path in the output
        let output = `${indent}${prefix}${node.name} (${node.path})\n`;
        
        if (node.children) {
            output += node.children
                .map(child => this.formatTree(child, level + 1))
                .join('');
        }
        
        return output;
    }

    /**
     * Main scanning function that returns both tree structure and formatted output
     * @param rootDir - Root directory to scan
     */
    public scan(rootDir: string): { 
        tree: DirectoryNode; 
        formatted: string;
        prompt: string;
    } {
        const absoluteRootDir = path.resolve(rootDir);
        const tree = this.scanDirectory(absoluteRootDir, absoluteRootDir);
        const formatted = this.formatTree(tree);
        const prompt = this.generateInstructionPrompt(formatted);
        return { tree, formatted, prompt };
    }
}

// Execute if running directly
if (require.main === module) {
    (async () => {
        const scanner = new StructureScanner();
        const { tree, formatted, prompt } = scanner.scan(process.cwd());
        
        // Save outputs
        fs.writeFileSync('structure.json', JSON.stringify(tree, null, 2), 'utf-8');
        fs.writeFileSync('structure.txt', formatted, 'utf-8');
        fs.writeFileSync('paste.txt', prompt, 'utf-8'); // Only save the prompt, not the duplicate structure

        // Copy to clipboard using dynamic import
        try {
            const { default: clipboardy } = await import('clipboardy');
            clipboardy.writeSync(prompt); // Only copy the prompt, not the duplicate structure
            console.log('✅ Prompt copied to clipboard!');
        } catch (error) {
            console.log('⚠️  Could not copy to clipboard. Here\'s the output:');
            console.log('==================================================');
            console.log(prompt);
            console.log('==================================================');
            console.log('You can manually copy the above output.');
        }

        console.log('\nEnhanced Directory Structure:');
        console.log(formatted);
        console.log('\nStructure has been saved to:');
        console.log('- structure.json (JSON format)');
        console.log('- structure.txt (Tree view format)');
        console.log('- paste.txt (LLM-ready prompt with structure)');
    })();
}