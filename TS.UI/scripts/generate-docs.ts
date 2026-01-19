/**
 * User Documentation Generator
 *
 * Generates user guide screenshots and videos using Playwright.
 * Run manually when documentation needs updating.
 *
 * Usage:
 *   cd TS.UI
 *   npx tsx ../docs/user-guide/generate-docs.ts
 *
 * Options:
 *   --video     Also record video walkthroughs
 *   --flow=X    Only generate specific flow (dashboard, tools, reservations, circles, profile)
 */

import { chromium, Browser, Page, BrowserContext } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';
const DOCS_DIR = path.join(__dirname, '..', '..', 'docs', 'user-guide');
const OUTPUT_DIR = path.join(DOCS_DIR, 'images');
const VIDEO_DIR = path.join(DOCS_DIR, 'videos');

interface DocStep {
  name: string;
  description: string;
  action: (page: Page) => Promise<void>;
  screenshot: string;
  notes?: string[];
}

interface DocFlow {
  id: string;
  title: string;
  description: string;
  steps: DocStep[];
}

// ============================================================================
// Documentation Flows
// ============================================================================

const flows: DocFlow[] = [
  {
    id: 'dashboard',
    title: 'Dashboard Overview',
    description: 'The dashboard is your home base in Tool Share. It shows your stats, quick actions, and recent activity.',
    steps: [
      {
        name: 'Dashboard Home',
        description: 'When you log in, you see your personalized dashboard.',
        action: async (page) => {
          await page.goto('/');
          await page.waitForTimeout(1000);
        },
        screenshot: '01-dashboard-home.png',
        notes: [
          'Stats show your tools listed, active loans, and pending requests',
          'Quick actions let you add tools or browse available tools',
          'Your recent tools are displayed below'
        ]
      }
    ]
  },
  {
    id: 'tools',
    title: 'Managing Your Tools',
    description: 'Learn how to add, edit, and manage your tools in the lending library.',
    steps: [
      {
        name: 'My Tools Page',
        description: 'View all tools you have listed for lending.',
        action: async (page) => {
          await page.goto('/my-tools');
          await page.waitForTimeout(1000);
        },
        screenshot: '02-my-tools-list.png',
        notes: [
          'Each tool card shows status, category, and loan settings',
          'Click a tool to view details or edit'
        ]
      },
      {
        name: 'Add New Tool',
        description: 'Click "Add Tool" to list a new tool.',
        action: async (page) => {
          await page.goto('/my-tools/add');
          await page.waitForTimeout(1000);
        },
        screenshot: '02-add-tool-form.png',
        notes: [
          'Enter tool name, category, and description',
          'Set advance notice days and maximum loan duration',
          'Optionally scan a UPC barcode to auto-fill details'
        ]
      },
      {
        name: 'Browse Tools',
        description: 'Browse tools available to borrow from your circles.',
        action: async (page) => {
          await page.goto('/browse');
          await page.waitForTimeout(1000);
        },
        screenshot: '02-browse-tools.png',
        notes: [
          'Filter by category or search by name',
          'Only tools from your circles are shown',
          'Click a tool to view details and request to borrow'
        ]
      }
    ]
  },
  {
    id: 'reservations',
    title: 'Borrowing & Lending',
    description: 'How to request tools, manage loans, and track reservations.',
    steps: [
      {
        name: 'Reservations Page',
        description: 'View all your borrowing and lending activity.',
        action: async (page) => {
          await page.goto('/reservations');
          await page.waitForTimeout(1000);
        },
        screenshot: '03-reservations-page.png',
        notes: [
          'Borrowing tab shows tools you have requested or borrowed',
          'Lending tab shows requests for your tools'
        ]
      }
    ]
  },
  {
    id: 'circles',
    title: 'Circles (Sharing Groups)',
    description: 'Circles are groups of trusted people you share tools with.',
    steps: [
      {
        name: 'My Circles',
        description: 'View circles you belong to.',
        action: async (page) => {
          await page.goto('/circles');
          await page.waitForTimeout(1000);
        },
        screenshot: '04-circles-list.png',
        notes: [
          'Each circle shows member count and your role',
          'Create a new circle or join an existing one'
        ]
      },
      {
        name: 'Create Circle',
        description: 'Start a new sharing circle.',
        action: async (page) => {
          await page.goto('/circles/create');
          await page.waitForTimeout(1000);
        },
        screenshot: '04-create-circle.png',
        notes: [
          'Give your circle a name and description',
          'Choose whether it is public or private',
          'You become the owner and can invite others'
        ]
      },
      {
        name: 'Join Circle',
        description: 'Join an existing circle with an invite code.',
        action: async (page) => {
          await page.goto('/circles/join');
          await page.waitForTimeout(1000);
        },
        screenshot: '04-join-circle.png',
        notes: [
          'Enter the 8-character invite code',
          'Ask the circle owner for the code'
        ]
      }
    ]
  },
  {
    id: 'profile',
    title: 'Your Profile',
    description: 'Manage your account settings and subscription.',
    steps: [
      {
        name: 'Profile Page',
        description: 'View and edit your profile information.',
        action: async (page) => {
          await page.goto('/profile');
          await page.waitForTimeout(1000);
        },
        screenshot: '05-profile-page.png',
        notes: [
          'Update your display name, phone, and address',
          'Add a bio to tell others about yourself',
          'View your subscription status'
        ]
      },
      {
        name: 'Notifications',
        description: 'View and manage your notifications.',
        action: async (page) => {
          await page.goto('/notifications');
          await page.waitForTimeout(1000);
        },
        screenshot: '05-notifications.png',
        notes: [
          'Filter by notification type',
          'Click to navigate to related item',
          'Mark all as read to clear badges'
        ]
      }
    ]
  }
];

// ============================================================================
// Generator Functions
// ============================================================================

async function captureFlow(page: Page, flow: DocFlow): Promise<string> {
  console.log(`\nCapturing flow: ${flow.title}`);

  let markdown = `## ${flow.title}\n\n${flow.description}\n\n`;

  for (const step of flow.steps) {
    console.log(`  - ${step.name}`);

    try {
      await step.action(page);
      await page.waitForTimeout(500); // Let animations settle

      const screenshotPath = path.join(OUTPUT_DIR, step.screenshot);
      await page.screenshot({
        path: screenshotPath,
        fullPage: false,
        animations: 'disabled'
      });

      markdown += `### ${step.name}\n\n`;
      markdown += `${step.description}\n\n`;
      markdown += `![${step.name}](images/${step.screenshot})\n\n`;

      if (step.notes && step.notes.length > 0) {
        markdown += step.notes.map(n => `- ${n}`).join('\n') + '\n\n';
      }
    } catch (error) {
      console.error(`    Error capturing ${step.name}:`, error);
      markdown += `### ${step.name}\n\n${step.description}\n\n*Screenshot not available*\n\n`;
    }
  }

  return markdown;
}

async function recordFlowVideo(context: BrowserContext, flow: DocFlow): Promise<void> {
  console.log(`\nRecording video: ${flow.title}`);

  const page = await context.newPage();

  for (const step of flow.steps) {
    console.log(`  - ${step.name}`);
    try {
      await step.action(page);
      await page.waitForTimeout(1500); // Slower for video
    } catch (error) {
      console.error(`    Error in ${step.name}:`, error);
    }
  }

  await page.close();
}

async function generateMarkdown(flowMarkdowns: Map<string, string>): Promise<void> {
  let fullGuide = `# Tool Share User Guide

Welcome to Tool Share! This guide will help you get started with borrowing and lending tools in your community.

**Table of Contents**
${flows.map(f => `- [${f.title}](#${f.id})`).join('\n')}

---

`;

  for (const flow of flows) {
    const markdown = flowMarkdowns.get(flow.id);
    if (markdown) {
      fullGuide += markdown + '\n---\n\n';
    }
  }

  fullGuide += `
## Need Help?

- Check the [FAQ](/faq) for common questions
- Contact support at support@toolshare.example.com

---

*This guide was auto-generated using Playwright. Last updated: ${new Date().toISOString().split('T')[0]}*
`;

  const outputPath = path.join(DOCS_DIR, 'USER_GUIDE.md');
  fs.writeFileSync(outputPath, fullGuide);
  console.log(`\nGenerated: ${outputPath}`);
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  const recordVideo = args.includes('--video');
  const flowFilter = args.find(a => a.startsWith('--flow='))?.split('=')[1];

  console.log('Tool Share Documentation Generator');
  console.log('===================================');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Record video: ${recordVideo}`);
  console.log(`Flow filter: ${flowFilter || 'all'}`);

  // Ensure output directories exist
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  fs.mkdirSync(VIDEO_DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });

  const contextOptions: any = {
    viewport: { width: 1280, height: 720 },
    deviceScaleFactor: 2, // Retina screenshots
    baseURL: BASE_URL,
  };

  if (recordVideo) {
    contextOptions.recordVideo = {
      dir: VIDEO_DIR,
      size: { width: 1280, height: 720 }
    };
  }

  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  const flowMarkdowns = new Map<string, string>();
  const flowsToProcess = flowFilter
    ? flows.filter(f => f.id === flowFilter)
    : flows;

  if (flowsToProcess.length === 0) {
    console.error(`Flow not found: ${flowFilter}`);
    console.log('Available flows:', flows.map(f => f.id).join(', '));
    await browser.close();
    process.exit(1);
  }

  // Capture screenshots
  for (const flow of flowsToProcess) {
    const markdown = await captureFlow(page, flow);
    flowMarkdowns.set(flow.id, markdown);
  }

  // Record videos if requested
  if (recordVideo) {
    await page.close();
    for (const flow of flowsToProcess) {
      await recordFlowVideo(context, flow);
    }
  }

  // Generate markdown
  await generateMarkdown(flowMarkdowns);

  await context.close();
  await browser.close();

  console.log('\nDone!');
  console.log(`Screenshots: ${OUTPUT_DIR}`);
  if (recordVideo) {
    console.log(`Videos: ${VIDEO_DIR}`);
  }
}

main().catch(console.error);
