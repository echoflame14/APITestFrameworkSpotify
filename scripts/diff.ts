import { spawnSync } from 'child_process';
import * as fs from 'fs';

class DiffCapturer {
    private readonly outputFile = 'paste.txt';
    constructor(private verbose: boolean = false) {}

    private log(message: string): void {
        if (this.verbose) console.log(`[DEBUG] ${message}`);
    }

    private executeGitDiff(target?: string): string {
        const args = [
            'diff',
            '--staged',
            '--src-prefix=a/',
            '--dst-prefix=b/',
            '--ignore-space-change',
            '--ignore-blank-lines',
            target || 'HEAD'
        ];

        this.log(`Executing: git ${args.join(' ')}`);
        
        const result = spawnSync('git', args, {
            encoding: 'utf-8',
            stdio: ['pipe', 'pipe', 'inherit']
        });

        if (result.status !== 0) {
            throw new Error(`Git diff failed with status ${result.status}`);
        }

        return result.stdout;
    }

    public captureDiff(target?: string): void {
        if (fs.existsSync('./paste.txt')) {
            console.log('⚠️ Warning: paste.txt already exists');
            process.exit(1);
        }

        const diffOutput = this.executeGitDiff(target);

        const commitPrompt = `#!/bin/bash
# Auto-generated commit command builder | paste into terminal
# INSTRUCTIONS:
# 1. AI should generate a single -m argument for semantic commits
# 2. Format: "type(scope): brief summary"
# 3. Use bullet points for detailed changes
# 4. Escape quotes with \\"

echo "Generated commit command:"
echo "git commit -m \\"
`;

        const header = `# DIFF CONTENT BELOW - ${new Date().toISOString()}\n` +
                     `# git diff ${target || 'HEAD'}\n\n` +
                     `cat << 'EOF'\n`;
        
        const footer = `EOF\n`;
        
        fs.writeFileSync(this.outputFile, 
            commitPrompt + header + diffOutput + footer, 
            { mode: 0o755, encoding: 'utf-8' }
        );
        console.log(`✅ Generated paste-ready file: ${this.outputFile}`);
    }
}

if (require.main === module) {
    const args = process.argv.slice(2);
    const target = args[0];
    const verbose = args.includes('--verbose');
    
    const capturer = new DiffCapturer(verbose);
    capturer.captureDiff(target);
}