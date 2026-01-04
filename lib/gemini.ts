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
  console.log(`[Gemini] Prompt length: ${stylePrompt.length} characters`);

  // Truncate prompt if too large (Gemini has token limits)
  const MAX_PROMPT_LENGTH = 30000; // ~7500 tokens
  const truncatedPrompt = stylePrompt.length > MAX_PROMPT_LENGTH 
    ? stylePrompt.substring(0, MAX_PROMPT_LENGTH) + '\n\n[Content truncated for length. Generate script based on available information.]'
    : stylePrompt;
  
  if (truncatedPrompt.length < stylePrompt.length) {
    console.log(`[Gemini] Prompt truncated from ${stylePrompt.length} to ${truncatedPrompt.length} characters`);
  }
  
  if (!process.env.GEMINI_API_KEY) {
    console.error('[Gemini] ❌ GEMINI_API_KEY is missing!');
    throw new Error('GEMINI_API_KEY is not configured');
  }
  
  console.log('[Gemini] Calling Gemini API...');
  
  let result;
  try {
    // Add timeout for Gemini API call (90 seconds)
    result = await Promise.race([
      model.generateContent(truncatedPrompt),
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
    console.error('[Gemini] Failed to find JSON in response:', previewText);
    console.log('[Gemini] Using fallback script for repository');
    // Use fallback script when JSON parsing completely fails
    return {
      title: `The Case of ${repoData.name}`,
      narrator_voice: 'detective',
      dramatic_arc: `Investigating ${repoData.fullName}`,
      segments: generateFallbackSegments(repoData, files, narrativeStyle),
      total_duration: 0,
    };
  }

  let scriptData;
  try {
    scriptData = JSON.parse(jsonMatch[0]);
  } catch (parseError) {
    console.error('[Gemini] JSON parse error:', parseError);
    console.error('[Gemini] Attempted to parse:', jsonMatch[0].substring(0, 500));
    console.log('[Gemini] Using fallback script due to parse error');
    // Use fallback script when JSON parsing fails
    return {
      title: `The Case of ${repoData.name}`,
      narrator_voice: 'detective',
      dramatic_arc: `Investigating ${repoData.fullName}`,
      segments: generateFallbackSegments(repoData, files, narrativeStyle),
      total_duration: 0,
    };
  }

  console.log(`[Gemini] ✅ Script generated: "${scriptData.title}" with ${scriptData.segments?.length || 0} segments`);

  // Validate and sanitize segments to prevent undefined text errors
  let validatedSegments = (scriptData.segments || [])
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
    console.warn('[Gemini] No valid segments found, generating fallback script');
    // Generate a fallback script for large/complex repositories
    validatedSegments = generateFallbackSegments(repoData, files, narrativeStyle);
    scriptData.title = scriptData.title || `The Case of ${repoData.name}`;
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

function generateFallbackSegments(
  repoData: GitHubRepo,
  files: FileWithContent[],
  style: NarrativeStyle
): ScriptSegment[] {
  const topLanguages = Object.entries(
    files.reduce((acc, f) => {
      const ext = f.path.split('.').pop() || 'unknown';
      acc[ext] = (acc[ext] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort(([, a], [, b]) => b - a).slice(0, 3).map(([lang]) => lang);

  const keyFiles = files.slice(0, 5).map(f => f.path.split('/').pop()).join(', ');
  
  if (style === NarrativeStyle.SPORTS) {
    return [
      { speaker: 'commentator_1', text: `Ladies and gentlemen, welcome to the biggest match of the season! We're analyzing ${repoData.fullName}!` },
      { speaker: 'commentator_2', text: `What a lineup we have today! ${repoData.stars} stars watching this repository with over ${files.length} files on the field!` },
      { speaker: 'commentator_1', text: `The primary language is ${repoData.language}, and we're seeing impressive plays in ${topLanguages.join(', ')}.` },
      { speaker: 'commentator_2', text: `Key players include ${keyFiles}. This is championship-level code!` },
      { speaker: 'commentator_1', text: `${repoData.description || 'A formidable contender in the open source arena.'}` },
      { speaker: 'commentator_2', text: `And that's the final whistle! What a spectacular showing from ${repoData.name}!` },
    ];
  } else if (style === NarrativeStyle.DOCUMENTARY) {
    return [
      { speaker: 'narrator', text: `In the vast digital wilderness, we discover ${repoData.fullName}. A remarkable ecosystem of code.` },
      { speaker: 'narrator', text: `This organism has attracted ${repoData.stars} observers, drawn to its ${files.length} interconnected components.` },
      { speaker: 'narrator', text: `The primary species here is ${repoData.language}, coexisting with ${topLanguages.join(' and ')}.` },
      { speaker: 'narrator', text: `${repoData.description || 'A fascinating specimen of collaborative evolution.'}` },
      { speaker: 'narrator', text: `Key specimens include ${keyFiles}. Each plays a vital role in this digital ecosystem.` },
      { speaker: 'narrator', text: `And so, ${repoData.name} continues its remarkable journey through the open source landscape.` },
    ];
  } else {
    // TRUE_CRIME default
    return [
      { speaker: 'narrator', text: `The rain hammered the windows. On my desk: the case file for ${repoData.fullName}.`, sound_effect: 'rain' },
      { speaker: 'narrator', text: `${repoData.stars} witnesses had starred this suspect. ${files.length} pieces of evidence to sift through.`, emotion: 'suspicious' },
      { speaker: 'narrator', text: `The primary weapon of choice? ${repoData.language}. With accomplices in ${topLanguages.join(', ')}.` },
      { speaker: 'narrator', text: `${repoData.description || 'The motive was still unclear. But the code would talk.'}`, emotion: 'thoughtful' },
      { speaker: 'narrator', text: `My eyes scanned the key files: ${keyFiles}. Each one held secrets.`, sound_effect: 'keyboard_typing' },
      { speaker: 'narrator', text: `The verdict? ${repoData.name} would need more investigation. But one thing was clear: this codebase had a story to tell.`, emotion: 'conclusive' },
    ];
  }
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