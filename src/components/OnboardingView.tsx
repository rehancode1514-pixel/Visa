import React, { useState, useRef } from 'react';
import { 
  Upload, 
  User, 
  Globe, 
  Lock, 
  Clock, 
  Brain, 
  RefreshCw, 
  CheckCircle2, 
  ChevronRight, 
  ShieldCheck,
  Plane,
  Coins,
  History,
  Camera
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { extractPassportData } from '../lib/gemini';
import { UserProfile } from '../types';

interface OnboardingViewProps {
  onComplete: (profile: UserProfile) => void;
  addLog: (msg: string, type: 'info' | 'success' | 'warning' | 'error') => void;
}

export default function OnboardingView({ onComplete, addLog }: OnboardingViewProps) {
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [profile, setProfile] = useState<UserProfile>({
    fullName: '',
    passportNumber: '',
    nationality: '',
    dob: '',
    expiryDate: '',
    travelHistory: [],
    purpose: 'tourism',
    preferredCountries: [],
    financialProofRange: '$5,000 - $10,000',
    documents: {}
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  const handlePassportUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setIsProcessing(true);
      setOcrProgress(15);
      addLog('AI Module: Initializing Passport OCR...', 'info');

      try {
        setOcrProgress(40);
        const result = await extractPassportData(base64);
        setOcrProgress(80);
        if (result) {
          setProfile(prev => ({
            ...prev,
            fullName: result.full_name || prev.fullName,
            passportNumber: result.passport_number || prev.passportNumber,
            nationality: result.nationality || prev.nationality,
            dob: result.date_of_birth || prev.dob,
            expiryDate: result.expiry_date || prev.expiryDate,
            passportPhoto: base64,
            documents: { ...prev.documents, passportCopy: base64 }
          }));
          addLog(`AI Module: Successfully extracted data for ${result.full_name}.`, 'success');
          setOcrProgress(100);
          setTimeout(() => {
            setIsProcessing(false);
            setStep(2);
          }, 800);
        } else {
          addLog('AI Module: Failed to extract data. Please enter manually.', 'warning');
          setIsProcessing(false);
          setStep(2);
        }
      } catch (error) {
        addLog('AI Module: OCR error. Switching to manual entry.', 'error');
        setIsProcessing(false);
        setStep(2);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setPhotoPreview(base64);
      setProfile(prev => ({ ...prev, profilePhoto: base64 }));
      addLog('Profile: Headshot uploaded successfully.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  const renderStep1 = () => (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -20 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-blue-900/20 mb-4">
          <ShieldCheck className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Let's Secure Your Profile</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm">Upload your passport bio page. Our AI will automatically extract your details to save you time.</p>
      </div>

      <div 
        onClick={() => !isProcessing && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-16 flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group ${isProcessing ? 'border-blue-400 bg-blue-50/30' : 'border-slate-200 hover:border-blue-500 hover:bg-slate-50'}`}
      >
        <AnimatePresence mode="wait">
          {!isProcessing ? (
            <motion.div key="idle" className="flex flex-col items-center gap-4">
              <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform group-hover:bg-blue-100 group-hover:text-blue-600">
                <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-600" />
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-slate-800 text-lg">Click to upload Passport</p>
                <p className="text-xs text-slate-400 mt-1">Supports PNG, JPG, or PDF up to 10MB</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="processing" className="flex flex-col items-center gap-6">
              <div className="relative">
                <RefreshCw className="w-16 h-16 text-blue-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-blue-600">
                  {ocrProgress}%
                </div>
              </div>
              <div className="text-center">
                <p className="font-display font-bold text-slate-800 text-lg">AI Extracting Data...</p>
                <p className="text-xs text-slate-400 mt-1">Analyzing Machine Readable Zone (MRZ)</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <input type="file" ref={fileInputRef} onChange={handlePassportUpload} className="hidden" accept="image/*" />
      </div>

      <div className="flex justify-center pt-4">
        <button onClick={() => setStep(2)} className="text-slate-400 text-xs font-bold hover:text-slate-600 transition-colors uppercase tracking-widest flex items-center gap-1">
          Skip and enter manually <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep2 = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-8"
    >
      <div className="text-center space-y-2">
        <div className="w-16 h-16 bg-purple-600 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-purple-900/20 mb-4">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-display font-bold text-slate-900">Add a Profile Photo</h2>
        <p className="text-slate-500 max-w-md mx-auto text-sm">A clear headshot is required for your visa application documents. You can update this later.</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Step 2 of 5</p>
      </div>

      <div className="flex flex-col items-center gap-6">
        <div 
          onClick={() => photoInputRef.current?.click()}
          className="w-40 h-40 rounded-[40px] bg-slate-100 border-2 border-dashed border-slate-200 flex items-center justify-center overflow-hidden cursor-pointer hover:border-purple-500 hover:bg-purple-50 transition-all group"
        >
          {photoPreview ? (
            <img src={photoPreview} alt="Profile Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400 group-hover:text-purple-600">
              <Camera className="w-10 h-10" />
              <span className="text-[10px] font-bold uppercase tracking-widest">Upload Photo</span>
            </div>
          )}
        </div>
        <input type="file" ref={photoInputRef} onChange={handlePhotoUpload} className="hidden" accept="image/*" />
        
        {photoPreview && (
          <button 
            onClick={() => {setPhotoPreview(null); setProfile(p => ({...p, profilePhoto: undefined}))}}
            className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors uppercase tracking-widest"
          >
            Remove Photo
          </button>
        )}
      </div>

      <div className="pt-8 flex justify-between border-t border-slate-100">
        <button onClick={prevStep} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Back</button>
        <button 
            onClick={nextStep} 
            disabled={!photoPreview}
            className={`px-8 py-3 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${photoPreview ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20 hover:bg-blue-700' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
        >
          Continue <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep3 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-purple-50 text-purple-600 rounded-xl">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900">Personal Information</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Step 3 of 5</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Full Name (as per Passport)</label>
          <input 
            type="text" 
            value={profile.fullName || ''}
            onChange={(e) => setProfile({...profile, fullName: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            placeholder="Johnathan Doe"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Passport Number</label>
          <input 
            type="text" 
            value={profile.passportNumber || ''}
            onChange={(e) => setProfile({...profile, passportNumber: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            placeholder="A12345678"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nationality</label>
          <input 
            type="text" 
            value={profile.nationality || ''}
            onChange={(e) => setProfile({...profile, nationality: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            placeholder="United States"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Date of Birth</label>
          <input 
            type="date" 
            value={profile.dob || ''}
            onChange={(e) => setProfile({...profile, dob: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Expiry Date</label>
          <input 
            type="date" 
            value={profile.expiryDate || ''}
            onChange={(e) => setProfile({...profile, expiryDate: e.target.value})}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Destination Purpose</label>
          <select 
            value={profile.purpose}
            onChange={(e) => setProfile({...profile, purpose: e.target.value as any})}
            className="w-full bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
          >
            <option value="tourism">Tourism</option>
            <option value="work">Work</option>
            <option value="study">Study</option>
            <option value="medical">Medical</option>
          </select>
        </div>
      </div>

      <div className="pt-8 flex justify-between border-t border-slate-100">
        <button onClick={prevStep} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Back</button>
        <button onClick={nextStep} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center gap-2">
          Continue <Plane className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep4 = () => (
    <motion.div 
      initial={{ opacity: 0, x: 20 }} 
      animate={{ opacity: 1, x: 0 }} 
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 mb-8">
        <div className="p-3 bg-yellow-50 text-yellow-600 rounded-xl">
          <Coins className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-xl font-display font-bold text-slate-900">Travel & Finance</h3>
          <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Step 4 of 5</p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <History className="w-3 h-3" /> Travel History (Recent Countries)
          </label>
          <textarea 
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium min-h-[100px]"
            placeholder="List countries you have visited in the last 5 years (e.g. UK, UAE, Turkey)"
            value={profile.travelHistory.join(', ')}
            onChange={(e) => setProfile({...profile, travelHistory: e.target.value.split(',').map(s => s.trim())})}
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Coins className="w-3 h-3" /> Financial Proof (Estimated Savings)
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              '$1,000 - $3,000',
              '$3,000 - $5,000',
              '$5,000 - $10,000',
              '$10,000 - $20,000',
              '$20,000+'
            ].map((range) => (
              <button 
                key={range}
                onClick={() => setProfile({...profile, financialProofRange: range})}
                className={`px-4 py-3 rounded-2xl text-sm font-bold border transition-all ${profile.financialProofRange === range ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-900/20' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400'}`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1 flex items-center gap-2">
            <Globe className="w-3 h-3" /> Preferred Destinations
          </label>
          <input 
            type="text" 
            className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium"
            placeholder="e.g. Poland, France, Germany"
            value={profile.preferredCountries.join(', ')}
            onChange={(e) => setProfile({...profile, preferredCountries: e.target.value.split(',').map(s => s.trim())})}
          />
        </div>
      </div>

      <div className="pt-8 flex justify-between border-t border-slate-100">
        <button onClick={prevStep} className="px-6 py-2 text-slate-500 font-bold text-sm hover:text-slate-800 transition-colors">Back</button>
        <button onClick={nextStep} className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-bold text-sm shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all flex items-center gap-2">
          Final Review <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );

  const renderStep5 = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }} 
      animate={{ opacity: 1, scale: 1 }} 
      exit={{ opacity: 0, scale: 1.05 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2 mb-8">
        <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto shadow-xl shadow-green-900/20 mb-4 text-white">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h3 className="text-2xl font-display font-bold text-slate-900">Verify Your Information</h3>
        <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">Final Step (5 of 5)</p>
        <p className="text-slate-500 text-sm">Please ensure all details are correct before initializing Discovery.</p>
      </div>

      <div className="flex justify-center mb-6">
          <div className="relative group">
            <div className="w-24 h-24 rounded-[30px] overflow-hidden border-2 border-white shadow-xl">
                {profile.profilePhoto ? (
                    <img src={profile.profilePhoto} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full bg-slate-100 flex items-center justify-center">
                        <User className="w-10 h-10 text-slate-300" />
                    </div>
                )}
            </div>
            <button 
                onClick={() => setStep(2)}
                className="absolute -bottom-2 -right-2 bg-white p-2 rounded-xl shadow-lg border border-slate-100 text-blue-600 hover:scale-110 transition-transform"
            >
                <Camera className="w-4 h-4" />
            </button>
          </div>
      </div>

      <div className="bg-slate-50 rounded-3xl p-6 space-y-4 border border-slate-100 shadow-inner">
        <div className="grid grid-cols-2 gap-y-4 gap-x-8">
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Full Name</p>
            <p className="text-sm font-bold text-slate-800">{profile.fullName || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Passport</p>
            <p className="text-sm font-bold text-slate-800">{profile.passportNumber || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Nationality</p>
            <p className="text-sm font-bold text-slate-800">{profile.nationality || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Expiry Date</p>
            <p className="text-sm font-bold text-slate-800">{profile.expiryDate || 'N/A'}</p>
          </div>
          <div className="space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Purpose</p>
            <p className="text-sm font-bold text-slate-800 capitalize">{profile.purpose}</p>
          </div>
          <div className="col-span-2 space-y-0.5 pt-2 border-t border-slate-200/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Recent Travel</p>
            <p className="text-xs font-medium text-slate-600 line-clamp-2">{profile.travelHistory.join(', ') || 'None listed'}</p>
          </div>
          <div className="col-span-2 space-y-0.5">
            <p className="text-[10px] font-bold text-slate-400 uppercase">Financial Standing</p>
            <p className="text-xs font-medium text-slate-600">{profile.financialProofRange}</p>
          </div>
        </div>
      </div>

      <div className="pt-8 flex flex-col gap-3">
        <button 
          onClick={() => onComplete(profile)}
          className="w-full bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-base shadow-xl shadow-blue-900/30 hover:bg-blue-700 transition-all flex items-center justify-center gap-2 group"
        >
          Initialize AI Discovery Engine <Brain className="w-5 h-5 group-hover:rotate-12 transition-transform" />
        </button>
        <button onClick={prevStep} className="w-full py-3 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors uppercase tracking-widest text-center">Edit Details</button>
      </div>
    </motion.div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl shadow-slate-200 border border-white p-12 relative overflow-hidden">
        {/* Progress bar at the top */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-slate-100">
           <motion.div 
            className="h-full bg-blue-600" 
            initial={{ width: '0%' }}
            animate={{ width: `${(step / 5) * 100}%` }}
           />
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
          {step === 4 && renderStep4()}
          {step === 5 && renderStep5()}
        </AnimatePresence>
      </div>
    </div>
  );
}
