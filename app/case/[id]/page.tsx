import React from 'react';
import Link from 'next/link';
import { getCollection } from '@/lib/mongodb';
import { getGitHubClient, FileNode, RepoStructure } from '@/lib/github/client';
import { Podcast } from '@/lib/types';
import { FileText, Folder, PlayCircle, Fingerprint, Siren, Search, AlertTriangle, Paperclip, FileWarning, ArrowLeft } from 'lucide-react';

import CodeChatbot from '@/components/case/CodeChatbot';
import EvidenceLocker from '@/components/case/EvidenceLocker';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getCaseById(id: string) {
  try {
    const collection = await getCollection('podcasts');
    const podcast = await collection.findOne<Podcast>({ id });
    return podcast;
  } catch (error) {
    console.error('Error fetching case:', error);
    return null;
  }
}

async function getRepoStructure(repoName: string) {
  try {
    const [owner, repo] = repoName.split('/');
    const client = getGitHubClient();
    
    // Add timeout to prevent infinite loading
    const timeoutPromise = new Promise<any>((_, reject) => 
      setTimeout(() => reject(new Error('Timeout fetching repo structure')), 5000)
    );

    return await Promise.race([
      client.getRepoStructure(owner, repo),
      timeoutPromise
    ]) as RepoStructure;
  } catch (error) {
    console.error('Error fetching repo structure:', error);
    return null;
  }
}

function pseudoRandom(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash) / 2147483647;
}

export default async function CaseDetailPage({ params }: PageProps) {
  const { id } = await params;
  const podcast = await getCaseById(id);

  if (!podcast) {
    return (
      <div className="min-h-screen bg-[#050505] text-[#e7e5e4] font-typewriter flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/grain.gif')]"></div>
        <div className="text-center relative z-10 p-8 border-4 border-dashed border-zinc-800 rounded-sm bg-[#0a0a0a]">
          <Siren className="w-16 h-16 mx-auto mb-4 text-red-900/50" />
          <h1 className="text-2xl font-bold mb-2 uppercase tracking-widest font-typewriter">Case File Not Found</h1>
          <p className="text-zinc-500 font-courier">Case ID: {id} does not exist in the archives.</p>
          <Link href="/" className="mt-6 inline-block px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 uppercase tracking-widest text-sm transition-colors font-typewriter">
            Return to HQ
          </Link>
        </div>
      </div>
    );
  }

  const structure = await getRepoStructure(podcast.repo_name);
  
  // Process languages for stamps
  const languages = podcast.analysis_summary?.languages || {};
  const sortedLanguages = Object.entries(languages)
    .sort(([, a], [, b]) => (b as number) - (a as number))
    .slice(0, 6);

  // Identify entry points (simple heuristic)
  const entryPoints = structure?.files
    .filter(f => f.type === 'file' && (
      f.path.match(/index\.(js|ts|jsx|tsx|py|html)$/i) ||
      f.path.match(/main\.(js|ts|py|go|rs)$/i) ||
      f.path.match(/app\.(js|ts|py)$/i) ||
      f.path.match(/server\.(js|ts)$/i)
    ))
    .slice(0, 5) || [];

  // Mock metrics using deterministic random
  const rand = pseudoRandom(podcast.id);
  const [owner, repo] = podcast.repo_name.split('/');
  
  return (
    <div className="h-screen bg-[#050505] text-[#d4d4d4] font-courier p-6 pb-0 flex flex-col relative overflow-hidden">
      {/* Global Atmosphere */}
      <div className="fixed inset-0 pointer-events-none z-50">
        {/* Film Grain - Top Layer */}
        <div className="absolute inset-0 opacity-[0.05] bg-[url('/grain.gif')]"></div>
      </div>
      <div className="fixed inset-0 pointer-events-none z-0">
        {/* Harsh Desk Lamp Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(255,255,255,0.03)_0%,rgba(0,0,0,0.8)_80%)]"></div>
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.02] bg-[url('https://www.transparenttextures.com/patterns/paper-fibers.png')]"></div>
      </div>

      {/* Header - Case File Label */}
      <header className="relative z-10 mb-8 border-b-2 border-zinc-800 pb-4 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/" className="text-zinc-600 hover:text-zinc-400 transition-colors flex items-center gap-1 text-xs uppercase tracking-widest font-bold">
              <ArrowLeft className="w-3 h-3" /> HQ
            </Link>
            <div className="inline-block bg-zinc-900 text-zinc-500 px-3 py-1 text-xs font-bold tracking-[0.2em] transform -rotate-1 border border-zinc-800 shadow-sm font-typewriter">
              CONFIDENTIAL // DO NOT DISTRIBUTE
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#e5e5e5] tracking-tighter uppercase drop-shadow-md font-typewriter">
            CASE FILE: <span className="text-red-700 underline decoration-2 underline-offset-4">{podcast.repo_name}</span>
          </h1>
        </div>
        <div className="text-right text-xs text-zinc-500 font-mono">
          <div className="uppercase tracking-widest">Case ID: {podcast.id.substring(0, 8)}</div>
          <div className="uppercase tracking-widest">Opened: {new Date(podcast.created_at).toLocaleDateString()}</div>
        </div>
      </header>

      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 flex-grow mb-6 min-h-0">
        
        {/* Left Column: The Suspect's Rap Sheet */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar h-full">
          {/* Manila Folder - Tech Stack */}
          <section className="bg-[#1a1a1a] border-t-8 border-[#d4c5a9] p-4 shadow-lg relative group">
            <div className="absolute -top-8 left-0 bg-[#d4c5a9] text-black px-4 py-1 text-xs font-bold uppercase tracking-widest rounded-t-sm transform skew-x-12 origin-bottom-left font-typewriter">
              Tech Stack
            </div>
            <div className="absolute top-2 right-2 opacity-20 transform rotate-12">
              <Fingerprint className="w-16 h-16 text-zinc-500" />
            </div>
            
            <div className="flex flex-wrap gap-3 mt-2 relative z-10">
              {sortedLanguages.map(([lang]) => (
                <div key={lang} className="relative group/stamp">
                  <div className="border-2 border-red-900/40 text-red-800/60 px-3 py-1 text-xs font-bold uppercase tracking-widest transform rotate-[-2deg] group-hover/stamp:rotate-0 transition-transform bg-[#d4c5a9]/10 backdrop-blur-sm font-typewriter">
                    {lang}
                  </div>
                </div>
              ))}
              {podcast.repo_metadata?.topics?.slice(0, 4).map((topic: string) => (
                <div key={topic} className="relative group/stamp">
                  <div className="border-2 border-blue-900/30 text-blue-800/50 px-3 py-1 text-xs font-bold uppercase tracking-widest transform rotate-[1deg] group-hover/stamp:rotate-0 transition-transform font-typewriter">
                    {topic}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Suspect Leads - Contributors */}
          <section className="bg-[#0a0a0a] border border-zinc-800 p-5 shadow-lg relative">
            <div className="flex items-center gap-2 mb-4 border-b border-zinc-800 pb-2">
              <Search className="w-4 h-4 text-zinc-500" />
              <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest font-typewriter">Suspect Leads</h2>
            </div>
            
            <ul className="space-y-3">
              {podcast.contributors && podcast.contributors.length > 0 ? (
                podcast.contributors.slice(0, 5).map((contributor, i) => (
                  <li key={contributor} className="flex items-start gap-3 text-xs group cursor-pointer">
                    <span className="text-zinc-600 font-mono mt-0.5">0{i+1}</span>
                    <div className="flex-1 border-b border-zinc-800 border-dashed pb-1 group-hover:border-zinc-600 transition-colors">
                      <div className="flex items-center gap-2 text-zinc-300 group-hover:text-white">
                        <Fingerprint className="w-3 h-3" />
                        <span className="truncate font-mono">{contributor}</span>
                      </div>
                      {i === 0 && (
                        <span className="text-[10px] text-red-600 font-bold uppercase tracking-wider mt-1 block font-typewriter">
                          Prime Suspect
                        </span>
                      )}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-xs text-zinc-600 italic">No clear leads found.</li>
              )}
            </ul>
          </section>

          {/* Code Logic Chatbot */}
          <CodeChatbot podcastId={podcast.id} repoName={podcast.repo_name} />
        </div>

        {/* Center Column: The Evidence Locker */}
        <div className="lg:col-span-6 h-full">
          <EvidenceLocker 
            files={structure?.files || []} 
            owner={owner} 
            repo={repo}
            totalFiles={structure?.totalFiles || 0}
          />
        </div>

        {/* Right Column: The Interrogation Bureau */}
        <div className="lg:col-span-3 flex flex-col gap-6 overflow-y-auto pr-2 custom-scrollbar h-full">
          
          {/* Surveillance Tape Button */}
          <Link href={`/story/${podcast.id}`} className="block group relative">
            <div className="absolute inset-0 bg-red-900/20 blur-md group-hover:bg-red-900/30 transition-colors"></div>
            <button className="w-full relative bg-[#1a0505] border-2 border-red-900/40 text-red-500 hover:text-red-400 py-6 px-6 shadow-[inset_0_0_20px_rgba(0,0,0,1)] transition-all flex flex-col items-center justify-center gap-2 group-hover:border-red-600/60">
              <div className="flex items-center gap-3">
                <PlayCircle className="w-6 h-6 animate-pulse" />
                <span className="font-bold tracking-[0.2em] text-sm font-typewriter">[ ACCESS SURVEILLANCE TAPE ]</span>
              </div>
              <span className="text-[10px] text-red-800 uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity font-typewriter">
                Authorized Personnel Only
              </span>
            </button>
          </Link>

          {/* Autopsy Report */}
          <section className="bg-[#0a0a0a] border border-zinc-800 p-5 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2">
               <div className="border border-zinc-700 px-1 text-[8px] text-zinc-600 uppercase font-typewriter">CONFIDENTIAL</div>
            </div>
            <h2 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2 uppercase tracking-widest font-typewriter">
              <AlertTriangle className="w-4 h-4" /> Autopsy Report
            </h2>
            <div className="text-xs text-zinc-400 leading-relaxed space-y-4 font-courier">
              <div className="flex gap-2">
                <span className="text-zinc-600 select-none">{`>`}</span>
                <p className="text-justify">
                  {podcast.analysis_summary?.autopsy_report || podcast.repo_metadata?.description || 
                   "Subject demonstrates a complex web of dependencies. Initial forensic scan indicates a highly coupled architecture with potential for cascading failures. Proceed with caution."}
                </p>
              </div>
              
              {podcast.patterns_found && podcast.patterns_found.length > 0 && (
                <div className="mt-4 bg-zinc-900/30 p-3 border-l-2 border-red-900/50">
                  <h3 className="text-zinc-500 font-bold mb-2 text-[10px] uppercase tracking-wider font-typewriter">Pathology:</h3>
                  <ul className="list-none space-y-1 text-zinc-500">
                    {podcast.patterns_found.slice(0, 3).map((pattern, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-red-900 mt-0.5">•</span>
                        {pattern}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>

          {/* Money Trail - Data Flow */}
          <section className="bg-[#0a0a0a] border border-zinc-800 p-5 shadow-lg flex-1">
            <h2 className="text-sm font-bold text-zinc-400 mb-4 flex items-center gap-2 border-b border-zinc-800 pb-2 uppercase tracking-widest font-typewriter">
              <Paperclip className="w-4 h-4" /> The Money Trail
            </h2>
            <div className="text-xs text-zinc-500 font-mono space-y-4">
              <div className="relative pl-4 border-l border-zinc-800 border-dashed">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600"></div>
                <div className="mb-1 text-zinc-400 font-bold uppercase tracking-wider font-typewriter">Ingress</div>
                <div className="text-zinc-600">HTTP/REST detected via {entryPoints[0]?.path || 'unknown endpoint'}</div>
              </div>
              
              <div className="relative pl-4 border-l border-zinc-800 border-dashed">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-zinc-800 border border-zinc-600"></div>
                <div className="mb-1 text-zinc-400 font-bold uppercase tracking-wider font-typewriter">Laundering</div>
                <div className="text-zinc-600">Logic distributed across {structure?.totalFiles || '?'} modules</div>
              </div>
              
              <div className="relative pl-4 border-l-0">
                <div className="absolute -left-1.5 top-0 w-3 h-3 rounded-full bg-red-900/50 border border-red-800"></div>
                <div className="mb-1 text-red-800/80 font-bold uppercase tracking-wider font-typewriter">Fallout</div>
                <div className="text-red-900/60">High probability of unhandled exceptions in edge cases.</div>
              </div>
              
              <div className="mt-8 pt-4 border-t border-zinc-800/50">
                <p className="italic opacity-60 text-[10px] leading-relaxed font-courier">
                  &quot;The data flows like cheap whiskey in a speakeasy—fast, messy, and likely to cause a headache in the morning.&quot;
                </p>
                <p className="text-right mt-2 text-zinc-700 text-[10px] uppercase tracking-widest font-typewriter">- Det. Mongo D. Bane</p>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
