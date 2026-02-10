export type PriorityLevel = 'P1' | 'P2' | 'P3';

export type IntakeFieldType = 'text' | 'textarea' | 'select' | 'multi-select' | 'radio' | 'number';

export interface IntakeField {
  id: string;
  label: string;
  labelEn: string;
  type: IntakeFieldType;
  priority: PriorityLevel;
  placeholder?: string;
  placeholderEn?: string;
  options?: { value: string; label: string; labelEn: string }[];
  required?: boolean;
  description?: string;
  descriptionEn?: string;
}

export interface IntakeSection {
  id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  fields: IntakeField[];
}

export interface IntakeFormSchema {
  sections: IntakeSection[];
}

export type IntakeFormData = Record<string, string | string[]>;
