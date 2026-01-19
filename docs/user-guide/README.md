# User Guide Documentation Generator

Generates user documentation with screenshots and videos using Playwright.

## Prerequisites

1. The app must be running locally:
   ```bash
   cd TS.UI
   npm run dev
   ```

2. Playwright must be installed:
   ```bash
   cd TS.UI
   npx playwright install chromium
   ```

## Usage

### Generate All Documentation

```bash
cd TS.UI
npx tsx ../docs/user-guide/generate-docs.ts
```

### Generate Specific Flow

```bash
npx tsx ../docs/user-guide/generate-docs.ts --flow=dashboard
npx tsx ../docs/user-guide/generate-docs.ts --flow=tools
npx tsx ../docs/user-guide/generate-docs.ts --flow=reservations
npx tsx ../docs/user-guide/generate-docs.ts --flow=circles
npx tsx ../docs/user-guide/generate-docs.ts --flow=profile
```

### Generate with Video Recording

```bash
npx tsx ../docs/user-guide/generate-docs.ts --video
npx tsx ../docs/user-guide/generate-docs.ts --flow=tools --video
```

### Custom Base URL

```bash
BASE_URL=http://localhost:3000 npx tsx ../docs/user-guide/generate-docs.ts
```

## Output

After running, you'll have:

```
docs/user-guide/
├── USER_GUIDE.md        # Generated markdown guide
├── images/              # Screenshots
│   ├── 01-dashboard-home.png
│   ├── 01-dashboard-actions.png
│   ├── 02-my-tools-list.png
│   └── ...
└── videos/              # Video recordings (if --video flag used)
    └── *.webm
```

## Customizing

Edit `generate-docs.ts` to:

1. **Add new flows**: Add to the `flows` array
2. **Add steps to a flow**: Add to the `steps` array within a flow
3. **Change screenshot settings**: Modify `page.screenshot()` options
4. **Change viewport**: Modify `contextOptions.viewport`

## Tips

- Run with `--video` to create walkthrough videos for training
- Use `--flow=X` to regenerate just one section after changes
- Screenshots are 2x resolution (retina) for crisp display
- Animations are disabled for consistent screenshots

## When to Regenerate

Run this script when:
- UI layout changes significantly
- New features are added
- Preparing a new release
- Onboarding documentation is needed
