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

/**
 * Schema cho một mục trong Prompt Hub.
 * Đây là nơi lưu trữ các prompt đa năng (video, image, text, etc.).
 */
export interface PromptHub {
  id?: number;
  title: string;
  description?: string;
  prompt: string; // Nội dung prompt đầy đủ
  date: string; // Ngày tạo
  isFavorite?: boolean;
}

/**
 * Schema cho một Tag.
 */
export interface Tag {
  id?: number;
  name: string; // Tên tag là duy nhất
}

/**
 * Bảng liên kết Many-to-Many giữa PromptHub và Tag.
 */
export interface PromptTag {
  promptId: number;
  tagId: number;
}

export interface PromptModuleTables {
  scriptTypes: Table<ScriptType, string>;
  lengthOptions: Table<LengthOption, string>;
  topics: Table<Topic, string>;
  styles: Table<Style, string>;
  formats: Table<Format, string>;
  outputRequirements: Table<OutputRequirement, string>;
  promptTemplates: Table<PromptTemplate, string>;
  userPrompts: Table<UserPrompt, string>;
  promptHubs: Table<PromptHub, number>;
  tags: Table<Tag, number>;
  promptTags: Table<PromptTag, [number, number]>;
}

export const promptSchema = {
  scriptTypes: 'id, name',
  lengthOptions: 'id, label',
  topics: 'id, name, category',
  styles: 'id, name',
  formats: 'id, name',
  outputRequirements: 'id, name',
  promptTemplates: 'id, name',
  userPrompts: '++id, templateId, createdAt', // Sử dụng khóa chính tự tăng cho userPrompts
  promptHubs: '++id, title, date', // Bỏ tags ra khỏi đây
  tags: '++id, &name', // &name đảm bảo tên tag là duy nhất
  promptTags: '[promptId+tagId], promptId, tagId', // Bảng liên kết
};
