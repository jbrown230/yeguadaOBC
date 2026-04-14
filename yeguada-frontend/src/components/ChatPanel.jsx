// components/ChatPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, recordLocalConversation, resetBackendMetrics } from '../services/api';

const LS_KEY = 'yeguada_chat_history';

function loadHistory() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveHistory(msgs) {
  try {
    // Guardar solo los últimos 50 mensajes para no llenar localStorage
    localStorage.setItem(LS_KEY, JSON.stringify(msgs.slice(-50)));
  } catch {}
}

const localNLP = [
  { kw: ['reserv', 'apartar', 'booking', 'quiero un tour'],
    answer: 'Para reservar un tour contáctenos por WhatsApp al +507 6XXX-XXXX. Ofrecemos senderismo, cascadas y agroturismo. Reserve con 48h de anticipación. ¿Le gustaría saber más sobre algún tour?', intent: 'booking.tour' },
  { kw: ['precio', 'costo', 'cuánto', 'tarifa', 'cobr'],
    answer: '💰 Precios:\n🥾 Senderismo básico: $25/persona\n🌊 Cascadas Celestes: $35/persona\n🌿 Tour completo + almuerzo: $45/persona\n\nGrupos 8+: 15% descuento. ¿Alguna pregunta adicional?', intent: 'pricing.info' },
  { kw: ['guía', 'guia', 'guías', 'disponib'],
    answer: '🧭 Contamos con guías comunitarios certificados. Temporada alta (dic-abr): reserve con 1 semana de anticipación. Temporada baja (may-nov): mayor disponibilidad. ¿Para qué fecha lo necesita?', intent: 'guide.availability' },
  { kw: ['llegar', 'cómo llego', 'ubicación', 'dirección', 'dónde', 'donde'],
    answer: '📍 Calobre, Veraguas. Desde Ciudad de Panamá: Carretera Interamericana → El Jagüito → Calobre → La Yeguada (~260 km, 4-5h). Se recomienda 4x4.', intent: 'location.directions' },
  { kw: ['actividad', 'actividades', 'qué hacen', 'qué ofrecen', 'experiencia'],
    answer: '🌿 Ofrecemos: 🥾 Senderismo · 🌊 Cascadas Celestes · 🛶 Kayak en laguna · 🌱 Agroturismo · 🦜 Avistamiento aves (200+ sp.) · ⛺ Camping · 🎭 Talleres culturales', intent: 'general.info' },
  { kw: ['camping', 'acampar', 'carpa', 'noche', 'dormir'],
    answer: '⛺ ¡Sí! Zona natural a orillas de la Laguna y Estación ANAM con baños/duchas. Capacidad limitada — reserve con anticipación, especialmente en feriados.', intent: 'camping.info' },
  { kw: ['cascada', 'silampa', 'celeste', 'waterfall'],
    answer: '🌊 Cascadas Celestes: sendero ~45 min, incluida en tour $35.\n💧 Cascada La Silampa: ~1h45 min con guía. Ambas ideales para fotografía y baño en temporada seca.', intent: 'waterfall.info' },
  { kw: ['horario', 'hora', 'cuando', 'cuándo', 'apertura'],
    answer: '⏰ Tours salen a las 7:00-8:00 AM · Acceso reserva: 7:30 AM – 4:30 PM · Atención WhatsApp: lunes a domingo, horario de oficina.', intent: 'hours.info' },
  { kw: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'hey'],
    answer: '¡Hola! 👋 Soy el asistente de Ecoturismo La Yeguada OBC. Puedo ayudarte con información sobre tours, precios, cómo llegar y más. ¿En qué te puedo ayudar?', intent: 'greeting' },
  { kw: ['gracias', 'muchas gracias', 'adiós', 'adios', 'hasta luego', 'chao'],
    answer: '¡Con mucho gusto! 🌿 Esperamos verte pronto en La Yeguada. Para consultas adicionales, escríbenos al WhatsApp. ¡Buen día!', intent: 'farewell' },
];

function localClassify(text) {
  const t = text.toLowerCase();
  let best = null, bestLen = 0;
  localNLP.forEach(rule => {
    rule.kw.forEach(kw => {
      if (t.includes(kw) && kw.length > bestLen) { bestLen = kw.length; best = rule; }
    });
  });
  return best;
}

function now() {
  return new Date().toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' });
}

const INITIAL_MSG = {
  role: 'bot',
  text: '¡Hola! 👋 Soy el asistente virtual de Ecoturismo La Yeguada OBC. ¿En qué puedo ayudarte hoy?',
  time: now(),
  intent: null,
};

const s = {
  panel: { width: 'var(--chat-width)', background: 'var(--card)', borderLeft: '0.5px solid var(--border)', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  header: { padding: '12px 16px', borderBottom: '0.5px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
  headerLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  botAvatar: { width: 38, height: 38, borderRadius: '50%', background: 'var(--forest-pale)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, border: '1.5px solid var(--forest-light)', flexShrink: 0 },
  botName: { fontSize: 13, fontWeight: 700, color: 'var(--stone-deep)' },
  botStatus: { fontSize: 11, color: 'var(--teal-light)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 },
  statusDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--teal-light)', animation: 'pulse 2s infinite' },
  clearBtn: { fontSize: 10, color: 'var(--stone-mid)', background: 'none', border: '0.5px solid var(--border)', borderRadius: 4, padding: '3px 7px', cursor: 'pointer' },
  msgs: { flex: 1, overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: 10 },
  msg: (role) => ({
    maxWidth: '85%', padding: '9px 12px', borderRadius: 12, fontSize: 12,
    lineHeight: 1.55, whiteSpace: 'pre-wrap', animation: 'fadeUp 0.2s var(--ease)',
    ...(role === 'bot'
      ? { background: 'var(--forest-pale)', color: 'var(--stone-deep)', alignSelf: 'flex-start', borderBottomLeftRadius: 3 }
      : { background: 'var(--forest)', color: '#fff', alignSelf: 'flex-end', borderBottomRightRadius: 3 }),
  }),
  time: { fontSize: 10, color: 'var(--stone-light)', marginTop: 3 },
  intentTag: { display: 'inline-block', fontSize: 9, fontWeight: 700, padding: '1px 6px', borderRadius: 20, background: 'rgba(45,80,22,0.12)', color: 'var(--forest)', marginTop: 4, letterSpacing: '0.04em' },
  typing: { display: 'flex', alignItems: 'center', gap: 4, padding: '10px 12px', background: 'var(--forest-pale)', borderRadius: 12, borderBottomLeftRadius: 3, width: 52, alignSelf: 'flex-start' },
  typingDot: (d) => ({ width: 5, height: 5, borderRadius: '50%', background: 'var(--forest-light)', animation: `bounce 0.9s ${d}s infinite` }),
  inputRow: { padding: '10px', borderTop: '0.5px solid var(--border)', display: 'flex', gap: 6, alignItems: 'flex-end' },
  textarea: { flex: 1, border: '0.5px solid var(--border)', borderRadius: 'var(--r-sm)', padding: '8px 10px', fontSize: 12, fontFamily: 'var(--font-sans)', resize: 'none', outline: 'none', background: 'var(--bg)', color: 'var(--stone-deep)', maxHeight: 80, lineHeight: 1.4 },
  sendBtn: { width: 32, height: 32, background: 'var(--forest)', color: '#fff', border: 'none', borderRadius: 'var(--r-sm)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0, transition: 'background 0.15s' },
};

const ChatPanel = React.memo(function ChatPanel({ backendOnline }) {
  // Inicializar desde localStorage — persiste al recargar
  const [messages, setMessages] = useState(() => loadHistory() || [INITIAL_MSG]);
  const [input, setInput]   = useState('');
  const [typing, setTyping] = useState(false);
  const msgsRef   = useRef(null);
  const taRef     = useRef(null);
  const onlineRef   = useRef(backendOnline);
  const clearingRef = useRef(false); // evita que saveHistory se dispare durante el clear
  useEffect(() => { onlineRef.current = backendOnline; }, [backendOnline]);

  // Persistir cada vez que cambian los mensajes (salvo durante un clear)
  useEffect(() => {
    if (clearingRef.current) { clearingRef.current = false; return; }
    saveHistory(messages);
  }, [messages]);

  useEffect(() => {
    if (msgsRef.current) msgsRef.current.scrollTop = msgsRef.current.scrollHeight;
  }, [messages, typing]);

  function clearHistory() {
    // Marcar que el próximo disparo de saveHistory debe ignorarse
    clearingRef.current = true;

    // Borrar TODO el localStorage de La Yeguada
    [
      'yeguada_chat_history',
      'yeguada_conversations',
      'yeguada_intent_counts',
      'yeguada_stats',
      'yeguada_metrics_cache',
    ].forEach(key => localStorage.removeItem(key));

    // Resetear el chat — el useEffect de saveHistory verá clearingRef=true y no reescribirá
    setMessages([INITIAL_MSG]);

    // Resetear métricas del backend (si está online) y notificar al dashboard
    resetBackendMetrics();
    window.dispatchEvent(new CustomEvent('yeguada:metrics:updated'));
  }

  async function send() {
    const text = input.trim();
    if (!text || typing) return;

    setInput('');
    if (taRef.current) taRef.current.style.height = 'auto';
    setMessages(prev => [...prev, { role: 'user', text, time: now(), intent: null }]);
    setTyping(true);

    try {
      let botMsg;
      if (onlineRef.current) {
        const res = await sendMessage(text);
        botMsg = {
          role: 'bot',
          text: (res.answer || 'No pude procesar esa consulta.') + (res.escalated ? '\n\n⚠️ Escalado a operador humano.' : ''),
          time: now(), intent: res.intent, score: res.score, resolved: res.resolved,
        };
      } else {
        await new Promise(r => setTimeout(r, 80));
        const t0 = Date.now();
        const match = localClassify(text);
        const resolved = !!match;
        botMsg = match
          ? { role: 'bot', text: match.answer, time: now(), intent: match.intent, score: 0.92, resolved: true }
          : { role: 'bot', text: '🔄 Esta consulta requiere atención personalizada. También puedes escribirnos al WhatsApp +507 6XXX-XXXX.', time: now(), intent: 'unknown', resolved: false };
        // Acumular métricas localmente — el dashboard las leerá en el próximo poll
        recordLocalConversation({
          sessionId: 'admin-preview',
          message: text,
          intent: botMsg.intent,
          score: botMsg.score || 0,
          resolved,
          responseTimeMs: Date.now() - t0,
        });
      }
      setTyping(false);
      setMessages(prev => [...prev, botMsg]);
    } catch {
      setTyping(false);
      setMessages(prev => [...prev, { role: 'bot', text: 'Error al conectar con el backend. Verifica que el servidor esté corriendo en puerto 3001.', time: now() }]);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  }

  function handleInput(e) {
    setInput(e.target.value);
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 80) + 'px';
  }

  return (
    <aside style={s.panel}>
      <div style={s.header}>
        <div style={s.headerLeft}>
          <div style={s.botAvatar}>🤖</div>
          <div>
            <div style={s.botName}>La Yeguada Bot</div>
            <div style={s.botStatus}>
              <div style={s.statusDot} />
              {backendOnline ? 'node-nlp · En línea' : 'Demo local · En línea'}
            </div>
          </div>
        </div>
        <button style={s.clearBtn} onClick={clearHistory} title="Limpiar historial">Limpiar</button>
      </div>

      <div style={s.msgs} ref={msgsRef}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'bot' ? 'flex-start' : 'flex-end' }}>
            <div style={s.msg(m.role)}>{m.text}</div>
            <div style={s.time}>{m.time}</div>
            {m.intent && m.intent !== 'unknown' && (
              <div style={s.intentTag}>🎯 {m.intent}</div>
            )}
          </div>
        ))}
        {typing && (
          <div style={s.typing}>
            <div style={s.typingDot(0)} />
            <div style={s.typingDot(0.15)} />
            <div style={s.typingDot(0.3)} />
          </div>
        )}
      </div>

      <div style={s.inputRow}>
        <textarea
          ref={taRef}
          style={s.textarea}
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder="Escribe tu consulta..."
        />
        <button style={s.sendBtn} onClick={send}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--forest-mid)'}
          onMouseLeave={e => e.currentTarget.style.background = 'var(--forest)'}
        >➤</button>
      </div>
    </aside>
  );
});

export default ChatPanel;