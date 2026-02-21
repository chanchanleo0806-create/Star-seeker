/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Search, Sparkles, Globe, ArrowRight, Loader2, Star, ChevronUp, ChevronDown, ExternalLink, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Markdown from 'react-markdown';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { performSearchStream, type SearchResult } from './services/geminiService';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const resultsEndRef = useRef<HTMLDivElement>(null);
  const resultsTopRef = useRef<HTMLDivElement>(null);

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    e?.preventDefault();
    const searchTerm = overrideQuery || query;
    if (!searchTerm.trim() || isSearching) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);
    setResult({ text: "", sources: [] }); // Reset result for streaming

    try {
      const stream = performSearchStream(searchTerm);
      for await (const chunk of stream) {
        if (chunk.done) break;
        setResult(prev => ({
          text: chunk.text || prev?.text || "",
          sources: chunk.sources || prev?.sources || [],
          suggestion: chunk.suggestion || prev?.suggestion
        }));
      }
    } catch (err: any) {
      setError(err.message || '검색 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToBottom = () => {
    resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen star-gradient flex flex-col lg:flex-row selection:bg-blue-500/30">
      <div ref={resultsTopRef} />
      
      {/* Sidebar (Desktop) / Top Bar (Mobile) */}
      <aside className={cn(
        "lg:w-64 xl:w-72 border-b lg:border-b-0 lg:border-r border-white/10 bg-black/20 backdrop-blur-xl z-50 transition-all duration-300",
        hasSearched ? "flex lg:flex-col" : "hidden"
      )}>
        <div className="p-6 flex lg:flex-col items-center lg:items-start gap-4 w-full">
          <div 
            className="flex items-center gap-3 cursor-pointer group"
            onClick={() => {
              setHasSearched(false);
              setResult(null);
              setQuery('');
            }}
          >
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
              <Star className="w-6 h-6 text-white fill-white" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-display font-bold tracking-tight text-white">
                StarSeeker
              </h1>
              <span className="text-[10px] text-blue-400 font-medium uppercase tracking-widest">Official Engine</span>
            </div>
          </div>
          
          <div className="hidden lg:block mt-8 space-y-6">
            <div className="space-y-2">
              <p className="text-[11px] text-zinc-500 uppercase font-semibold tracking-wider">App Information</p>
              <div className="p-4 rounded-xl bg-white/5 border border-white/5 space-y-2">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Gemini AI와 실시간 웹 검색이 결합된 공식 검색 엔진입니다.
                </p>
                <div className="flex items-center gap-2 text-[10px] text-emerald-400">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  System Online
                </div>
              </div>
            </div>

            <nav className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <Search className="w-4 h-4" />
                새 검색
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 text-sm text-zinc-400 hover:text-white hover:bg-white/5 rounded-lg transition-all">
                <Info className="w-4 h-4" />
                정보
              </button>
            </nav>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col items-center overflow-y-auto">
        {/* Header (Only shown when NOT searched) */}
        {!hasSearched && (
          <header className="w-full max-w-4xl px-6 pt-32 pb-12 flex flex-col items-center">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mb-8 p-4 bg-blue-600 rounded-2xl shadow-2xl shadow-blue-600/20"
            >
              <Star className="w-12 h-12 text-white fill-white" />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              <h2 className="text-5xl md:text-7xl font-display font-bold mb-6 tracking-tighter">
                Star<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-emerald-400">Seeker</span>
              </h2>
              <p className="text-zinc-400 text-lg max-w-xl mx-auto">
                실시간 웹 데이터를 바탕으로 가장 정확한 정보를 찾아드립니다.
              </p>
            </motion.div>
          </header>
        )}

        <main className={cn(
          "w-full max-w-4xl px-6 transition-all duration-300",
          hasSearched ? "py-8" : "flex flex-col items-center"
        )}>
          <form 
            onSubmit={handleSearch}
            className={cn(
              "relative group w-full sticky top-6 z-40 transition-all duration-300",
              !hasSearched && "max-w-2xl"
            )}
          >
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-emerald-600 rounded-2xl blur opacity-25 group-focus-within:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
              <div className="pl-5 text-zinc-500">
                <Search className="w-5 h-5" />
              </div>
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="무엇이든 물어보세요..."
                className="w-full py-4 px-4 bg-transparent outline-none text-white placeholder:text-zinc-600 text-lg"
              />
              <button 
                type="submit"
                disabled={isSearching || !query.trim()}
                className="pr-4 pl-2 text-zinc-400 hover:text-white disabled:opacity-50 transition-colors"
              >
                {isSearching ? (
                  <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
                ) : (
                  <ArrowRight className="w-6 h-6" />
                )}
              </button>
            </div>
          </form>

          {/* Results Area */}
          <AnimatePresence mode="wait">
            {hasSearched && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="mt-12 space-y-12 pb-24"
              >
                {/* Typo Suggestion */}
                {!isSearching && result?.suggestion && (
                  <motion.div 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center gap-3"
                  >
                    <Info className="w-5 h-5 text-blue-400" />
                    <p className="text-sm text-zinc-300">
                      혹시 <button 
                        onClick={() => {
                          const suggested = result.suggestion!;
                          setQuery(suggested);
                          handleSearch(undefined, suggested);
                        }}
                        className="text-blue-400 font-bold hover:underline cursor-pointer"
                      >
                        {result.suggestion}
                      </button>을(를) 검색하려던 것이 맞습니까?
                    </p>
                  </motion.div>
                )}

                {isSearching && (!result?.text) ? (
                  <div className="space-y-6">
                    <div className="h-8 w-1/4 bg-white/5 rounded" />
                    <div className="space-y-3">
                      <div className="h-4 w-full bg-white/5 rounded" />
                      <div className="h-4 w-5/6 bg-white/5 rounded" />
                    </div>
                  </div>
                ) : error ? (
                  <div className="p-6 glass-card border-red-500/20 text-red-400 flex items-center gap-3">
                    <Info className="w-5 h-5 shrink-0" />
                    <p>{error}</p>
                  </div>
                ) : result ? (
                  <div className="flex flex-col gap-12">
                    {/* AI Summary Section - Only show if there are sources */}
                    {result.sources.length > 0 ? (
                      <section className="space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-blue-400 font-medium">
                            <Sparkles className="w-5 h-5" />
                            <span className="text-lg font-display">AI 분석 요약</span>
                          </div>
                          <div className="text-xs text-zinc-500">
                            검색된 {result.sources.length}개의 웹사이트 분석 완료
                          </div>
                        </div>
                        <div className="p-8 glass-card bg-blue-500/5 border-blue-500/10 relative group">
                          <div className="markdown-body">
                            <Markdown>{result.text}</Markdown>
                          </div>
                          
                          {/* Prominent Sources used for this summary */}
                          <div className="mt-8 pt-6 border-t border-white/5">
                            <p className="text-xs text-zinc-400 font-semibold mb-4 flex items-center gap-2 uppercase tracking-wider">
                              <Globe className="w-3 h-3 text-emerald-500" />
                              요약에 인용된 주요 사이트
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              {result.sources.slice(0, 4).map((s, i) => (
                                <a 
                                  key={i} 
                                  href={s.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors group/item"
                                >
                                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center overflow-hidden shrink-0 border border-white/10">
                                    <img 
                                      src={`https://www.google.com/s2/favicons?domain=${new URL(s.uri).hostname}&sz=64`}
                                      alt=""
                                      className="w-5 h-5 object-contain"
                                      referrerPolicy="no-referrer"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-medium text-zinc-200 truncate">{s.title}</p>
                                    <p className="text-[10px] text-zinc-500 truncate">{new URL(s.uri).hostname}</p>
                                  </div>
                                </a>
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    ) : (
                      <div className="p-12 glass-card text-center space-y-4">
                        <div className="w-12 h-12 bg-zinc-800 rounded-full flex items-center justify-center mx-auto">
                          <Search className="w-6 h-6 text-zinc-500" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-zinc-300 font-medium">검색 결과가 충분하지 않습니다.</p>
                          <p className="text-sm text-zinc-500">AI 요약을 생성하기 위한 신뢰할 수 있는 웹 소스를 찾지 못했습니다.</p>
                        </div>
                      </div>
                    )}

                    {/* All Web Results Section */}
                    {result.sources.length > 0 && (
                      <section className="space-y-6">
                        <div className="flex items-center gap-2 text-emerald-400 font-medium">
                          <Globe className="w-5 h-5" />
                          <span className="text-lg font-display">전체 웹 검색 결과</span>
                        </div>
                        <div className="grid grid-cols-1 gap-4">
                          {result.sources.map((source, i) => (
                            <motion.a
                              key={source.uri}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              href={source.uri}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block p-6 glass-card hover:bg-white/10 transition-all group relative overflow-hidden"
                            >
                              <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/50 opacity-0 group-hover:opacity-100 transition-opacity" />
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <div className="text-xs text-emerald-500 font-medium mb-1 flex items-center gap-2">
                                    <div className="w-4 h-4 rounded-sm bg-white/10 flex items-center justify-center overflow-hidden">
                                      <img 
                                        src={`https://www.google.com/s2/favicons?domain=${new URL(source.uri).hostname}&sz=32`}
                                        alt=""
                                        className="w-3 h-3 object-contain"
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                    {new URL(source.uri).hostname}
                                  </div>
                                  <h4 className="text-lg font-medium text-zinc-100 group-hover:text-blue-400 transition-colors line-clamp-2">
                                    {source.title}
                                  </h4>
                                  <p className="text-sm text-zinc-500 line-clamp-1 mt-2">
                                    {source.uri}
                                  </p>
                                </div>
                                <div className="p-2 rounded-lg bg-white/5 group-hover:bg-blue-500/20 transition-colors">
                                  <ExternalLink className="w-4 h-4 text-zinc-600 group-hover:text-blue-400 transition-colors shrink-0" />
                                </div>
                              </div>
                            </motion.a>
                          ))}
                        </div>
                      </section>
                    )}
                  </div>
                ) : null}
                <div ref={resultsEndRef} />
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Footer */}
        {!hasSearched && (
          <footer className="mt-auto py-8 text-zinc-600 text-sm flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4" />
              <span>StarSeeker v1.1</span>
            </div>
            <a href="#" className="hover:text-zinc-400 transition-colors">개인정보처리방침</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">이용약관</a>
          </footer>
        )}
      </div>

      {/* Floating Navigation Buttons */}
      <AnimatePresence>
        {hasSearched && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed bottom-8 right-8 flex flex-col gap-3 z-50"
          >
            <button 
              onClick={scrollToTop}
              className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/20 transition-all active:scale-95 group"
              title="맨 위로"
            >
              <ChevronUp className="w-6 h-6 group-hover:-translate-y-0.5 transition-transform" />
            </button>
            <button 
              onClick={scrollToBottom}
              className="p-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full shadow-lg transition-all active:scale-95 group"
              title="맨 아래로"
            >
              <ChevronDown className="w-6 h-6 group-hover:translate-y-0.5 transition-transform" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
