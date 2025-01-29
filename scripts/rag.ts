import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import Anthropic from '@anthropic-ai/sdk';

// Types
interface SummaryMetadata {
  filePath: string;
  summary: string;
  lastUpdated: string;
  fileHash: string;
}

interface Config {
  summaryDir: string;
  ignoreDirs: string[];
  ignoreFiles: string[];
  ignoreExtensions: string[];
}

// Ensure we have the API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('Error: ANTHROPIC_API_KEY environment variable is not set');
  process.exit(1);
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const PROJECT_ROOT = path.join(__dirname, '..');

// Configuration
const config: Config = {
  summaryDir: path.join(PROJECT_ROOT, 'summaries'),
  ignoreDirs: [
    'node_modules',
    'dist',
    'build',
    'coverage',
    '.git',
    '.cache',
    '.next',
    '__pycache__',
    'summaries'  // Keep this from original config to store summaries
  ],
  ignoreFiles: [
    '.DS_Store',
    'package-lock.json'
  ],
  // Only include these extensions (inverse of ignore)
  ignoreExtensions: [
    // Include only these (everything else is ignored):
    // .ts, .tsx, .txt, .js, .jsx, .json, .d.ts
    '.jpg', '.png', '.gif', '.mp4', '.mp3', '.pdf', '.md', '.csv', 
    '.yaml', '.yml', '.lock', '.env', '.log', '.sql', '.sh', '.bash',
    '.zsh', '.fish', '.ps1', '.bat', '.cmd', '.exe', '.dll', '.so',
    '.dylib', '.tar', '.gz', '.zip', '.rar', '.7z', '.ico', '.svg',
    '.ttf', '.woff', '.woff2', '.eot'
  ],
};

async function calculateFileHash(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath);
  return crypto.createHash('md5').update(content).digest('hex');
}

async function generateSummary(filePath: string): Promise<string> {
  const content = await fs.readFile(filePath, 'utf-8');
  const fileExt = path.extname(filePath);
  
  const message = await anthropic.messages.create({
    model: 'claude-3-haiku-20240307',
    max_tokens: 1024,
    messages: [{
      role: 'user',
      content: `Please provide a concise summary of this ${fileExt} file content. Focus on its main purpose and key functionality:\n\n${content}`
    }]
  });

  // Check if we have content and it's a text block
  const firstBlock = message.content[0];
  if (!firstBlock || firstBlock.type !== 'text') {
    throw new Error('Expected a text response from Claude');
  }

  return firstBlock.text;
}

async function saveSummary(filePath: string, summary: string): Promise<void> {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const summaryPath = path.join(config.summaryDir, `${relativePath}.summary.json`);
    const summaryDir = path.dirname(summaryPath);
    
    const metadata: SummaryMetadata = {
      filePath: relativePath,
      summary,
      lastUpdated: new Date().toISOString(),
      fileHash: await calculateFileHash(filePath),
    };
  
    await fs.mkdir(summaryDir, { recursive: true });
  
    // Properly escape and sanitize the summary text
    const sanitizedSummary = summary
      .replace(/[\u0000-\u0019]+/g, ' ') // Replace control characters with spaces
      .split('\n')
      .map(line => line.trim())
      .join('\n    ')
      .trim();
  
    // Create a sanitized JSON object
    const formattedJson = {
      ...metadata,
      summary: sanitizedSummary
    };
  
    try {
      // Validate that we can stringify/parse the JSON before saving
      JSON.parse(JSON.stringify(formattedJson));
      
      await fs.writeFile(
        summaryPath, 
        JSON.stringify(formattedJson, null, 2)
      );
    } catch (error) {
      console.error(`Error saving summary for ${filePath}:`, error);
      console.error('Problematic summary:', summary);
      throw error;
    }
  }

const INCLUDE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.txt',
  '.js',
  '.jsx',
  '.json',
  '.d.ts'
]);

async function shouldProcessFile(filePath: string): Promise<boolean> {
  const relativePath = path.relative(PROJECT_ROOT, filePath);
  const parts = relativePath.split(path.sep);
  
  // Check if file is in ignored directory
  if (parts.some(part => config.ignoreDirs.includes(part))) {
    return false;
  }

  // Check if file is in ignore list
  if (config.ignoreFiles.includes(path.basename(filePath))) {
    return false;
  }

  // Only process files with included extensions
  const ext = path.extname(filePath);
  if (!INCLUDE_EXTENSIONS.has(ext)) {
    return false;
  }

  return true;
}

// Let's add logging to debug the needsNewSummary function
async function needsNewSummary(filePath: string): Promise<boolean> {
    const relativePath = path.relative(PROJECT_ROOT, filePath);
    const summaryPath = path.join(config.summaryDir, `${relativePath}.summary.json`);
    
    const metadata = await getSummaryMetadata(summaryPath);
    if (!metadata) {
      console.log(`No existing summary found for: ${filePath}`);
      return true;
    }
  
    const currentHash = await calculateFileHash(filePath);
    const needsUpdate = currentHash !== metadata.fileHash;
    
    console.log(`File: ${filePath}`);
    console.log(`Current hash: ${currentHash}`);
    console.log(`Stored hash: ${metadata.fileHash}`);
    console.log(`Needs update: ${needsUpdate}`);
    
    return needsUpdate;
  }
  
  async function getSummaryMetadata(summaryPath: string): Promise<SummaryMetadata | null> {
  try {
    const content = await fs.readFile(summaryPath, 'utf-8');
    
    // Try to parse, handling potential control characters
    let metadata: SummaryMetadata;
    try {
      metadata = JSON.parse(content);
    } catch (parseError) {
      // If parsing fails, try to clean the content first
      const cleanContent = content.replace(/[\u0000-\u0019]+/g, ' ');
      metadata = JSON.parse(cleanContent);
    }
    
    // Validate the metadata structure
    if (!metadata.filePath || !metadata.summary || !metadata.lastUpdated || !metadata.fileHash) {
      console.error(`Invalid metadata structure in ${summaryPath}`);
      return null;
    }
    
    return metadata;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      console.error(`Error reading summary metadata from ${summaryPath}:`, error);
    }
    return null;
  }
}
  
async function processFile(filePath: string): Promise<void> {
  try {
    if (!await shouldProcessFile(filePath)) {
      return;
    }

    if (!await needsNewSummary(filePath)) {
      console.log(`Summary is up to date for: ${filePath}`);
      return;
    }

    console.log(`Generating summary for: ${filePath}`);
    const summary = await generateSummary(filePath);
    await saveSummary(filePath, summary);
    console.log(`Summary saved for: ${filePath}`);
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

async function walkDirectory(dir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory()) {
      if (!config.ignoreDirs.includes(entry.name)) {
        await walkDirectory(fullPath);
      }
    } else {
      await processFile(fullPath);
    }
  }
}

async function main(): Promise<void> {
  try {
    // Ensure summaries directory exists
    await fs.mkdir(config.summaryDir, { recursive: true });
    
    // Start processing from project root
    await walkDirectory(PROJECT_ROOT);
    
    console.log('Summary generation complete!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();