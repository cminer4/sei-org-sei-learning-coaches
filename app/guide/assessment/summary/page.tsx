'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  BookOpen,
  Lightbulb,
  Shield,
  Target,
  CheckCircle2,
  Loader2,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

type ApiSummary = {
  dimensions: {
    product_knowledge: { summary: string; key_takeaway: string };
    value_articulation: { summary: string; key_takeaway: string };
    objection_handling: { summary: string; key_takeaway: string };
    competitive_positioning: { summary: string; key_takeaway: string };
  };
  covered: string[];
  revisit: string[];
  confidence: 'Building' | 'Developing' | 'Strong';
};

type SummaryState = 'no_data' | 'loading' | 'success' | 'error';

const DIMENSION_CONFIG = [
  { key: 'product_knowledge' as const, label: 'Product Knowledge', icon: BookOpen, color: 'text-blue-400' },
  { key: 'value_articulation' as const, label: 'Value Articulation', icon: Lightbulb, color: 'text-yellow-400' },
  { key: 'objection_handling' as const, label: 'Objection Handling', icon: Shield, color: 'text-green-400' },
  { key: 'competitive_positioning' as const, label: 'Competitive Positioning', icon: Target, color: 'text-purple-400' },
];

const CONFIDENCE_STYLES = {
  Building: { bg: 'bg-orange-500/10', border: 'border-orange-500/20', text: 'text-orange-400', label: 'Building Foundation' },
  Developing: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', label: 'Developing Skills' },
  Strong: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', label: 'Strong Understanding' },
};

export default function AssessmentSummaryPage() {
  const [state, setState] = useState<SummaryState>('loading');
  const [summary, setSummary] = useState<ApiSummary | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    const transcript = typeof window !== 'undefined' ? window.localStorage.getItem('assessmentTranscript') : null;
    console.log('[assessment-summary] transcript from localStorage — length:', transcript?.length);

    const trimmedTranscript = transcript?.trim() ?? '';
    const hasValidTranscript = trimmedTranscript.length >= 20;

    if (!hasValidTranscript) {
      setState('no_data');
      return;
    }

    setState('loading');
    fetch('/api/assessment-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: trimmedTranscript }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((body) => {
            throw new Error((body && body.error) || `Summary failed (${res.status})`);
          });
        }
        return res.json();
      })
      .then((data: unknown) => {
        const s = data as ApiSummary;
        if (!s?.dimensions || !s?.confidence) throw new Error('Invalid summary response');
        setSummary(s);
        setState('success');
      })
      .catch((err: Error) => {
        setErrorMessage(err?.message || 'Summary failed. Please try again.');
        setState('error');
      });
  }, []);

  const handleRetry = () => {
    setState('loading');
    setErrorMessage('');
    const transcript = typeof window !== 'undefined' ? window.localStorage.getItem('assessmentTranscript') : null;
    const trimmedTranscript = transcript?.trim() ?? '';
    
    if (trimmedTranscript.length < 20) {
      setState('no_data');
      return;
    }

    fetch('/api/assessment-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript: trimmedTranscript }),
    })
      .then((res) => {
        if (!res.ok) return res.json().then((body) => { throw new Error((body && body.error) || String(res.status)); });
        return res.json();
      })
      .then((data: unknown) => {
        const s = data as ApiSummary;
        if (!s?.dimensions || !s?.confidence) throw new Error('Invalid summary response');
        setSummary(s);
        setState('success');
      })
      .catch((err: Error) => {
        setErrorMessage(err?.message || 'Summary failed. Please try again.');
        setState('error');
      });
  };

  return (
    <main className="min-h-screen bg-textured-gradient px-6 py-20 flex flex-col items-center">
      <div className="w-full max-w-5xl">
        <AnimatePresence mode="wait">
          {state === 'no_data' && (
            <motion.div
              key="no_data"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-md mx-auto text-center"
            >
              <Link href="/guide/assessment" className="inline-flex items-center text-white/60 hover:text-white mb-12 transition-colors group">
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Assessment
              </Link>
              <div className="glass-card p-10">
                <p className="text-xl text-white/90 mb-6">No session data found. Please complete a learning session first.</p>
                <Link href="/guide/assessment" className="btn-primary w-full py-4 block text-center">
                  Start a session
                </Link>
              </div>
            </motion.div>
          )}

          {state === 'loading' && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full"
            >
              <Link href="/guide/assessment" className="inline-flex items-center text-white/60 hover:text-white mb-12 transition-colors group">
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Assessment
              </Link>
              <header className="mb-12 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 mb-4"
                >
                  <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
                  <span className="text-xs font-bold tracking-widest uppercase text-blue-400">Generating Summary</span>
                </motion.div>
                <h1 className="text-5xl font-bold mb-4">Learning Summary</h1>
                <p className="text-xl text-white/60">Analyzing your session...</p>
              </header>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12 opacity-50">
                {DIMENSION_CONFIG.map(({ label }) => (
                  <div key={label} className="glass-card p-6 flex flex-col items-center text-center opacity-70">
                    <div className="w-12 h-12 rounded-xl bg-white/5 mb-4" />
                    <div className="text-sm font-medium text-white/40 uppercase tracking-wider">{label}</div>
                  </div>
                ))}
              </div>
              <div className="w-64 h-1.5 bg-white/5 rounded-full overflow-hidden mx-auto">
                <motion.div
                  initial={{ x: '-100%' }}
                  animate={{ x: '100%' }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: 'linear' }}
                  className="w-full h-full bg-gradient-primary shadow-glow"
                />
              </div>
            </motion.div>
          )}

          {state === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="max-w-md mx-auto text-center"
            >
              <Link href="/guide/assessment" className="inline-flex items-center text-white/60 hover:text-white mb-12 transition-colors group">
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Assessment
              </Link>
              <div className="glass-card p-10">
                <p className="text-xl text-white/90 mb-6">{errorMessage}</p>
                <div className="flex flex-col gap-3">
                  <button type="button" onClick={handleRetry} className="btn-primary w-full py-4 flex items-center justify-center gap-2">
                    <RefreshCw className="w-4 h-4" />
                    Try again
                  </button>
                  <Link href="/guide/assessment" className="btn-secondary w-full py-4 block text-center">
                    Start a session
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {state === 'success' && summary && (
            <motion.div
              key="summary"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="w-full"
            >
              <Link href="/guide" className="inline-flex items-center text-white/60 hover:text-white mb-12 transition-colors group">
                <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
                Back to Internal Tools
              </Link>

              <header className="mb-12 text-center">
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-green-500/10 border border-green-500/20 mb-4"
                >
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-xs font-bold tracking-widest uppercase text-green-400">Session Complete</span>
                </motion.div>
                <h1 className="text-5xl font-bold mb-4">Learning Summary</h1>
                <p className="text-xl text-white/60">Here is what you covered and where to focus next</p>
              </header>

              {/* Confidence Indicator */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className={`glass-card p-6 mb-8 text-center ${CONFIDENCE_STYLES[summary.confidence].bg} ${CONFIDENCE_STYLES[summary.confidence].border}`}
              >
                <div className="text-sm font-medium text-white/60 uppercase tracking-wider mb-2">Confidence Level</div>
                <div className={`text-3xl font-bold ${CONFIDENCE_STYLES[summary.confidence].text}`}>
                  {CONFIDENCE_STYLES[summary.confidence].label}
                </div>
              </motion.div>

              {/* Learning Dimension Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {DIMENSION_CONFIG.map(({ key, label, icon: Icon, color }, i) => {
                  const dim = summary.dimensions[key];
                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 + i * 0.1 }}
                      className="glass-card p-6 group hover:border-white/30 transition-colors"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-lg">{label}</h3>
                      </div>
                      <p className="text-white/70 text-sm mb-4 leading-relaxed">{dim.summary}</p>
                      <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-1">Key Takeaway</div>
                        <p className="text-white/90 text-sm">{dim.key_takeaway}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* What You Covered / Worth Revisiting */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 }}
                  className="glass-card p-8"
                >
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-green-400">
                    <CheckCircle2 className="w-6 h-6" />
                    What You Covered
                  </h3>
                  <ul className="space-y-3">
                    {(summary.covered && summary.covered.length > 0
                      ? summary.covered
                      : ['No specific topics recorded']
                    ).map((item, i) => (
                      <li key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 flex-shrink-0" />
                        <p className="text-white/80 text-sm">{item}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.7 }}
                  className="glass-card p-8"
                >
                  <h3 className="text-2xl font-bold mb-6 flex items-center gap-3 text-orange-400">
                    <ArrowRight className="w-6 h-6" />
                    Worth Revisiting
                  </h3>
                  <ul className="space-y-3">
                    {(summary.revisit && summary.revisit.length > 0
                      ? summary.revisit
                      : ['Continue practicing all dimensions']
                    ).map((item, i) => (
                      <li key={i} className="flex gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
                        <div className="w-1.5 h-1.5 rounded-full bg-orange-400 mt-2 flex-shrink-0" />
                        <p className="text-white/70 text-sm">{item}</p>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8 border-t border-white/10">
                <Link href="/guide/assessment" className="btn-primary px-12 py-4 text-center">
                  Restart Session
                </Link>
                <Link href="/guide" className="btn-secondary px-12 py-4 text-center">
                  Return to Internal Tools
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
