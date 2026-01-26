#!/bin/bash
#
# ACTO Skills Setup Script
# Install ACTO skills globally for Claude Code and/or initialize project config
#
# Usage:
#   ./setup-acto.sh              # Install globally (default)
#   ./setup-acto.sh --project    # Initialize project config
#   ./setup-acto.sh --all        # Both global and project
#   ./setup-acto.sh --force      # Overwrite existing files
#

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMMANDS_DIR="$SCRIPT_DIR/commands"
CONFIG_SCHEMA="$SCRIPT_DIR/acto-config.schema.json"

# Skills to install
SKILLS=(
    "acto-loop.md"
    "acto-batch.md"
    "acto-status.md"
    "acto-merge.md"
)

# Default options
INSTALL_GLOBAL=true
INSTALL_PROJECT=false
FORCE=false

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --project)
            INSTALL_PROJECT=true
            INSTALL_GLOBAL=false
            shift
            ;;
        --all)
            INSTALL_GLOBAL=true
            INSTALL_PROJECT=true
            shift
            ;;
        --force|-f)
            FORCE=true
            shift
            ;;
        --help|-h)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  --project    Initialize project with acto-config.json"
            echo "  --all        Install globally AND initialize project"
            echo "  --force, -f  Overwrite existing files without prompting"
            echo "  --help, -h   Show this help message"
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 1
            ;;
    esac
done

install_global_skills() {
    echo -e "${CYAN}Installing ACTO skills globally...${NC}"

    GLOBAL_DIR="$HOME/.claude/commands"

    # Create directory if it doesn't exist
    if [ ! -d "$GLOBAL_DIR" ]; then
        mkdir -p "$GLOBAL_DIR"
        echo -e "  ${GREEN}Created $GLOBAL_DIR${NC}"
    fi

    for skill in "${SKILLS[@]}"; do
        source="$COMMANDS_DIR/$skill"
        dest="$GLOBAL_DIR/$skill"

        if [ ! -f "$source" ]; then
            echo -e "  ${YELLOW}Warning: $skill not found, skipping${NC}"
            continue
        fi

        if [ -f "$dest" ] && [ "$FORCE" != "true" ]; then
            read -p "  $skill exists. Overwrite? (y/N) " response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                echo -e "  ${YELLOW}Skipped $skill${NC}"
                continue
            fi
        fi

        cp "$source" "$dest"
        echo -e "  ${GREEN}Installed $skill${NC}"
    done

    echo -e "\n${CYAN}Global installation complete!${NC}"
    echo -e "${GRAY}Skills available: /acto-loop, /acto-batch, /acto-status, /acto-merge${NC}"
}

initialize_project_config() {
    echo -e "\n${CYAN}Initializing project configuration...${NC}"

    PROJECT_CLAUDE_DIR="$(pwd)/.claude"
    PROJECT_CONFIG_FILE="$PROJECT_CLAUDE_DIR/acto-config.json"
    PROJECT_SCHEMA_FILE="$PROJECT_CLAUDE_DIR/acto-config.schema.json"

    # Create .claude directory if needed
    if [ ! -d "$PROJECT_CLAUDE_DIR" ]; then
        mkdir -p "$PROJECT_CLAUDE_DIR"
        echo -e "  ${GREEN}Created .claude directory${NC}"
    fi

    # Copy schema
    if [ -f "$CONFIG_SCHEMA" ]; then
        if [ -f "$PROJECT_SCHEMA_FILE" ] && [ "$FORCE" != "true" ]; then
            echo -e "  ${YELLOW}Schema already exists, skipping${NC}"
        else
            cp "$CONFIG_SCHEMA" "$PROJECT_SCHEMA_FILE"
            echo -e "  ${GREEN}Copied acto-config.schema.json${NC}"
        fi
    fi

    # Create config
    if [ -f "$PROJECT_CONFIG_FILE" ] && [ "$FORCE" != "true" ]; then
        echo -e "  ${YELLOW}Config already exists at $PROJECT_CONFIG_FILE${NC}"
        echo -e "  ${GRAY}Use --force to overwrite${NC}"
    else
        cat > "$PROJECT_CONFIG_FILE" << 'EOF'
{
  "$schema": "./acto-config.schema.json",
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
EOF
        echo -e "  ${GREEN}Created acto-config.json${NC}"
        echo -e "\n  ${GRAY}Edit $PROJECT_CONFIG_FILE to customize for your project${NC}"
    fi

    echo -e "\n${CYAN}Project initialization complete!${NC}"
}

# Main execution
echo ""
echo -e "${NC}ACTO Skills Setup${NC}"
echo "================="
echo ""

if [ "$INSTALL_GLOBAL" = "true" ]; then
    install_global_skills
fi

if [ "$INSTALL_PROJECT" = "true" ]; then
    initialize_project_config
fi

echo ""
echo -e "${GRAY}Next steps:${NC}"
echo "-----------"
echo "1. Run '/acto-loop --issue <number>' to resolve a GitHub issue"
echo "2. Run '/acto-batch --count 3' to process multiple issues"
echo "3. Run '/acto-status' to check progress"
echo "4. Run '/acto-merge' to merge completed PRs"
echo ""
echo "For project-specific config, run:"
echo "  ./setup-acto.sh --project"
echo ""
