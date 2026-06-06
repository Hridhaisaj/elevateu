import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Image, Send, Heart, MessageCircle, Bookmark, MapPin, Calendar, X, Loader2, Trash2 } from 'lucide-react'
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
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [modError, setModError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const qc = useQueryClient()

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !user) return
    if (!file.type.startsWith('image/')) return
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB.')
      return
    }
    setUploading(true)
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png'
    const path = `posts/${user.id}-${Date.now()}.${ext}`
    const { error } = await supabase.storage.from('logos').upload(path, file, { upsert: true, cacheControl: '3600' })
    if (!error) {
      const { data } = supabase.storage.from('logos').getPublicUrl(path)
      setImageUrl(data.publicUrl)
    }
    setUploading(false)
    if (fileRef.current) fileRef.current.value = ''
  }

  async function submit() {
    if ((!content.trim() && !imageUrl) || !user) return
    setModError('')
    setLoading(true)

    // AI moderation: keep posts education / career related. Fails open if the
    // moderation endpoint is unavailable so posting never breaks.
    if (content.trim()) {
      try {
        const res = await fetch('/api/moderate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ content: content.trim() }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.allowed === false) {
            setModError(data.reason || "This post doesn't look related to school, careers, or opportunities, so it wasn't posted.")
            setLoading(false)
            return
          }
        }
      } catch {
        // Network/endpoint error — allow the post through.
      }
    }

    await supabase.from('posts').insert({ user_id: user.id, content: content.trim(), image_url: imageUrl })
    setContent('')
    setImageUrl(null)
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

          {imageUrl && (
            <div className="relative mt-1 mb-2 inline-block">
              <img src={imageUrl} alt="" className="rounded-lg max-h-60 object-cover" />
              <button
                onClick={() => setImageUrl(null)}
                className="absolute top-2 right-2 p-1 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
                title="Remove image"
              >
                <X size={14} />
              </button>
            </div>
          )}

          {modError && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2 mt-2">
              {modError}
            </div>
          )}

          <div className="flex items-center justify-between pt-2 border-t border-surface-border mt-2">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary transition-colors disabled:opacity-50"
            >
              {uploading ? <Loader2 size={15} className="animate-spin" /> : <Image size={15} />}
              {uploading ? 'Uploading…' : 'Photo'}
            </button>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
            <button
              onClick={submit}
              disabled={(!content.trim() && !imageUrl) || loading || uploading}
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
function PostCard({ post, currentUserId, isAdmin }: { post: PostWithAuthor; currentUserId: string; isAdmin: boolean }) {
  const qc = useQueryClient()
  const liked = post.post_likes.some((l) => l.user_id === currentUserId)
  const canDelete = currentUserId === post.user_id || isAdmin

  async function deletePost() {
    if (!confirm('Delete this post?')) return
    await supabase.from('posts').delete().eq('id', post.id)
    qc.invalidateQueries({ queryKey: ['feed'] })
  }

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
        {canDelete && (
          <button
            onClick={deletePost}
            className="flex-shrink-0 p-1.5 rounded-md text-text-muted hover:bg-red-50 hover:text-red-500 transition-colors"
            title={isAdmin && currentUserId !== post.user_id ? 'Delete post (admin)' : 'Delete post'}
          >
            <Trash2 size={15} />
          </button>
        )}
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
            <PostCard key={post.id} post={post} currentUserId={user?.id ?? ''} isAdmin={profile?.is_admin ?? false} />
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
