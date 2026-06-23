import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { WS_URL, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Send, Paperclip, Image as ImageIcon, Check, CheckCheck, X } from "lucide-react";

export default function Messages() {
  const { user } = useAuth();
  const [sp, setSp] = useSearchParams();
  const [convs, setConvs] = useState([]); const [loadingConvs, setLoadingConvs] = useState(true);
  const [activeId, setActiveId] = useState(sp.get("c") || null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [attachment, setAttachment] = useState(null);   // { b64, type, name }
  const [typingFrom, setTypingFrom] = useState(null);
  const [busy, setBusy] = useState(false);
  const wsRef = useRef(null);
  const scrollRef = useRef(null);

  const loadConvs = async () => {
    setLoadingConvs(true);
    const { data } = await api.get("/conversations");
    setConvs(data);
    if (!activeId && data.length) setActiveId(data[0].id);
    setLoadingConvs(false);
  };

  const loadMessages = async (id) => {
    if (!id) return;
    const { data } = await api.get(`/conversations/${id}/messages`);
    setMessages(data);
    setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 50);
  };

  useEffect(() => { loadConvs(); /* eslint-disable-next-line */ }, []);
  useEffect(() => { if (activeId) { loadMessages(activeId); setSp({ c: activeId }, { replace: true }); } /* eslint-disable-next-line */ }, [activeId]);

  // WebSocket connect
  useEffect(() => {
    if (!user) return;
    const setupWs = async () => {
      // Issue a one-off token via refresh (cookie-based session is httpOnly, so we use a short access token endpoint)
      // For simplicity, we expose a token via /auth/ws-token route... but we don't have one.
      // Instead, use a session: encode the user id+role from the cookie via /auth/me (already loaded).
      // We'll use a server-side approach: WS verifies any access_token query.
      // Fetch a token by calling /auth/refresh (returns httpOnly), then we can't read it.
      // SOLUTION: WS accepts cookies on same origin; pass through standard WS upgrade.
      const ws = new WebSocket(`${WS_URL}?token=${encodeURIComponent(await getWsToken())}`);
      ws.onopen = () => { /* connected */ };
      ws.onmessage = (ev) => {
        try {
          const msg = JSON.parse(ev.data);
          if (msg.event === "message") {
            if (msg.data.conversation_id === activeId) {
              setMessages(m => [...m, msg.data]);
              setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" }), 30);
            }
            loadConvs(); // refresh sidebar
          } else if (msg.event === "typing") {
            if (msg.data.conversation_id === activeId && msg.data.user_id !== user.id) {
              setTypingFrom(msg.data.user_id);
              setTimeout(() => setTypingFrom(null), 2000);
            }
          }
        } catch {}
      };
      ws.onclose = () => { wsRef.current = null; };
      wsRef.current = ws;
    };
    setupWs();
    return () => { try { wsRef.current?.close(); } catch {} };
    // eslint-disable-next-line
  }, [user, activeId]);

  const sendTyping = () => {
    if (wsRef.current?.readyState === 1 && activeId) {
      wsRef.current.send(JSON.stringify({ event: "typing", conversation_id: activeId }));
    }
  };

  const onFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { alert("File too large (max 5MB for base64)"); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const b64 = reader.result;
      const t = file.type.startsWith("image/") ? "image" : file.type.startsWith("video/") ? "video" : "file";
      setAttachment({ b64, type: t, name: file.name });
    };
    reader.readAsDataURL(file);
  };

  const send = async () => {
    if (!text.trim() && !attachment) return;
    setBusy(true);
    try {
      await api.post("/messages", {
        conversation_id: activeId, text: text.trim(),
        attachment_b64: attachment?.b64, attachment_type: attachment?.type, attachment_name: attachment?.name,
      });
      setText(""); setAttachment(null);
    } catch (e) { alert(formatApiError(e)); }
    finally { setBusy(false); }
  };

  const active = convs.find(c => c.id === activeId);

  return (
    <div className="fade-in max-w-7xl mx-auto px-6 lg:px-10 py-8">
      <h1 className="font-heading text-3xl font-bold text-gray-900 mb-6">Messages</h1>

      <div className="grid lg:grid-cols-[340px,1fr] gap-6 h-[70vh]">
        {/* Conversations list */}
        <aside className="card overflow-y-auto scroll-area">
          {loadingConvs ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14"/>)}</div>
          ) : convs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">No conversations yet.<br/>Open an editor profile and click <strong>Message Editor</strong>.</div>
          ) : convs.map(c => (
            <button key={c.id} onClick={()=>setActiveId(c.id)} data-testid={`conv-${c.id}`}
              className={`w-full text-left flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 ${activeId===c.id?"bg-gray-50":""}`}>
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center font-heading text-gray-500 overflow-hidden">
                {c.other_user.avatar ? <img src={c.other_user.avatar} className="w-full h-full object-cover" alt=""/> : c.other_user.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-gray-900 truncate">{c.other_user.name || "Unknown"}</p>
                  {c.unread > 0 && <span className="ml-2 px-1.5 rounded-full bg-neon-grad text-[10px] font-bold text-ink">{c.unread}</span>}
                </div>
                <p className="text-xs text-gray-500 truncate">{c.last_message || "Say hi 👋"}</p>
              </div>
            </button>
          ))}
        </aside>

        {/* Chat pane */}
        <section className="card flex flex-col overflow-hidden">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-gray-400">Select a conversation</div>
          ) : (
            <>
              <header className="p-4 border-b border-gray-200 flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center font-heading text-gray-500">
                  {active.other_user.avatar ? <img src={active.other_user.avatar} className="w-full h-full object-cover" alt=""/> : active.other_user.name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{active.other_user.name}</p>
                  <p className="text-xs text-gray-500">{typingFrom ? "Typing…" : active.other_user.role}</p>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-area p-4 space-y-3 bg-gray-50">
                {messages.map(m => <MessageBubble key={m.id} m={m} mine={m.sender_id === user.id}/>)}
              </div>

              {attachment && (
                <div className="px-4 pt-3 flex items-center gap-2 text-sm">
                  {attachment.type === "image" ? (
                    <img src={attachment.b64} className="h-12 rounded" alt=""/>
                  ) : <span className="px-2 py-1 rounded bg-gray-100">{attachment.name}</span>}
                  <button onClick={()=>setAttachment(null)} className="text-gray-500 hover:text-gray-900"><X size={14}/></button>
                </div>
              )}

              <div className="p-3 border-t border-gray-200 flex items-end gap-2">
                <label className="cursor-pointer text-gray-500 hover:text-gray-900 p-2" data-testid="chat-attach">
                  <Paperclip size={18}/>
                  <input type="file" accept="image/*,video/*,application/*" hidden onChange={(e)=>onFile(e.target.files[0])}/>
                </label>
                <textarea data-testid="chat-input" rows={1} className="input resize-none" placeholder="Type a message…"
                  value={text} onChange={e=>{ setText(e.target.value); sendTyping(); }}
                  onKeyDown={e=>{ if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <button onClick={send} disabled={busy} data-testid="chat-send" className="btn-primary px-4 py-3 disabled:opacity-50">
                  <Send size={16}/>
                </button>
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}

// Helper: fetch a short-lived WS token from /auth/me-based ephemeral endpoint.
// To avoid adding a new backend endpoint, we'll use the access_token cookie via a tiny helper:
// We expose a temporary token via document.cookie? No — httpOnly. So we add a backend endpoint
// /auth/ws-token to issue a fresh short-lived token. Implement via API call.
async function getWsToken() {
  try {
    const { data } = await api.post("/auth/ws-token");
    return data.token;
  } catch { return ""; }
}

function MessageBubble({ m, mine }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm ${mine ? "bg-ink text-white" : "bg-white border border-gray-200 text-gray-900"} ${m.system ? "italic opacity-90" : ""}`}>
        {m.attachment_b64 && m.attachment_type === "image" && <img src={m.attachment_b64} className="rounded-lg max-h-60 mb-2" alt="attachment"/>}
        {m.attachment_b64 && m.attachment_type === "video" && <video src={m.attachment_b64} controls className="rounded-lg max-h-60 mb-2"/>}
        {m.attachment_b64 && m.attachment_type === "file" && (
          <a href={m.attachment_b64} download={m.attachment_name} className="block underline mb-2 text-xs">📎 {m.attachment_name}</a>
        )}
        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
        <div className={`text-[10px] mt-1 flex items-center gap-1 ${mine ? "text-gray-300 justify-end" : "text-gray-400"}`}>
          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {mine && (m.read ? <CheckCheck size={12} className="text-[#39FF14]"/> : <Check size={12}/>)}
        </div>
      </div>
    </div>
  );
}
