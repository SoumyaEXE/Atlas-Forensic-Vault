import { NextRequest, NextResponse } from 'next/server';
import { getCollection } from '@/lib/mongodb';
import { textToSpeech, concatenateAudioBuffers } from '@/lib/elevenlabs';
import { getRequestContext } from '@cloudflare/next-on-pages';

export const runtime = 'nodejs';

// This endpoint starts the audio generation process
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const collection = await getCollection('podcasts');
    const podcast = await collection.findOne({ id });

    if (!podcast) {
      return NextResponse.json({ error: 'Podcast not found' }, { status: 404 });
    }

    if (!podcast.script || !podcast.script.segments) {
      return NextResponse.json(
        { error: 'No script available for this podcast' },
        { status: 400 }
      );
    }

    // Update status to generating audio
    await collection.updateOne(
      { id },
      {
        $set: {
          audio_status: 'recording',
          audio_progress: 0,
          audio_message: 'Starting audio generation with ElevenLabs...',
          audio_started_at: new Date().toISOString(),
        },
      }
    );

    // Start background audio generation
    // We don't await this, but we catch errors to prevent unhandled rejections
    const ctx = getRequestContext();
    // @ts-ignore - Cloudflare Workers types mismatch
    if (ctx.waitUntil) {
      // @ts-ignore
      ctx.waitUntil(generateAudioInBackground(id, podcast.script));
    } else {
      // Fallback for local dev or if waitUntil is missing
      generateAudioInBackground(id, podcast.script).catch(err => {
        console.error(`[Background Error] Unhandled error in audio generation for ${id}:`, err);
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Audio generation started',
      id,
    });
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    console.error('Error starting audio generation:', error);
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

interface ScriptSegment {
  speaker: string;
  text: string;
  emotion?: string;
}

interface PodcastScript {
  segments: ScriptSegment[];
}

// Real audio generation using ElevenLabs API
async function generateAudioInBackground(podcastId: string, script: PodcastScript) {
  console.log(`[Audio] Background process started for ${podcastId}`);
  
  try {
    const collection = await getCollection('podcasts');
    
    // Filter out sound_effect segments - only voice segments
    // Keep segments with missing speaker (default to Narrator) or where speaker is NOT sound_effect
    const voiceSegments = script.segments.filter(
      (s) => !s.speaker || s.speaker.toLowerCase() !== 'sound_effect'
    );
    const totalSegments = voiceSegments.length;
    const audioBuffers: Buffer[] = [];

    console.log(`[Audio] Starting generation for ${totalSegments} voice segments (skipping ${script.segments.length - totalSegments} sound effects)`);

    let lastError: Error | null = null;

    for (let i = 0; i < totalSegments; i++) {
      const segment = voiceSegments[i];
      const progress = Math.round(((i + 1) / totalSegments) * 90); // Reserve 10% for processing

      // Update progress
      await collection.updateOne(
        { id: podcastId },
        {
          $set: {
            audio_status: 'recording',
            audio_progress: progress,
            audio_message: `🎙️ Recording segment ${i + 1} of ${totalSegments}: ${segment.speaker}`,
            audio_current_segment: i + 1,
            audio_total_segments: totalSegments,
          },
        }
      );

      try {
        const speakerName = segment.speaker || 'Narrator';
        // Call ElevenLabs API to generate audio
        console.log(`Generating audio for segment ${i + 1} (${speakerName}): "${segment.text.substring(0, 50)}..."`);
        
        const audioBuffer = await textToSpeech({
          text: segment.text,
          speaker: speakerName, // Pass speaker to determine voice ID
          // Adjust voice settings based on emotion if present
          stability: getStabilityForEmotion(segment.emotion),
          similarityBoost: 0.75,
          style: getStyleForEmotion(segment.emotion),
        });

        audioBuffers.push(audioBuffer);
        console.log(`✅ Segment ${i + 1} audio generated (${audioBuffer.length} bytes)`);

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 300));
      } catch (segmentError: unknown) {
        console.error(`Error generating segment ${i + 1}:`, segmentError);
        lastError = segmentError instanceof Error ? segmentError : new Error(String(segmentError));
        // Continue with other segments, but log the error
        await collection.updateOne(
          { id: podcastId },
          {
            $set: {
              audio_message: `⚠️ Warning: Segment ${i + 1} failed: ${lastError.message.substring(0, 50)}...`,
            },
          }
        );
      }
    }

    // Processing phase - concatenate audio
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          audio_status: 'processing',
          audio_progress: 95,
          audio_message: '🔧 Concatenating audio segments...',
        },
      }
    );

    if (audioBuffers.length === 0) {
      if (totalSegments === 0) {
         throw new Error('No voice segments found in script to generate audio for.');
      }
      throw new Error(`No audio segments were generated successfully. Last error: ${lastError?.message || 'Unknown error'}`);
    }

    // Concatenate all audio buffers
    const finalAudio = concatenateAudioBuffers(audioBuffers);
    console.log(`📦 Final audio size: ${finalAudio.length} bytes`);

    // Store the audio as base64 in MongoDB (for simplicity)
    // In production, you'd upload to S3/Cloudflare R2/etc.
    const audioBase64 = finalAudio.toString('base64');
    const audioDuration = estimateDuration(audioBuffers.length);

    // Mark as completed
    await collection.updateOne(
      { id: podcastId },
      {
        $set: {
          audio_status: 'completed',
          audio_progress: 100,
          audio_message: '✅ Audio generation complete!',
          audio_data: audioBase64, // Store audio data
          audio_url: `/api/podcasts/${podcastId}/audio`, // API endpoint to serve audio
          audio_duration: audioDuration,
          audio_completed_at: new Date().toISOString(),
          status: 'audio_ready',
        },
      }
    );

    console.log(`🎉 Podcast ${podcastId} audio generation complete!`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Audio generation failed';
    console.error('Error generating audio:', error);
    
    try {
      const collection = await getCollection('podcasts');
      await collection.updateOne(
        { id: podcastId },
        {
          $set: {
            audio_status: 'error',
            audio_message: `❌ ${errorMessage}`,
          },
        }
      );
    } catch (dbError) {
      console.error('Failed to update error status in DB:', dbError);
    }
  }
}

// Get stability setting based on emotion
function getStabilityForEmotion(emotion?: string): number {
  const settings: Record<string, number> = {
    mysterious: 0.6,
    dramatic: 0.4,
    excited: 0.3,
    serious: 0.7,
    suspenseful: 0.5,
    shocked: 0.3,
  };
  return settings[emotion || ''] || 0.5;
}

// Get style setting based on emotion
function getStyleForEmotion(emotion?: string): number {
  const settings: Record<string, number> = {
    mysterious: 0.3,
    dramatic: 0.7,
    excited: 0.8,
    serious: 0.4,
    suspenseful: 0.5,
    shocked: 0.9,
  };
  return settings[emotion || ''] || 0.5;
}

// Estimate duration based on segments
function estimateDuration(generatedSegments: number): number {
  // Rough estimate: ~10 seconds per segment on average
  return generatedSegments * 10;
}
