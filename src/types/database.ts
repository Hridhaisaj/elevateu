export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      experiences: {
        Row: {
          id: string
          user_id: string
          title: string
          organization: string
          description: string | null
          start_date: string
          end_date: string | null
          type: 'club' | 'volunteer' | 'internship' | 'job' | 'research' | 'sport' | 'other'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['experiences']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['experiences']['Insert']>
      }
      achievements: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          date_received: string | null
          category: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['achievements']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['achievements']['Insert']>
      }
      skills: {
        Row: {
          id: string
          user_id: string
          skill_name: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['skills']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['skills']['Insert']>
      }
      opportunities: {
        Row: {
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
        Insert: Omit<Database['public']['Tables']['opportunities']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['opportunities']['Insert']>
      }
      connections: {
        Row: {
          id: string
          requester_id: string
          recipient_id: string
          status: 'pending' | 'accepted' | 'declined'
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['connections']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['connections']['Insert']>
      }
      posts: {
        Row: {
          id: string
          user_id: string
          content: string
          image_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['posts']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['posts']['Insert']>
      }
      post_likes: {
        Row: {
          id: string
          post_id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_likes']['Row'], 'id' | 'created_at'>
        Update: never
      }
      post_comments: {
        Row: {
          id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['post_comments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['post_comments']['Insert']>
      }
      saved_opportunities: {
        Row: {
          id: string
          user_id: string
          opportunity_id: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['saved_opportunities']['Row'], 'id' | 'created_at'>
        Update: never
      }
      messages: {
        Row: {
          id: string
          sender_id: string
          recipient_id: string
          content: string
          read_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['messages']['Insert']>
      }
    }
  }
}

// Convenience types
export type Profile = Database['public']['Tables']['profiles']['Row']
export type Experience = Database['public']['Tables']['experiences']['Row']
export type Achievement = Database['public']['Tables']['achievements']['Row']
export type Skill = Database['public']['Tables']['skills']['Row']
export type Opportunity = Database['public']['Tables']['opportunities']['Row']
export type Connection = Database['public']['Tables']['connections']['Row']
export type Post = Database['public']['Tables']['posts']['Row']
export type PostLike = Database['public']['Tables']['post_likes']['Row']
export type PostComment = Database['public']['Tables']['post_comments']['Row']
export type Message = Database['public']['Tables']['messages']['Row']

export type PostWithAuthor = Post & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'headline'>
  post_likes: Pick<PostLike, 'user_id'>[]
  post_comments: (PostComment & {
    profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url'>
  })[]
}
