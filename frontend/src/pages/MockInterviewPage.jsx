import React, { useState, useEffect, useRef } from 'react';
import { mockInterviewAPI } from '../services/api';
import { Navbar } from '../components/layout/Navbar';
import { Sidebar } from '../components/layout/Sidebar';
import { BackgroundDecoration } from '../components/ui/BackgroundDecoration';
import {
  Mic,
  MicOff,
  Volume2,
  Sparkles,
  Send,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Award,
  Building2,
  Briefcase,
  Play,
  BookOpen,
  HelpCircle,
  FileCheck,
  X,
  Square,
  RotateCcw,
  Edit3,
  Headphones,
  Radio,
  VolumeX
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const MockInterviewPage = () => {
  // Session Configuration State
  const [companyName, setCompanyName] = useState('Google');
  const [jobRole, setJobRole] = useState('Software Engineer');
  const [interviewType, setInterviewType] = useState('Technical');
  const [difficulty, setDifficulty] = useState('Medium');
  const [durationMinutes, setDurationMinutes] = useState(15); // 10 to 15 minutes

  // Active Session State
  const [sessionId, setSessionId] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerText, setAnswerText] = useState('');
  const [evaluating, setEvaluating] = useState(false);
  const [submittingTurn, setSubmittingTurn] = useState(false);
  const [sessionReport, setSessionReport] = useState(null);
  const [heardQuestionsMap, setHeardQuestionsMap] = useState({}); // Can only hear question once!

  // Timer State (10 - 15 minutes)
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [timerActive, setTimerActive] = useState(false);

  // Spoken Interview Studio State
  const [inputMode, setInputMode] = useState('voice'); // 'voice' by default!
  const [liveInterim, setLiveInterim] = useState('');
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // Past Reports State
  const [pastReports, setPastReports] = useState([]);
  const [showPastReports, setShowPastReports] = useState(false);
  const [selectedPastReport, setSelectedPastReport] = useState(null);

  // Audio Speech Recognition & Synthesis State
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef(null);

  const fetchPastReports = async () => {
    try {
      const res = await mockInterviewAPI.getReports();
      if (res && res.success && Array.isArray(res.reports)) {
        setPastReports(res.reports);
      }
    } catch (err) {
      console.warn('Failed to load past mock interview reports:', err);
    }
  };

  // Initialize Speech Recognition & load reports on mount
  useEffect(() => {
    fetchPastReports();
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onresult = (event) => {
        let finalTrans = '';
        let interimTrans = '';
        for (let i = event.results.length - 1; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            finalTrans += event.results[i][0].transcript;
          } else {
            interimTrans += event.results[i][0].transcript;
          }
        }
        if (finalTrans) {
          setAnswerText((prev) => (prev ? `${prev} ${finalTrans}`.trim() : finalTrans.trim()));
        }
        setLiveInterim(interimTrans);
      };

      rec.onerror = (e) => {
        console.warn('Speech recognition event notice:', e.error);
        if (e.error !== 'no-speech') {
          setIsListening(false);
        }
      };

      rec.onend = () => {
        setIsListening(false);
        setLiveInterim('');
      };

      recognitionRef.current = rec;
    } else {
      setSpeechSupported(false);
    }
  }, []);

  // Live Countdown Timer (10 to 15 minutes)
  useEffect(() => {
    let interval = null;
    if (timerActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setTimerActive(false);
            handleFinishSession(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerActive, timeLeft, sessionId]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startListening = async () => {
    setLiveInterim('');
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    // Capture microphone audio via MediaRecorder for robust fallback
    try {
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        audioChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };
        recorder.start();
        mediaRecorderRef.current = recorder;
      }
    } catch (e) {
      console.warn("Microphone stream error:", e);
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn('Recognition start exception:', e);
        setIsListening(true);
      }
    } else {
      setIsListening(true);
    }
  };

  const stopListening = () => {
    setIsListening(false);
    setLiveInterim('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.warn('Recognition stop exception:', e);
      }
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream?.getTracks().forEach(track => track.stop());
      } catch (e) {
        console.warn('MediaRecorder stop exception:', e);
      }
    }
  };

  const speakText = (text) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const playQuestionAudioOnce = (text, index) => {
    if (heardQuestionsMap[index]) return; // Strictly cannot hear again!
    setHeardQuestionsMap((prev) => ({ ...prev, [index]: true }));
    speakText(text);
  };

  const handleStartSession = async () => {
    setEvaluating(true);
    setSessionReport(null);
    setAnswerText('');
    setLiveInterim('');
    setHeardQuestionsMap({});

    // Question count adapted to duration (10 min -> 4 questions, 15 min -> 6 questions)
    const count = durationMinutes === 10 ? 4 : 6;
    setTimeLeft(durationMinutes * 60);

    try {
      const res = await mockInterviewAPI.startSession({
        company_name: companyName,
        job_role: jobRole,
        interview_type: interviewType,
        difficulty: difficulty,
        question_count: count,
        duration_minutes: durationMinutes
      });

      if (res.success && res.session) {
        setSessionId(res.session.session_id);
        const qList = res.session.questions || [];
        setQuestions(qList);
        setCurrentIdx(0);
        setTimerActive(true);
        if (res.session.first_question) {
          // Play first question once & lock it
          setHeardQuestionsMap({ 0: true });
          speakText(res.session.first_question.question_text);
        }
      }
    } catch (err) {
      console.error('Failed to start mock interview session:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const handleSubmitAnswerAndProceed = async (spokenOverride) => {
    let candidate = (spokenOverride !== undefined ? spokenOverride : answerText).trim();
    if (liveInterim) {
      candidate = `${candidate} ${liveInterim}`.trim();
    }

    // If speech recognition didn't capture text, try server-side transcription fallback
    if (!candidate && audioChunksRef.current.length > 0) {
      try {
        setIsTranscribing(true);
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const transRes = await mockInterviewAPI.transcribeAudio(blob);
        if (transRes && transRes.transcript) {
          candidate = transRes.transcript.trim();
        }
      } catch (e) {
        console.warn("Server transcription fallback notice:", e);
      } finally {
        setIsTranscribing(false);
      }
    }

    if (!candidate) {
      alert("Please speak or type your answer before proceeding.");
      return;
    }

    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }

    setSubmittingTurn(true);
    const q = questions[currentIdx];

    try {
      // Evaluate and record turn response in the backend
      await mockInterviewAPI.evaluateTurn({
        session_id: sessionId,
        question_id: q?.question_id || `q_${currentIdx + 1}`,
        question_text: q?.question_text || '',
        transcribed_answer: candidate
      });
    } catch (err) {
      console.error('Failed to evaluate turn:', err);
    } finally {
      setSubmittingTurn(false);
    }

    // Immediately clear answer input
    setAnswerText('');
    setLiveInterim('');
    audioChunksRef.current = [];

    // Advance directly to the next question or complete interview
    const nextIdx = currentIdx + 1;
    if (nextIdx < questions.length) {
      setCurrentIdx(nextIdx);
      // Play next question audio once & mark as heard
      setHeardQuestionsMap((prev) => ({ ...prev, [nextIdx]: true }));
      speakText(questions[nextIdx].question_text);
    } else {
      // All questions completed -> generate full analysis report
      handleFinishSession(false);
    }
  };

  const handleFinishSession = async (endedEarly = false) => {
    if (!sessionId) return;
    setTimerActive(false);
    stopListening();
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
    setEvaluating(true);
    try {
      const res = await mockInterviewAPI.finishSession(sessionId, endedEarly);
      if (res.success) {
        setSessionReport(res.report);
        fetchPastReports();
      }
    } catch (err) {
      console.error('Failed to finish mock interview session:', err);
    } finally {
      setEvaluating(false);
    }
  };

  const currentQ = questions[currentIdx];

  return (
    <div className="min-h-screen bg-[#F7F9F2] text-[#14251D] flex flex-col relative overflow-hidden">
      <BackgroundDecoration />
      <Navbar />

      <div className="flex flex-1 z-10">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl mx-auto overflow-y-auto">
          
          {/* PAGE HEADER */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/20 text-[#041E17] font-black text-xs border border-[#10B981]/40 mb-2">
                <Mic className="w-3.5 h-3.5 text-[#059669]" /> Module C & D — Spoken & Text Mock Interview
              </div>
              <h1 className="text-3xl font-black text-[#041E17]">Voice & Text AI Mock Interview</h1>
              <p className="text-xs font-bold text-[#1A3328]">
                Simulate company-specific 10–15 minute interview rounds with unique dynamic questions, live timer, speech recognition, and transparent Gemini AI evaluation.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowPastReports(true)}
                className="px-4 py-2.5 rounded-2xl bg-white border border-emerald-300 hover:border-[#10B981] text-[#041E17] font-black text-xs shadow-sm hover:bg-emerald-50 transition-all flex items-center gap-2"
              >
                <Award className="w-4 h-4 text-[#059669]" />
                Past Sessions ({pastReports.length})
              </button>
            </div>
          </div>

          {/* AI NOTICE DISCLAIMER */}
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-start gap-3">
            <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <p className="text-xs font-bold text-amber-950 leading-relaxed">
              <span className="font-black">Notice:</span> Practice scores and readiness levels are AI feedback metrics based on transcript evidence, not official hiring outcomes.
            </p>
          </div>

          {/* SETUP SESSION CARD */}
          {!sessionId && (
            <div className="glass-panel p-6 rounded-3xl border border-[#10B981]/40 shadow-md space-y-4">
              <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#059669]" /> Initialize Interview Session
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Company Name</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Job Role</label>
                  <input
                    type="text"
                    value={jobRole}
                    onChange={(e) => setJobRole(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black"
                  />
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Interview Round</label>
                  <select
                    value={interviewType}
                    onChange={(e) => setInterviewType(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black"
                  >
                    <option value="Technical">Technical Round</option>
                    <option value="Coding & DSA">Coding & DSA</option>
                    <option value="CS Fundamentals">CS Fundamentals</option>
                    <option value="HR & Behavioral">HR & Behavioral</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Difficulty</label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-extrabold text-[#041E17] mb-1">Duration</label>
                  <select
                    value={durationMinutes}
                    onChange={(e) => setDurationMinutes(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl border border-emerald-300 bg-white text-xs font-black"
                  >
                    <option value={10}>10 Min (4 Questions)</option>
                    <option value={15}>15 Min (6 Questions)</option>
                  </select>
                </div>
              </div>

              <button
                onClick={handleStartSession}
                disabled={evaluating}
                className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#059669] via-[#10B981] to-[#059669] text-white font-black text-xs shadow-glow-emerald hover:opacity-95 flex items-center justify-center gap-2"
              >
                {evaluating ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Play className="w-4 h-4 text-[#D9F99D]" /> Launch {durationMinutes}-Minute Mock Interview
                  </>
                )}
              </button>
            </div>
          )}

          {/* ACTIVE SESSION WORKSPACE (FOCUSED, DISTRACTION-FREE INTERVIEW COCKPIT) */}
          {sessionId && !sessionReport && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
              
              <div className="glass-panel p-6 md:p-8 rounded-3xl border border-[#10B981]/40 space-y-6 shadow-xl bg-white/90">
                
                {/* INTERVIEW HEADER: PROGRESS, TIMER & CONTROLS */}
                <div className="flex items-center justify-between flex-wrap gap-3 pb-4 border-b border-emerald-100">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-[#059669] bg-emerald-100 px-3.5 py-1 rounded-full border border-emerald-300 shadow-sm">
                      {companyName} • Question {currentIdx + 1} of {questions.length}
                    </span>
                    <span className={`text-xs font-black px-3.5 py-1 rounded-full border flex items-center gap-1.5 shadow-sm ${
                      timeLeft <= 120 
                        ? 'bg-rose-100 text-rose-700 border-rose-300 animate-pulse' 
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}>
                      ⏱️ {formatTime(timeLeft)} remaining
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* AUDIO STATUS: CAN ONLY BE HEARD ONCE */}
                    {isSpeaking ? (
                      <span className="px-3.5 py-1.5 rounded-xl bg-emerald-600 text-white text-xs font-bold flex items-center gap-1.5 animate-pulse shadow-sm">
                        <Volume2 className="w-4 h-4" /> Interviewer Speaking...
                      </span>
                    ) : heardQuestionsMap[currentIdx] ? (
                      <span
                        className="px-3.5 py-1.5 rounded-xl bg-gray-100 text-gray-500 border border-gray-200 text-xs font-bold flex items-center gap-1.5 cursor-not-allowed select-none"
                        title="Questions can only be heard once per round"
                      >
                        <VolumeX className="w-4 h-4 text-gray-400" /> Audio Heard (1/1)
                      </span>
                    ) : (
                      <button
                        onClick={() => playQuestionAudioOnce(currentQ?.question_text, currentIdx)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-[#059669] text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Volume2 className="w-4 h-4" /> Listen (1 Time Only)
                      </button>
                    )}

                    {/* STOP INTERVIEW IN BETWEEN */}
                    <button
                      onClick={() => handleFinishSession(true)}
                      disabled={evaluating || submittingTurn}
                      className="px-3.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-extrabold text-xs transition-all flex items-center gap-1.5 shadow-sm"
                      title="Stop the interview anytime and receive AI evaluation on answers submitted so far"
                    >
                      <Square className="w-3.5 h-3.5 fill-rose-600 text-rose-600" />
                      End Early
                    </button>
                  </div>
                </div>

                {/* QUESTION DISPLAY */}
                <div className="space-y-2 bg-gradient-to-r from-emerald-50/70 to-teal-50/40 p-5 rounded-2xl border border-emerald-200">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase font-black tracking-wider text-emerald-800">
                      Round: {currentQ?.category || interviewType} ({difficulty})
                    </span>
                    <span className="text-[10px] font-bold text-gray-500">
                      Question {currentIdx + 1} / {questions.length}
                    </span>
                  </div>
                  <h3 className="text-xl font-black text-[#041E17] leading-relaxed">
                    "{currentQ?.question_text}"
                  </h3>
                </div>

                {/* INPUT MODE TOGGLE */}
                <div className="flex items-center justify-between pt-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-black text-[#041E17]">
                    <Radio className="w-3.5 h-3.5 text-[#059669] animate-pulse" />
                    {inputMode === 'voice' ? 'Spoken Voice Mode (Primary)' : 'Manual Typing Mode'}
                  </div>

                  <button
                    type="button"
                    onClick={() => setInputMode(prev => prev === 'voice' ? 'text' : 'voice')}
                    className="text-[11px] font-extrabold text-[#059669] hover:text-[#041E17] hover:underline flex items-center gap-1"
                  >
                    {inputMode === 'voice' ? (
                      <><Edit3 className="w-3.5 h-3.5" /> Switch to Typing Mode</>
                    ) : (
                      <><Mic className="w-3.5 h-3.5" /> Switch to Spoken Voice Mode</>
                    )}
                  </button>
                </div>

                {/* SUBMITTING OVERLAY / SPINNER */}
                {submittingTurn && (
                  <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-300 flex items-center justify-center gap-3 text-xs font-black text-[#059669] animate-pulse">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Evaluating answer & loading next question...
                  </div>
                )}

                {/* VOICE STUDIO */}
                {!submittingTurn && inputMode === 'voice' && (
                  <div className="space-y-4">
                    
                    {/* STATE 1: IDLE / READY TO RECORD */}
                    {!isListening && !answerText && (
                      <div className="text-center py-10 px-4 space-y-4 bg-gradient-to-b from-emerald-50/40 to-white rounded-3xl border-2 border-dashed border-emerald-300">
                        <button
                          onClick={startListening}
                          className="w-24 h-24 mx-auto rounded-full bg-gradient-to-tr from-[#059669] to-[#10B981] text-white shadow-xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
                        >
                          <Mic className="w-10 h-10 group-hover:scale-110 transition-transform" />
                        </button>
                        <div>
                          <h4 className="text-base font-black text-[#041E17]">Click Microphone to Speak Your Answer</h4>
                          <p className="text-xs font-bold text-gray-600 max-w-sm mx-auto mt-1">
                            Speak clearly. When finished, submit to move directly to the next question.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* STATE 2: ACTIVE LISTENING & RECORDING (WITH AUDIO WAVES) */}
                    {isListening && (
                      <div className="text-center py-7 px-5 space-y-4 bg-[#041E17] text-white rounded-3xl border border-emerald-500 shadow-2xl relative overflow-hidden">
                        {/* Audio Waveform Bars */}
                        <div className="flex items-center justify-center gap-1.5 h-12">
                          {[40, 75, 100, 65, 90, 50, 85, 45, 95, 60, 80].map((h, i) => (
                            <motion.div
                              key={i}
                              animate={{ height: [`${h * 0.25}%`, `${h}%`, `${h * 0.35}%`] }}
                              transition={{ repeat: Infinity, duration: 0.5 + (i % 4) * 0.15, ease: 'easeInOut' }}
                              className="w-1.5 bg-[#D9F99D] rounded-full"
                            />
                          ))}
                        </div>

                        <div>
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-500/30 text-red-200 border border-red-500/50 text-xs font-black animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            Listening & Recording Your Voice...
                          </span>
                        </div>

                        {/* Live Speech Stream Display */}
                        <div className="bg-black/50 border border-emerald-700/80 p-4 rounded-2xl mx-2 min-h-[90px] text-left text-xs font-bold text-[#D9F99D]">
                          <span className="text-[10px] uppercase text-emerald-400 block mb-1">Live Speech Transcript:</span>
                          {answerText || liveInterim ? (
                            <p className="leading-relaxed">
                              {answerText} <span className="text-white italic animate-pulse">{liveInterim}</span>
                            </p>
                          ) : (
                            <p className="text-emerald-400/60 italic">Listening for speech input...</p>
                          )}
                        </div>

                        {/* Action Controls */}
                        <div className="flex justify-center gap-3 pt-2">
                          <button
                            onClick={() => handleSubmitAnswerAndProceed()}
                            disabled={isTranscribing || submittingTurn}
                            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-[#10B981] to-[#34D399] text-[#041E17] font-black text-xs shadow-lg transition-all flex items-center gap-2 hover:scale-105"
                          >
                            {isTranscribing ? (
                              <RefreshCw className="w-4 h-4 animate-spin text-[#041E17]" />
                            ) : (
                              <CheckCircle2 className="w-4 h-4 text-[#041E17]" />
                            )}
                            Finish & Submit Answer {currentIdx + 1 < questions.length ? '→' : '🏁'}
                          </button>
                          <button
                            onClick={() => { setAnswerText(''); setLiveInterim(''); }}
                            className="px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-black text-xs transition-all flex items-center gap-1.5"
                          >
                            <RotateCcw className="w-4 h-4" /> Restart Recording
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STATE 3: SPOKEN ANSWER CAPTURED */}
                    {!isListening && answerText && (
                      <div className="p-5 bg-white rounded-3xl border border-emerald-300 space-y-4 shadow-md">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-black text-[#059669] flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4" /> Spoken Answer Captured
                          </span>
                          <span className="text-[11px] text-gray-500 font-bold">
                            {answerText.split(' ').filter(Boolean).length} words
                          </span>
                        </div>

                        <div className="bg-emerald-50/70 p-4 rounded-2xl border border-emerald-200">
                          <span className="text-[10px] uppercase font-bold text-emerald-800 block mb-1">Your Voice Transcript:</span>
                          <p className="text-xs font-bold text-gray-800 leading-relaxed italic">
                            "{answerText}"
                          </p>
                        </div>

                        <div className="flex gap-3 pt-1">
                          <button
                            onClick={() => handleSubmitAnswerAndProceed()}
                            disabled={submittingTurn}
                            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#10B981] text-white font-black text-xs shadow-md flex items-center justify-center gap-2 hover:opacity-95"
                          >
                            {currentIdx + 1 < questions.length ? (
                              <>Submit Answer & Go to Next Question →</>
                            ) : (
                              <><CheckCircle2 className="w-4 h-4 text-[#D9F99D]" /> Submit Answer & Complete Interview 🏁</>
                            )}
                          </button>
                          <button
                            onClick={() => { setAnswerText(''); startListening(); }}
                            className="px-4 py-3.5 rounded-2xl bg-white border border-emerald-300 text-[#041E17] font-black text-xs hover:bg-emerald-50 flex items-center gap-1.5"
                          >
                            <Mic className="w-4 h-4 text-[#059669]" /> Speak Again
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                )}

                {/* TYPING MODE (OPTIONAL FALLBACK) */}
                {!submittingTurn && inputMode === 'text' && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-extrabold text-[#041E17] uppercase tracking-wider mb-2">
                        Type Your Answer Below:
                      </label>
                      <textarea
                        rows={6}
                        placeholder="Type your response here..."
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        className="w-full p-4 rounded-2xl border border-emerald-300 bg-white focus:outline-none focus:border-[#10B981] text-xs font-bold text-[#0A1C15] resize-none shadow-sm"
                      />
                    </div>

                    <button
                      onClick={() => handleSubmitAnswerAndProceed()}
                      disabled={submittingTurn || !answerText.trim()}
                      className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-[#059669] to-[#10B981] text-white font-black text-xs shadow-glow-emerald hover:opacity-95 transition-all flex items-center justify-center gap-2"
                    >
                      {currentIdx + 1 < questions.length ? (
                        <>Submit Answer & Go to Next Question →</>
                      ) : (
                        <><CheckCircle2 className="w-4 h-4 text-[#D9F99D]" /> Submit Answer & Complete Interview 🏁</>
                      )}
                    </button>
                  </div>
                )}

              </div>

            </div>
          )}

          {/* COMPLETED SESSION REPORT (FULL POST-INTERVIEW ANALYSIS) */}
          {sessionReport && (
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="glass-banner-dark p-8 rounded-3xl shadow-2xl space-y-4">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#10B981]/30 text-[#D9F99D] font-black text-xs">
                  <Award className="w-4 h-4 text-[#D9F99D]" /> Mock Interview Analysis Report
                </div>
                <h2 className="text-3xl font-black text-white">{sessionReport.company_name} — {sessionReport.job_role} Performance</h2>
                <div className="flex items-center gap-6">
                  <div>
                    <span className="text-[11px] text-[#A7F3D0] uppercase font-black block">Overall Practice Score</span>
                    <span className="text-4xl font-black text-[#D9F99D]">{sessionReport.overall_score} / 100</span>
                  </div>
                  <div className="h-10 border-r border-emerald-700" />
                  <div>
                    <span className="text-[11px] text-[#A7F3D0] uppercase font-black block">Readiness Level</span>
                    <span className="text-xl font-black text-white">{sessionReport.performance_level}</span>
                  </div>
                  <div className="h-10 border-r border-emerald-700" />
                  <div>
                    <span className="text-[11px] text-[#A7F3D0] uppercase font-black block">Questions Completed</span>
                    <span className="text-xl font-black text-white">{sessionReport.total_questions_answered} of {sessionReport.total_questions_planned || questions.length}</span>
                  </div>
                </div>
              </div>

              {/* DETAILED QUESTION-BY-QUESTION BREAKDOWN */}
              {sessionReport.question_breakdown && sessionReport.question_breakdown.length > 0 && (
                <div className="glass-panel p-6 rounded-3xl border border-emerald-300 space-y-4 shadow-md bg-white">
                  <h3 className="text-base font-black text-[#041E17] flex items-center gap-2">
                    <FileCheck className="w-5 h-5 text-[#059669]" /> Question-by-Question Evaluation & Rubric
                  </h3>
                  <div className="space-y-4">
                    {sessionReport.question_breakdown.map((turn, idx) => (
                      <div key={idx} className="p-4 rounded-2xl border border-emerald-200 bg-emerald-50/30 space-y-3">
                        <div className="flex items-center justify-between flex-wrap gap-2">
                          <span className="text-xs font-black text-[#059669] bg-emerald-100 px-3 py-0.5 rounded-full border border-emerald-300">
                            Question {idx + 1}
                          </span>
                          <span className="text-xs font-black text-[#041E17]">
                            Score: <span className="text-[#059669] font-black">{turn.evaluation?.overall_turn_score ?? 'N/A'}/100</span>
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[#041E17]">
                          "{turn.question_text}"
                        </h4>

                        <div className="bg-white p-3 rounded-xl border border-emerald-200 text-xs">
                          <span className="font-bold text-[#059669] block mb-0.5">Your Spoken Answer:</span>
                          <p className="text-gray-800 italic leading-relaxed">"{turn.transcribed_answer}"</p>
                        </div>

                        {turn.evaluation?.scores && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-[11px] font-bold bg-white p-2.5 rounded-xl border border-emerald-200">
                            <div>Correctness: <span className="text-[#059669]">{turn.evaluation.scores.technical_correctness}%</span></div>
                            <div>Relevance: <span className="text-[#059669]">{turn.evaluation.scores.relevance}%</span></div>
                            <div>Completeness: <span className="text-[#059669]">{turn.evaluation.scores.completeness}%</span></div>
                            <div>Clarity: <span className="text-[#059669]">{turn.evaluation.scores.clarity}%</span></div>
                          </div>
                        )}

                        {turn.evaluation?.strengths?.length > 0 && (
                          <div className="text-xs space-y-1">
                            <span className="font-extrabold text-emerald-900 block">Strengths:</span>
                            <ul className="list-disc list-inside text-emerald-800 space-y-0.5">
                              {turn.evaluation.strengths.map((str, sIdx) => (
                                <li key={sIdx}>{str}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {turn.evaluation?.missing_concepts?.length > 0 && (
                          <div className="text-xs space-y-1">
                            <span className="font-extrabold text-amber-900 block">Areas to Improve:</span>
                            <ul className="list-disc list-inside text-amber-800 space-y-0.5">
                              {turn.evaluation.missing_concepts.map((g, gIdx) => (
                                <li key={gIdx}>{g}</li>
                              ))}
                            </ul>
                          </div>
                        )}

                        {turn.evaluation?.model_answer && (
                          <div className="text-xs bg-white p-3 rounded-xl border border-emerald-200 text-gray-700">
                            <span className="font-extrabold text-[#059669] block mb-1">Recommended Model Answer:</span>
                            <p className="leading-relaxed">{turn.evaluation.model_answer}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-panel p-6 rounded-3xl border border-emerald-300 space-y-3">
                  <h3 className="text-base font-black text-[#041E17]">Key Strengths Demonstrated</h3>
                  <div className="space-y-2">
                    {sessionReport.key_strengths?.map((str, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-bold text-emerald-950 flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" /> {str}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="glass-panel p-6 rounded-3xl border border-emerald-300 space-y-3">
                  <h3 className="text-base font-black text-[#041E17]">Recommended Revision Topics</h3>
                  <div className="space-y-2">
                    {sessionReport.recommended_revision_topics?.map((top, i) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-emerald-200 text-xs font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-emerald-700" /> {top}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => {
                  setSessionId(null);
                  setSessionReport(null);
                }}
                className="w-full py-3.5 rounded-2xl bg-[#059669] text-white font-black text-xs hover:bg-[#047857] shadow-lg transition-all"
              >
                Start Another Mock Interview Session
              </button>
            </motion.div>
          )}

        </main>
      </div>

      {/* PAST INTERVIEW REPORTS MODAL */}
      <AnimatePresence>
        {showPastReports && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#F7F9F2] w-full max-w-2xl rounded-3xl border border-emerald-400 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="bg-[#064E3B] text-white p-5 flex items-center justify-between border-b border-emerald-600">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-[#10B981]/20 border border-[#10B981]/40">
                    <Award className="w-5 h-5 text-[#D9F99D]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Past Mock Interview Sessions</h2>
                    <p className="text-xs font-semibold text-emerald-200">Review historical feedback, rubric scores, and recommendations</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowPastReports(false)}
                  className="p-2 rounded-xl hover:bg-white/10 text-emerald-200 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-4 overflow-y-auto">
                {pastReports.length === 0 ? (
                  <div className="text-center py-12 space-y-3">
                    <Sparkles className="w-8 h-8 text-[#059669] mx-auto animate-pulse" />
                    <h4 className="text-sm font-black text-[#041E17]">No Past Sessions Yet</h4>
                    <p className="text-xs font-bold text-[#1A3328]">Complete your first mock interview above to see historical reports recorded here.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pastReports.map((item, idx) => {
                      const rep = item.final_report || item;
                      const cName = rep.company_name || item.company_name || 'Interview Practice';
                      const role = rep.job_role || item.job_role || 'General Role';
                      const score = rep.overall_score ?? item.overall_score ?? 'N/A';
                      const perf = rep.performance_level || item.performance_level || 'Evaluated';
                      const date = item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent';

                      return (
                        <div
                          key={item.session_id || idx}
                          className="glass-card p-4 rounded-2xl border border-emerald-300 hover:border-[#10B981] flex items-center justify-between gap-4 transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#041E17] bg-[#10B981]/20 px-2.5 py-0.5 rounded-full border border-[#10B981]/40">
                                {cName}
                              </span>
                              <span className="text-xs font-bold text-[#059669]">{role}</span>
                              <span className="text-[10px] text-gray-500">• {date}</span>
                            </div>
                            <p className="text-xs font-bold text-[#1A3328]">
                              Performance Level: <span className="font-black text-[#041E17]">{perf}</span>
                            </p>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <span className="text-[10px] text-gray-500 block uppercase font-bold">Score</span>
                              <span className="text-xl font-black text-[#059669]">{score}/100</span>
                            </div>
                            <button
                              onClick={() => {
                                setSessionReport(rep);
                                setShowPastReports(false);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-[#064E3B] text-[#D9F99D] font-black text-xs hover:bg-[#041E17] transition-all"
                            >
                              Inspect
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
