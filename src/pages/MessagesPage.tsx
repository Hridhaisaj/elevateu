import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Send } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { formatRelativeDate } from '@/lib/utils'
import Avatar from '@/components/ui/Avatar'
import type { Message, Profile } from '@/types/database'

type ConversationSummary = {
  partnerId: string
  partnerProfile: Profile
  lastMessage: string
  lastAt: string
  unread: number
}

export default function MessagesPage() {
  const { userId: partnerIdParam } = useParams<{ userId?: string }>()
  const { user } = useAuth()
  const [partnerId, setPartnerId] = useState(partnerIdParam ?? '')
  const [content, setContent] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const qc = useQueryClient()

  // Fetch conversations list
  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })
      if (!data) return []

      // Group by partner
      const partnerMap = new Map<string, Message>()
      for (const msg of data) {
        const pId = msg.sender_id === user!.id ? msg.recipient_id : msg.sender_id
        if (!partnerMap.has(pId)) partnerMap.set(pId, msg)
      }

      const partners = Array.from(partnerMap.entries())
      const profiles = await Promise.all(
        partners.map(async ([pId]) => {
          const { data: p } = await supabase.from('profiles').select('*').eq('id', pId).single()
          return p as Profile
        })
      )

      return partners.map(([pId, msg], i) => ({
        partnerId: pId,
        partnerProfile: profiles[i],
        lastMessage: msg.content,
        lastAt: msg.created_at,
        unread: 0,
      })) as ConversationSummary[]
    },
  })

  // Fetch active conversation messages
  const { data: messages = [] } = useQuery({
    queryKey: ['messages', user?.id, partnerId],
    enabled: !!user && !!partnerId,
    queryFn: async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .or(`and(sender_id.eq.${user!.id},recipient_id.eq.${partnerId}),and(sender_id.eq.${partnerId},recipient_id.eq.${user!.id})`)
        .order('created_at', { ascending: true })
      return (data ?? []) as Message[]
    },
  })

  const { data: partnerProfile } = useQuery({
    queryKey: ['profile-by-id', partnerId],
    enabled: !!partnerId,
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', partnerId).single()
      return data as Profile | null
    },
  })

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Realtime subscription
  useEffect(() => {
    if (!user || !partnerId) return
    const channel = supabase.channel('messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, () => {
        qc.invalidateQueries({ queryKey: ['messages'] })
      })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user, partnerId, qc])

  async function sendMessage() {
    if (!content.trim() || !user || !partnerId) return
    await supabase.from('messages').insert({ sender_id: user.id, recipient_id: partnerId, content: content.trim() })
    setContent('')
    qc.invalidateQueries({ queryKey: ['messages'] })
    qc.invalidateQueries({ queryKey: ['conversations'] })
  }

  return (
    <div className="h-[calc(100vh-5rem)] flex gap-4">
      {/* Conversation list */}
      <div className="w-64 flex-shrink-0 card overflow-hidden flex flex-col">
        <div className="p-3 border-b border-surface-border">
          <h2 className="text-sm font-semibold text-text-primary">Messages</h2>
        </div>
        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-center text-xs text-text-muted">No conversations yet</div>
          ) : (
            conversations.map((conv) => (
              <button
                key={conv.partnerId}
                onClick={() => setPartnerId(conv.partnerId)}
                className={`w-full flex items-center gap-2.5 p-3 text-left hover:bg-slate-50 transition-colors ${
                  partnerId === conv.partnerId ? 'bg-brand-50' : ''
                }`}
              >
                <Avatar src={conv.partnerProfile?.avatar_url} name={conv.partnerProfile?.full_name ?? '?'} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-text-primary truncate">{conv.partnerProfile?.full_name}</p>
                  <p className="text-xs text-text-muted truncate">{conv.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 card flex flex-col overflow-hidden">
        {!partnerId ? (
          <div className="flex-1 flex items-center justify-center text-text-muted text-sm">
            Select a conversation
          </div>
        ) : (
          <>
            {/* Chat header */}
            <div className="p-3 border-b border-surface-border flex items-center gap-3">
              {partnerProfile && (
                <>
                  <Avatar src={partnerProfile.avatar_url} name={partnerProfile.full_name} size="sm" />
                  <Link to={`/profile/${partnerProfile.username}`} className="text-sm font-semibold text-text-primary hover:underline">
                    {partnerProfile.full_name}
                  </Link>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => {
                const isMine = msg.sender_id === user?.id
                return (
                  <div key={msg.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      isMine ? 'bg-brand-500 text-white' : 'bg-slate-100 text-text-primary'
                    }`}>
                      <p>{msg.content}</p>
                      <p className={`text-xs mt-1 ${isMine ? 'text-brand-100' : 'text-text-muted'}`}>
                        {formatRelativeDate(msg.created_at)}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-surface-border flex gap-2">
              <input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                placeholder="Type a message…"
                className="input flex-1"
              />
              <button onClick={sendMessage} disabled={!content.trim()} className="btn-primary px-3 disabled:opacity-40">
                <Send size={15} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
