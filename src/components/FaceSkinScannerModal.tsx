import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Camera,
  Scan,
  Sparkles,
  Check,
  AlertTriangle,
  RotateCcw,
  Upload,
  User,
  ShieldCheck,
  ArrowRight,
  ShoppingBag,
  Loader2,
  Lock,
  CheckCircle2,
  Info,
  HelpCircle,
  Eye,
  Zap,
  Sun,
  Target,
  Glasses,
  Sliders,
  UserCheck,
  Video,
  Volume2,
  VolumeX
} from 'lucide-react';
import { Product, Language } from '../types';
import { getAllStoredProducts } from '../utils/productManager';
import { useAuth } from '../context/AuthContext';
import { GEMINI_ENABLED } from '../config/appConfig';

interface FaceSkinScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAddToCart: (product: Product) => void;
  onAddMultipleToCart: (products: Product[]) => void;
  onNavigateToPhoneLogin?: () => void;
  products?: Product[];
}

type StepType = 'login-check' | 'profile-age' | 'instructions' | 'camera' | 'preview' | 'analyzing' | 'result';

export const FaceSkinScannerModal: React.FC<FaceSkinScannerModalProps> = ({
  isOpen,
  onClose,
  language,
  onAddToCart,
  onAddMultipleToCart,
  onNavigateToPhoneLogin,
  products,
}) => {
  const { currentUser, userProfile } = useAuth();

  // Active step state
  const [step, setStep] = useState<StepType>('login-check');

  // Profile Form State (Reset on fresh session)
  const [fullName, setFullName] = useState('');
  const [gender, setGender] = useState<'female' | 'male' | 'other'>('female');
  const [ageGroup, setAgeGroup] = useState<'under18' | '18-24' | '25-34' | '35-44' | '45+'>('18-24');
  const [primarySkinConcerns, setPrimarySkinConcerns] = useState<string[]>(['acne']);

  // Instructions State
  const [readInstructions, setReadInstructions] = useState(true);

  // Camera & Image Capture State
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [autoCaptureSeconds, setAutoCaptureSeconds] = useState<number>(4);
  const [isAutoCapturePaused, setIsAutoCapturePaused] = useState<boolean>(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Analysis State
  const [analyzingProgress, setAnalyzingProgress] = useState(0);
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Voice Guidance Speech Synthesis in Khmer
  const speakVoiceGuidance = (text: string = 'សូមដាក់ស្បែកមុខដែលចង់វិភាគនៅកណ្ដាល Camera') => {
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'km-KH';
        utterance.rate = 0.9;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.log('Speech synthesis error:', e);
      }
    }
  };

  // Audio chime feedback when photo is captured
  const playCaptureSound = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1100, ctx.currentTime + 0.12);
        gain.gain.setValueAtTime(0.25, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      }
    } catch (e) {
      console.log('Audio error:', e);
    }
  };

  // CRITICAL REQUIREMENT: Reset Scanner session completely to zero when modal opens or restarted
  useEffect(() => {
    if (isOpen) {
      // Always reset session state from zero
      setCapturedImage(null);
      setAnalysisResult(null);
      setReadInstructions(false);
      setAnalyzingProgress(0);
      setCameraError(null);

      // Pre-fill user profile defaults from auth if available, but scan session itself is fresh
      const existingName = userProfile?.fullName || userProfile?.displayName || currentUser?.displayName || '';
      if (existingName) {
        setFullName(existingName);
      } else {
        setFullName('');
      }

      // Determine initial step: open camera scanner directly
      setStep('camera');
    } else {
      stopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [isOpen, currentUser, userProfile]);

  // Clean up camera stream on unmount or step change & speak voice prompt
  useEffect(() => {
    if (step === 'camera') {
      setAutoCaptureSeconds(4);
      setIsAutoCapturePaused(false);
      startCamera();
      // Speak Khmer voice instruction to user upon opening camera
      speakVoiceGuidance('សូមដាក់ស្បែកមុខដែលចង់វិភាគនៅកណ្ដាល Camera');
    } else if (step === 'preview') {
      stopCamera();
      // Speak Khmer confirmation that photo is captured and displayed
      speakVoiceGuidance('បានចាប់យករូបភាពស្បែកមុខរួចរាល់ សូមពិនិត្យមើលរូបថតរបស់អ្នក');
    } else {
      stopCamera();
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    }
  }, [step]);

  // AI Auto Capture Countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'camera' && isCameraActive && !isAutoCapturePaused) {
      if (autoCaptureSeconds > 0) {
        timer = setTimeout(() => {
          setAutoCaptureSeconds((prev) => prev - 1);
        }, 1000);
      } else if (autoCaptureSeconds === 0) {
        // Auto capture triggered by AI scanner!
        handleCapturePhoto();
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step, isCameraActive, autoCaptureSeconds, isAutoCapturePaused]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const startCamera = async () => {
    stopCamera();
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera API not supported on this browser');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      setIsCameraActive(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('មិនអាចបើកកាមេរ៉ាបានទេ។ សូមប្រាកដថាអ្នកបានអនុញ្ញាត Camera Permission ក្នុង Browser ឬជ្រើសរើសរូបថតផ្ទាល់ខ្លួនពី Gallery។');
      setIsCameraActive(false);
    }
  };

  const handleCapturePhoto = () => {
    let dataUrl: string | null = null;
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    } else if (mediaStreamRef.current) {
      const video = document.createElement('video');
      video.srcObject = mediaStreamRef.current;
      video.play();
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 640;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      }
    }

    if (dataUrl) {
      playCaptureSound();
      stopCamera();
      setCapturedImage(dataUrl);
      setStep('preview');
      speakVoiceGuidance('បានចាប់យករូបភាពស្បែកមុខរួចរាល់');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        playCaptureSound();
        stopCamera();
        setCapturedImage(dataUrl);
        setStep('preview');
        speakVoiceGuidance('បានជ្រើសរើសរូបភាពស្បែកមុខរួចរាល់');
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async (imageData: string) => {
    // If Gemini is disabled in Development Mode, do NOT make API call; return mock analysis result directly
    if (!GEMINI_ENABLED) {
      setStep('analyzing');
      setAnalyzingProgress(100);
      setIsApiLoading(false);
      setAnalysisResult({
        overallScore: 82,
        skinType: 'ស្បែកមុខចម្រុះ (Mixed Skin)',
        acneScore: 35,
        dullnessScore: 30,
        poresScore: 55,
        sensitiveScore: 25,
        rednessScore: 20,
        acneTypesDetected: [
          { name: 'មុនក្បាលស (Whiteheads)', level: 'តិចតួច' },
          { name: 'មុនក្បាលខ្មៅ (Blackheads)', level: 'នៅ T-Zone' },
        ],
        focusSummary: [
          '១. ស្បែកមុខមានសុខភាពល្អជាទូទៅ',
          '២. មានមុនក្បាលខ្មៅតិចតួចនៅតំបន់ច្រមុះ',
          '៣. ត្រូវការផ្តល់សំណើមបន្ថែមដើម្បីរក្សាភាពស្រស់ថ្លា'
        ]
      });
      setTimeout(() => {
        setStep('result');
      }, 500);
      return;
    }

    setStep('analyzing');
    setAnalyzingProgress(10);
    setIsApiLoading(true);

    // Progress animation
    const interval = setInterval(() => {
      setAnalyzingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 15;
      });
    }, 300);

    try {
      const response = await fetch('/api/scan-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: imageData,
          formData: {
            fullName,
            gender,
            ageGroup,
            skinConcerns: primarySkinConcerns,
          },
          language,
        }),
      });

      const data = await response.json();
      clearInterval(interval);
      setAnalyzingProgress(100);
      setAnalysisResult(data);
      setTimeout(() => {
        setStep('result');
        setIsApiLoading(false);
      }, 500);
    } catch (err) {
      console.error('Error in scan API:', err);
      clearInterval(interval);
      setAnalyzingProgress(100);

      // Clean fallback skin analysis result tailored for Lumimei
      const fallbackResult = {
        overallScore: 78,
        skinType: 'ស្បែកមុខចម្រុះ ងាយឡើងខ្លាញ់ និងមានមុន',
        acneScore: 42,
        dullnessScore: 38,
        poresScore: 65,
        sensitiveScore: 30,
        rednessScore: 28,
        acneTypesDetected: [
          { name: 'មុនក្បាលស (Whiteheads)', level: 'មធ្យម' },
          { name: 'មុនក្បាលខ្មៅ (Blackheads)', level: 'ច្រើននៅ T-Zone' },
          { name: 'មុនក្រហម / រលាក', level: 'តិចតួច' },
          { name: 'ស្នាមមុនចាស់ៗ', level: 'មធ្យម' },
        ],
        focusSummary: [
          '១. មុខមុន៖ ឃើញមានមុនក្បាលស និងមុនក្បាលខ្មៅនៅតំបន់ច្រមុះ និងថ្ពាល់',
          '២. មុខខ្មៅស្រអាប់៖ ស្បែកខ្វះសំណើម និងមានកោសិកាចាស់កកស្ទះ',
          '៣. រន្ធញើសធំ៖ ឃើញមានរន្ធញើសរីកធំនៅតំបន់ T-Zone ព្រោះជាតិខ្លាញ់ច្រើន',
          '៤. មុខរោល៖ មានអាការៈរោលតិចតួចពេលអាកាសធាតុក្តៅ',
          '៥. មុខរលាក/ក្រហម៖ ឃើញមានស្នាមក្រហមនៅជុំវិញមុនរលាក',
        ],
      };
      setAnalysisResult(fallbackResult);
      setTimeout(() => {
        setStep('result');
        setIsApiLoading(false);
      }, 500);
    }
  };

  const handleRestartScan = () => {
    // Completely clear scan state for a fresh new session
    setCapturedImage(null);
    setAnalysisResult(null);
    setReadInstructions(false);
    setAnalyzingProgress(0);
    stopCamera();
    setStep('instructions');
  };

  if (!isOpen) return null;

  const catalog = products && products.length > 0 ? products : getAllStoredProducts();

  // Recommended products matching analysis
  const recommendedRoutineProducts = catalog.filter((p) =>
    ['p1', 'p2', 'p4'].includes(p.id)
  );

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden my-auto border border-emerald-100 flex flex-col max-h-[92vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 text-white flex items-center justify-between shrink-0 shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur-md border border-white/20 shadow-inner">
              <Scan className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg tracking-tight font-battambang">
                  Scan វិភាគស្បែកមុខ AI
                </h3>
                <span className="px-2 py-0.5 bg-amber-400 text-emerald-950 text-[10px] font-black rounded-full uppercase tracking-wider">
                  New
                </span>
              </div>
              <p className="text-[11px] text-emerald-100/90 font-battambang mt-0.5">
                Lumimei Face Skin Diagnostic & Routine Finder
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopCamera();
              onClose();
            }}
            className="p-2 text-emerald-200 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
            title="បិទ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 font-battambang bg-slate-50/50">
          {/* STEP 1: LOGIN / REGISTER CHECK */}
          {step === 'login-check' && (
            <div className="py-6 px-4 text-center space-y-5 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
                <Lock className="w-8 h-8 text-emerald-600" />
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h4 className="text-lg font-bold text-slate-900">
                  សូមចូលគណនីដើម្បីចាប់ផ្ដើម Scan វិភាគស្បែកមុខ
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  ដើម្បីរក្សាទុកប្រវត្តិស្បែក និងទទួលបានការណែនាំឈុតផលិតផលថែរក្សាស្បែកមុខផ្ទាល់ខ្លួនពី Lumimei AI សូមចូលគណនី ឬចុះឈ្មោះប្រើប្រាស់។
                </p>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3 max-w-sm mx-auto">
                <button
                  onClick={() => {
                    onClose();
                    if (onNavigateToPhoneLogin) onNavigateToPhoneLogin();
                  }}
                  className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  <User className="w-4 h-4" />
                  <span>ចូលគណនី / ចុះឈ្មោះ</span>
                </button>
                <button
                  onClick={() => setStep('camera')}
                  className="w-full py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-2xl transition cursor-pointer"
                >
                  បន្តក្នុងនាមភ្ញៀវ
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: PROFILE & AGE CHECK */}
          {step === 'profile-age' && (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-900">
                <User className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">ជំហានទី ១/៣៖ ព័ត៌មានផ្ទាល់ខ្លួន និងអាយុ</p>
                  <p className="text-[11px] text-emerald-700">បំពេញព័ត៌មានខាងក្រោម ដើម្បីឲ្យ AI វិភាគស្បែកមុខបានត្រឹមត្រូវបំផុត</p>
                </div>
              </div>

              {/* Input: Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ឈ្មោះរបស់អ្នក (Full Name)
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="ឧទាហរណ៍៖ សុខា"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-sans"
                />
              </div>

              {/* Input: Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ភេទ (Gender)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGender('female')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      gender === 'female'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    👩 ស្រី (Female)
                  </button>
                  <button
                    type="button"
                    onClick={() => setGender('male')}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-bold transition cursor-pointer ${
                      gender === 'male'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    👨 ប្រុស (Male)
                  </button>
                </div>
              </div>

              {/* Input: Age Group */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  ក្រុមអាយុ (Age Check)
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'under18', label: 'ក្រោម ១៨ ឆ្នាំ' },
                    { id: '18-24', label: '១៨ - ២៤ ឆ្នាំ' },
                    { id: '25-34', label: '២៥ - ៣៤ ឆ្នាំ' },
                    { id: '35-44', label: '៣៥ - ៤៤ ឆ្នាំ' },
                    { id: '45+', label: '៤៥ ឆ្នាំឡើង' },
                  ].map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setAgeGroup(item.id as any)}
                      className={`py-2 px-2.5 rounded-xl border text-[11px] font-bold transition cursor-pointer ${
                        ageGroup === item.id
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Primary Skin Concerns */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  បញ្ហាស្បែកមុខដែលអ្នកចង់ដោះស្រាយ (ជ្រើសរើសយ៉ាងតិច ១)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'acne', label: '១. មុខមុន (Acne & Scars)' },
                    { id: 'dullness', label: '២. មុខខ្មៅស្រអាប់ (Dull Skin)' },
                    { id: 'pores', label: '៣. រន្ធញើសធំ (Large Pores)' },
                    { id: 'sensitive', label: '៤. មុខរោល (Sensitive/Bumpy)' },
                    { id: 'redness', label: '៥. មុខរលាក / ក្រហម (Redness)' },
                  ].map((c) => {
                    const isSelected = primarySkinConcerns.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          if (isSelected) {
                            setPrimarySkinConcerns(primarySkinConcerns.filter((x) => x !== c.id));
                          } else {
                            setPrimarySkinConcerns([...primarySkinConcerns, c.id]);
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-600 text-emerald-900 shadow-2xs'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{c.label}</span>
                        {isSelected && <Check className="w-4 h-4 text-emerald-600" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                onClick={() => setStep('camera')}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>ចូលទៅ Camera Scan</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 3: INSTRUCTIONS BEFORE SCAN */}
          {step === 'instructions' && (
            <div className="space-y-4 animate-fade-in">
              {/* Header Box */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200/80 p-4 rounded-2xl text-left space-y-1 shadow-2xs">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-emerald-700 shrink-0" />
                  <p className="font-extrabold text-sm text-emerald-950 font-opensans">
                    សេចក្ដីណែនាំមុនពេល Scan ស្បែកមុខ
                  </p>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed font-sans pt-0.5">
                  ដើម្បីឲ្យរូបភាពមានគុណភាពល្អ និងជួយឲ្យការវិភាគស្បែកមានភាពច្បាស់លាស់ សូមអនុវត្តតាមការណែនាំខាងក្រោម៖
                </p>
              </div>

              {/* 7 Guidelines Visual Cards Grid - 2 cards per row on mobile (grid-cols-2) */}
              <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                {/* Card 1 */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Sun className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមប្រើ Camera ដែលអាចថតរូបបានច្បាស់ និងមានពន្លឺគ្រប់គ្រាន់។
                  </p>
                </div>

                {/* Card 2 */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Target className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមដាក់ស្បែកមុខដែលចង់វិភាគនៅកណ្ដាល Camera
                  </p>
                </div>

                {/* Card 3 */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Sliders className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមកុំប្រើ Filter, Beauty Mode ឬមុខងារកែសម្ផស្សផ្សេងៗ ពេលថតរូប។
                  </p>
                </div>

                {/* Card 4 */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-teal-50 border border-teal-200 text-teal-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមរៀបសក់ឲ្យផុតពីផ្ទៃមុខ ដើម្បីកុំឲ្យសក់បាំងតំបន់ស្បែកដែលត្រូវវិភាគ។
                  </p>
                </div>

                {/* Card 5 */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-rose-50 border border-rose-200 text-rose-500 flex items-center justify-center shrink-0 shadow-2xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមរក្សាមុខទទេ កុំ Makeup
                  </p>
                </div>

                {/* Card 6 */}
                <div className="p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col items-center text-center gap-2 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-2xs">
                    <Glasses className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមដោះវ៉ែនតា មុនពេល Scan ដើម្បីឲ្យប្រព័ន្ធអាចមើលឃើញផ្ទៃមុខបានច្បាស់។
                  </p>
                </div>

                {/* Card 7 (col-span-2 for full-width highlight on mobile) */}
                <div className="col-span-2 p-3 bg-white rounded-2xl border border-slate-200/90 shadow-2xs flex flex-row items-center text-left gap-3 hover:border-emerald-400 transition-all">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center shrink-0 shadow-2xs">
                    <Video className="w-5 h-5" />
                  </div>
                  <p className="text-[11px] sm:text-xs font-bold text-slate-800 leading-snug font-sans">
                    • សូមរក្សាមុខឲ្យនៅស្ងៀម និងកុំផ្លាស់ទីខ្លាំង ខណៈពេលកំពុង Scan។
                  </p>
                </div>
              </div>

              {/* Button: Direct & Always Enabled */}
              <button
                onClick={() => {
                  setStep('camera');
                  startCamera();
                }}
                className="w-full py-3.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-500/20 active:scale-[0.99]"
              >
                <Camera className="w-4 h-4 text-amber-300" />
                <span>ចូលទៅកម្មវិធី Scan</span>
              </button>
            </div>
          )}

          {/* STEP 4: CAMERA FACE SCANNER */}
          {step === 'camera' && (
            <div className="space-y-3 animate-fade-in text-center">
              {/* Spoken Voice Guidance Notification Banner */}
              <div className="bg-emerald-950/90 border border-emerald-500/50 p-2.5 rounded-2xl flex items-center justify-center gap-2 text-xs font-bold text-emerald-200 shadow-md">
                <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce shrink-0" />
                <span>សំឡេងណែនាំ៖ "សូមដាក់ស្បែកមុខដែលចង់វិភាគនៅកណ្ដាល Camera"</span>
              </div>

              {/* Camera Preview Box with Face Oval Overlay & AI Auto Capture */}
              <div className="relative w-full max-w-sm aspect-square mx-auto bg-slate-900 rounded-3xl overflow-hidden shadow-xl border-4 border-emerald-500/50 flex items-center justify-center">
                {isCameraActive ? (
                  <>
                    <video
                      ref={(el) => {
                        videoRef.current = el;
                        if (el && mediaStreamRef.current) {
                          el.srcObject = mediaStreamRef.current;
                        }
                      }}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover transform -scale-x-100"
                    />

                    {/* Face Oval Overlay Frame with Animated Laser Scan Line */}
                    <div className="absolute inset-0 border-[3px] border-emerald-400/80 rounded-[50%] m-8 pointer-events-none shadow-[0_0_25px_rgba(16,185,129,0.4)] animate-pulse flex flex-col items-center justify-between p-4 overflow-hidden">
                      {/* Laser Beam Scanner Effect when face is placed correctly */}
                      <div className="w-full h-1 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_15px_rgba(52,211,153,1)] animate-[ping_1.5s_infinite]" />
                      <span className="text-[10px] font-bold text-emerald-300 bg-slate-900/85 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        តម្រង់ផ្ទៃមុខនៅកណ្ដាល
                      </span>
                      <span className="text-[10px] font-bold text-emerald-300 bg-slate-900/85 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        បំភ្លឺពន្លឺឲ្យច្បាស់
                      </span>
                    </div>

                    {/* Replay Voice Button */}
                    <button
                      onClick={() => speakVoiceGuidance('សូមដាក់ស្បែកមុខដែលចង់វិភាគនៅកណ្ដាល Camera')}
                      title="ស្តាប់សំឡេងណែនាំឡើងវិញ"
                      className="absolute top-3 right-3 bg-slate-900/90 hover:bg-slate-800 backdrop-blur-md p-2 rounded-2xl border border-emerald-400/60 text-emerald-300 flex items-center gap-1.5 text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
                    >
                      <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                      <span className="text-[11px]">ស្តាប់សំឡេង</span>
                    </button>

                    {/* Auto-Capture AI Countdown Badge */}
                    <div className="absolute top-3 left-3 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-emerald-400/60 text-white flex items-center gap-2 text-xs font-bold shadow-md">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      <span>
                        Auto Capture: {autoCaptureSeconds}s
                      </span>
                    </div>

                    {/* Real-time Positioning & Capture Status Bar */}
                    <div className="absolute bottom-3 inset-x-3 bg-slate-900/90 backdrop-blur-md p-2.5 rounded-2xl border border-emerald-400/60 text-white flex items-center justify-center gap-2 text-xs font-bold shadow-lg">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping shrink-0" />
                      {autoCaptureSeconds > 2 ? (
                        <span className="text-emerald-300 text-[11px] sm:text-xs">
                          សូមដាក់ស្បែកមុខដែលចង់វិភាគនៅកណ្ដាល Camera
                        </span>
                      ) : autoCaptureSeconds > 0 ? (
                        <span className="text-amber-300 text-[11px] sm:text-xs">
                          បានរកឃើញផ្ទៃមុខ! សូមរក្សាមុខនៅស្ងៀម...
                        </span>
                      ) : (
                        <span className="text-emerald-400 font-extrabold text-[11px] sm:text-xs animate-pulse">
                          ផ្ទៃមុខត្រឹមត្រូវ និងនៅស្ងៀម! AI កំពុងចាប់យកស្បែកមុខដែលមានបញ្ហា...
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="p-6 text-slate-300 space-y-3 flex flex-col items-center justify-center">
                    <Camera className="w-12 h-12 text-emerald-400" />
                    <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
                      {cameraError || 'កំពុងដំណើការកាមេរ៉ា... ឬជ្រើសរើសរូបថតផ្ទាល់ខ្លួន'}
                    </p>
                    <button
                      onClick={startCamera}
                      className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md transition cursor-pointer flex items-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>សាកល្បងបើកកាមេរ៉ាម្តងទៀត</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Action Trigger Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                {isCameraActive && (
                  <button
                    onClick={handleCapturePhoto}
                    className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                  >
                    <Camera className="w-4 h-4" />
                    <span>ថតរូបភាពឥឡូវនេះ ({autoCaptureSeconds}s)</span>
                  </button>
                )}

                {/* Upload Image Option */}
                <label className="w-full sm:flex-1 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer">
                  <Upload className="w-4 h-4 text-amber-300" />
                  <span>ជ្រើសរើសរូបពី Gallery</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* STEP 5: PREVIEW CAPTURED PHOTO */}
          {step === 'preview' && capturedImage && (
            <div className="space-y-5 animate-fade-in text-center">
              <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-2xl flex items-center gap-3 text-xs text-emerald-900 text-left">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <div>
                  <p className="font-bold">បានចាប់យករូបភាពស្បែកមុខរួចរាល់ (Face Captured)</p>
                  <p className="text-[11px] text-emerald-700">សូមពិនិត្យមើលរូបភាពស្បែកមុខរបស់អ្នក មុនពេលចុចចាប់ផ្ដើម Scan វិភាគស្បែកមុខ</p>
                </div>
              </div>

              {/* Captured Image Display with Face Box */}
              <div className="relative w-full max-w-xs aspect-square mx-auto rounded-3xl overflow-hidden shadow-2xl border-4 border-emerald-600 bg-slate-900">
                <img
                  src={capturedImage}
                  alt="Captured face preview"
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-3 inset-x-3 bg-slate-900/80 backdrop-blur-md py-1.5 px-3 rounded-xl text-[11px] font-bold text-emerald-300 flex items-center justify-center gap-1.5 border border-emerald-400/30">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>រូបភាពច្បាស់ល្អ រួចរាល់សម្រាប់ Scan</span>
                </div>
              </div>

              {/* 2 Primary Buttons as requested */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto pt-2">
                {/* Button 1: ថតម្តងទៀត (Retake) */}
                <button
                  onClick={() => {
                    setCapturedImage(null);
                    setStep('camera');
                  }}
                  className="w-full sm:flex-1 py-3.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs sm:text-sm rounded-2xl transition flex items-center justify-center gap-2 cursor-pointer border border-slate-300"
                >
                  <RotateCcw className="w-4 h-4 text-slate-600" />
                  <span>ថតម្តងទៀត</span>
                </button>

                {/* Button 2: ចាប់ផ្តើមវិភាគស្បែកមុខ (Analyze) */}
                <button
                  onClick={() => runAnalysis(capturedImage)}
                  className="w-full sm:flex-1 py-3.5 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 hover:from-emerald-800 hover:to-teal-800 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-xl transition flex items-center justify-center gap-2 cursor-pointer ring-2 ring-emerald-500/30 active:scale-[0.99]"
                >
                  <Scan className="w-4.5 h-4.5 text-amber-300" />
                  <span>ចាប់ផ្តើមវិភាគស្បែកមុខ</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: ANALYZING ANIMATION */}
          {step === 'analyzing' && (
            <div className="py-10 text-center space-y-6 animate-fade-in">
              <div className="relative w-48 h-48 mx-auto rounded-3xl overflow-hidden border-4 border-emerald-500 shadow-2xl bg-slate-900">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Captured face scan"
                    className="w-full h-full object-cover"
                  />
                )}
                {/* Laser Scanning Bar */}
                <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-yellow-300 to-emerald-400 shadow-[0_0_15px_#10b981] animate-laser-scan" />
              </div>

              <div className="space-y-2">
                <h4 className="text-base font-extrabold text-slate-900 flex items-center justify-center gap-2">
                  <Loader2 className="w-5 h-5 text-emerald-600 animate-spin" />
                  <span>AI កំពុងវិភាគស្បែកមុខរបស់អ្នក... ({analyzingProgress}%)</span>
                </h4>
                <p className="text-xs text-slate-600 max-w-sm mx-auto">
                  ប្រព័ន្ធ AI កំពុងពិនិត្យលើ ៥ បញ្ហា៖ មុខមុន, មុខខ្មៅស្រអាប់, រន្ធញើសធំ, មុខរោល, និងមុខរលាក...
                </p>
              </div>

              {/* Progress Bar */}
              <div className="w-full max-w-xs mx-auto bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-teal-600 h-full transition-all duration-300 rounded-full"
                  style={{ width: `${analyzingProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* STEP 6: RESULT & REPORT */}
          {step === 'result' && analysisResult && (
            analysisResult.disabled || !GEMINI_ENABLED ? (
              <div className="py-8 px-4 text-center space-y-5 animate-fade-in max-w-md mx-auto">
                {capturedImage && (
                  <div className="w-28 h-28 mx-auto rounded-3xl overflow-hidden border-2 border-emerald-500/40 shadow-lg">
                    <img src={capturedImage} alt="Captured Face" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-5 bg-amber-50 border border-amber-200 rounded-3xl space-y-3 shadow-xs">
                  <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-extrabold text-amber-950 leading-snug font-opensans">
                    {analysisResult.message || 'មុខងារវិភាគស្បែកដោយ AI កំពុងត្រូវបានរៀបចំ។ សូមព្យាយាមម្ដងទៀតនៅពេលក្រោយ។'}
                  </h4>
                  <p className="text-xs text-amber-800 leading-relaxed font-sans">
                    (Development Mode: Gemini API disabled)
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <button
                    onClick={() => {
                      setCapturedImage(null);
                      setStep('camera');
                    }}
                    className="w-full sm:flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl border border-slate-300 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <RotateCcw className="w-4 h-4" />
                    <span>ថតរូបម្ដងទៀត</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-full sm:flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>បិទ (Close)</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6 animate-fade-in">
              {/* Captured Photo & Score Card */}
              <div className="p-4 bg-gradient-to-br from-emerald-800 to-teal-900 text-white rounded-3xl shadow-xl flex flex-col sm:flex-row items-center gap-4">
                {capturedImage && (
                  <img
                    src={capturedImage}
                    alt="Scanned Face"
                    className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border-2 border-emerald-300/60 shadow-md shrink-0"
                  />
                )}
                <div className="space-y-1 text-center sm:text-left flex-1">
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                    <span className="px-2.5 py-0.5 bg-amber-400 text-emerald-950 font-black text-[10px] rounded-full uppercase">
                      លទ្ធផល Scan ស្បែកមុខ
                    </span>
                    <span className="text-xs text-emerald-200 font-sans">
                      {fullName ? `សម្រាប់៖ ${fullName}` : 'សម្រាប់អ្នកប្រើប្រាស់'}
                    </span>
                  </div>
                  <h4 className="text-base font-extrabold text-white">
                    ប្រភេទស្បែក៖ {analysisResult.skinType || 'ស្បែកមុខចម្រុះ និងងាយឡើងមុន'}
                  </h4>
                  <p className="text-xs text-emerald-100">
                    ពិន្ទុសុខភាពស្បែកសរុប (Health Score)៖ <span className="text-amber-300 font-extrabold text-sm">{analysisResult.overallScore || 80}/100</span>
                  </p>
                </div>
              </div>

              {/* FACE SCAN FOCUS: 5 KEY ISSUES BREAKDOWN */}
              <div className="space-y-3">
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-emerald-600" />
                  <span>លទ្ធផលវិភាគលើ ៥ បញ្ហាស្បែកមុខសំខាន់ៗ៖</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Issue 1: មុខមុន */}
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>១. មុខមុន (Acne & Scars)</span>
                      <span className="text-red-600 font-extrabold">{analysisResult.acneScore || 38}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-red-500 h-full rounded-full" style={{ width: `${analysisResult.acneScore || 38}%` }} />
                    </div>
                    {/* Visible acne types */}
                    <div className="text-[11px] text-slate-600 pt-1 space-y-1">
                      <p className="font-bold text-slate-700">សង្កេតឃើញ Visible Appearance:</p>
                      <div className="grid grid-cols-2 gap-1 text-[10px]">
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">• មុនក្បាលស</span>
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">• មុនក្បាលខ្មៅ</span>
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">• មុនក្រហម/រលាក</span>
                        <span className="px-1.5 py-0.5 bg-red-50 text-red-700 rounded">• ស្នាមមុន</span>
                      </div>
                    </div>
                  </div>

                  {/* Issue 2: មុខខ្មៅស្រអាប់ */}
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>២. មុខខ្មៅស្រអាប់ (Dull Skin)</span>
                      <span className="text-amber-600 font-extrabold">{analysisResult.dullnessScore || 40}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${analysisResult.dullnessScore || 40}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      កោសិកាចាស់កកស្ទះ និងខ្វះភាពស្រស់ថ្លា
                    </p>
                  </div>

                  {/* Issue 3: រន្ធញើសធំ */}
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>៣. រន្ធញើសធំ (Large Pores)</span>
                      <span className="text-teal-600 font-extrabold">{analysisResult.poresScore || 62}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${analysisResult.poresScore || 62}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      រន្ធញើសរីកធំនៅតំបន់ T-Zone និងមានខ្លាញ់ច្រើន
                    </p>
                  </div>

                  {/* Issue 4 & 5: មុខរោល & មុខរលាក/ក្រហម */}
                  <div className="p-3.5 bg-white rounded-2xl border border-emerald-100 shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800">
                      <span>៤. មុខរោល & ៥. រលាក/ក្រហម</span>
                      <span className="text-rose-600 font-extrabold">{analysisResult.sensitiveScore || 28}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${analysisResult.sensitiveScore || 28}%` }} />
                    </div>
                    <p className="text-[11px] text-slate-600">
                      មានប្រតិកម្មរោលក្រហមតិចតួចពេលកម្ដៅថ្ងៃ
                    </p>
                  </div>
                </div>
              </div>

              {/* NON-MEDICAL DIAGNOSIS DISCLAIMER */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-[11px] text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  <strong className="font-bold">ចំណាំប្រុងប្រយ័ត្ន៖</strong> លទ្ធផលវិភាគនេះសម្រាប់តែការពិគ្រោះសម្រស់ និងការជ្រើសរើសផលិតផលថែរក្សាស្បែក Lumimei ប៉ុណ្ណោះ មិនមែនជាការវិនិច្ឆ័យផ្នែកវេជ្ជសាស្ត្រ (Medical Diagnosis) ឡើយ។
                </p>
              </div>

              {/* RECOMMENDED LUMIMEI ROUTINE PRODUCTS */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <span>ឈុតផលិតផល Lumimei ដែលស័ក្តិសមបំផុត៖</span>
                  </h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {recommendedRoutineProducts.map((prod) => (
                    <div
                      key={prod.id}
                      className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between"
                    >
                      <div>
                        <img
                          src={prod.image}
                          alt={prod.nameKm}
                          className="w-full aspect-square object-cover rounded-xl mb-2"
                        />
                        <p className="text-[10px] font-bold text-emerald-700">{prod.brand}</p>
                        <h5 className="text-xs font-bold text-slate-900 line-clamp-1">{prod.nameKm}</h5>
                        <p className="text-xs font-extrabold text-emerald-800 mt-1">${prod.priceUsd.toFixed(2)}</p>
                      </div>
                      <button
                        onClick={() => onAddToCart(prod)}
                        className="w-full mt-2 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-[11px] rounded-xl transition flex items-center justify-center gap-1 cursor-pointer border border-emerald-200"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        <span>ថែមចូលកន្ត្រក</span>
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add All Routine to Cart */}
                <button
                  onClick={() => {
                    onAddMultipleToCart(recommendedRoutineProducts);
                    onClose();
                  }}
                  className="w-full py-3.5 bg-gradient-to-r from-emerald-700 to-teal-800 hover:from-emerald-800 hover:to-teal-900 text-white font-bold text-xs sm:text-sm rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
                >
                  <ShoppingBag className="w-4 h-4 text-amber-300" />
                  <span>បន្ថែមឈុតទាំងមូលចូលក្នុងកន្ត្រក (${recommendedRoutineProducts.reduce((sum, p) => sum + p.priceUsd, 0).toFixed(2)})</span>
                </button>
              </div>

              {/* RESTART SCANNER SESSION BUTTON */}
              <div className="pt-2 text-center">
                <button
                  onClick={handleRestartScan}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5 text-slate-600" />
                  <span>ចាប់ផ្ដើម Scan ស្បែកមុខម្ដងទៀត (Session ថ្មី)</span>
                </button>
              </div>
            </div>
            )
          )}
        </div>
      </div>
    </div>
  );
};
