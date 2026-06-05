export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

// ─── Row shapes (standalone, no self-reference) ───────────────────────────────
export interface Profile {
  id: string
  username: string
  full_name: string
  bio: string | null
  grade_level: string | null
  graduation_year: number | null
  school_name: string | null
  school_location: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  avatar_url: string | null
  cover_photo_url: string | null
  gpa: number | null
  headline: string | null
  created_at: string
  updated_at: string
}

export interface Experience {
  id: string
  user_id: string
  company_id: string | null
  title: string
  organization: string
  location: string | null
  description: string | null
  start_date: string
  end_date: string | null
  is_current: boolean
  type: 'club' | 'volunteer' | 'internship' | 'job' | 'research' | 'sport' | 'other'
  created_at: string
}

export interface Company {
  id: string
  created_by: string | null
  name: string
  logo_url: string | null
  industry: string | null
  location: string | null
  website: string | null
  description: string | null
  created_at: string
}

export interface Education {
  id: string
  user_id: string
  school_name: string
  degree: string | null
  field_of_study: string | null
  start_year: number | null
  end_year: number | null
  grade: string | null
  activities: string | null
  description: string | null
  created_at: string
}

export interface Achievement {
  id: string
  user_id: string
  title: string
  description: string | null
  issuer: string | null
  date_received: string | null
  category: string | null
  created_at: string
}

export interface Skill {
  id: string
  user_id: string
  skill_name: string
  created_at: string
}

export interface Opportunity {
  id: string
  created_by: string
  title: string
  organization: string
  description: string
  type: 'internship' | 'volunteer' | 'scholarship' | 'competition' | 'program' | 'job' | 'other'
  location: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  is_remote: boolean
  deadline: string | null
  application_url: string | null
  pay_type: 'paid' | 'unpaid' | 'stipend' | null
  grade_levels: string[]
  tags: string[]
  created_at: string
}

export interface Connection {
  id: string
  requester_id: string
  recipient_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  image_url: string | null
  created_at: string
  updated_at: string
}

export interface PostLike {
  id: string
  post_id: string
  user_id: string
  created_at: string
}

export interface PostComment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
}

export interface SavedOpportunity {
  id: string
  user_id: string
  opportunity_id: string
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  content: string
  read_at: string | null
  created_at: string
}

// ─── Helper: a generic table mapping for the Supabase client ──────────────────
type TableDef<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row
  Insert: Insert
  Update: Update
  Relationships: []
}

export interface Database {
  public: {
    Tables: {
      profiles: TableDef<Profile, Partial<Profile> & { id: string; username: string; full_name: string }>
      experiences: TableDef<Experience, Omit<Experience, 'id' | 'created_at'>>
      companies: TableDef<Company, Omit<Company, 'id' | 'created_at'>>
      education: TableDef<Education, Omit<Education, 'id' | 'created_at'>>
      achievements: TableDef<Achievement, Omit<Achievement, 'id' | 'created_at'>>
      skills: TableDef<Skill, Omit<Skill, 'id' | 'created_at'>>
      opportunities: TableDef<Opportunity, Omit<Opportunity, 'id' | 'created_at'>>
      connections: TableDef<Connection, Omit<Connection, 'id' | 'created_at'>>
      posts: TableDef<Post, Omit<Post, 'id' | 'created_at' | 'updated_at'>>
      post_likes: TableDef<PostLike, Omit<PostLike, 'id' | 'created_at'>>
      post_comments: TableDef<PostComment, Omit<PostComment, 'id' | 'created_at'>>
      saved_opportunities: TableDef<SavedOpportunity, Omit<SavedOpportunity, 'id' | 'created_at'>>
      messages: TableDef<Message, Omit<Message, 'id' | 'created_at'>>
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

// ─── Composed/joined convenience types ────────────────────────────────────────
export type ExperienceWithCompany = Experience & {
  companies: Pick<Company, 'id' | 'name' | 'logo_url' | 'industry'> | null
}

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'headline'>
  post_likes: Pick<PostLike, 'user_id'>[]
  post_comments: (PostComment & {
    profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  })[]
}
