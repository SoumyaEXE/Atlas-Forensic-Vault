# GitHub Repository Analysis Setup - Complete

## ✅ Installation Complete

### Packages Installed
- `@octokit/rest@^21.0.2` - Official GitHub REST API client
- `zod@^3.24.1` - TypeScript-first schema validation
- `server-only@^0.0.1` - Ensures server-side only code execution

### Files Created

#### 1. `lib/github/types.ts`
Complete TypeScript type definitions including:
- `GitHubRepository` - Repository metadata
- `GitHubFile` - File information and content
- `GitHubTree` - Repository file tree structure
- `RepoAnalysisData` - Complete analysis data structure
- `AnalyzedFile` - File with analysis metadata
- `FileStructure` - Hierarchical file organization
- `RepoStatistics` - Repository metrics
- `LanguageDistribution` - Language usage breakdown
- `FileTypeDistribution` - File type statistics
- `GitHubRateLimit` - Rate limit tracking
- `FetchOptions` - Configurable fetch parameters
- `CodePattern` - Code pattern detection
- `DependencyInfo` - Package dependency information
- `PackageJson` - Package.json structure

#### 2. `lib/github/config.ts`
GitHub API configuration with:

**Features:**
- Singleton Octokit instance with authentication
- Rate limit checking and management
- Retry logic with exponential backoff
- Comprehensive error types (RateLimitError, RepositoryNotFoundError, etc.)
- File fetch configuration with smart defaults
- Language detection by extension
- URL validation utilities

**Rate Limiting:**
- Authenticated: 5000 requests/hour
- Unauthenticated: 60 requests/hour
- Auto-stops at 90% of limit
- Smart retry with reset time handling

**File Filtering:**
- Max 100 files per analysis
- Max 1MB per file
- Max 50MB total size
- Excludes node_modules, dist, build, test files
- Includes all major programming languages

**Error Handling:**
- `GitHubApiError` - Base error class
- `RateLimitError` - Rate limit exceeded with reset time
- `RepositoryNotFoundError` - 404 errors
- `RepositoryAccessDeniedError` - 403 permission errors
- Automatic retry (max 3 attempts) with backoff

#### 3. Environment Variables (`.env.local`)
```env
GITHUB_TOKEN=               # Optional for public repos, required for private
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

## Usage Examples

### 1. Initialize Octokit Client
```typescript
import { getOctokit } from '@/lib/github/config';

const octokit = getOctokit();
```

### 2. Check Rate Limit
```typescript
import { checkRateLimit, waitForRateLimit } from '@/lib/github/config';

const rateLimit = await checkRateLimit();
console.log(`Remaining: ${rateLimit.remaining}/${rateLimit.limit}`);

// Throws RateLimitError if exceeded
await waitForRateLimit();
```

### 3. Fetch Repository with Retry
```typescript
import { getOctokit, retryWithBackoff } from '@/lib/github/config';

const data = await retryWithBackoff(async () => {
  const octokit = getOctokit();
  const { data } = await octokit.repos.get({
    owner: 'facebook',
    repo: 'react'
  });
  return data;
});
```

### 4. Validate GitHub URL
```typescript
import { isValidGitHubUrl } from '@/lib/github/config';

if (isValidGitHubUrl('https://github.com/facebook/react')) {
  // Valid URL
}
```

### 5. Type-Safe Repository Analysis
```typescript
import type { RepoAnalysisData, AnalyzedFile } from '@/lib/github/types';

const analysis: RepoAnalysisData = {
  repository: repoData,
  files: analyzedFiles,
  structure: fileStructure,
  languages: languageStats,
  contributors: contributors,
  recentCommits: commits,
  statistics: stats
};
```

## Next Steps

### 1. Enhanced GitHub Fetcher (`lib/github/fetcher.ts`)
```typescript
// TODO: Implement
export async function fetchRepositoryComplete(
  owner: string,
  repo: string,
  options?: FetchOptions
): Promise<RepoAnalysisData>
```

Features to implement:
- Full repository data fetching
- Smart file selection (prioritize important files)
- Parallel file content fetching
- Progress tracking
- Caching layer
- Content deduplication

### 2. Code Analysis (`lib/github/analyzer.ts`)
```typescript
// TODO: Implement
export async function analyzeCodePatterns(
  files: AnalyzedFile[]
): Promise<CodePattern[]>
```

Features to implement:
- Function/class detection
- Import dependency mapping
- Code complexity calculation
- Security issue detection
- Best practice violations
- Architecture pattern recognition

### 3. Update Existing `lib/github.ts`
Refactor to use the new types and config:
```typescript
import { getOctokit, FETCH_CONFIG } from './github/config';
import type { GitHubRepository, FetchOptions } from './github/types';
```

### 4. API Route Integration
Update `/api/github/fetch/route.ts` to use new system:
```typescript
import { fetchRepositoryComplete } from '@/lib/github/fetcher';
import { checkRateLimit } from '@/lib/github/config';
```

### 5. MongoDB Schema
Add indexes for efficient queries:
```typescript
// repositories collection
{
  "github_id": 1,
  "full_name": 1,
  "owner": 1,
  "repo": 1,
  "analyzed_at": 1
}
```

## Configuration Options

### Customize File Fetch Limits
Edit `FETCH_CONFIG` in `lib/github/config.ts`:
```typescript
export const FETCH_CONFIG = {
  MAX_FILES: 200,           // Increase for larger repos
  MAX_FILE_SIZE: 2097152,   // 2MB
  MAX_TOTAL_SIZE: 104857600, // 100MB
};
```

### Add More Language Extensions
```typescript
export const LANGUAGE_EXTENSIONS: Record<string, string> = {
  '.dart': 'Dart',
  '.sol': 'Solidity',
  // Add more...
};
```

### Adjust Rate Limit Buffer
```typescript
export const RATE_LIMIT_CONFIG = {
  BUFFER_PERCENTAGE: 0.2, // Stop at 80% instead of 90%
};
```

## Error Handling Best Practices

```typescript
try {
  const data = await fetchRepository(owner, repo);
} catch (error) {
  if (error instanceof RateLimitError) {
    // Show retry time to user
    return { error: `Rate limited. Try again at ${error.resetTime}` };
  }
  
  if (error instanceof RepositoryNotFoundError) {
    return { error: 'Repository not found' };
  }
  
  if (error instanceof RepositoryAccessDeniedError) {
    return { error: 'Private repository. Add GITHUB_TOKEN to access.' };
  }
  
  // Generic error
  return { error: 'Failed to fetch repository' };
}
```

## Testing

### Health Check
Test the setup:
```bash
curl http://localhost:3001/api/health
```

### Parse GitHub URL
```bash
curl -X POST http://localhost:3001/api/github/parse \
  -H "Content-Type: application/json" \
  -d '{"url": "https://github.com/facebook/react"}'
```

### Fetch Repository
```bash
curl -X POST http://localhost:3001/api/github/fetch \
  -H "Content-Type: application/json" \
  -d '{"owner": "facebook", "repo": "react"}'
```

## Performance Considerations

1. **Caching**: Implement Redis/memory cache for:
   - Repository metadata (TTL: 1 hour)
   - File content (TTL: 24 hours)
   - Rate limit status (TTL: 1 minute)

2. **Parallel Processing**: Fetch multiple files concurrently:
   ```typescript
   const files = await Promise.all(
     filePaths.map(path => fetchFileContent(path))
   );
   ```

3. **Streaming**: For large repositories, use streaming:
   ```typescript
   const stream = octokit.repos.getArchiveLink({
     archive_format: 'tarball',
     ref: 'main'
   });
   ```

4. **Incremental Updates**: Only fetch changed files:
   ```typescript
   const commits = await octokit.repos.listCommits({
     since: lastAnalyzedAt
   });
   ```

## Security

- ✅ `server-only` ensures API keys never leak to client
- ✅ Environment variables for sensitive data
- ✅ Rate limit protection prevents abuse
- ✅ URL validation prevents SSRF attacks
- ✅ File size limits prevent DoS
- ⚠️ TODO: Add request signing for webhook verification
- ⚠️ TODO: Implement user-based rate limiting

## Monitoring

Add logging for:
- Rate limit usage
- API errors
- Slow requests (>5s)
- Failed retries
- Invalid URLs

```typescript
console.log('[GitHub API]', {
  action: 'fetch_repo',
  owner,
  repo,
  duration: endTime - startTime,
  rateLimit: remaining,
  success: true
});
```
