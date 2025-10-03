export interface FormData {
  fullName: string;
  email: string;
  nationalId: string;
  phone: string;
  category: 'participant' | 'exhibitor' | 'speaker' | 'television';
  attachments: File[];
}

export type RegistrationStatus = 'pending' | 'confirmed' | 'rejected';

export interface Registration extends Omit<FormData, 'attachments'> {
  id: string;
  status: RegistrationStatus;
  submissionDate: string;
  attachmentNames?: string[];
}


export type SubmissionStatus = 'idle' | 'loading' | 'success' | 'error';