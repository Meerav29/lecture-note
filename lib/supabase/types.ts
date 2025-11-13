export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      lectures: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          audio_url: string | null;
          transcript: string | null;
          duration: number | null;
          metadata: Json;
          transcription_status: 'pending' | 'processing' | 'completed' | 'failed';
          transcription_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          audio_url?: string | null;
          transcript?: string | null;
          duration?: number | null;
          metadata?: Json;
          transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
          transcription_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          audio_url?: string | null;
          transcript?: string | null;
          duration?: number | null;
          metadata?: Json;
          transcription_status?: 'pending' | 'processing' | 'completed' | 'failed';
          transcription_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lecture_content: {
        Row: {
          id: string;
          lecture_id: string;
          content_type: 'notes' | 'flashcards' | 'mindmap' | 'summary';
          content: Json;
          provider: 'openai' | 'anthropic' | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lecture_id: string;
          content_type: 'notes' | 'flashcards' | 'mindmap' | 'summary';
          content: Json;
          provider?: 'openai' | 'anthropic' | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lecture_id?: string;
          content_type?: 'notes' | 'flashcards' | 'mindmap' | 'summary';
          content?: Json;
          provider?: 'openai' | 'anthropic' | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      lecture_chats: {
        Row: {
          id: string;
          lecture_id: string;
          role: 'user' | 'assistant';
          content: string;
          provider: 'openai' | 'anthropic' | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          lecture_id: string;
          role: 'user' | 'assistant';
          content: string;
          provider?: 'openai' | 'anthropic' | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          lecture_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          provider?: 'openai' | 'anthropic' | null;
          created_at?: string;
        };
      };
      transcription_jobs: {
        Row: {
          id: string;
          lecture_id: string;
          user_id: string;
          audio_path: string;
          audio_mime_type: string | null;
          status: 'pending' | 'processing' | 'completed' | 'failed';
          error: string | null;
          attempts: number;
          metadata: Json;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          lecture_id: string;
          user_id: string;
          audio_path: string;
          audio_mime_type?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error?: string | null;
          attempts?: number;
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          lecture_id?: string;
          user_id?: string;
          audio_path?: string;
          audio_mime_type?: string | null;
          status?: 'pending' | 'processing' | 'completed' | 'failed';
          error?: string | null;
          attempts?: number;
          metadata?: Json;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

// Helper types
export type Lecture = Database['public']['Tables']['lectures']['Row'];
export type LectureInsert = Database['public']['Tables']['lectures']['Insert'];
export type LectureUpdate = Database['public']['Tables']['lectures']['Update'];

export type LectureContent = Database['public']['Tables']['lecture_content']['Row'];
export type LectureContentInsert = Database['public']['Tables']['lecture_content']['Insert'];
export type LectureContentUpdate = Database['public']['Tables']['lecture_content']['Update'];

export type LectureChat = Database['public']['Tables']['lecture_chats']['Row'];
export type LectureChatInsert = Database['public']['Tables']['lecture_chats']['Insert'];
export type LectureChatUpdate = Database['public']['Tables']['lecture_chats']['Update'];

export type TranscriptionJob = Database['public']['Tables']['transcription_jobs']['Row'];
export type TranscriptionJobInsert = Database['public']['Tables']['transcription_jobs']['Insert'];
export type TranscriptionJobUpdate = Database['public']['Tables']['transcription_jobs']['Update'];
