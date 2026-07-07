import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api, { WS_URL, formatApiError } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Send, Paperclip, Check, CheckCheck, X } from "lucide-react";

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
    <div className="fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-6 sm:py-8 bg-background text-foreground">
      <h1 className="font-heading text-3xl font-black text-foreground mb-6">Messages</h1>

      <div className="grid lg:grid-cols-[340px,1fr] gap-4 lg:gap-6 min-h-[70vh] lg:h-[70vh]">
        {/* Conversations list */}
        <aside className="card overflow-y-auto scroll-area max-h-72 lg:max-h-none border border-border">
          {loadingConvs ? (
            <div className="p-4 space-y-3">{[1,2,3].map(i => <div key={i} className="skeleton h-14"/>)}</div>
          ) : convs.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">No conversations yet.<br/>Open an editor profile and click <strong>Message Editor</strong>.</div>
          ) : convs.map(c => (
            <button key={c.id} onClick={()=>setActiveId(c.id)} data-testid={`conv-${c.id}`}
              className={`w-full text-left flex items-center gap-3 p-4 border-b border-border hover:bg-foreground/[0.02] transition-colors ${activeId===c.id?"bg-foreground/[0.04] border-l-2 border-purple-500":""}`}>
              <div className="w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center font-heading text-muted-foreground overflow-hidden">
                {c.other_user.avatar ? <img src={c.other_user.avatar} className="w-full h-full object-cover" alt=""/> : c.other_user.name?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-foreground truncate">{c.other_user.name || "Unknown"}</p>
                  {c.unread > 0 && <span className="ml-2 px-1.5 rounded-full bg-[#7C3AED] text-[10px] font-bold text-white">{c.unread}</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{c.last_message || "Say hi 👋"}</p>
              </div>
            </button>
          ))}
        </aside>

        {/* Chat pane */}
        <section className="card flex flex-col overflow-hidden min-h-[60vh] lg:min-h-0 border border-border">
          {!active ? (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">Select a conversation</div>
          ) : (
            <>
              <header className="p-4 border-b border-border flex items-center gap-3 bg-card">
                <div className="w-9 h-9 rounded-full bg-background border border-border overflow-hidden flex items-center justify-center font-heading text-muted-foreground">
                  {active.other_user.avatar ? <img src={active.other_user.avatar} className="w-full h-full object-cover" alt=""/> : active.other_user.name?.[0]}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-foreground truncate">{active.other_user.name}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-mono font-bold">{typingFrom ? "Typing…" : active.other_user.role}</p>
                </div>
              </header>

              <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-area p-4 space-y-3 bg-foreground/[0.015]">
                {messages.map(m => <MessageBubble key={m.id} m={m} mine={m.sender_id === user.id}/>)}
              </div>

              {attachment && (
                <div className="px-4 pt-3 flex items-center gap-2 text-sm bg-card border-t border-border">
                  {attachment.type === "image" ? (
                    <img src={attachment.b64} className="h-12 rounded border border-border" alt=""/>
                  ) : <span className="px-2 py-1 rounded bg-background border border-border text-xs text-foreground">{attachment.name}</span>}
                  <button onClick={()=>setAttachment(null)} className="text-muted-foreground hover:text-foreground"><X size={14}/></button>
                </div>
              )}

              <div className="p-3 border-t border-border bg-card flex items-end gap-2">
                <label className="cursor-pointer text-muted-foreground hover:text-foreground p-2" data-testid="chat-attach">
                  <Paperclip size={18}/>
                  <input type="file" accept="image/*,video/*,application/*" hidden onChange={(e)=>onFile(e.target.files[0])}/>
                </label>
                <textarea data-testid="chat-input" rows={1} className="input resize-none" placeholder="Type a message…"
                  value={text} onChange={e=>{ setText(e.target.value); sendTyping(); }}
                  onKeyDown={e=>{ if (e.key==="Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} />
                <button onClick={send} disabled={busy} data-testid="chat-send" className="btn-primary px-4 py-3 disabled:opacity-50 shrink-0">
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
async function getWsToken() {
  try {
    const { data } = await api.post("/auth/ws-token");
    return data.token;
  } catch { return ""; }
}

function MessageBubble({ m, mine }) {
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div className={`max-w-[86%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm break-words border ${
        mine 
          ? "bg-[#7C3AED] border-[#7C3AED] text-white rounded-tr-none shadow-[0_4px_12px_rgba(124,58,237,0.15)]" 
          : "bg-card border-border text-foreground rounded-tl-none"
      } ${m.system ? "italic opacity-90" : ""}`}>
        {m.attachment_b64 && m.attachment_type === "image" && <img src={m.attachment_b64} className="rounded-lg max-h-60 mb-2 border border-border" alt="attachment"/>}
        {m.attachment_b64 && m.attachment_type === "video" && <video src={m.attachment_b64} controls className="rounded-lg max-h-60 mb-2 border border-border"/>}
        {m.attachment_b64 && m.attachment_type === "file" && (
          <a href={m.attachment_b64} download={m.attachment_name} className="block underline mb-2 text-xs">📎 {m.attachment_name}</a>
        )}
        {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
        <div className={`text-[10px] mt-1.5 flex items-center gap-1.5 ${mine ? "text-purple-200 justify-end" : "text-muted-foreground"}`}>
          {new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
          {mine && (m.read ? <CheckCheck size={12} className="text-cyan-400 font-bold"/> : <Check size={12} className="text-purple-300"/>)}
        </div>
      </div>
    </div>
  );
}
