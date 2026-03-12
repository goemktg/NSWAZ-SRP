# Universal Development Template

A standardized template for **any software development project** with **GitHub Copilot** integration and AI-powered workflows.

> **📌 Project-Specific Details**: For actual project structure, build instructions, and tech stack, refer to **[documents/PROJECT.md](documents/PROJECT.md)**.

## Features

- 🤖 **AI-Optimized**: Pre-configured GitHub Copilot instructions, custom agents, and agent skills
- 📊 **Flexible Structure**: Adaptable to any project type (Web, Game, ML/AI, Modding, etc.)
- 🔄 **Reproducible**: Version control, configuration management, type-safe code practices
- 📝 **Documentation-First**: Structured documentation workflow with templates
- 🧩 **Extensible**: Agent skills for automated workflows and best practices
- 🌐 **Multi-Language**: Support for Korean + English documentation

## Quick Start

```bash
# Clone your project
git clone <repository-url>
cd <project-directory>

# Install dependencies (adapt to your project)
# Python: uv sync
# Node.js: npm install
# .NET: dotnet restore
# RimWorld Mod: See documents/BUILD_GUIDE.md

# Run your project (adapt to your project)
# Python: uv run python src/main.py
# Node.js: npm start
# .NET: dotnet run
# RimWorld Mod: Copy to mods folder and launch game
```

## Project Structure

> **📌 For detailed project structure**: See **[documents/PROJECT.md](documents/PROJECT.md)** for the actual directory layout and organization specific to this project.

This template provides a standardized structure that adapts to any project type:

```text
.
├── .github/                 # GitHub Copilot configuration
│   ├── agents/              # Custom agents (.agent.md)
│   ├── skills/              # Agent Skills (workflows)
│   └── copilot-instructions.md
├── documents/               # Documentation hub
│   ├── PROJECT.md           # ⭐ Project overview (start here!)
│   ├── final/               # Published documents
│   ├── drafts/              # Work in progress
│   └── reference/           # External references
├── src/                     # Source code
├── tests/                   # Test files
├── scripts/                 # Automation scripts
└── AGENTS.md                # Agent documentation
```

**Adaptable to**:

- Software development (Web, Desktop, Mobile)
- Research & ML/AI projects
- Game & mod development
- Infrastructure & DevOps

## AI Agents

This template includes pre-configured GitHub Copilot agents for common development tasks:

| Agent | Description |
| :--- | :--- |
| `@orchestrator` | Autonomous Task Manager & Master Planner |
| `@fixer` | Autonomous problem-solving & execution agent |
| `@doc-writer` | Documentation Writer (creates structured docs) |
| `@doc-reviewer` | Documentation Reviewer (quality checks) |
| `@code-generator` | Code generation with best practices |
| `@code-quality-reviewer` | Code quality & standards compliance |
| `@validator` | Verification and validation |
| `@architect` | System architecture & design |
| `@research-gemini` | Implementation-focused research |
| `@research-gpt` | Theory-focused research |
| `@research-claude` | System/Safety-focused research |
| `@planner-*` | Strategic planning (Gemini/GPT/Claude variants) |
| `@idea-generator-*` | Ideation (Gemini/GPT/Claude variants) |

**See [AGENTS.md](AGENTS.md) for full documentation.**

## Agent Skills

Agent Skills are specialized workflows automatically loaded by Copilot:

| Skill | Description |
| :--- | :--- |
| `documentation` | Standardized doc creation and formatting |
| `code-review` | Code quality checklist and best practices |
| `deep-research` | Recursive research workflow (STORM-style) |
| `data-analysis` | Result visualization and statistical comparison |
| `skill-extension` | Create and extend agent skills |
| `external-skill-generation` | Generate skills from external documentation |

**See [AGENTS.md](AGENTS.md) for usage examples.**

## Documentation Workflow

### Document Types

| Type | Location | Purpose |
| :--- | :--- | :--- |
| **Final Reports** | `documents/final/` | Completed, reviewed documents |
| **Drafts** | `documents/drafts/` | Work in progress |
| **Technical Reference** | `documents/reference/technical/` | API docs, guides |
| **Paper Summaries** | `documents/reference/papers/` | Research summaries |
| **Templates** | `documents/templates/` | Standard forms |

### Documentation Guidelines

1. **Write drafts in `documents/drafts/`** - Not ready for publication
2. **Move to `documents/final/`** - After review and approval
3. **Use Memory MCP for notes** - Don't create `*.memory.md` files
4. **Follow project language policy** - See `.github/copilot-instructions.md`

## Development Workflow

### Working with Agents

1. **Check [AGENTS.md](AGENTS.md)** - Find the right agent for your task
2. **Invoke agent** - Use `@agent-name` in Copilot chat
3. **Provide context** - Clear requirements and constraints
4. **Review output** - Validate and iterate

### Using Skills

Skills are automatically loaded by Copilot when relevant. You can also manually load them:

```bash
# Load a skill
@workspace /skills documentation

# Use skill in context
@doc-writer Create a technical guide for feature X using the documentation skill
```

### Memory Management

Use **Memory MCP** (`mcp_memory_*` tools) for transient data:

- Observations/Notes → `mcp_memory_store`
- Prior context lookup → `mcp_memory_search`
- List all memories → `mcp_memory_list`

**DO NOT** create local `*.memory.md` files.

## Project Adaptation Guide

### For Different Project Types

**RimWorld Mod Development**:

- Structure: See [documents/PROJECT.md](documents/PROJECT.md)
- Build: MSBuild, .NET Framework 4.8
- Test: In-game testing with Debug Mode

**ML/AI Research**:

- Add: `configs/`, `results/`, `checkpoints/`
- Tools: PyTorch, TensorFlow, Weights & Biases
- Test: Reproducibility checks, statistical validation

**Web Development**:

- Add: `frontend/`, `backend/`, `api/`, `public/`
- Tools: React, Node.js, Express, Next.js
- Test: Unit tests, integration tests, E2E tests

**Game Development**:

- Add: `assets/`, `scenes/`, `scripts/`, `prefabs/`
- Tools: Unity, Unreal, Godot
- Test: Playtesting, performance profiling

**General Software**:

- Standard structure works out of the box
- Adapt as needed for your tech stack

### Customization Steps

1. **Update `documents/PROJECT.md`** - Add project-specific details
2. **Configure `.github/copilot-instructions.md`** - Set coding standards
3. **Add custom agents** - Create `.github/agents/<name>.agent.md`
4. **Create skills** - Add `.github/skills/<name>/SKILL.md`
5. **Update AGENTS.md** - Document your custom agents

## Getting Started

**First-time project setup**:

1. **Read [documents/PROJECT.md](documents/PROJECT.md)** - Understand your project
2. **Check [AGENTS.md](AGENTS.md)** - Learn about available agents
3. **Review [documents/QUICKSTART.md](documents/QUICKSTART.md)** - Quick start guide
4. **Follow [documents/BUILD_GUIDE.md](documents/BUILD_GUIDE.md)** - Build your project
5. **Use [documents/TEST_GUIDE.md](documents/TEST_GUIDE.md)** - Test your work

## Documentation

- **[documents/PROJECT.md](documents/PROJECT.md)** - Project overview and specifics
- **[AGENTS.md](AGENTS.md)** - AI agent documentation (must-read!)
- **[documents/AGENT_MANUAL.md](documents/AGENT_MANUAL.md)** - AI agent operation manual
- **[documents/QUICKSTART.md](documents/QUICKSTART.md)** - Quick start guide
- **[documents/CHANGELOG.md](documents/CHANGELOG.md)** - Change history
- **[.github/copilot-instructions.md](.github/copilot-instructions.md)** - Development guidelines

## Reference Codes

The `reference_codes/` directory stores **external code used as reference** during development.

**Management Principles**:

- ✅ Include: External projects, library examples, prototype code
- ❌ Exclude: Active project code (`src/`), archived versions (`archive/`), documentation (`documents/`)

**Guidelines**:

1. Verify and comply with licenses
2. Document version/date information clearly
3. Reference code is read-only (no direct modifications)
4. Regularly update or remove outdated references

**See [documents/PROJECT.md](documents/PROJECT.md) for project-specific references.**

## Contributing

This is a template project. To use it:

1. Clone or fork this repository
2. Adapt the structure to your project type
3. Update `documents/PROJECT.md` with your project details
4. Customize agents and skills as needed
5. Remove this section and add your project-specific content

## License

[Specify your license]

## Links

- [GitHub Copilot Documentation](https://docs.github.com/en/copilot)
- [Agent Skills Specification](https://agentskills.io/specification)
- [VS Code Copilot Customization](https://code.visualstudio.com/docs/copilot/customization/agent-skills)
- [Keep a Changelog](https://keepachangelog.com/)
- [Semantic Versioning](https://semver.org/)

---

**Template Version**: 1.0.1  
**Last Updated**: 2026-03-06
