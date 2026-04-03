export interface OCRResult extends MRZData {
  confidence_score: number;
}

export interface MRZData {
  passportNumber: string;
  dob: string;
  expiry: string;
  nationality: string;
  surname: string;
  givenNames: string;
  sex: string;
  raw?: string[];
  isValid: boolean;
}

export interface UserProfile {
  fullName: string;
  passportNumber: string;
  nationality: string;
  dob: string;
  expiryDate: string;
  profilePhoto?: string;
  passportPhoto?: string;
  travelHistory: string[];
  purpose: 'tourism' | 'work' | 'study' | 'medical';
  preferredCountries: string[];
  financialProofRange: string;
  documents: {
    passportCopy?: string;
    photo?: string;
    bankStatement?: string;
    invitationLetter?: string;
  };
}

export interface VisaOpportunity {
  id: string;
  country: string;
  visaType: string;
  category: 'Easy' | 'Moderate' | 'Hard';
  eligibilityScore: number;
  successProbability: number;
  vfsProcessed: boolean;
  vfsPortalLink?: string;
  requiredForms: string[];
  description: string;
}

export interface Application {
  id: string;
  country: string;
  visaType: string;
  status: 
    | 'not_started' 
    | 'in_progress' 
    | 'submitted' 
    | 'appointment_booked' 
    | 'processing' 
    | 'approved' 
    | 'rejected';
  submissionDate?: string;
  appointmentDate?: string;
  vfsCenterLocation?: string;
  feesPaid?: number;
  notes?: string;
  lastUpdate: string;
  applicantName: string;
  passportNumber: string;
  documentsSubmitted: string[];
}

export interface BotStatus {
  state: 
    | 'idle' 
    | 'onboarding'
    | 'discovery'
    | 'logging_in' 
    | 'otp_waiting'
    | 'uploading' 
    | 'monitoring' 
    | 'slot_found' 
    | 'error';
  currentStep: string;
  lastLog: string;
  progress: number;
}

export interface AutomationInstruction {
  website: string;
  steps: string[];
  manual_steps: string[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
}
export interface User {
  id?: string;
  email: string;
  lastLogin?: string;
  token?: string;
}

export interface BrowserState {
  url: string;
  screenshot: string | null;
  isActive: boolean;
  state: 'idle' | 'logging_in' | 'logged_in' | 'applying' | 'error';
}
