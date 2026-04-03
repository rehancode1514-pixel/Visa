export interface MRZData {
  passportNumber: string;
  dob: string;
  expiry: string;
  nationality: string;
  surname: string;
  givenNames: string;
  sex: string;
  raw: string[];
  isValid: boolean;
}

export interface BotStatus {
  state: 
    | 'idle' 
    | 'logging_in' 
    | 'otp_waiting'
    | 'uploading' 
    | 'local_ocr_check'
    | 'vfs_ocr_processing'
    | 'auto_fill_validation'
    | 'liveness_waiting' 
    | 'monitoring' 
    | 'slot_found' 
    | 'payment_waiting'
    | 'finishing'
    | 'error';
  currentStep: string;
  lastLog: string;
  progress: number;
}

export interface Application {
  country: string;
  visa_type: string;
  platform: string;
  status: 'pending' | 'submitted' | 'appointment_booked' | 'error';
  date_applied: string;
  next_step: string;
  notes: string;
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
