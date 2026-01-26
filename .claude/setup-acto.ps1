<#
.SYNOPSIS
    Install ACTO skills globally for Claude Code

.DESCRIPTION
    Copies ACTO skill files to the global Claude commands directory (~/.claude/commands)
    and optionally initializes a project with a config file.

.PARAMETER Global
    Install skills to global ~/.claude/commands (default behavior)

.PARAMETER Project
    Initialize current project with acto-config.json

.PARAMETER Force
    Overwrite existing files without prompting

.EXAMPLE
    .\setup-acto.ps1
    # Installs skills globally

.EXAMPLE
    .\setup-acto.ps1 -Project
    # Initializes current project with config file

.EXAMPLE
    .\setup-acto.ps1 -Global -Project -Force
    # Does both, overwriting existing files
#>

param(
    [switch]$Global = $true,
    [switch]$Project,
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Get the directory where this script is located
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$CommandsDir = Join-Path $ScriptDir "commands"
$ConfigSchema = Join-Path $ScriptDir "acto-config.schema.json"
$ConfigExample = Join-Path $ScriptDir "acto-config.json"

# Skills to install
$Skills = @(
    "acto-loop.md",
    "acto-batch.md",
    "acto-status.md",
    "acto-merge.md"
)

function Install-GlobalSkills {
    Write-Host "Installing ACTO skills globally..." -ForegroundColor Cyan

    $GlobalDir = Join-Path $env:USERPROFILE ".claude\commands"

    # Create directory if it doesn't exist
    if (-not (Test-Path $GlobalDir)) {
        New-Item -ItemType Directory -Path $GlobalDir -Force | Out-Null
        Write-Host "  Created $GlobalDir" -ForegroundColor Green
    }

    foreach ($skill in $Skills) {
        $source = Join-Path $CommandsDir $skill
        $dest = Join-Path $GlobalDir $skill

        if (-not (Test-Path $source)) {
            Write-Host "  Warning: $skill not found, skipping" -ForegroundColor Yellow
            continue
        }

        if ((Test-Path $dest) -and -not $Force) {
            $response = Read-Host "  $skill exists. Overwrite? (y/N)"
            if ($response -ne 'y' -and $response -ne 'Y') {
                Write-Host "  Skipped $skill" -ForegroundColor Yellow
                continue
            }
        }

        Copy-Item $source $dest -Force
        Write-Host "  Installed $skill" -ForegroundColor Green
    }

    Write-Host "`nGlobal installation complete!" -ForegroundColor Cyan
    Write-Host "Skills available: /acto-loop, /acto-batch, /acto-status, /acto-merge" -ForegroundColor Gray
}

function Initialize-ProjectConfig {
    Write-Host "`nInitializing project configuration..." -ForegroundColor Cyan

    $ProjectClaudeDir = Join-Path (Get-Location) ".claude"
    $ProjectConfigFile = Join-Path $ProjectClaudeDir "acto-config.json"
    $ProjectSchemaFile = Join-Path $ProjectClaudeDir "acto-config.schema.json"

    # Create .claude directory if needed
    if (-not (Test-Path $ProjectClaudeDir)) {
        New-Item -ItemType Directory -Path $ProjectClaudeDir -Force | Out-Null
        Write-Host "  Created .claude directory" -ForegroundColor Green
    }

    # Copy schema
    if ((Test-Path $ConfigSchema)) {
        if ((Test-Path $ProjectSchemaFile) -and -not $Force) {
            Write-Host "  Schema already exists, skipping" -ForegroundColor Yellow
        } else {
            Copy-Item $ConfigSchema $ProjectSchemaFile -Force
            Write-Host "  Copied acto-config.schema.json" -ForegroundColor Green
        }
    }

    # Create or copy config
    if ((Test-Path $ProjectConfigFile) -and -not $Force) {
        Write-Host "  Config already exists at $ProjectConfigFile" -ForegroundColor Yellow
        Write-Host "  Use -Force to overwrite" -ForegroundColor Gray
    } else {
        # Create a minimal config template
        $configTemplate = @"
{
  "`$schema": "./acto-config.schema.json",
  "build": {
    "command": "npm run build",
    "workingDirectory": "."
  },
  "test": {
    "command": "npm test",
    "workingDirectory": ".",
    "env": {}
  },
  "worktree": {
    "parentDirectory": "..",
    "namingPattern": "{repo}-{issue}",
    "baseBranch": "main"
  },
  "github": {
    "copilotReview": true,
    "autoMergeMethod": "squash",
    "deleteBranchOnMerge": true
  },
  "loop": {
    "maxIterations": 20,
    "maxAttempts": 3,
    "stuckTimeoutMinutes": 5,
    "maxReviewIterations": 3
  },
  "batch": {
    "maxConcurrent": 3,
    "excludeLabels": ["blocked", "wontfix", "on-hold"],
    "preferLabels": ["good-first-issue", "quick-fix"]
  },
  "status": {
    "filePath": ".claude/acto-status.json",
    "staleThresholdMinutes": 10
  }
}
"@
        $configTemplate | Out-File -FilePath $ProjectConfigFile -Encoding utf8
        Write-Host "  Created acto-config.json" -ForegroundColor Green
        Write-Host "`n  Edit $ProjectConfigFile to customize for your project" -ForegroundColor Gray
    }

    Write-Host "`nProject initialization complete!" -ForegroundColor Cyan
}

# Main execution
Write-Host @"

ACTO Skills Setup
=================
"@ -ForegroundColor White

if ($Global) {
    Install-GlobalSkills
}

if ($Project) {
    Initialize-ProjectConfig
}

if (-not $Global -and -not $Project) {
    # Default: just install globally
    Install-GlobalSkills
}

Write-Host @"

Next steps:
-----------
1. Run '/acto-loop --issue <number>' to resolve a GitHub issue
2. Run '/acto-batch --count 3' to process multiple issues
3. Run '/acto-status' to check progress
4. Run '/acto-merge' to merge completed PRs

For project-specific config, run:
  .\setup-acto.ps1 -Project

"@ -ForegroundColor Gray
