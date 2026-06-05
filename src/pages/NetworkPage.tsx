import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserCheck, UserX, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import Avatar from '@/components/ui/Avatar'
import EmptyState from '@/components/ui/EmptyState'
import type { Connection, Profile } from '@/types/database'

type ConnectionWithProfile = Connection & {
  profiles: Pick<Profile, 'id' | 'username' | 'full_name' | 'avatar_url' | 'headline' | 'school_name'>
}

function PersonCard({ conn, currentUserId, onAccept, onDecline }: {
  conn: ConnectionWithProfile
  currentUserId: string
  onAccept?: () => void
  onDecline?: () => void
}) {
  const p = conn.profiles
  const isPending = conn.status === 'pending' && conn.recipient_id === currentUserId

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-slate-50 transition-colors">
      <Link to={`/profile/${p.username}`}>
        <Avatar src={p.avatar_url} name={p.full_name} size="md" />
      </Link>
      <div className="flex-1 min-w-0">
        <Link to={`/profile/${p.username}`} className="text-sm font-semibold text-text-primary hover:underline truncate block">
          {p.full_name}
        </Link>
        {p.headline && <p className="text-xs text-text-muted truncate">{p.headline}</p>}
        {p.school_name && <p className="text-xs text-text-muted truncate">{p.school_name}</p>}
      </div>
      {isPending && (
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={onAccept} className="btn-primary py-1 px-3 flex items-center gap-1">
            <UserCheck size={13} /> Accept
          </button>
          <button onClick={onDecline} className="btn-ghost py-1 px-2 flex items-center gap-1 text-red-500 hover:bg-red-50">
            <UserX size={13} />
          </button>
        </div>
      )}
    </div>
  )
}

export default function NetworkPage() {
  const { user } = useAuth()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'connections' | 'pending'>('connections')

  const { data: connections = [] } = useQuery({
    queryKey: ['connections', user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from('connections')
        .select('*, profiles!connections_requester_id_fkey(id, username, full_name, avatar_url, headline, school_name)')
        .or(`requester_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
      return (data ?? []) as ConnectionWithProfile[]
    },
  })

  const updateConnection = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'accepted' | 'declined' }) => {
      await supabase.from('connections').update({ status }).eq('id', id)
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['connections'] }),
  })

  const accepted = connections.filter((c) => c.status === 'accepted')
  const pending = connections.filter((c) => c.status === 'pending' && c.recipient_id === user?.id)

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-bold text-text-primary">My Network</h1>

      {/* Tabs */}
      <div className="flex border-b border-surface-border">
        {(['connections', 'pending'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors capitalize -mb-px ${
              tab === t ? 'border-brand-500 text-brand-600' : 'border-transparent text-text-muted hover:text-text-secondary'
            }`}
          >
            {t === 'pending' ? `Pending (${pending.length})` : `Connections (${accepted.length})`}
          </button>
        ))}
      </div>

      <div className="card divide-y divide-surface-border">
        {tab === 'connections' && (
          accepted.length === 0
            ? <EmptyState icon={Users} title="No connections yet" description="Connect with other students to build your network." />
            : accepted.map((c) => (
                <PersonCard key={c.id} conn={c} currentUserId={user!.id} />
              ))
        )}

        {tab === 'pending' && (
          pending.length === 0
            ? <EmptyState icon={Users} title="No pending requests" />
            : pending.map((c) => (
                <PersonCard
                  key={c.id}
                  conn={c}
                  currentUserId={user!.id}
                  onAccept={() => updateConnection.mutate({ id: c.id, status: 'accepted' })}
                  onDecline={() => updateConnection.mutate({ id: c.id, status: 'declined' })}
                />
              ))
        )}
      </div>
    </div>
  )
}
