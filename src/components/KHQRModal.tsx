import React, { useState, useEffect } from 'react';
import { X, CheckCircle, QrCode, Loader2, Upload, Image, Send, Check } from 'lucide-react';
import { Order, Language } from '../types';
import { openTelegramAdmin } from '../utils/telegram';

interface KHQRModalProps {
  order: Order | null;
  language: Language;
  onClose: () => void;
  onPaymentSuccess: (orderId: string) => void;
}

export const KHQRModal: React.FC<KHQRModalProps> = ({
  order,
  language,
  onClose,
  onPaymentSuccess,
}) => {
  if (!order) return null;

  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes timer
  const [isSimulating, setIsSimulating] = useState(false);
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptFileName, setReceiptFileName] = useState<string | null>(null);

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setReceiptFileName(file.name);
      const reader = new FileReader();
      reader.onload = () => {
        setReceiptImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSimulatePayment = async () => {
    setIsSimulating(true);

    setTimeout(async () => {
      setIsSimulating(false);
      await openTelegramAdmin(order, true, receiptImage);
      onPaymentSuccess(order.id);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden my-6 border border-rose-100">
        {/* Header Bar */}
        <div className="p-4 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <QrCode className="w-6 h-6 text-yellow-300" />
            <div>
              <h3 className="font-extrabold text-base leading-none tracking-wide">
                ABA KHQR PAYMENT
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* KHQR Card Frame */}
        <div className="p-6 bg-slate-50 flex flex-col items-center">
          {/* Merchant Header */}
          <div className="w-full bg-white p-4 rounded-2xl shadow-sm border border-slate-200 text-center space-y-1 mb-4">
            <span
              className="uppercase tracking-wider font-bold px-2 py-0.5 rounded-full border border-white"
              style={{ fontSize: '19px', backgroundColor: '#ffffff', color: '#009966' }}
            >
              MUOYKIM KOUCH
            </span>
            <h4 className="text-sm font-extrabold" style={{ color: '#009966' }}>
              004 806 561
            </h4>
            <div className="flex justify-center items-baseline gap-2 pt-1">
              <span className="text-2xl font-black text-emerald-700">
                ៛{order.totalKhr.toLocaleString()}
              </span>
              <span className="text-xs font-bold text-slate-500">
                (${order.totalUsd.toFixed(2)})
              </span>
            </div>
          </div>

          {/* Interactive QR SVG Graphic */}
          <div className="relative bg-white p-5 rounded-3xl shadow-md border-2 border-red-500 flex flex-col items-center">
            {/* Top KHQR Tag */}
            <div className="w-full flex items-center justify-between px-2 pb-3 border-b border-dashed border-slate-200 mb-3">
              <span className="font-black text-red-600 tracking-tighter text-sm">ABA PAY / KHQR</span>
            </div>

            {/* ABA Mobile KHQR Image */}
            <div className="w-56 h-56 bg-white p-1 border border-slate-100 rounded-2xl relative flex items-center justify-center overflow-hidden shadow-xs">
              <img
                src="https://i.postimg.cc/bYmZQmB9/IMG-20260729-100318.png"
                alt="ABA KHQR Code"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>

            {/* Timer */}
            <div className="mt-3 flex items-center gap-2 text-xs text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-full">
              <span>{language === 'km' ? 'កូដផុតកំណត់ក្នុងរយៈពេល' : 'Expires in'}:</span>
              <span className="font-mono text-sm">{formatTimer(timeLeft)}</span>
            </div>
          </div>

          {/* Receipt Upload Box */}
          <div className="w-full mt-4 p-3 bg-white rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-emerald-600" />
                {language === 'km' ? 'upload វិក័យបត្ររូបភាព' : 'Upload Payment Receipt'}
              </span>
              {receiptImage && (
                <button
                  type="button"
                  onClick={() => { setReceiptImage(null); setReceiptFileName(null); }}
                  className="text-[11px] text-rose-500 hover:text-rose-700 font-semibold cursor-pointer"
                >
                  {language === 'km' ? 'លុប' : 'Remove'}
                </button>
              )}
            </div>

            {receiptImage ? (
              <div className="flex items-center gap-3 p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <img
                  src={receiptImage}
                  alt="Receipt Preview"
                  className="w-12 h-12 object-cover rounded-lg border border-emerald-300 shadow-xs"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                    <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                    {language === 'km' ? 'បាន Upload រូបភាពវិក័យបត្ររួចរាល់' : 'Receipt Uploaded'}
                  </p>
                  <p className="text-[10px] text-slate-500 truncate">{receiptFileName}</p>
                </div>
              </div>
            ) : (
              <label className="block w-full">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="w-full py-2.5 px-3 bg-slate-50 hover:bg-emerald-50/50 border-2 border-dashed border-slate-300 hover:border-emerald-400 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition text-slate-600 hover:text-emerald-700">
                  <Image className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold">
                    {language === 'km' ? 'ជ្រើសរើសរូបភាពវិក័យបត្រទូទាត់' : 'Select Receipt Image'}
                  </span>
                </div>
              </label>
            )}
          </div>

          {/* Action Buttons */}
          <div className="w-full space-y-2.5 mt-4">
            <button
              onClick={handleSimulatePayment}
              disabled={isSimulating}
              className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white rounded-2xl font-bold text-xs shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSimulating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>{language === 'km' ? 'កំពុងពិនិត្យ និងផ្ញើ...' : 'Verifying & Sending...'}</span>
                </>
              ) : (
                <>
                  {receiptImage ? (
                    <Send className="w-4 h-4 text-emerald-200" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-200" />
                  )}
                  <span>
                    {language === 'km'
                      ? (receiptImage ? 'ផ្ញើវិក័យបត្រ និងការទូទាត់' : 'ខ្ញុំបានទូទាត់រួចរាល់')
                      : (receiptImage ? 'Send Receipt & Complete Order' : 'I Have Paid')}
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
