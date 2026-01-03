# 🔍 Full Repository Crime Story Generator

## Overview
This feature reads **the entire repository** and generates a dramatic crime investigation story using Gemini AI.

## How It Works

### 1. **Full Repository Scan** 📂
- Fetches ALL files from the repository (up to 100 code files)
- Filters out build artifacts, node_modules, minified files
- Includes: `.js`, `.ts`, `.py`, `.java`, `.go`, `.rs`, `.rb`, `.php`, `.cpp`, `.cs`, `.swift`, `.kt`, `.vue`, `.html`, `.css`, `.md`, `.json`, `.yml`, etc.
- Reads actual file contents (up to 100KB per file)

### 2. **Code Analysis** 🧬
For each file, the system analyzes:
- Lines of code
- TODO/FIXME/BUG/HACK comments
- Complexity score (based on file size)
- File extension and language

### 3. **Pattern Detection** 🎯
Automatically detects:
- Test-Driven Development
- Containerization (Docker)
- CI/CD Pipelines
- RESTful API Architecture
- React/Vue/Angular frameworks
- TypeScript usage
- Database layers
- Monorepo structure

### 4. **Crime Story Generation** 🎭
Gemini AI creates a dramatic investigation story:
- **Detective Marcus Kane** narrates the investigation
- Treats the codebase as a crime scene
- Files become evidence
- Bugs are crimes to solve
- Architecture patterns are forensic clues
- TODO comments are suspicious findings

## Story Structure

1. **Opening Hook** (30s) - Dramatic scene-setting
2. **Introduce the Victim** (1 min) - What is this repo?
3. **The Crime Scene** (2-3 min) - Walk through the codebase
4. **Forensic Analysis** (2-3 min) - Deep dive into patterns
5. **The Twist** (1 min) - Unexpected discovery
6. **Closing the Case** (1 min) - Final verdict

## API Flow

```
POST /api/analyze
  ├─ 5%: Opening case file
  ├─ 15%: Searching crime scene
  ├─ 25%: Cataloging evidence
  ├─ 40%: Reading files
  ├─ 55%: Analyzing patterns
  ├─ 65%: Found suspicious patterns
  ├─ 75%: Crafting narrative
  ├─ 90%: Story written
  └─ 100%: Case closed!
```

## Files Modified

### 1. `/app/api/analyze/route.ts`
- Changed from "intelligent file selector" to "full repo reader"
- Added crime-themed progress messages
- Calls `fetchFullRepository()` instead of `fetchCompleteRepository()`

### 2. `/lib/github/fetcher.ts`
- Added `fetchFullRepository()` method
- Reads up to 100 code files
- Filters out unnecessary files
- Analyzes each file for interesting patterns
- Returns all files with content

### 3. `/lib/gemini.ts`
- Complete rewrite of the prompt
- Detective Marcus Kane persona
- Crime investigation narrative structure
- References actual file contents
- Includes code snippets in the prompt
- More detailed story arc (7-10 minutes)

## Example Usage

```bash
# Start the server
npm run dev

# Test with a repository
curl -X POST http://localhost:3000/api/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "repo_url": "https://github.com/facebook/react",
    "narrative_style": "true-crime"
  }'
```

## Configuration

### Max Files
Default: 100 files
Change in `/lib/github/fetcher.ts`:
```typescript
const maxFiles = options?.maxFiles || 100;
```

### Max File Size
Default: 100KB per file
Change in `/lib/github/fetcher.ts`:
```typescript
const maxFileSize = options?.maxFileSize || 100 * 1024;
```

### Narrative Styles
- `true-crime` (default) - Detective Marcus Kane
- `sports` - High-energy sports commentary
- `documentary` - David Attenborough style
- `comedy` - Stand-up comedian code review

## Output Format

The generated script includes:
```json
{
  "title": "The React Investigation: A Tale of Components and Hooks",
  "narrator_voice": "detective",
  "dramatic_arc": "A veteran developer created React...",
  "segments": [
    {
      "speaker": "narrator",
      "text": "On the night of May 29th, 2013...",
      "emotion": "mysterious",
      "sound_effect": "suspenseful_music",
      "code_reference": {
        "file": "packages/react/src/React.js",
        "line": 42
      }
    }
  ]
}
```

## What's Next? 🚀

To complete the full pipeline:
1. **ElevenLabs Integration** - Convert script to multi-speaker audio
2. **Cloudflare R2** - Store and serve audio files
3. **Vectorize Integration** - Index code chunks for semantic search
4. **Pattern Learning** - Learn from previous investigations

## Testing

Try these repos for best results:
- Small repos (< 50 files): Quick, focused stories
- Medium repos (50-100 files): Perfect balance
- Framework repos: Lots of patterns to detect

Avoid:
- Mega repos (> 500MB)
- Repos with mostly binary files
- Empty repositories

---

**Status**: ✅ Feature Complete
**Version**: 1.0.0
**Last Updated**: January 2, 2026
