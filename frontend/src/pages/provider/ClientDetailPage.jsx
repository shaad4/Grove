import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, MoreVertical, Edit2, PowerOff, Power,
  Trash2, Plus, X, Check, Loader2, ExternalLink,
  Clock, Package, Calendar, Mail, Building2,
  FileText, Tag, AlertTriangle, ChevronRight,
} from 'lucide-react'
import ProviderLayout from '../../components/layout/ProviderLayout'
import ProviderTopbar from '../../components/layout/ProviderTopbar'
import EditClientModal from '../../components/modals/EditClientModal'
import DeleteClientModal from '../../components/modals/DeleteClientModal'
import clientsApi from '../../api/clients.api'
import { getTagColor, getAvatarColor, getInitials, timeAgo, formatDate } from '../../utils/clientHelpers'

// ─── TAG CHIP ─────────────────────────────────────────────────
function TagChip({ name, onRemove }) {
  const c = getTagColor(name)
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px] font-medium"
      style={{ background: c.bg, color: c.text }}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: c.dot }} />
      {name}
      {onRemove && (
        <button
          onClick={onRemove}
          className="ml-0.5 opacity-60 hover:opacity-100 transition-opacity"
        >
          <X size={10} />
        </button>
      )}
    </span>
  )
}

// ─── STATUS BADGE ─────────────────────────────────────────────
function StatusBadge({ client }) {
  if (client.is_deactivated) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4f3] px-3 py-1.5 text-[12px] font-medium text-[#4a544a]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#9ea89e]" />
        Deactivated
      </span>
    )
  }
  if (client.status === 'pending') {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fef3e2] px-3 py-1.5 text-[12px] font-medium text-[#92500a]">
        <span className="h-1.5 w-1.5 rounded-full bg-[#f59e0b]" />
        Awaiting invite
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-[#e6f5f0] px-3 py-1.5 text-[12px] font-medium text-[#085041]">
      <span className="h-1.5 w-1.5 rounded-full bg-[#1d9e75] animate-pulse" />
      Active
    </span>
  )
}

// ─── REQUEST STATUS BADGE ─────────────────────────────────────
const REQUEST_STATUS = {
  received:    { label: 'Just submitted',    bg: '#E6F5F0', text: '#085041' },
  in_review:   { label: "We're looking at it", bg: '#FEF3E2', text: '#92500A' },
  in_progress: { label: 'Work has started',  bg: '#EEF2FF', text: '#3730A3' },
  delivered:   { label: 'Ready for you',     bg: '#E6F5F0', text: '#0F6E56' },
  closed:      { label: 'Done',              bg: '#F3F4F3', text: '#4A544A' },
}

function RequestStatusBadge({ status }) {
  const cfg = REQUEST_STATUS[status] || { label: status, bg: '#F3F4F3', text: '#4A544A' }
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium"
      style={{ background: cfg.bg, color: cfg.text }}
    >
      {cfg.label}
    </span>
  )
}

// ─── NOTE ITEM ────────────────────────────────────────────────
function NoteItem({ note, onDelete }) {
  return (
    <div className="group relative rounded-xl border border-[#f1f3f1] bg-[#fafafa] px-4 py-3">
      <p className="text-[13px] leading-6 text-[#141a14] whitespace-pre-wrap">{note.content || note}</p>
      <div className="mt-2 flex items-center justify-between">
        <p className="text-[11px] text-[#9ea89e]">
          {note.created_at ? timeAgo(note.created_at) : ''}
        </p>
        {onDelete && (
          <button
            onClick={onDelete}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-[#9ea89e] hover:text-red-400"
          >
            <Trash2 size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

// ─── INLINE PRIVATE NOTE EDITOR ───────────────────────────────
function PrivateNoteEditor({ client, onSaved }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(client.private_note || '')
  const [loading, setLoading] = useState(false)
  const textareaRef = useRef(null)

  useEffect(() => {
    if (editing) textareaRef.current?.focus()
  }, [editing])

  const handleSave = async () => {
    setLoading(true)
    try {
      await clientsApi.update(client.id, { private_note: value })
      onSaved?.(value)
      setEditing(false)
    } catch {
      // keep editing open on error
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    setValue(client.private_note || '')
    setEditing(false)
  }

  if (!editing) {
    return (
      <div
        className="group min-h-[60px] cursor-text rounded-xl border border-dashed border-[#e8eae8] px-4 py-3 hover:border-[#0f6e56] hover:bg-[#fafafa] transition-all"
        onClick={() => setEditing(true)}
      >
        {value ? (
          <p className="text-[13px] leading-6 text-[#141a14] whitespace-pre-wrap">{value}</p>
        ) : (
          <p className="text-[13px] text-[#9ea89e]">Add a private note about this client...</p>
        )}
        <p className="mt-1.5 text-[11px] text-[#9ea89e] opacity-0 group-hover:opacity-100 transition-opacity">
          Click to edit
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-[#0f6e56] ring-4 ring-[#0f6e56]/10 overflow-hidden">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        rows={4}
        placeholder="Add a private note about this client..."
        className="w-full resize-none px-4 py-3 text-[13px] text-[#141a14] outline-none placeholder:text-[#9ea89e] bg-white"
      />
      <div className="flex items-center justify-end gap-2 border-t border-[#f1f3f1] px-3 py-2 bg-white">
        <button
          onClick={handleCancel}
          className="rounded-lg px-3 py-1.5 text-[12px] font-medium text-[#6b756d] hover:bg-[#f7f8f7] transition-colors"
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-[#0f6e56] px-3 py-1.5 text-[12px] font-medium text-white hover:bg-[#085041] disabled:opacity-60 transition-colors"
        >
          {loading && <Loader2 size={12} className="animate-spin" />}
          Save
        </button>
      </div>
    </div>
  )
}

// ─── TOAST ────────────────────────────────────────────────────
function Toast({ message, type = 'success' }) {
  return (
    <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-xl px-5 py-3 text-[13px] font-medium text-white shadow-xl shadow-black/20
      ${type === 'success' ? 'bg-[#0f6e56]' : 'bg-red-500'}
    `}>
      {message}
    </div>
  )
}

// ─── PAGE ─────────────────────────────────────────────────────
export default function ClientDetailPage() {
  const { clientId } = useParams()
  const navigate = useNavigate()

  const [client, setClient] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [toast, setToast] = useState(null)
  const [activeTab, setActiveTab] = useState('all')

  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  const showToast = (message, type = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchClient = async () => {
    try {
      const res = await clientsApi.get(clientId)
      setClient(res.data.data)
    } catch (err) {
      if (err?.response?.status === 404) setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchClient() }, [clientId])

  const handleDeactivate = async () => {
    setActionLoading(true)
    try {
      await clientsApi.deactivate(clientId)
      await fetchClient()
      showToast('Client deactivated.')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to deactivate.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  const handleReactivate = async () => {
    setActionLoading(true)
    try {
      await clientsApi.reactivate(clientId)
      await fetchClient()
      showToast('Client reactivated.')
    } catch (err) {
      showToast(err?.response?.data?.message || 'Failed to reactivate.', 'error')
    } finally {
      setActionLoading(false)
    }
  }

  // ── Loading ───────────────────────────────────────────────
  if (loading) {
    return (
      <ProviderLayout badges={{}} topbar={<ProviderTopbar title="Client" />}>
        <div className="flex items-center justify-center p-16">
          <Loader2 size={24} className="animate-spin text-[#0f6e56]" />
        </div>
      </ProviderLayout>
    )
  }

  if (notFound || !client) {
    return (
      <ProviderLayout badges={{}} topbar={<ProviderTopbar title="Client" />}>
        <div className="flex flex-col items-center justify-center p-16 text-center">
          <p className="text-[16px] font-medium text-[#141a14]">Client not found</p>
          <p className="mt-2 text-[13px] text-[#9ea89e]">This client may have been deleted.</p>
          <button
            onClick={() => navigate('/clients')}
            className="mt-6 flex items-center gap-2 rounded-xl bg-[#0f6e56] px-5 py-2.5 text-[13px] font-medium text-white hover:bg-[#085041] transition-colors"
          >
            <ArrowLeft size={15} />
            Back to clients
          </button>
        </div>
      </ProviderLayout>
    )
  }

  const displayName = client.display_name || client.client_name || 'Unknown'
  const email = client.email || client.client_email || '—'
  const avatar = getAvatarColor(displayName)
  const initials = getInitials(displayName)
  const tags = (client.tags || []).map(t => typeof t === 'string' ? t : t.name)
  const requests = client.requests || []
  const isDeactivated = client.is_deactivated
  const isPending = client.status === 'pending' && !isDeactivated

  // Filter requests by tab
  const REQUEST_TABS = ['all', 'open', 'received', 'in_review', 'in_progress', 'delivered', 'closed']
  const filteredRequests = requests.filter(r => {
    if (activeTab === 'all') return true
    if (activeTab === 'open') return !['delivered', 'closed'].includes(r.status)
    return r.status === activeTab
  })

  return (
    <>
      <ProviderLayout
        badges={{ clients: 0, requests: 0 }}
        topbar={
          <div className="flex h-[60px] items-center gap-3 border-b border-[#e8eae8] bg-white px-6">
            <button
              onClick={() => navigate('/clients')}
              className="flex items-center gap-1.5 text-[13px] text-[#9ea89e] hover:text-[#141a14] transition-colors"
            >
              <ArrowLeft size={15} />
              Clients
            </button>
            <span className="text-[#e8eae8]">/</span>
            <span className="text-[13px] font-medium text-[#141a14]">{displayName}</span>
          </div>
        }
      >
        <div className="grid gap-6 p-6 xl:grid-cols-[1fr_300px]">

          {/* ── LEFT ── */}
          <div className="min-w-0">

            {/* Client header card */}
            <div className="mb-6 rounded-2xl border border-[#e8eae8] bg-white p-6">
              <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                {/* Left: avatar + info */}
                <div className="flex items-start gap-4">
                  <div className={`h-14 w-14 shrink-0 rounded-2xl flex items-center justify-center text-[16px] font-semibold ${avatar.bg} ${avatar.text}`}>
                    {isPending ? <Mail size={20} className="opacity-70" /> : initials}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <h1 className="text-[20px] font-semibold text-[#141a14]">{displayName}</h1>
                      <StatusBadge client={client} />
                    </div>
                    <div className="mt-1.5 flex items-center gap-3 flex-wrap">
                      {client.business_type && (
                        <span className="text-[13px] text-[#9ea89e]">{client.business_type}</span>
                      )}
                      {client.business_type && client.joined_at && (
                        <span className="text-[#e8eae8]">·</span>
                      )}
                      {client.joined_at && (
                        <span className="text-[13px] text-[#9ea89e]">
                          Client since {formatDate(client.joined_at || client.created_at)}
                        </span>
                      )}
                    </div>
                    {tags.length > 0 && (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {tags.map(tag => <TagChip key={tag} name={tag} />)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right: stats + actions */}
                <div className="flex items-center gap-6 shrink-0">
                  <div className="text-center">
                    <p className="text-[22px] font-semibold text-[#141a14]">{client.open_request_count ?? 0}</p>
                    <p className="text-[11px] text-[#9ea89e]">Open requests</p>
                  </div>
                  <div className="h-8 w-px bg-[#e8eae8]" />
                  <div className="text-center">
                    <p className="text-[22px] font-semibold text-[#141a14]">{client.total_request_count ?? 0}</p>
                    <p className="text-[11px] text-[#9ea89e]">Total</p>
                  </div>
                  {client.last_login && (
                    <>
                      <div className="h-8 w-px bg-[#e8eae8]" />
                      <div className="text-center">
                        <p className="text-[13px] font-semibold text-[#141a14]">{timeAgo(client.last_login)}</p>
                        <p className="text-[11px] text-[#9ea89e]">Last active</p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* ── Request history ── */}
            <div>
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[15px] font-semibold text-[#141a14]">Request history</h2>
                {requests.length > 0 && (
                  <span className="text-[12px] text-[#9ea89e]">{requests.length} total</span>
                )}
              </div>

              {/* Tab filter */}
              {requests.length > 0 && (
                <div className="mb-4 flex items-center gap-1 overflow-x-auto">
                  {['all', 'open', 'in_progress', 'in_review', 'delivered', 'closed'].map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`shrink-0 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors capitalize ${
                        activeTab === tab
                          ? 'bg-[#0f6e56] text-white'
                          : 'bg-[#f0f2f0] text-[#4a544a] hover:bg-[#e8eae8]'
                      }`}
                    >
                      {tab === 'all' ? 'All' : tab.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              )}

              {isPending ? (
                <div className="rounded-2xl border border-dashed border-[#e8eae8] bg-white py-12 text-center">
                  <Mail size={24} className="mx-auto text-[#9ea89e]" />
                  <p className="mt-3 text-[14px] font-medium text-[#141a14]">Waiting for client to join</p>
                  <p className="mt-1 text-[12px] text-[#9ea89e]">Request history will appear once they accept the invite.</p>
                </div>
              ) : filteredRequests.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-[#e8eae8] bg-white py-12 text-center">
                  <Package size={24} className="mx-auto text-[#9ea89e]" />
                  <p className="mt-3 text-[14px] font-medium text-[#141a14]">No requests yet</p>
                  <p className="mt-1 text-[12px] text-[#9ea89e]">
                    {activeTab !== 'all' ? 'Try switching to "All"' : 'Requests will appear here once submitted.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredRequests.map(req => (
                    <div
                      key={req.id}
                      className="group flex items-start gap-4 rounded-2xl border border-[#e8eae8] bg-white p-5 hover:shadow-sm transition-shadow cursor-pointer"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <p className="text-[14px] font-medium text-[#141a14]">{req.title}</p>
                          <RequestStatusBadge status={req.status} />
                        </div>
                        {req.description && (
                          <p className="mt-1.5 text-[12px] text-[#9ea89e] line-clamp-2">{req.description}</p>
                        )}
                        <div className="mt-3 flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-[11px] text-[#9ea89e]">
                            <Clock size={11} />
                            {timeAgo(req.created_at)}
                          </span>
                          {req.due_date && (
                            <span className={`flex items-center gap-1 text-[11px] font-medium ${
                              new Date(req.due_date) < new Date() && !['delivered','closed'].includes(req.status)
                                ? 'text-red-500'
                                : 'text-[#9ea89e]'
                            }`}>
                              <Calendar size={11} />
                              Due {formatDate(req.due_date)}
                              {new Date(req.due_date) < new Date() && !['delivered','closed'].includes(req.status) && (
                                <span className="ml-0.5 rounded bg-red-100 px-1 text-[10px] text-red-500">Overdue</span>
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                      <ChevronRight size={16} className="mt-1 shrink-0 text-[#e8eae8] group-hover:text-[#9ea89e] transition-colors" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <div className="space-y-5">

            {/* Tags */}
            <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#141a14]">Tags</h3>
                <button
                  onClick={() => setShowEdit(true)}
                  className="text-[12px] font-medium text-[#0f6e56] hover:text-[#085041] transition-colors"
                >
                  + Add tag
                </button>
              </div>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => <TagChip key={tag} name={tag} />)}
                </div>
              ) : (
                <p className="text-[12px] text-[#9ea89e]">No tags yet.</p>
              )}
            </div>

            {/* Internal notes */}
            <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[13px] font-semibold text-[#141a14]">Internal notes</h3>
                <span className="text-[11px] text-[#9ea89e]">Only you can see these.</span>
              </div>
              <PrivateNoteEditor
                client={client}
                onSaved={(val) => setClient(c => ({ ...c, private_note: val }))}
              />
            </div>

            {/* Client info */}
            <div className="rounded-2xl border border-[#e8eae8] bg-white p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-[13px] font-semibold text-[#141a14]">Client info</h3>
                <button
                  onClick={() => setShowEdit(true)}
                  className="text-[12px] font-medium text-[#0f6e56] hover:text-[#085041] transition-colors"
                >
                  Edit
                </button>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Mail size={14} className="mt-0.5 shrink-0 text-[#9ea89e]" />
                  <div>
                    <p className="text-[11px] text-[#9ea89e]">Email</p>
                    <p className="text-[13px] text-[#0f6e56] font-medium">{email}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Building2 size={14} className="mt-0.5 shrink-0 text-[#9ea89e]" />
                  <div>
                    <p className="text-[11px] text-[#9ea89e]">Business</p>
                    <p className="text-[13px] text-[#141a14]">{client.business_type || '—'}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Calendar size={14} className="mt-0.5 shrink-0 text-[#9ea89e]" />
                  <div>
                    <p className="text-[11px] text-[#9ea89e]">Client since</p>
                    <p className="text-[13px] text-[#141a14]">{formatDate(client.joined_at || client.created_at)}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Package size={14} className="mt-0.5 shrink-0 text-[#9ea89e]" />
                  <div>
                    <p className="text-[11px] text-[#9ea89e]">Requests</p>
                    <p className="text-[13px] text-[#141a14]">
                      {client.total_request_count ?? 0} total · {client.delivered_count ?? 0} delivered
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Danger zone */}
            <div className="rounded-2xl border border-red-100 bg-white p-5">
              <h3 className="mb-1 text-[13px] font-semibold text-red-500">Danger zone</h3>
              <div className="mt-3 space-y-3">
                {!isDeactivated ? (
                  <div>
                    <button
                      onClick={handleDeactivate}
                      disabled={actionLoading || isPending}
                      className="w-full text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-[13px] font-medium text-[#141a14] group-hover:text-red-500 transition-colors">
                        Deactivate {displayName.split(' ')[0]}'s access
                      </p>
                      <p className="text-[11px] text-[#9ea89e]">Freezes their portal. All data is kept.</p>
                    </button>
                  </div>
                ) : (
                  <div>
                    <button
                      onClick={handleReactivate}
                      disabled={actionLoading}
                      className="w-full text-left group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <p className="text-[13px] font-medium text-[#0f6e56] group-hover:text-[#085041] transition-colors">
                        Reactivate {displayName.split(' ')[0]}'s access
                      </p>
                      <p className="text-[11px] text-[#9ea89e]">Restores portal access.</p>
                    </button>
                  </div>
                )}

                <div className="border-t border-red-50 pt-3">
                  <button
                    onClick={() => setShowDelete(true)}
                    className="w-full text-left group"
                  >
                    <p className="text-[13px] font-medium text-[#141a14] group-hover:text-red-500 transition-colors">
                      Delete this client
                    </p>
                    <p className="text-[11px] text-[#9ea89e]">Permanently removes all data. Cannot be undone.</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </ProviderLayout>

      {/* Modals */}
      {showEdit && (
        <EditClientModal
          client={client}
          onClose={() => setShowEdit(false)}
          onSuccess={() => { fetchClient(); showToast('Client updated.') }}
        />
      )}

      {showDelete && (
        <DeleteClientModal
          client={client}
          onClose={() => setShowDelete(false)}
          onSuccess={() => navigate('/clients')}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} />}
    </>
  )
}