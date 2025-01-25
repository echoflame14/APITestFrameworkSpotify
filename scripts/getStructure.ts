import * as fs from 'fs';
import * as path from 'path';

interface DirectoryNode {
    type: 'file' | 'directory';
    name: string;
    path: string;               // Relative path from root
    fullPath: string;           // Absolute path for internal use
    tokenCount?: number;        // New token count field
    children?: DirectoryNode[];
}

class StructureScanner {
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

    private calculateTokens(content: string): number {
        // Conservative estimate: 1 token = 4 characters
        return Math.ceil(content.length / 4);
    }

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

    private shouldIgnore(pathToCheck: string, isDirectory: boolean = false): boolean {
        const basename = path.basename(pathToCheck);
        if (isDirectory && basename === 'docs') return false;
        return this.ignorePatterns.has(basename);
    }

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
            
            // Process files with token calculation
            const files = entries
                .filter(entry => 
                    entry.isFile() && 
                    this.includeExtensions.has(path.extname(entry.name)) &&
                    !this.shouldIgnore(entry.name)
                )
                .map(entry => {
                    const fullFilePath = path.join(dirPath, entry.name);
                    const content = fs.readFileSync(fullFilePath, 'utf-8');
                    return {
                        type: 'file' as const,
                        name: entry.name,
                        path: path.relative(relativeTo, fullFilePath),
                        fullPath: fullFilePath,
                        tokenCount: this.calculateTokens(content)
                    };
                });

            // Process directories
            const directories = entries
                .filter(entry => 
                    entry.isDirectory() && 
                    !this.shouldIgnore(entry.name, true)
                )
                .map(entry => 
                    this.scanDirectory(
                        path.join(dirPath, entry.name),
                        relativeTo
                    )
                );

            node.children = [
                ...directories.sort((a, b) => a.name.localeCompare(b.name)),
                ...files.sort((a, b) => a.name.localeCompare(b.name))
            ];
        } catch (error) {
            console.error(`Error scanning directory ${dirPath}:`, error);
        }

        return node;
    }

    private formatTree(node: DirectoryNode, level: number = 0): string {
        const indent = '  '.repeat(level);
        const prefix = node.type === 'directory' ? '📁 ' : '📄 ';
        
        // Add token count display for files
        let pathInfo = node.path;
        if (node.type === 'file' && node.tokenCount) {
            pathInfo += ` [${node.tokenCount} tokens]`;
        }
        
        let output = `${indent}${prefix}${node.name} (${pathInfo})\n`;
        
        if (node.children) {
            output += node.children
                .map(child => this.formatTree(child, level + 1))
                .join('');
        }
        
        return output;
    }

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

if (require.main === module) {
    (async () => {
        const scanner = new StructureScanner();
        const { tree, formatted, prompt } = scanner.scan(process.cwd());
        
        fs.writeFileSync('structure.json', JSON.stringify(tree, null, 2), 'utf-8');
        fs.writeFileSync('structure.txt', formatted, 'utf-8');
        fs.writeFileSync('paste.txt', prompt, 'utf-8');

        try {
            const { default: clipboardy } = await import('clipboardy');
            clipboardy.writeSync(prompt);
            console.log('✅ Prompt copied to clipboard!');
        } catch (error) {
            console.log('⚠️  Could not copy to clipboard. Output:\n');
            console.log(prompt);
        }

        console.log('\nEnhanced Directory Structure:');
        console.log(formatted);
        console.log('\nSaved to: structure.json, structure.txt, paste.txt');
    })();
}