// Types pour le système de notes enrichies (block-based, style Notion)

export type BlockType =
  | 'paragraph'
  | 'heading'
  | 'list'
  | 'checklist'
  | 'quote'
  | 'divider'
  | 'embed'
  | 'link-preview'

export interface BaseBlock {
  id: string
  type: BlockType
  createdAt: string
}

export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph'
  content: {
    text: string
    formatting?: {
      bold?: boolean
      italic?: boolean
      code?: boolean
      color?: string
    }
  }
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading'
  content: {
    text: string
    level: 1 | 2 | 3
  }
}

export interface ListBlock extends BaseBlock {
  type: 'list'
  content: {
    items: string[]
    ordered: boolean
  }
}

export interface ChecklistBlock extends BaseBlock {
  type: 'checklist'
  content: {
    items: Array<{
      id: string
      text: string
      checked: boolean
    }>
  }
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote'
  content: {
    text: string
    author?: string
  }
}

export interface DividerBlock extends BaseBlock {
  type: 'divider'
  content: Record<string, never>
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed'
  content: {
    url: string
    provider: 'youtube' | 'tiktok' | 'vimeo' | 'twitter' | 'spotify'
    embedId?: string
    thumbnail?: string
    title?: string
    duration?: number
    cached: boolean
  }
}

export interface LinkPreviewBlock extends BaseBlock {
  type: 'link-preview'
  content: {
    url: string
    title?: string
    description?: string
    image?: string
    favicon?: string
    cached: boolean
  }
}

export type NoteBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | ChecklistBlock
  | QuoteBlock
  | DividerBlock
  | EmbedBlock
  | LinkPreviewBlock

export interface MediaMetadata {
  [blockId: string]: {
    thumbnail?: string
    title?: string
    description?: string
    image?: string
    favicon?: string
    duration?: number
    cached_at: string
  }
}

export interface HabitNote {
  id: string
  habit_id: string
  user_id: string
  title: string
  blocks: NoteBlock[]
  is_pinned: boolean
  media_metadata: MediaMetadata
  created_at: string
  updated_at: string
}

export interface HabitNoteTask {
  id: string
  note_id: string
  habit_id: string
  user_id: string
  title: string
  description?: string
  source_type: 'video' | 'article' | 'custom'
  source_url?: string
  is_completed: boolean
  completed_at?: string
  due_date?: string
  created_at: string
  updated_at: string
}

// Types pour l'API
export interface EmbedPreviewRequest {
  url: string
}

export interface EmbedPreviewResponse {
  provider: 'youtube' | 'tiktok' | 'vimeo' | 'article' | 'twitter' | 'spotify'
  embedId?: string
  thumbnail?: string
  title?: string
  description?: string
  image?: string
  favicon?: string
  duration?: number
  embedHtml?: string
  url?: string
}

export interface CreateTaskRequest {
  noteId: string
  habitId: string
  title: string
  description?: string
  sourceType: 'video' | 'article' | 'custom'
  sourceUrl?: string
  dueDate?: string
}
