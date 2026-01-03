import { GoogleGenerativeAI } from '@google/generative-ai';
import { NarrativeStyle, PodcastScript, ScriptSegment } from './types';
import { FileWithContent } from './github/fetcher';
import { GitHubRepo } from './github/client';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Voice IDs for different styles
export const VOICE_IDS = {
  detective: '8iDUAV5slUpRv30f3cyz', // Main detective voice
  sports_commentator_1: 'gU0LNdkMOQCOrPrwtbee', // Sports voice 1
  sports_commentator_2: 'UPZIegnxY8z2Ya7jignw', // Sports voice 2
  documentary: '8iDUAV5slUpRv30f3cyz', // Documentary narrator
};

export async function generatePodcastScript(
  repoData: GitHubRepo,
  files: FileWithContent[],
  narrativeStyle: NarrativeStyle,
  context?: {
    selectedFilesSummary?: any;
    statistics?: any;
    patterns?: string[];
    fullRepoContext?: boolean;
  }
): Promise<PodcastScript> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  // Get style-specific prompt
  const stylePrompt = getStyleSpecificPrompt(narrativeStyle, repoData, files, context);

  console.log('[Gemini] Generating script with style:', narrativeStyle);
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('[Gemini] ❌ GEMINI_API_KEY is missing!');
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  console.log('[Gemini] Calling Gemini API...');
  
  let result;
  try {
    // Add timeout for Gemini API call (90 seconds)
    result = await Promise.race([
      model.generateContent(stylePrompt),
      new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Gemini API timeout after 90 seconds')), 90000)
      )
    ]);
  } catch (apiError: any) {
    console.error('[Gemini] ❌ API call failed:', apiError?.message);
    throw new Error(`Gemini API error: ${apiError?.message || 'Unknown error'}`);
  }
  
  const response = result.response;
  const text = response.text();

  if (!text) {
    throw new Error('Gemini returned an empty response');
  }

  // Parse the JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    const previewText = text.length > 200 ? text.substring(0, 200) : text;
    console.error('[Gemini] Failed to parse JSON from response:', previewText);
    throw new Error('Failed to parse script from Gemini response');
  }

  let scriptData;
  try {
    scriptData = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('[Gemini] JSON parse error:', parseError);
    throw new Error('Failed to parse JSON from Gemini response');
  }

  console.log(`[Gemini] ✅ Script generated: "${scriptData.title}" with ${scriptData.segments?.length || 0} segments`);

  // Validate and sanitize segments to prevent undefined text errors
  const validatedSegments = (scriptData.segments || [])
    .filter((seg: any) => seg && typeof seg === 'object')
    .map((seg: any) => ({
      speaker: seg.speaker || 'narrator',
      text: String(seg.text || '').trim(),
      emotion: seg.emotion || undefined,
      sound_effect: seg.sound_effect || undefined,
      code_reference: seg.code_reference || undefined,
    }))
    .filter((seg: any) => seg.text.length > 0); // Remove empty text segments

  if (validatedSegments.length === 0) {
    console.error('[Gemini] No valid segments found in script');
    throw new Error('Generated script has no valid segments');
  }

  console.log(`[Gemini] ✅ Validated ${validatedSegments.length} segments`);

  return {
    title: scriptData.title || 'Untitled Investigation',
    narrator_voice: scriptData.narrator_voice || 'detective',
    dramatic_arc: scriptData.dramatic_arc || '',
    segments: validatedSegments,
    total_duration: 0,
  };
}

function getStyleSpecificPrompt(
  style: NarrativeStyle,
  repoData: GitHubRepo,
  files: FileWithContent[],
  context?: any
): string {
  const baseRepoInfo = `
📂 REPOSITORY INFORMATION:
- **Repository**: ${repoData.fullName}
- **Description**: ${repoData.description || 'No description provided'}
- **Primary Language**: ${repoData.language}
- **Stars**: ${repoData.stars}
- **Files Examined**: ${context?.statistics?.analyzedFiles || files.length} files
${repoData.topics && repoData.topics.length > 0 ? `- **Topics**: ${repoData.topics.join(', ')}` : ''}

🧬 LANGUAGES:
${context?.statistics?.languages 
  ? Object.entries(context.statistics.languages)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .slice(0, 5)
      .map(([lang, count]) => `  - ${lang}: ${count} files`)
      .join('\n')
  : `  - ${repoData.language || 'Multiple languages'}`}

🔎 KEY FILES:
${files.slice(0, 15).map((f, idx) => {
  const analysis = f.analysis;
  return `${idx + 1}. **${f.path}** - ${f.size} bytes${
     analysis?.interestingComments && analysis.interestingComments.length > 0
       ? ` | Note: ${analysis.interestingComments[0]}`
       : ''
   }`;
}).join('\n')}

🎯 DETECTED PATTERNS:
${context?.patterns && context.patterns.length > 0 
  ? context.patterns.map((p: string) => `  - ${p}`).join('\n')
  : '  - Standard codebase structure'}

📝 SAMPLE CODE (for reference):
${files.slice(0, 2).map(f => `
--- ${f.path} ---
\`\`\`
${f.content?.substring(0, 400)}${f.content && f.content.length > 400 ? '...' : ''}
\`\`\`
`).join('\n')}`;

  if (style === NarrativeStyle.SPORTS) {
    return getSportsCommentaryPrompt(repoData, baseRepoInfo);
  } else if (style === NarrativeStyle.DOCUMENTARY) {
    return getDocumentaryPrompt(repoData, baseRepoInfo);
  } else {
    // TRUE_CRIME is default
    return getTrueCrimePrompt(repoData, baseRepoInfo);
  }
}

function getTrueCrimePrompt(repoData: GitHubRepo, baseRepoInfo: string): string {
  return `You are Detective Mongo D Bane., lead investigator for the Code Crime Unit. The rain is pouring, and this codebase is the primary suspect.

${baseRepoInfo}

🎬 CREATE A HARD-BOILED TRUE CRIME SCRIPT (STRICTLY 4 MINUTES MAX - 550 to 600 words)

CRITICAL EXECUTION RULES:
1. **CREDIT CONSERVATION**: Maximum 600 words. ElevenLabs credits are precious—make every word count.
2. **THE NOIR VIBE**: Use gritty Noir tropes. The repo isn't "software"; it's a "suspect." Functions are "alibis." Classes are "accomplices." Complex code segments are "evidence of a struggle."
3. **INTERROGATE THE TARGET**: Don't be polite. Grill the architecture. Find the "motive" behind the design choices. Is it a clean operation or a messy hit?
4. **FORMAT**: 
   - "narrator" = The Detective (Cynical, gravelly, low-tone dialogue).
   - "sound_effect" = Use sparingly for high-impact atmosphere.

STRUCTURE:
1. **THE CRIME SCENE** (30s): Atmosphere. The discovery of ${repoData.name}.
2. **THE AUTOPSY** (1m): Break down the tech stack as the victim's anatomy.
3. **THE GRILLING** (1.5m): Confront the Key Files and Patterns. Point out the "shady" logic and complex files.
4. **THE VERDICT** (1m): Final judgment on the codebase. Is it going to the chair or walking free?

📋 REQUIRED JSON FORMAT:
{
  "title": "CASE FILE #${repoData.name.toUpperCase()}: The [Gritty Noir Subtitle]",
  "narrator_voice": "detective",
  "dramatic_arc": "A high-stakes forensic analysis of ${repoData.fullName}",
  "segments": [...]
}

AVAILABLE SOUND EFFECTS: suspenseful_music, dramatic_pause, thunder, keyboard_typing, door_slam, footsteps, record_scratch, static_noise`;
}

function getSportsCommentaryPrompt(repoData: GitHubRepo, baseRepoInfo: string): string {
  return `You are TWO high-octane football commentators. This isn't just code; it's a championship battle!

${baseRepoInfo}

🎬 CREATE A SPORTS "MATCH OF THE DAY" SCRIPT (STRICTLY 4 MINUTES MAX - 550 to 600 words)

CRITICAL EXECUTION RULES:
1. **EFFICIENCY**: Maximum 600 words total. Keep it fast-paced.
2. **THE TWO-VOICE VIBE**: High-energy "Play-by-play" (Commentator 1) and "Color Commentary" (Commentator 2). Use intense football metaphors (e.g., "That React Architecture is playing a high-line defense!").
3. **CALL THE PLAYS**: Hype the clever logic, but call out the "fumbles" (complex code or bad patterns).
4. **FORMAT**: 
   - Rapid-fire exchanges between "commentator_1" and "commentator_2".

STRUCTURE:
1. **KICKOFF** (30s): Stadium roar. Introduce the underdog repository.
2. **FIRST HALF** (1.5m): Power through the architecture. Fast, exciting analysis.
3. **CRUNCH TIME** (1.5m): Analyze the key patterns. A touchdown for the logic or a defensive collapse?
4. **FINAL WHISTLE** (30s): The final score and a legendary closing call.

📋 REQUIRED JSON FORMAT:
{
  "title": "${repoData.name.toUpperCase()} vs The Competition: [Epic Title]",
  "narrator_voice": "sports",
  "dramatic_arc": "Championship match coverage for ${repoData.name}",
  "segments": [...]
}

AVAILABLE SOUND EFFECTS: crowd_cheering, whistle, goal_horn, crowd_gasp, applause, stadium_ambience`;
}

function getDocumentaryPrompt(repoData: GitHubRepo, baseRepoInfo: string): string {
  return `You are a world-class naturalist. You are observing a rare digital organism in its server habitat.

${baseRepoInfo}

🎬 CREATE A DOCUMENTARY SCRIPT (STRICTLY 4 MINUTES MAX - 550 to 600 words)

CRITICAL EXECUTION RULES:
1. **PRECISION**: Maximum 600 words. Silence and ambience are key.
2. **THE ATTENBOROUGH VIBE**: Calm, hushed, awe-struck. Code is biology. Databases are "nesting grounds." Functions are "predators." APIs are "symbiotic relationships."
3. **OBSERVATION**: Analyze how this "organism" adapts or fails to survive the wild.
4. **FORMAT**: 
   - "narrator" = Calm, observational, cinematic tone.

STRUCTURE:
1. **THE DISCOVERY** (30s): Stumbling upon the ${repoData.name} ecosystem.
2. **ECOLOGICAL STUDY** (1.5m): How the stack and structure survive together.
3. **THE STRUGGLE** (1.5m): The fight of clean logic against the encroaching bugs.
4. **SURVIVAL PROGNOSIS** (30s): Will this codebase evolve or go extinct?

📋 REQUIRED JSON FORMAT:
{
  "title": "The ${repoData.name} Chronicles: A Digital Evolution",
  "narrator_voice": "documentary",
  "dramatic_arc": "The survival story of a digital ecosystem",
  "segments": [...]
}

AVAILABLE SOUND EFFECTS: nature_ambience, birds_chirping, wind, water_flowing, dramatic_strings, gentle_music`;
}
export async function analyzeCodePatterns(files: FileWithContent[]): Promise<string[]> {
  const patterns: string[] = [];

  // Enhanced pattern detection using file content and analysis
  const fileExtensions = files.map((f) => f.path.split('.').pop());
  const uniqueExtensions = [...new Set(fileExtensions)];
  const filePaths = files.map(f => f.path.toLowerCase());

  // Testing patterns
  if (filePaths.some(p => p.includes('test') || p.includes('spec') || p.includes('__tests__'))) {
    patterns.push('Test-Driven Development');
  }

  // Containerization
  if (filePaths.some((f) => f.includes('docker') || f.includes('dockerfile'))) {
    patterns.push('Containerization');
  }

  // CI/CD
  if (filePaths.some((f) => f.includes('.github/workflows') || f.includes('.gitlab-ci') || f.includes('jenkins'))) {
    patterns.push('CI/CD Pipeline');
  }

  // API patterns
  if (filePaths.some((f) => f.includes('api') || f.includes('routes') || f.includes('endpoints'))) {
    patterns.push('RESTful API Architecture');
  }

  // Frontend frameworks
  if (uniqueExtensions.includes('jsx') || uniqueExtensions.includes('tsx')) {
    patterns.push('React Architecture');
  }
  if (filePaths.some(f => f.includes('vue'))) {
    patterns.push('Vue.js Architecture');
  }
  if (filePaths.some(f => f.includes('angular'))) {
    patterns.push('Angular Architecture');
  }

  // Backend frameworks
  if (filePaths.some(f => f.includes('express') || f.includes('fastapi') || f.includes('flask') || f.includes('django'))) {
    patterns.push('Backend Framework');
  }

  // Database patterns
  if (filePaths.some(f => f.includes('model') || f.includes('schema') || f.includes('migration'))) {
    patterns.push('Database Layer');
  }

  // Configuration management
  if (filePaths.some(f => f.includes('.env') || f.includes('config'))) {
    patterns.push('Environment Configuration');
  }

  // TypeScript usage
  if (uniqueExtensions.includes('ts') || uniqueExtensions.includes('tsx')) {
    patterns.push('TypeScript Type Safety');
  }

  // Monorepo structure
  if (filePaths.some(f => f.includes('packages/') || f.includes('apps/'))) {
    patterns.push('Monorepo Structure');
  }

  // Analyze complexity
  const highComplexityFiles = files.filter(f => 
    f.analysis?.linesOfCode && f.analysis.linesOfCode > 200
  );
  if (highComplexityFiles.length > 3) {
    patterns.push('Complex Codebase');
  }

  // Check for interesting comments
  const filesWithTodos = files.filter(f => 
    f.analysis?.interestingComments?.some(c => c.toLowerCase().includes('todo'))
  );
  if (filesWithTodos.length > 5) {
    patterns.push('Work in Progress');
  }

  return [...new Set(patterns)]; // Remove duplicates
}