import React, { useState, useEffect } from 'react';
import { api } from '../services/api.ts';
import { RecallRequest, ProductCategory } from '../types.ts';
import { useAuth } from '../context/AuthContext.tsx';
import {
  Search, ShieldAlert, CheckCircle2, AlertTriangle, ArrowRight,
  Filter, Building2, UserCheck, RefreshCw, HelpCircle, Send, Check,
  Mic, MicOff, Volume2, Car, Laptop, HeartPulse, Baby, Utensils, Wrench,
  ShieldCheck, Flame, AlertOctagon, Info, Layers, Tag
} from 'lucide-react';

interface LandingPageProps {
  onSelectRecall: (recall: RecallRequest) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onSelectRecall }) => {
  const { setAuthModal } = useAuth();
  const [stats, setStats] = useState({
    totalRecalls: 0,
    criticalRecalls: 0,
    monitoredBatches: 0,
    approvedCompanies: 0,
    resolvedReturns: 0,
    registeredProducts: 0
  });

  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [recalls, setRecalls] = useState<RecallRequest[]>([]);
  const [loadingRecalls, setLoadingRecalls] = useState(false);

  // Search filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Web Speech API state
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [voiceFeedback, setVoiceFeedback] = useState<string | null>(null);
  const recognitionRef = React.useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasSpeech = 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
      setSpeechSupported(hasSpeech);
    }
  }, []);

  const handleToggleVoiceSearch = () => {
    if (!speechSupported) {
      setVoiceFeedback('Voice recognition is not supported in this browser. Please use Chrome, Edge, or Safari.');
      setTimeout(() => setVoiceFeedback(null), 4000);
      return;
    }

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      recognition.lang = 'en-US';
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceFeedback('Listening... Speak product model, brand, or batch number.');
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript || '';
        if (transcript) {
          const cleaned = transcript.trim();
          setSearchQuery(cleaned);
          setVoiceFeedback(`Voice detected: "${cleaned}"`);
          loadRecalls(cleaned, selectedSeverity, selectedCategory);
          setTimeout(() => setVoiceFeedback(null), 4000);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setVoiceFeedback('Microphone permission denied. Please allow microphone access in your browser.');
        } else if (event.error === 'no-speech') {
          setVoiceFeedback('No speech detected. Please click the mic and try again.');
        } else {
          setVoiceFeedback(`Voice search: ${event.error}`);
        }
        setTimeout(() => setVoiceFeedback(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err: any) {
      console.error('Speech recognition start failed:', err);
      setIsListening(false);
      setVoiceFeedback('Could not initialize microphone. Please check browser settings.');
      setTimeout(() => setVoiceFeedback(null), 4000);
    }
  };

  // Contact form
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSuccess, setContactSuccess] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);

  useEffect(() => {
    loadStats();
    loadCategories();
    loadRecalls();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getPublicStats();
      setStats(data);
    } catch (e) {
      console.error('Failed to load stats', e);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data.categories || []);
    } catch (e) {
      console.error('Failed to load categories', e);
    }
  };

  const loadRecalls = async (query = searchQuery, sev = selectedSeverity, cat = selectedCategory) => {
    setLoadingRecalls(true);
    try {
      const data = await api.getPublicRecalls({ q: query, severity: sev, category: cat });
      setRecalls(data.recalls || []);
    } catch (e) {
      console.error('Failed to load recalls', e);
    } finally {
      setLoadingRecalls(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadRecalls(searchQuery, selectedSeverity, selectedCategory);
  };

  const handleContactSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setContactLoading(true);
    try {
      await api.submitContact({
        name: contactName,
        email: contactEmail,
        subject: contactSubject,
        message: contactMessage
      });
      setContactSuccess(true);
      setContactName('');
      setContactEmail('');
      setContactSubject('');
      setContactMessage('');
      setTimeout(() => setContactSuccess(false), 6000);
    } catch (e) {
      console.error(e);
    } finally {
      setContactLoading(false);
    }
  };

  const getCategoryIcon = (slug?: string) => {
    switch (slug) {
      case 'automotive': return <Car className="w-3.5 h-3.5 text-blue-600" />;
      case 'electronics': return <Laptop className="w-3.5 h-3.5 text-indigo-600" />;
      case 'medical': return <HeartPulse className="w-3.5 h-3.5 text-rose-600" />;
      case 'childcare': return <Baby className="w-3.5 h-3.5 text-pink-600" />;
      case 'food-beverage': return <Utensils className="w-3.5 h-3.5 text-emerald-600" />;
      case 'industrial': return <Wrench className="w-3.5 h-3.5 text-orange-600" />;
      default: return <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* HERO SECTION */}
      <section className="relative bg-white border-b border-slate-200 overflow-hidden pt-12 pb-16 lg:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Column: Headline & Direct Search */}
            <div className="lg:col-span-7 space-y-6">
              
              <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-700 bg-blue-50 px-3 py-1 rounded-md border border-blue-200/80">
                <ShieldAlert className="w-3.5 h-3.5 text-blue-600" />
                <span>Enterprise Product Safety & Recall Registry</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-950 tracking-tight leading-[1.15] text-balance">
                Real-Time Product Safety, Defect Tracing & Recall Resolution.
              </h1>

              <p className="text-base text-slate-600 leading-relaxed max-w-2xl">
                Connecting certified manufacturers, regulatory oversight authorities, and consumers.
                Search authorized defect advisories, verify batch & serial integrity, and initiate guaranteed remedies.
              </p>

              {/* Integrated Recall Search Bar with Web Speech API */}
              <div id="search-recalls" className="pt-2">
                <form
                  onSubmit={handleSearchSubmit}
                  className="p-2 bg-slate-50 border border-slate-300 rounded-xl shadow-xs flex flex-col sm:flex-row gap-2 relative"
                >
                  <div className="relative flex-1 flex items-center">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={isListening ? 'Listening for speech command...' : 'Search by Product Name, Model, SKU, Batch # or Serial #'}
                      className={`w-full pl-10 pr-16 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 bg-transparent focus:outline-none ${
                        isListening ? 'placeholder:text-red-500 placeholder:animate-pulse font-medium' : ''
                      }`}
                    />
                    
                    {searchQuery && (
                      <button
                        type="button"
                        onClick={() => {
                          setSearchQuery('');
                          loadRecalls('', selectedSeverity, selectedCategory);
                        }}
                        title="Clear search query"
                        className="absolute right-9 p-1 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/80 transition-colors text-xs font-bold w-5 h-5 flex items-center justify-center cursor-pointer"
                      >
                        ✕
                      </button>
                    )}

                    {/* Web Speech API Microphone Trigger Button */}
                    <button
                      type="button"
                      onClick={handleToggleVoiceSearch}
                      title={isListening ? 'Stop listening' : 'Search by voice command (Web Speech API)'}
                      className={`absolute right-2 p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                        isListening
                          ? 'bg-red-500 text-white animate-pulse shadow-xs ring-2 ring-red-300'
                          : 'text-slate-400 hover:text-blue-600 hover:bg-slate-200/80'
                      }`}
                    >
                      {isListening ? (
                        <MicOff className="w-4 h-4" />
                      ) : (
                        <Mic className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors whitespace-nowrap shrink-0 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Check Recall Status</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>

                {/* Voice Feedback Banner */}
                {voiceFeedback && (
                  <div className={`mt-2 p-2.5 rounded-lg text-xs flex items-center gap-2.5 transition-all animate-in fade-in slide-in-from-top-1 ${
                    isListening
                      ? 'bg-red-50 border border-red-200 text-red-800'
                      : 'bg-blue-50 border border-blue-200 text-blue-900'
                  }`}>
                    {isListening ? (
                      <span className="relative flex h-2.5 w-2.5">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                      </span>
                    ) : (
                      <Volume2 className="w-4 h-4 text-blue-600 shrink-0" />
                    )}
                    <span className="font-medium">{voiceFeedback}</span>
                  </div>
                )}
                <div className="mt-2 text-[11px] text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span>Try sample search:</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('HVI-900X');
                      loadRecalls('HVI-900X', selectedSeverity, selectedCategory);
                    }}
                    className="text-blue-600 hover:underline font-mono cursor-pointer"
                  >
                    HVI-900X
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('BATCH-2026-Q1-A4');
                      loadRecalls('BATCH-2026-Q1-A4', selectedSeverity, selectedCategory);
                    }}
                    className="text-blue-600 hover:underline font-mono cursor-pointer"
                  >
                    BATCH-2026-Q1-A4
                  </button>
                  <span aria-hidden="true">·</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('Apex');
                      loadRecalls('Apex', selectedSeverity, selectedCategory);
                    }}
                    className="text-blue-600 hover:underline font-mono cursor-pointer"
                  >
                    Apex
                  </button>
                </div>
              </div>

              {/* Action buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setAuthModal('register_customer')}
                  className="px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Register Purchased Product</span>
                </button>
                <button
                  onClick={() => setAuthModal('register_company')}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Building2 className="w-4 h-4 text-slate-500" />
                  <span>Manufacturer Portal Onboarding</span>
                </button>
              </div>

            </div>

            {/* Right Column: Hero Visual Showcase */}
            <div className="lg:col-span-5">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 shadow-xl bg-slate-900">
                <img
                  src="/src/assets/images/hero_safety_inspection_1793542350026.jpg"
                  alt="Quality assurance safety laboratory engineers inspecting precision hardware modules"
                  className="w-full h-80 sm:h-96 object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-transparent p-6 flex flex-col justify-end text-white">
                  <div className="flex items-center gap-2 text-xs font-medium text-emerald-400 mb-1">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Consumer Safety Protection</span>
                  </div>
                  <h3 className="text-base font-bold">Proactive Defect & Recall Alerts</h3>
                  <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                    Consumers receive instant notifications if any registered product is recalled by the manufacturer.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* REAL-TIME PRODUCT SAFETY METRICS STRIP */}
      <section className="bg-slate-900 text-white py-10 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span>LIVE PUBLIC SAFETY REGISTRY</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1">
                Active Product Safety & Recall Overview
              </h2>
            </div>
            <div className="text-xs text-slate-400 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span>Official Manufacturer & Regulatory Bulletins</span>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            
            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Active Recalls</span>
                  <AlertOctagon className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono tabular-nums mt-2">
                  {stats.totalRecalls}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Active safety advisories currently monitored across all categories.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-red-950/20 border border-red-900/50 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Critical Hazards</span>
                  <Flame className="w-4 h-4 text-red-400 animate-pulse" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-red-400 font-mono tabular-nums mt-2">
                  {stats.criticalRecalls}
                </div>
              </div>
              <p className="text-[11px] text-red-300/80 mt-3 leading-relaxed">
                High-urgency defects with immediate stop-use warnings.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tracked Batches</span>
                  <Layers className="w-4 h-4 text-blue-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-blue-400 font-mono tabular-nums mt-2">
                  {stats.monitoredBatches}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Specific production lots identified for targeted recall action.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-800/60 border border-slate-700/60 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Certified Makers</span>
                  <Building2 className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 font-mono tabular-nums mt-2">
                  {stats.approvedCompanies}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
                Verified manufacturers providing 100% free returns and refunds.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* ACTIVE PRODUCT RECALLS REGISTRY SECTION */}
      <section id="active-recalls" className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider">
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>Public Consumer Safety Registry</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              Active Product Recall Notices
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Official defect notices issued by certified manufacturers and approved by the regulatory commission.
            </p>
          </div>

          {/* Severity Filter Controls */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-lg border border-slate-200">
            {['all', 'critical', 'high', 'medium'].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setSelectedSeverity(sev);
                  loadRecalls(searchQuery, sev, selectedCategory);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md capitalize transition-colors cursor-pointer ${
                  selectedSeverity === sev
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {sev === 'all' ? 'All Severities' : sev}
              </button>
            ))}
          </div>
        </div>

        {/* Industry Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          <button
            onClick={() => {
              setSelectedCategory('all');
              loadRecalls(searchQuery, selectedSeverity, 'all');
            }}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
              selectedCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>All Sectors</span>
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setSelectedCategory(cat.slug);
                loadRecalls(searchQuery, selectedSeverity, cat.slug);
              }}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer ${
                selectedCategory === cat.slug
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200 hover:border-slate-300'
              }`}
            >
              {getCategoryIcon(cat.slug)}
              <span>{cat.name}</span>
            </button>
          ))}
        </div>

        {/* Active Filter Chips Bar */}
        {(searchQuery || selectedSeverity !== 'all' || selectedCategory !== 'all') && (
          <div className="flex flex-wrap items-center gap-2 mb-6 p-2.5 bg-blue-50/80 border border-blue-200/80 rounded-xl text-xs animate-in fade-in">
            <span className="font-semibold text-blue-900 text-[11px] uppercase tracking-wider">Active Filters:</span>
            
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('all');
                  loadRecalls(searchQuery, selectedSeverity, 'all');
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 rounded-md text-blue-800 hover:bg-blue-100/60 transition-colors shadow-2xs font-medium cursor-pointer"
              >
                <span>Sector: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}</span>
                <span className="font-bold text-slate-400 hover:text-slate-700">✕</span>
              </button>
            )}

            {selectedSeverity !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setSelectedSeverity('all');
                  loadRecalls(searchQuery, 'all', selectedCategory);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 rounded-md text-blue-800 hover:bg-blue-100/60 transition-colors shadow-2xs font-medium cursor-pointer"
              >
                <span className="capitalize">Severity: {selectedSeverity}</span>
                <span className="font-bold text-slate-400 hover:text-slate-700">✕</span>
              </button>
            )}

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  loadRecalls('', selectedSeverity, selectedCategory);
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-blue-200 rounded-md text-blue-800 hover:bg-blue-100/60 transition-colors shadow-2xs font-medium cursor-pointer"
              >
                <span>Keyword: "{searchQuery}"</span>
                <span className="font-bold text-slate-400 hover:text-slate-700">✕</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedSeverity('all');
                setSelectedCategory('all');
                loadRecalls('', 'all', 'all');
              }}
              className="ml-auto text-xs text-blue-700 hover:text-blue-900 font-semibold underline cursor-pointer"
            >
              Reset All Filters
            </button>
          </div>
        )}

        {/* Recalls Grid */}
        {loadingRecalls ? (
          <div className="py-20 text-center text-slate-500 text-xs">
            <RefreshCw className="w-6 h-6 mx-auto animate-spin text-blue-600 mb-2" />
            Loading certified recall notices...
          </div>
        ) : recalls.length === 0 ? (
          <div className="p-10 text-center bg-white rounded-2xl border border-slate-200 shadow-2xs">
            <ShieldAlert className="w-12 h-12 text-amber-500 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-900">No Matching Recall Notices Found</h4>
            <p className="text-xs text-slate-600 mt-1.5 max-w-lg mx-auto leading-relaxed">
              No active recall advisories match your combined filters:
              {selectedCategory !== 'all' && <span className="font-semibold text-slate-900"> [Sector: {categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory}]</span>}
              {selectedSeverity !== 'all' && <span className="font-semibold text-slate-900"> [Severity: {selectedSeverity}]</span>}
              {searchQuery && <span className="font-semibold text-slate-900"> [Query: "{searchQuery}"]</span>}
            </p>
            
            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    loadRecalls('', selectedSeverity, selectedCategory);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  Clear Search Term "{searchQuery}"
                </button>
              )}
              {selectedSeverity !== 'all' && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSeverity('all');
                    loadRecalls(searchQuery, 'all', selectedCategory);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  Show All Severities in {selectedCategory === 'all' ? 'All Sectors' : (categories.find((c) => c.slug === selectedCategory)?.name || selectedCategory)}
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSeverity('all');
                  setSelectedCategory('all');
                  loadRecalls('', 'all', 'all');
                }}
                className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                Reset All Filters (View All 12 Notices)
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recalls.map((recall) => (
              <div
                key={recall.id}
                className="bg-white rounded-xl border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all p-5 flex flex-col justify-between group"
              >
                <div className="space-y-3">
                  
                  {/* Top Header: Company + Severity */}
                  <div className="flex items-center justify-between text-xs font-medium">
                    <div className="flex items-center gap-1.5 text-slate-700 font-semibold truncate max-w-[65%]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{recall.company_name}</span>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                          recall.severity === 'critical'
                            ? 'bg-red-50 text-red-700 border border-red-200'
                            : recall.severity === 'high'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {recall.severity === 'critical' && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-600 animate-ping inline-block" />
                        )}
                        <span>{recall.severity}</span>
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">#{recall.id}</span>
                    </div>
                  </div>

                  {/* Title & Product Info */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug group-hover:text-blue-600 transition-colors">
                      {recall.title}
                    </h3>
                    <div className="mt-1.5 text-xs text-slate-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className="text-slate-700 font-medium">{recall.product_name}</span>
                      <span className="text-slate-300" aria-hidden="true">|</span>
                      <span>Model: <span className="font-mono text-slate-700">{recall.model}</span></span>
                      {recall.sku && (
                        <>
                          <span className="text-slate-300" aria-hidden="true">|</span>
                          <span className="font-mono text-[11px] text-slate-400">SKU: {recall.sku}</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Hazard Description */}
                  <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                    {recall.hazard_reason}
                  </p>

                  {/* Batch & Serial Range box */}
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-slate-500 font-medium">Affected Batches:</span>
                      <span className="text-emerald-700 font-semibold text-[10px] bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">Verified Notice</span>
                    </div>
                    <div className="font-mono font-bold text-slate-900 truncate">
                      {recall.affected_batch_numbers}
                    </div>
                    {recall.affected_serial_range && (
                      <div className="text-[11px] text-slate-500 truncate pt-0.5 border-t border-slate-200/60 mt-1">
                        Serials: <span className="font-mono text-slate-700">{recall.affected_serial_range}</span>
                      </div>
                    )}
                  </div>

                </div>

                {/* Footer Remedy & Action */}
                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px]">
                    <span className="text-slate-500">Statutory Remedy: </span>
                    <span className="font-bold text-slate-900 capitalize">
                      {recall.remedy_type === 'refund' ? '100% Full Refund' :
                       recall.remedy_type === 'replacement' ? 'Free Replacement' :
                       recall.remedy_type === 'repair' ? 'Complimentary Repair' : recall.remedy_type}
                    </span>
                  </div>
                  <button
                    onClick={() => onSelectRecall(recall)}
                    className="px-3.5 py-1.5 text-xs font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <span>View Advisory</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </section>

      {/* HOW THE PLATFORM WORKS SECTION */}
      <section id="how-it-works" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Consumer Safety Guide
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
              How Product Recalls Work
            </h2>
            <p className="text-xs text-slate-500 mt-2">
              Four easy steps to check your products, stay protected, and claim guaranteed replacements or refunds.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center font-mono text-sm">
                01
              </div>
              <h3 className="text-sm font-bold text-slate-900">1. Search or Register</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Search your product model or batch number in the public registry, or register your product to receive automated alerts.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center font-mono text-sm">
                02
              </div>
              <h3 className="text-sm font-bold text-slate-900">2. Instant Safety Alerts</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                If an official safety recall is issued for your registered item, you immediately receive a high-priority advisory with instructions.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center font-mono text-sm">
                03
              </div>
              <h3 className="text-sm font-bold text-slate-900">3. Pre-Paid Return Pickup</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                File a free return request in your portal. The manufacturer provides pre-paid shipping labels and courier pickup at zero cost to you.
              </p>
            </div>

            <div className="space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-bold flex items-center justify-center font-mono text-sm">
                04
              </div>
              <h3 className="text-sm font-bold text-slate-900">4. 100% Refund or Replacement</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Receive a 100% full refund to your original payment method or an upgraded safe replacement unit delivered directly to your doorstep.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* SAFETY FAQS ACCORDION SECTION */}
      <section id="faqs" className="py-16 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        
        <div className="text-center mb-10">
          <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
            Consumer Support
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mt-1">
            Frequently Asked Questions
          </h2>
        </div>

        <div className="space-y-4">
          
          <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              How do I know if my specific serial number is affected?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Use the search bar at the top of this portal to enter your model or batch code found on your product's rating label. If you register your purchased product in your free consumer account, our system automatically checks every new safety notice and notifies you instantly.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              Do I have to pay for return shipping costs?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              No. By law, manufacturers must cover 100% of return shipping costs for certified safety recalls. Once your return request is approved in the portal, you will receive a pre-paid courier shipping label with free home pickup.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              How can a manufacturing brand publish product recalls?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              Manufacturing companies create an account through the Manufacturer Portal by submitting their business registration and compliance details. Once verified by the safety commission, companies can issue official product defect advisories and manage customer returns.
            </p>
          </div>

          <div className="p-5 bg-white rounded-xl border border-slate-200 space-y-2">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-blue-600 shrink-0" />
              How long does it take to receive a refund or replacement unit?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed pl-6">
              After submitting your return claim, the pre-paid courier label is generated within 24–48 hours. Once the returned item is dropped off or inspected, electronic refunds are processed within 3–5 business days, and replacement units are shipped via expedited delivery.
            </p>
          </div>

        </div>

      </section>

      {/* CONTACT REGULATORY SAFETY DIVISION SECTION */}
      <section id="contact" className="py-16 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center mb-8">
            <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
              Inquiries & Incident Reports
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mt-1">
              Contact Safety & Compliance Directorate
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Have an urgent safety question or unlisted product defect? Submit an inquiry to our dedicated staff.
            </p>
          </div>

          {contactSuccess && (
            <div className="mb-6 p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-xs text-emerald-800">
              <Check className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Your message has been submitted. Safety staff will respond within 24 business hours.</span>
            </div>
          )}

          <form onSubmit={handleContactSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Your Full Name</label>
                <input
                  type="text"
                  required
                  value={contactName}
                  onChange={(e) => setContactName(e.target.value)}
                  placeholder="e.g. Elena Rostova"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="name@domain.com"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
              <input
                type="text"
                required
                value={contactSubject}
                onChange={(e) => setContactSubject(e.target.value)}
                placeholder="Incident report / Regulatory inquiry"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Message Details</label>
              <textarea
                required
                rows={4}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                placeholder="Provide detailed description of the product issue, batch code if known, or general question..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={contactLoading}
              className="w-full py-2.5 px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{contactLoading ? 'Transmitting Message...' : 'Send Inquiry to Safety Staff'}</span>
            </button>
          </form>

        </div>
      </section>

      {/* FOOTER */}
      <footer className="mt-auto bg-slate-900 text-slate-400 py-12 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <ShieldAlert className="w-5 h-5 text-blue-500" />
              <span>RecallGuard</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              National Product Safety and Regulatory Compliance Infrastructure. Protecting consumer health and property through certified recall governance.
            </p>
          </div>

          <div>
            <div className="text-white font-semibold mb-3">Public Resources</div>
            <ul className="space-y-2">
              <li><a href="#active-recalls" className="hover:text-white transition-colors">Active Recall Notices</a></li>
              <li><a href="#search-recalls" className="hover:text-white transition-colors">Search Serial Registry</a></li>
              <li><a href="#how-it-works" className="hover:text-white transition-colors">How The Platform Works</a></li>
              <li><a href="#faqs" className="hover:text-white transition-colors">Consumer Safety FAQs</a></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold mb-3">Enterprise Portals</div>
            <ul className="space-y-2">
              <li><button onClick={() => setAuthModal('register_company')} className="hover:text-white transition-colors cursor-pointer text-left">Manufacturer Registration</button></li>
              <li><button onClick={() => setAuthModal('register_customer')} className="hover:text-white transition-colors cursor-pointer text-left">Consumer Product Registration</button></li>
              <li><button onClick={() => setAuthModal('login')} className="hover:text-white transition-colors cursor-pointer text-left">Authorized Portal Sign-In</button></li>
            </ul>
          </div>

          <div>
            <div className="text-white font-semibold mb-3">Regulatory Standards</div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Built in accordance with ISO 10377 (Consumer Product Safety — Guidelines for Suppliers) and ISO 10393 (Product Recall Code of Practice).
            </p>
            <div className="mt-3 text-[11px] text-slate-500">
              © {new Date().getFullYear()} RecallGuard Directorate. All rights reserved.
            </div>
          </div>

        </div>
      </footer>

    </div>
  );
};
