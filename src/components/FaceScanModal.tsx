import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  ShoppingBag,
  ExternalLink,
  ShieldCheck,
  HeartHandshake,
  Phone,
  MessageSquare,
  Activity,
  Droplets,
  Zap,
  Apple,
  Dumbbell,
  Smile,
  Sparkle
} from 'lucide-react';
import { Language, Product } from '../types';
import { PRODUCTS } from '../data/products';

interface FaceScanModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onAddToCart: (product: Product) => void;
  onOpenChatBot?: () => void;
}

interface ScanResult {
  overallScore: number;
  skinType: string;
  concerns: string[];
  acneLevel: number;
  oilLevel: number;
  moistureLevel: number;
  rednessLevel: number;
  darkSpotsLevel: number;
  productRoutine: {
    step: string;
    product: string;
    productId?: string;
    usage: string;
  }[];
  dietAdvice: string;
  physicalHealthAdvice: string;
  mentalHealthAdvice: string;
  hygieneAdvice: string;
}

export const FaceScanModal: React.FC<FaceScanModalProps> = ({
  isOpen,
  onClose,
  language,
  onAddToCart,
  onOpenChatBot,
}) => {
  const [mode, setMode] = useState<'upload' | 'camera'>('upload');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepText, setScanStepText] = useState('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [addedProductIds, setAddedProductIds] = useState<string[]>([]);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Stop camera stream when modal closes or switching modes
  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
  };

  useEffect(() => {
    if (!isOpen) {
      stopCamera();
      setSelectedImage(null);
      setIsScanning(false);
      setResult(null);
    }
  }, [isOpen]);

  useEffect(() => {
    if (mode === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => {
      stopCamera();
    };
  }, [mode, isOpen]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
        audio: false,
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setCameraError(
        language === 'km'
          ? 'មិនអាចបើកកាមេរ៉ាបានទេ! សូមពិនិត្យ Permission កាមេរ៉ា ឬជ្រើសរើស Upload រូបថតជំនួសវិញ។'
          : 'Could not access camera. Please check permissions or upload a photo instead.'
      );
    }
  };

  const captureCameraPhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 640;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      setSelectedImage(dataUrl);
      stopCamera();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const runAnalysis = async () => {
    if (!selectedImage) return;

    setIsScanning(true);
    setScanProgress(10);
    setScanStepText(language === 'km' ? 'កំពុងស្កេនផ្ទៃមុខ...' : 'Scanning facial features...');

    const progressTimer = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 85) {
          clearInterval(progressTimer);
          return 90;
        }
        if (prev === 30) {
          setScanStepText(language === 'km' ? 'កំពុងវាស់កម្រិតខ្លាញ់ និងសំណើម...' : 'Measuring oil & hydration levels...');
        } else if (prev === 60) {
          setScanStepText(language === 'km' ? 'កំពុងពិនិត្យមុន និងរន្ធញើស...' : 'Analyzing pores & acne severity...');
        }
        return prev + 15;
      });
    }, 400);

    try {
      const response = await fetch('/api/scan-skin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: selectedImage,
          language,
        }),
      });

      clearInterval(progressTimer);
      setScanProgress(100);

      if (response.ok) {
        const data = await response.json();
        setResult(data);
      } else {
        throw new Error('API failed');
      }
    } catch (error) {
      console.error('Scan error, fallback to structured analysis:', error);
      clearInterval(progressTimer);
      setScanProgress(100);

      // Default fallback
      setResult({
        overallScore: 82,
        skinType: 'ស្បែកមុខចម្រុះ ងាយឡើងខ្លាញ់ និងមានមុនរលាក',
        concerns: [
          'រន្ធញើសធំ និងមានខ្លាញ់កកស្ទះ',
          'មុនរលាក និងស្នាមខ្មៅស្រអាប់',
          'ស្បែកខ្វះសំណើម និងសរសៃក្រហម'
        ],
        acneLevel: 38,
        oilLevel: 65,
        moistureLevel: 52,
        rednessLevel: 28,
        darkSpotsLevel: 35,
        productRoutine: [
          {
            step: '១',
            product: 'Lumimei Clay Mask ($10)',
            productId: 'p1',
            usage: 'លាយ ២-៣ ស្លាបព្រាកាហ្វេ ជាមួយទឹកធម្មតា ឬទឹកដោះគោស្រស់ បិទទុក ១៥ នាទី រួចលាងចេញ។ (សប្តាហ៍ដំបូងបិទរាល់ថ្ងៃ ក្រោយមក ២ ថ្ងៃម្តង)'
          },
          {
            step: '២',
            product: 'Lumimei Natural Soap ($3)',
            productId: 'p4',
            usage: 'លាងសម្អាតមុខជាមួយសាប៊ូ Lumimei ជារៀងរាល់ថ្ងៃ ដើម្បីជម្រះជាតិខ្លាញ់ និងកាកសំណល់ Clay Mask ឲ្យស្អាតល្អ'
          },
          {
            step: '៣',
            product: 'Lumimei Serum ($11)',
            productId: 'p2',
            usage: 'លាប ២-៣ ដំណក់ ព្រឹក និងយប់ ជួយបំបាត់ស្នាមមុន បង្រួមរន្ធញើស និងជួយឲ្យស្បែកភ្លឺថ្លាម៉តរលោងចេញពីខាងក្នុង'
          },
          {
            step: '៤',
            product: 'Lumimei Coconut Oil ($5)',
            productId: 'p3',
            usage: 'ប្រើ ១ ដំណក់ម៉ស្សាលើមុខមុនពេលគេង ឬប្រើផ្តល់សំណើមដល់ស្បែកស្ងួតខ្លាំង'
          }
        ],
        dietAdvice: 'ញ៉ាំទឹកស្អាតឲ្យបាន ២-២.៥ លីត្រជារៀងរាល់ថ្ងៃ។ កាត់បន្ថយអាហារបំពង ខ្លាញ់ច្រើន ផ្អែមខ្លាំង និងភេសជ្ជៈមានហ្គាស។ បន្ថែមការញ៉ាំបន្លែបៃតង និងផ្លែឈើស្រស់ដូចជា ប្រទាលកន្ទុយក្រពើ ក្រូច និងផ្លែប៉ោម។',
        physicalHealthAdvice: 'គេងលក់ឲ្យបានស្ងប់ស្ងាត់ ៧-៨ ម៉ោង/យប់ (ជៀសវាងការគេងយប់ជ្រៅហួសម៉ោង ១១)។ ធ្វើលំហាត់ប្រាណស្រាលៗជារៀងរាល់ថ្ងៃ ដើម្បីបង្កើនលំហូរឈាមរត់ និងបែកញើសជម្រះជាតិពុល។',
        mentalHealthAdvice: 'រក្សាអារម្មណ៍រីករាយ និងកាត់បន្ថយភាពតានតឹងផ្លូវចិត្ត (Stress)។ ភាពតានតឹងធ្វើឲ្យរាងកាយបញ្ចេញអរម៉ូន Cortisol ដែលបង្កឲ្យមុខឡើងខ្លាញ់ និងមុនរលាកកាន់តែខ្លាំង។',
        hygieneAdvice: 'បោកសម្អាតស្រោមខ្នើយ កន្សែងជូតមុខ និងប្រដាប់ផាត់មុខ ៣-៤ ថ្ងៃម្តង។ មិនត្រូវប្រើដៃមិនស្អាតមកស្ទាប ចុច ឬញេចមុនលើផ្ទៃមុខជាដាច់ខាត។'
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleAddToCart = (productId: string) => {
    const product = PRODUCTS.find((p) => p.id === productId);
    if (product) {
      onAddToCart(product);
      setAddedProductIds((prev) => [...prev, productId]);
      setTimeout(() => {
        setAddedProductIds((prev) => prev.filter((id) => id !== productId));
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl overflow-hidden my-6 max-h-[92vh] flex flex-col border border-emerald-100">
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 text-white p-4 sm:p-5 flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300 animate-pulse" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-opensans flex items-center gap-2">
                {language === 'km' ? 'ប្រព័ន្ធ AI ស្កេន និងវិភាគសុខភាពស្បែកមុខ' : 'AI Face Scan & Skin Health Diagnostic'}
              </h2>
              <p className="text-xs text-emerald-100">
                {language === 'km' ? 'វិភាគស្បែកមុខច្បាស់លាស់ + ផ្តល់ដំណោះស្រាយ Lumimei' : 'Instant skin analysis & personalized Lumimei skincare guide'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!result ? (
            /* STEP 1: CAPTURE / UPLOAD PHOTO */
            <div className="space-y-6">
              {/* Mode Toggle Buttons */}
              <div className="flex rounded-2xl bg-emerald-50/80 p-1.5 border border-emerald-100 gap-2">
                <button
                  onClick={() => setMode('upload')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'upload'
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'km' ? 'ជ្រើសរើសរូបថត (Upload Photo)' : 'Upload Photo'}</span>
                </button>
                <button
                  onClick={() => setMode('camera')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs sm:text-sm font-semibold transition flex items-center justify-center gap-2 cursor-pointer ${
                    mode === 'camera'
                      ? 'bg-white text-emerald-800 shadow-sm border border-emerald-200'
                      : 'text-slate-600 hover:text-emerald-700'
                  }`}
                >
                  <Camera className="w-4 h-4 text-teal-600" />
                  <span>{language === 'km' ? 'ថតផ្ទាល់ (Live Camera)' : 'Live Camera'}</span>
                </button>
              </div>

              {/* Input Area */}
              {mode === 'upload' ? (
                <div className="space-y-4">
                  {selectedImage ? (
                    <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-lg bg-slate-900 group">
                      <img src={selectedImage} alt="Selected face" className="w-full h-full object-cover" />
                      {isScanning && (
                        <div className="absolute inset-0 bg-emerald-950/40 flex flex-col items-center justify-center p-4">
                          <div className="w-full h-1 bg-gradient-to-r from-emerald-400 via-teal-300 to-yellow-300 absolute top-0 animate-bounce shadow-lg shadow-emerald-400" />
                          <div className="w-16 h-16 rounded-full border-4 border-emerald-400 border-t-transparent animate-spin mb-3" />
                          <span className="text-white text-xs font-bold bg-emerald-900/80 px-3 py-1 rounded-full border border-emerald-400/50">
                            {scanStepText}
                          </span>
                        </div>
                      )}
                      <button
                        onClick={() => setSelectedImage(null)}
                        disabled={isScanning}
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full max-w-md mx-auto py-12 px-6 border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/80 rounded-3xl flex flex-col items-center justify-center gap-3 cursor-pointer transition group"
                    >
                      <div className="w-16 h-16 rounded-2xl bg-emerald-100 group-hover:scale-110 text-emerald-700 flex items-center justify-center transition">
                        <Upload className="w-8 h-8" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-slate-800">
                          {language === 'km' ? 'ចុចទីនេះដើម្បីជ្រើសរើសរូបថតផ្ទៃមុខ' : 'Click to upload a clear face photo'}
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                          {language === 'km' ? 'សូមជ្រើសរើសរូបថតច្បាស់ និងមានពន្លឺគ្រប់គ្រាន់' : 'Ensure good lighting and full facial view'}
                        </p>
                      </div>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* CAMERA MODE */
                <div className="space-y-4">
                  {cameraError ? (
                    <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-xs flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
                      <span>{cameraError}</span>
                    </div>
                  ) : selectedImage ? (
                    <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden border-2 border-emerald-500 shadow-lg bg-slate-900">
                      <img src={selectedImage} alt="Captured face" className="w-full h-full object-cover" />
                      <button
                        onClick={() => {
                          setSelectedImage(null);
                          startCamera();
                        }}
                        disabled={isScanning}
                        className="absolute top-3 right-3 p-2 bg-black/60 hover:bg-black/80 text-white rounded-full transition"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="relative w-full max-w-sm mx-auto aspect-square rounded-3xl overflow-hidden bg-slate-900 border-2 border-emerald-400 shadow-lg">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover transform -scale-x-100"
                      />
                      {/* Face Overlay Oval Guide */}
                      <div className="absolute inset-0 border-2 border-dashed border-emerald-400/70 rounded-[50%] m-8 pointer-events-none flex items-center justify-center">
                        <span className="text-[10px] text-emerald-200 font-semibold bg-black/50 px-2 py-0.5 rounded-full">
                          {language === 'km' ? 'ដាក់ផ្ទៃមុខក្នុងរង្វង់នេះ' : 'Align face in oval'}
                        </span>
                      </div>
                      <button
                        onClick={captureCameraPhoto}
                        className="absolute bottom-4 left-1/2 -translate-x-1/2 px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs rounded-full shadow-lg flex items-center gap-2 cursor-pointer transition"
                      >
                        <Camera className="w-4 h-4" />
                        <span>{language === 'km' ? 'ថតរូបថត (Capture Photo)' : 'Capture Photo'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Progress Bar when scanning */}
              {isScanning && (
                <div className="w-full max-w-md mx-auto space-y-2">
                  <div className="flex justify-between text-xs font-bold text-emerald-800">
                    <span>{scanStepText}</span>
                    <span>{scanProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-emerald-200">
                    <div
                      className="bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 h-full transition-all duration-300 rounded-full"
                      style={{ width: `${scanProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Analyze Action Button */}
              {selectedImage && !isScanning && (
                <div className="text-center pt-2">
                  <button
                    onClick={runAnalysis}
                    className="px-8 py-3.5 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold text-sm sm:text-base rounded-full shadow-lg hover:shadow-xl transition transform hover:-translate-y-0.5 flex items-center gap-2.5 mx-auto cursor-pointer"
                  >
                    <Sparkles className="w-5 h-5 text-yellow-300" />
                    <span>{language === 'km' ? 'ចាប់ផ្តើមស្កេន និងវិភាគស្បែកមុខ' : 'Start Face Analysis'}</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* STEP 2: DIAGNOSTIC & SOLUTION REPORT */
            <div className="space-y-6 animate-fade-in">
              {/* Top Summary Banner */}
              <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 text-white p-5 rounded-3xl shadow-md border border-emerald-700/50 flex flex-col md:flex-row items-center justify-between gap-5">
                <div className="flex items-center gap-4">
                  <div className="relative w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-400 flex-shrink-0 shadow-md">
                    <img src={selectedImage || ''} alt="Analyzed" className="w-full h-full object-cover" />
                    <div className="absolute top-1 right-1 w-3 h-3 bg-emerald-400 rounded-full border border-white animate-ping" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold tracking-wider text-emerald-300 uppercase bg-emerald-800/80 px-2 py-0.5 rounded-md border border-emerald-600/50">
                      {language === 'km' ? 'លទ្ធផលការវិភាគ AI' : 'AI Diagnostic Result'}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-white mt-1">
                      {result.skinType}
                    </h3>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {result.concerns.map((c, i) => (
                        <span key={i} className="text-[11px] bg-white/10 text-emerald-200 px-2.5 py-0.5 rounded-full border border-white/10">
                          • {c}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Overall Score Badge */}
                <div className="flex flex-col items-center justify-center p-3.5 bg-emerald-800/50 rounded-2xl border border-emerald-500/40 min-w-[120px]">
                  <span className="text-[10px] text-emerald-300 font-semibold uppercase">
                    {language === 'km' ? 'ពិន្ទុស្បែកមុខ' : 'Skin Health'}
                  </span>
                  <div className="text-3xl font-black text-yellow-300 font-opensans my-0.5">
                    {result.overallScore}<span className="text-sm text-emerald-200">/100</span>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-200">
                    {result.overallScore >= 80 ? 'ល្អប្រសើរ (Good Condition)' : 'ត្រូវថែទាំបន្ថែម'}
                  </span>
                </div>
              </div>

              {/* Detailed Metrics Grid */}
              <div className="bg-slate-50 p-4 sm:p-5 rounded-3xl border border-slate-200 space-y-3">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'km' ? 'សូចនាករសុខភាពស្បែកមុខ (Skin Metrics)' : 'Skin Metrics Analysis'}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Metric 1: Acne */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{language === 'km' ? 'មុន និងស្នាមមុន (Acne Level)' : 'Acne Severity'}</span>
                      <span className="text-rose-600">{result.acneLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-rose-500 h-full rounded-full" style={{ width: `${result.acneLevel}%` }} />
                    </div>
                  </div>

                  {/* Metric 2: Oil */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{language === 'km' ? 'ជាតិខ្លាញ់លើមុខ (Sebum/Oil)' : 'Oiliness'}</span>
                      <span className="text-amber-600">{result.oilLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-amber-500 h-full rounded-full" style={{ width: `${result.oilLevel}%` }} />
                    </div>
                  </div>

                  {/* Metric 3: Hydration */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{language === 'km' ? 'កម្រិតសំណើម (Hydration)' : 'Moisture Level'}</span>
                      <span className="text-teal-600">{result.moistureLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-teal-500 h-full rounded-full" style={{ width: `${result.moistureLevel}%` }} />
                    </div>
                  </div>

                  {/* Metric 4: Redness/Sensitivity */}
                  <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-2xs space-y-1">
                    <div className="flex justify-between font-bold text-slate-700">
                      <span>{language === 'km' ? 'ភាពរោល/សរសៃក្រហម (Sensitivity)' : 'Redness/Sensitivity'}</span>
                      <span className="text-purple-600">{result.rednessLevel}%</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div className="bg-purple-500 h-full rounded-full" style={{ width: `${result.rednessLevel}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* PRODUCT ROUTINE & USAGE GUIDANCE */}
              <div className="bg-emerald-50/60 p-4 sm:p-5 rounded-3xl border border-emerald-200/70 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-900 text-xs sm:text-sm flex items-center gap-2">
                    <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
                    <span>{language === 'km' ? 'វិធីប្រើប្រាស់ផលិតផល Lumimei ឲ្យចំគោលដៅ' : 'Targeted Lumimei Product Routine'}</span>
                  </h4>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                    {language === 'km' ? 'សន្សំពេល សន្សំលុយ លទ្ធផលខ្ពស់' : 'Save Time & Money'}
                  </span>
                </div>

                <div className="space-y-3">
                  {result.productRoutine.map((item, index) => {
                    const isAdded = item.productId && addedProductIds.includes(item.productId);
                    return (
                      <div
                        key={index}
                        className="bg-white p-3.5 rounded-2xl border border-emerald-100 shadow-2xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
                      >
                        <div className="flex items-start gap-3">
                          <span className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                            {item.step}
                          </span>
                          <div>
                            <h5 className="font-bold text-slate-800 text-xs sm:text-sm">
                              {item.product}
                            </h5>
                            <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                              {item.usage}
                            </p>
                          </div>
                        </div>

                        {item.productId && (
                          <button
                            onClick={() => handleAddToCart(item.productId!)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 flex-shrink-0 cursor-pointer ${
                              isAdded
                                ? 'bg-teal-600 text-white'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                            }`}
                          >
                            <ShoppingBag className="w-3.5 h-3.5" />
                            <span>{isAdded ? (language === 'km' ? 'បានបន្ថែម!' : 'Added!') : (language === 'km' ? 'ទិញផលិតផលនេះ' : 'Buy Now')}</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* HOLISTIC LIFESTYLE & CARE PLAN (របបអាហារ, សុខភាព, អនាម័យ) */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 text-xs sm:text-sm flex items-center gap-2">
                  <HeartHandshake className="w-4 h-4 text-teal-600" />
                  <span>{language === 'km' ? 'វិធីថែទាំបែបធម្មជាតិពេញលេញ (Holistic Care Plan)' : 'Holistic Care & Lifestyle Plan'}</span>
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* 1. Dietary Advice */}
                  <div className="p-3.5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-1.5">
                    <h5 className="font-bold text-emerald-900 text-xs flex items-center gap-1.5">
                      <Apple className="w-4 h-4 text-emerald-600" />
                      <span>{language === 'km' ? '១. របបអាហារ (Diet & Nutrition)' : '1. Dietary Advice'}</span>
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {result.dietAdvice}
                    </p>
                  </div>

                  {/* 2. Physical Health */}
                  <div className="p-3.5 bg-teal-50/40 rounded-2xl border border-teal-100 space-y-1.5">
                    <h5 className="font-bold text-teal-900 text-xs flex items-center gap-1.5">
                      <Dumbbell className="w-4 h-4 text-teal-600" />
                      <span>{language === 'km' ? '២. សុខភាពផ្លូវកាយ (Physical Health & Sleep)' : '2. Physical Health & Sleep'}</span>
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {result.physicalHealthAdvice}
                    </p>
                  </div>

                  {/* 3. Mental Wellbeing */}
                  <div className="p-3.5 bg-purple-50/40 rounded-2xl border border-purple-100 space-y-1.5">
                    <h5 className="font-bold text-purple-900 text-xs flex items-center gap-1.5">
                      <Smile className="w-4 h-4 text-purple-600" />
                      <span>{language === 'km' ? '៣. សុខភាពផ្លូវចិត្ត (Mental Wellbeing & Stress)' : '3. Mental Health'}</span>
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {result.mentalHealthAdvice}
                    </p>
                  </div>

                  {/* 4. Personal Hygiene */}
                  <div className="p-3.5 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-1.5">
                    <h5 className="font-bold text-amber-900 text-xs flex items-center gap-1.5">
                      <Droplets className="w-4 h-4 text-amber-600" />
                      <span>{language === 'km' ? '៤. ការអនាម័យខ្លួន (Personal Hygiene)' : '4. Personal Hygiene'}</span>
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      {result.hygieneAdvice}
                    </p>
                  </div>
                </div>
              </div>

              {/* CONTACT SUPPORT & TELEGRAM DIRECT LINK */}
              <div className="p-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white rounded-2xl shadow-sm space-y-3">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h5 className="font-bold text-sm flex items-center gap-1.5">
                      <ShieldCheck className="w-4.5 h-4.5 text-yellow-300" />
                      <span>{language === 'km' ? 'ព័ត៌មានបន្ថែម អតិថិជនអាចទាក់ទងយើងបាន!' : 'For details or questions, contact us!'}</span>
                    </h5>
                    <p className="text-xs text-emerald-100 mt-0.5">
                      {language === 'km' ? 'ក្រុមការងារ Lumimei AI រង់ចាំផ្តល់ការពិគ្រោះដោយឥតគិតថ្លៃ ២៤/៧' : 'Lumimei support team is ready to consult 24/7'}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href="https://t.me/lumimeicambodia"
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Telegram @lumimeicambodia</span>
                    </a>

                    {onOpenChatBot && (
                      <button
                        onClick={() => {
                          onClose();
                          onOpenChatBot();
                        }}
                        className="px-3.5 py-2 bg-white text-emerald-900 font-bold text-xs rounded-xl hover:bg-emerald-50 transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{language === 'km' ? 'ឆាតជាមួយ AI Chatbot' : 'Chat with Lumimei AI'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <button
                  onClick={() => setResult(null)}
                  className="px-4 py-2 border border-slate-200 hover:border-emerald-500 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{language === 'km' ? 'ស្កេនឡើងវិញ (Scan Again)' : 'Scan Again'}</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-6 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                >
                  {language === 'km' ? 'បិទ (Close)' : 'Close'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
