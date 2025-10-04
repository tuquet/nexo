import type { Table } from 'dexie';

export interface ScriptType {
  id: string;
  name: string;
  description: string;
}

export interface LengthOption {
  id: string;
  label: string;
  characters: [number, number];
  duration: [number, number];
}

export interface Topic {
  id: string;
  name: string;
  category: string;
  isCustom?: boolean;
}

export interface Style {
  id: string;
  name: string;
  description?: string;
}

export interface Format {
  id: string;
  name: string;
  description?: string;
}

export interface OutputRequirement {
  id: string;
  name: string;
  rules: string[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  structure: string;
  placeholders: string[];
}

export interface UserPrompt {
  id: string;
  templateId: string;
  filledValues: Record<string, any>;
  finalPrompt: string;
  createdAt: Date;
}

export interface PromptVideoMakerTables {
  scriptTypes: Table<ScriptType, string>;
  lengthOptions: Table<LengthOption, string>;
  topics: Table<Topic, string>;
  styles: Table<Style, string>;
  formats: Table<Format, string>;
  outputRequirements: Table<OutputRequirement, string>;
  promptTemplates: Table<PromptTemplate, string>;
  userPrompts: Table<UserPrompt, string>;
}

export const promptVideoMakerSchema = {
  scriptTypes: 'id, name',
  lengthOptions: 'id, label',
  topics: 'id, name, category',
  styles: 'id, name',
  formats: 'id, name',
  outputRequirements: 'id, name',
  promptTemplates: 'id, name',
  userPrompts: '++id, templateId, createdAt', // Use auto-incrementing primary key for userPrompts
};
