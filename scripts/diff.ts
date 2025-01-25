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
        try {
            const diffOutput = this.executeGitDiff(target);
            
            // Add timestamp and command info
            const header = `# Generated: ${new Date().toISOString()}\n` +
                         `# Command: git diff ${target || 'HEAD'}\n\n`;
            
            fs.writeFileSync(this.outputFile, header + diffOutput, 'utf-8');
            console.log(`✅ Diff output saved to ${this.outputFile}`);
            
        } catch (error) {
            console.error('❌ Error capturing diff:');
            if (error instanceof Error) console.error(error.message);
            process.exit(1);
        }
    }
}

// CLI Execution remains the same
if (require.main === module) {
    const args = process.argv.slice(2);
    const target = args[0];
    const verbose = args.includes('--verbose');
    
    const capturer = new DiffCapturer(verbose);
    capturer.captureDiff(target);
}