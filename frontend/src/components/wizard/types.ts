export interface WizardFormData {
  goalEvent: string;
  goalHours: string;
  goalMinutes: string;
  goalSeconds: string;
  targetDate: string;
  trainingDays: string[];
  longRunDay: string;
  bodyWeight: string;
  targetWeight: string;
}

export interface WizardProps {
  mode: 'create' | 'edit';
  initialData?: WizardFormData;
  onComplete: (data: WizardFormData) => Promise<void> | void;
  onCancel?: () => void;
}

export interface StepProps {
  formData: WizardFormData;
  updateFormData: (partial: Partial<WizardFormData>) => void;
}

function defaultTargetDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 35); // 5주 뒤
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDefaultFormData(): WizardFormData {
  return {
    goalEvent: '10K',
    goalHours: '0',
    goalMinutes: '50',
    goalSeconds: '0',
    targetDate: defaultTargetDate(),
    trainingDays: ['TUE', 'THU', 'SAT'],
    longRunDay: 'SAT',
    bodyWeight: '70',
    targetWeight: '',
  };
}
