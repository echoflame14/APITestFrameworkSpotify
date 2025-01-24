import * as fs from 'fs';
import * as path from 'path';

interface FileInfo {
    path: string;
    content: string;
}

interface DirectoryStructure {
    files?: FileInfo[];
    dirs?: Record<string, DirectoryStructure>;
}

interface IncludePattern {
    pattern: string;
    isRegex: boolean;
}

class CodebaseCapture {
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
        'package-lock.json',
        'paste.txt',
        'codebase-snapshot.json'
    ]);

    private includePatterns: IncludePattern[] = [];
    private rootDir: string = '';

    constructor(private readonly csvPath: string = 'input.csv') {}

    private parsePatternInput(content: string): IncludePattern[] {
        return content
            .split('\n')
            .map(line => line.trim())
            .filter(line => line && !line.startsWith('#'))
            .map(line => {
                const [pattern, typeStr = 'simple'] = line.split(',').map(s => s.trim());
                return {
                    pattern: pattern.replace(/^\.\//, ''),
                    isRegex: typeStr.toLowerCase() === 'regex'
                };
            });
    }

    private loadPatterns(): void {
        try {
            const content = fs.readFileSync(this.csvPath, 'utf-8');
            this.includePatterns = this.parsePatternInput(content);
            
            console.log('Loaded include patterns:');
            this.includePatterns.forEach(p => {
                console.log(`  ${p.isRegex ? 'Regex' : 'Simple'}: ${p.pattern}`);
            });
        } catch (error) {
            console.error(`Error reading patterns file: ${this.csvPath}`);
            process.exit(1);
        }
    }

    private shouldCapture(entryPath: string): boolean {
        const relativePath = path.relative(this.rootDir, entryPath).replace(/\\/g, '/');
        const basename = path.basename(entryPath);
        
        if (this.ignorePatterns.has(basename)) {
            return false;
        }

        if (this.includePatterns.length === 0) {
            return true;
        }

        return this.includePatterns.some(pattern => {
            if (pattern.isRegex) {
                try {
                    const regex = new RegExp(pattern.pattern);
                    return regex.test(relativePath);
                } catch (e) {
                    console.warn(`Invalid regex pattern: ${pattern.pattern}`);
                    return false;
                }
            } else {
                const simplePattern = pattern.pattern
                    .replace(/\./g, '\\.')
                    .replace(/\*/g, '.*');
                const regex = new RegExp(`^${simplePattern}$`);
                return regex.test(relativePath);
            }
        });
    }

    private readFileContent(filepath: string): string {
        return fs.readFileSync(filepath, { encoding: 'utf-8' });
    }

    private scanDirectory(currentPath: string): DirectoryStructure {
        const structure: DirectoryStructure = {};
        const entries = fs.readdirSync(currentPath, { withFileTypes: true });

        const files = entries
            .filter(entry => entry.isFile() && this.shouldCapture(path.join(currentPath, entry.name)));
        
        if (files.length > 0) {
            structure.files = files.map(file => ({
                path: path.join(currentPath, file.name).replace(/\\/g, '/'),
                content: this.readFileContent(path.join(currentPath, file.name))
            }));
        }

        const directories = entries.filter(entry => 
            entry.isDirectory() && !this.ignorePatterns.has(entry.name)
        );
        
        if (directories.length > 0) {
            structure.dirs = {};
            for (const dir of directories) {
                const fullPath = path.join(currentPath, dir.name);
                const subStructure = this.scanDirectory(fullPath);
                if (Object.keys(subStructure).length > 0) {
                    structure.dirs[dir.name] = subStructure;
                }
            }
        }

        return structure;
    }

    private formatOutput(structure: DirectoryStructure): string {
        let output = '';

        const processFiles = (files: FileInfo[]) => {
            for (const file of files) {
                output += `\n\n=== File: ${file.path} ===\n`;
                output += file.content;
            }
        };

        const processDirs = (dirs: Record<string, DirectoryStructure>) => {
            for (const [dirName, dirStructure] of Object.entries(dirs)) {
                if (dirStructure.files) {
                    processFiles(dirStructure.files);
                }
                if (dirStructure.dirs) {
                    processDirs(dirStructure.dirs);
                }
            }
        };

        if (structure.files) {
            processFiles(structure.files);
        }
        if (structure.dirs) {
            processDirs(structure.dirs);
        }

        return output.trim();
    }

    public capture(rootDir: string): void {
        console.log('Starting codebase capture...');
        this.rootDir = rootDir;
        
        this.loadPatterns();
        console.log('\nScanning directory...');
        
        const structure = this.scanDirectory(rootDir);
        const output = this.formatOutput(structure);
        
        fs.writeFileSync('paste.txt', output, { encoding: 'utf-8' });
        console.log('Codebase capture complete!');
        console.log('Output saved to: paste.txt');
    }
}

// Command-line execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const rootDir = args[0] || process.cwd();
    const csvPath = args[1] || 'input.csv';

    const capture = new CodebaseCapture(csvPath);
    capture.capture(rootDir);
}