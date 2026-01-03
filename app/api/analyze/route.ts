import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { getGitHubFetcher } from '@/lib/github/fetcher';
import { generatePodcastScript, analyzeCodePatterns } from '@/lib/gemini';
import { NarrativeStyle, AnalysisStatus, Podcast } from '@/lib/types';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'edge';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { repo_url, narrative_style = NarrativeStyle.TRUE_CRIME } = body;

    if (!repo_url) {
      return NextResponse.json(
        { error: 'repo_url is required' },
        { status: 400 }
      );
    }

    // Parse GitHub URL
    const urlMatch = repo_url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
    if (!urlMatch) {
      return NextResponse.json(
        { error: 'Invalid GitHub URL' },
        { status: 400 }
      );
    }

    const [, owner, repo] = urlMatch;

    // Create initial podcast document
    const podcast: Podcast = {
      id: crypto.randomUUID(),
      repo_url,
      repo_name: `${owner}/${repo}`,
      title: `The Case of ${repo}`,
      narrative_style,
      status: AnalysisStatus.PENDING,
      progress: 0,
      progress_message: 'Starting analysis...',
      patterns_found: [],
      duration: 0,
      created_at: new Date(),
    };

    // Save to database
    const collection = await getCollection('podcasts');
    await collection.insertOne(podcast);

    // Start background processing
    const ctx = getRequestContext();
    // @ts-ignore - Cloudflare Workers types mismatch
    if (ctx.waitUntil) {
      // @ts-ignore
      ctx.waitUntil(processRepository(podcast.id, owner, repo, narrative_style));
    } else {
      // Fallback for local dev or if waitUntil is missing
      processRepository(podcast.id, owner, repo, narrative_style).catch(console.error);
    }

    return NextResponse.json({
      id: podcast.id,
      status: podcast.status,
      message: 'Analysis started',
    });
  } catch (error: any) {
    console.error('Error in analyze endpoint:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

async function processRepository(
  podcastId: string,
  owner: string,
  repo: string,
  narrativeStyle: NarrativeStyle
) {
  const collection = await getCollection('podcasts');
  const fetcher = getGitHubFetcher();

  try {
    // Step 1: Fetch repository metadata
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          status: AnalysisStatus.ANALYZING,
          progress: 5,
          progress_message: '🔍 Opening the case file...',
        },
      }
    );

    const repository = await fetcher.getRepoMetadata(owner, repo);

    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          progress: 15,
          progress_message: '📂 Searching crime scene for evidence...',
          repo_metadata: {
            name: repository.name,
            description: repository.description,
            language: repository.language,
            stars: repository.stars,
            size: repository.size,
            topics: repository.topics,
          },
        },
      }
    );

    // Step 2: Read ENTIRE repository structure
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          progress: 25,
          progress_message: '🗂️ Cataloging all evidence files...',
        },
      }
    );

    const fullRepo = await fetcher.fetchFullRepository(owner, repo);

    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          progress: 40,
          progress_message: `📄 Reading ${fullRepo.allFiles.length} files from the scene...`,
        },
      }
    );

    // Step 3: Analyze code patterns
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          progress: 55,
          progress_message: '🔬 Analyzing code patterns and forensic evidence...',
        },
      }
    );

    const patterns = await analyzeCodePatterns(fullRepo.filesWithContent);

    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          patterns_found: patterns,
          progress: 65,
          progress_message: `🎯 Found ${patterns.length} suspicious patterns at the crime scene...`,
        },
      }
    );

    // Step 4: Generate crime investigation story
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          status: AnalysisStatus.GENERATING_SCRIPT,
          progress: 75,
          progress_message: '🎙️ Detective crafting the investigation narrative...',
        },
      }
    );

    const script = await generatePodcastScript(
      repository,
      fullRepo.filesWithContent,
      narrativeStyle,
      {
        statistics: fullRepo.statistics,
        patterns,
        fullRepoContext: true,
      }
    );

    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          script,
          progress: 90,
          progress_message: '📝 Crime story written, case file ready...',
        },
      }
    );

    // Mark as completed
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          status: AnalysisStatus.COMPLETED,
          progress: 100,
          progress_message: '✅ Case closed! Investigation complete.',
          completed_at: new Date(),
          analysis_summary: {
            total_files: fullRepo.statistics.totalFiles,
            analyzed_files: fullRepo.statistics.analyzedFiles,
            total_size: fullRepo.statistics.totalSize,
            languages: fullRepo.statistics.languages,
            processing_time_ms: fullRepo.statistics.processingTime,
          },
        },
      }
    );
  } catch (error: any) {
    console.error('Error processing repository:', error);
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          status: AnalysisStatus.FAILED,
          error_message: error.message,
          progress_message: 'Investigation hit a dead end',
        },
      }
    );
  }
}
