import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image, Send, Heart, MessageCircle, Bookmark, MapPin, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatRelativeDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import { Link } from 'react-router-dom'
import type { PostWithAuthor, Opportunity } from '@/types/database'

// ─── Post Composer ───────────────────────────────────────────────────────────
function PostComposer() {
  const { user, profile } = useAuth()
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const qc = useQueryClient()

  async function submit() {
    if (!content.trim() || !user) return
    setLoading(true)
    await supabase.from('posts').insert({ user_id: user.id, content: content.trim() })
    setContent('')
    setLoading(false)
    qc.invalidateQueries({ queryKey: ['feed'] })
  }

  if (!profile) return null

  return (
    <div className="card p-4">
      <div className="flex gap-3">
        <Avatar src={profile.avatar_url} name={profile.full_name} size="md" />
        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share an update, achievement, or question…"
            className="w-full text-sm text-text-primary placeholder:text-text-muted resize-none border-none outline-none bg-transparent min-h-[72px]"
          />
          <div className="flex items-center justify-between pt-2 border-t border-surface-border mt-2">
            <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
              <Image size={15} /> Photo
            </button>
            <button
              onClick={submit}
              disabled={!content.trim() || loading}
              className="btn-primary py-1.5 flex items-center gap-1.5 disabled:opacity-40"
            >
              <Send size={13} /> Post
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Post Card ────────────────────────────────────────────────────────────────
function PostCard({ post, currentUserId }: { post: PostWithAuthor; currentUserId: string }) {
  const qc = useQueryClient()
  const liked = post.post_likes.some((l) => l.user_id === currentUserId)

  async function toggleLike() {
    if (liked) {
      await supabase.from('post_likes').delete().eq('post_id', post.id).eq('user_id', currentUserId)
    } else {
      await supabase.from('post_likes').insert({ post_id: post.id, user_id: currentUserId })
    }
    qc.invalidateQueries({ queryKey: ['feed'] })
  }

  return (
    <div className="card p-4">
      <div className="flex items-start gap-3 mb-3">
        <Link to={`/profile/${post.profiles.username}`}>
          <Avatar src={post.profiles.avatar_url} name={post.profiles.full_name} size="md" />
        </Link>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline gap-2 flex-wrap">
            <Link to={`/profile/${post.profiles.username}`} className="text-sm font-semibold text-text-primary hover:underline">
              {post.profiles.full_name}
            </Link>
            {post.profiles.headline && (
              <span className="text-xs text-text-muted truncate">{post.profiles.headline}</span>
            )}
          </div>
          <p className="text-xs text-text-muted">{formatRelativeDate(post.created_at)}</p>
        </div>
      </div>

      <p className="text-sm text-text-primary whitespace-pre-wrap leading-relaxed">{post.content}</p>

      {post.image_url && (
        <img src={post.image_url} alt="" className="mt-3 rounded-lg w-full object-cover max-h-80" />
      )}

      <div className="flex items-center gap-4 mt-4 pt-3 border-t border-surface-border">
        <button
          onClick={toggleLike}
          className={`flex items-center gap-1.5 text-xs transition-colors ${
            liked ? 'text-brand-500' : 'text-text-muted hover:text-text-secondary'
          }`}
        >
          <Heart size={15} className={liked ? 'fill-brand-500' : ''} />
          {post.post_likes.length > 0 && post.post_likes.length}
          <span className="sr-only">likes</span>
        </button>
        <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
          <MessageCircle size={15} />
          {post.post_comments.length > 0 && post.post_comments.length}
          <span className="sr-only">comments</span>
        </button>
        <button className="ml-auto flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors">
          <Bookmark size={15} />
        </button>
      </div>
    </div>
  )
}

// ─── Opportunity Sidebar Card ─────────────────────────────────────────────────
function SidebarOpportunityCard({ opp }: { opp: Opportunity }) {
  return (
    <Link to={`/opportunities/${opp.id}`} className="block hover:bg-slate-50 -mx-2 px-2 py-2 rounded-lg transition-colors">
      <p className="text-sm font-medium text-text-primary leading-snug">{opp.title}</p>
      <p className="text-xs text-text-secondary mt-0.5">{opp.organization}</p>
      <div className="flex items-center gap-2 mt-1 flex-wrap">
        {opp.city && (
          <span className="flex items-center gap-0.5 text-xs text-text-muted">
            <MapPin size={11} />{opp.city}, {opp.state}
          </span>
        )}
        {opp.deadline && (
          <span className="flex items-center gap-0.5 text-xs text-text-muted">
            <Calendar size={11} />Due {new Date(opp.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </Link>
  )
}

// ─── Main Feed Page ───────────────────────────────────────────────────────────
export default function FeedPage() {
  const { user, profile } = useAuth()

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ['feed'],
    queryFn: async () => {
      const { data } = await supabase
        .from('posts')
        .select(`*, profiles(id, username, full_name, avatar_url, headline), post_likes(user_id), post_comments(*, profiles(id, username, full_name, avatar_url))`)
        .order('created_at', { ascending: false })
        .limit(30)
      return (data ?? []) as PostWithAuthor[]
    },
  })

  const { data: nearbyOpps = [] } = useQuery({
    queryKey: ['nearby-opps', profile?.state],
    enabled: !!profile?.state,
    queryFn: async () => {
      const { data } = await supabase
        .from('opportunities')
        .select('*')
        .eq('state', profile!.state!)
        .order('created_at', { ascending: false })
        .limit(5)
      return (data ?? []) as Opportunity[]
    },
  })

  return (
    <div className="flex gap-6">
      {/* Feed */}
      <div className="flex-1 space-y-4 min-w-0">
        <PostComposer />

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card p-4 animate-pulse">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-slate-200 rounded w-1/3" />
                    <div className="h-3 bg-slate-200 rounded w-1/4" />
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  <div className="h-3 bg-slate-200 rounded" />
                  <div className="h-3 bg-slate-200 rounded w-4/5" />
                </div>
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-text-secondary text-sm">No posts yet. Be the first to share something!</p>
          </div>
        ) : (
          posts.map((post) => (
            <PostCard key={post.id} post={post} currentUserId={user?.id ?? ''} />
          ))
        )}
      </div>

      {/* Right sidebar */}
      <aside className="hidden lg:block w-64 flex-shrink-0">
        <div className="sticky top-20 space-y-4">
          {nearbyOpps.length > 0 && (
            <div className="card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="section-title">Opportunities near you</h3>
                <Link to="/opportunities" className="text-xs text-brand-500 hover:underline">See all</Link>
              </div>
              <div className="divide-y divide-surface-border">
                {nearbyOpps.map((opp) => (
                  <SidebarOpportunityCard key={opp.id} opp={opp} />
                ))}
              </div>
            </div>
          )}

          {profile && (
            <div className="card p-4">
              <Link to={`/profile/${profile.username}`} className="flex items-center gap-3 mb-3 hover:opacity-80">
                <Avatar src={profile.avatar_url} name={profile.full_name} size="md" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{profile.full_name}</p>
                  {profile.headline && <p className="text-xs text-text-muted truncate">{profile.headline}</p>}
                </div>
              </Link>
              {profile.school_name && (
                <p className="text-xs text-text-secondary">{profile.school_name}</p>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
