'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Loader2, Mic, MessageSquare, Briefcase, CheckCircle2, XCircle } from 'lucide-react';

const KNOWLEDGE_LEVELS = [
  { value: 'new', label: 'New to it', description: 'Just getting started with AI Assessment' },
  { value: 'familiar', label: 'Some familiarity', description: 'I know the basics but want to go deeper' },
  { value: 'expert', label: 'Know it well', description: 'Looking to refine my approach' },
] as const;

export default function AssessmentOnboardingPage() {
  const router = useRouter();
  const [isSyncing, setIsSyncing] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  
  const loadingPhrases = [
    'Preparing your learning session...',
    'Loading AI Assessment content...',
    'Getting everything ready...',
  ];

  const [formData, setFormData] = useState({
    firstName: '',
    email: '',
    knowledgeLevel: '' as '' | 'new' | 'familiar' | 'expert',
    interactionMode: '' as '' | 'voice' | 'text',
  });

  const [micTestState, setMicTestState] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [micErrorMessage, setMicErrorMessage] = useState('');

  const handleTestMicrophone = async () => {
    setMicTestState('testing');
    setMicErrorMessage('');
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      setMicTestState('success');
    } catch {
      setMicTestState('error');
      setMicErrorMessage('Microphone not detected. Check your browser permissions.');
    }
  };

  useEffect(() => {
    if (isSyncing) {
      const interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
      return () => clearInterval(interval);
    } else {
      setLoadingPhraseIndex(0);
    }
  }, [isSyncing, loadingPhrases.length]);

  const isFormValid = formData.firstName.trim() && formData.email.trim() && formData.knowledgeLevel && formData.interactionMode;

  const handleStart = async () => {
    if (!isFormValid) return;
    
    setIsSyncing(true);
    
    const onboardingData = {
      firstName: formData.firstName,
      email: formData.email,
      knowledgeLevel: formData.knowledgeLevel,
      interactionMode: formData.interactionMode,
    };
    
    localStorage.setItem('assessment-onboarding-data', JSON.stringify(onboardingData));
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    router.push('/guide/assessment/session');
  };

  return (
    <main className="min-h-screen bg-textured-gradient flex flex-col items-center justify-center px-6 py-20">
      <div className="w-full max-w-2xl">
        <div className="flex justify-between items-center mb-12">
          <Link href="/guide" className="inline-flex items-center text-white/60 hover:text-white transition-colors group">
            <ChevronLeft className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Internal Tools
          </Link>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card p-12 min-h-[600px] flex flex-col relative overflow-hidden"
        >
          <AnimatePresence mode="wait">
            {isSyncing ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.05 }}
                className="flex-grow flex flex-col items-center justify-center text-center space-y-8"
              >
                <div className="relative">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      rotate: 360 
                    }}
                    transition={{ 
                      scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                      rotate: { duration: 3, repeat: Infinity, ease: "linear" }
                    }}
                    className="w-24 h-24 rounded-full border-4 border-white/10 border-t-white relative"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute inset-0 bg-plum/20 rounded-full blur-xl"
                  />
                </div>
                
                <div className="space-y-3">
                  <h2 className="text-2xl font-bold text-white">Starting your session...</h2>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={loadingPhraseIndex}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-white/60 font-medium"
                    >
                      {loadingPhrases[loadingPhraseIndex]}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-grow"
              >
                <div className="mb-8">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-4">
                    <Briefcase className="w-4 h-4 text-white/60" />
                    <span className="text-xs font-semibold uppercase tracking-wider text-white/60">AI Assessment & Strategy</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-2">Learn the AI Assessment Product</h1>
                  <p className="text-white/60">Gain a deeper understanding of the product, practice articulating value and positioning.</p>
                </div>

                <div className="space-y-6 flex-grow">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">First Name</label>
                      <input
                        type="text"
                        placeholder="Your first name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white/60 mb-2">Email</label>
                      <input
                        type="email"
                        placeholder="you@sei.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-white/30 transition-colors"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-3">How familiar are you with the AI Assessment product?</label>
                    <div className="space-y-2">
                      {KNOWLEDGE_LEVELS.map((level) => (
                        <button
                          key={level.value}
                          type="button"
                          onClick={() => setFormData({ ...formData, knowledgeLevel: level.value })}
                          className={`w-full p-4 rounded-xl border transition-all text-left ${
                            formData.knowledgeLevel === level.value
                              ? 'bg-white/10 border-white/40 ring-1 ring-white/20'
                              : 'bg-white/5 border-white/10 hover:border-white/20'
                          }`}
                        >
                          <span className="font-semibold block">{level.label}</span>
                          <span className="text-sm text-white/50">{level.description}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white/60 mb-3">How would you like to learn?</label>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, interactionMode: 'voice' })}
                        className={`p-4 rounded-xl border transition-all text-left flex items-start gap-3 ${
                          formData.interactionMode === 'voice'
                            ? 'bg-white/10 border-white/40 ring-1 ring-white/20'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${formData.interactionMode === 'voice' ? 'bg-gradient-primary text-white' : 'bg-white/5 text-white/40'}`}>
                          <Mic className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold block">Voice</span>
                          <span className="text-xs text-white/50">Conversational learning</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, interactionMode: 'text' })}
                        className={`p-4 rounded-xl border transition-all text-left flex items-start gap-3 ${
                          formData.interactionMode === 'text'
                            ? 'bg-white/10 border-white/40 ring-1 ring-white/20'
                            : 'bg-white/5 border-white/10 hover:border-white/20'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${formData.interactionMode === 'text' ? 'bg-gradient-primary text-white' : 'bg-white/5 text-white/40'}`}>
                          <MessageSquare className="w-5 h-5" />
                        </div>
                        <div>
                          <span className="font-semibold block">Text</span>
                          <span className="text-xs text-white/50">Type your responses</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  {formData.interactionMode === 'voice' && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      {micTestState === 'idle' && (
                        <button
                          type="button"
                          onClick={handleTestMicrophone}
                          className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                        >
                          <Mic className="w-4 h-4" />
                          Test Microphone
                        </button>
                      )}
                      {micTestState === 'testing' && (
                        <div className="flex items-center gap-2 text-sm text-white/60">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Checking microphone access...
                        </div>
                      )}
                      {micTestState === 'success' && (
                        <div className="flex items-center gap-2 text-sm text-green-400">
                          <CheckCircle2 className="w-4 h-4" />
                          Microphone ready
                        </div>
                      )}
                      {micTestState === 'error' && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-red-400">
                            <XCircle className="w-4 h-4" />
                            {micErrorMessage}
                          </div>
                          <button
                            type="button"
                            onClick={handleTestMicrophone}
                            className="text-xs text-white/40 hover:text-white/60 underline transition-colors"
                          >
                            Try again
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="pt-6">
                  <button
                    onClick={handleStart}
                    disabled={!isFormValid || isSyncing}
                    className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isSyncing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting...
                      </>
                    ) : (
                      'Start Learning Session'
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </main>
  );
}
