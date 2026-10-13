// components/ChatPanel.jsx
import React, { useState, useRef, useEffect } from 'react';
import { sendMessage, recordLocalConversation, resetBackendMetrics } from '../services/api';
import Icon from './Icon';

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
    answer: 'Precios:\n· Senderismo básico: $25/persona\n· Cascadas Celestes: $35/persona\n· Tour completo + almuerzo: $45/persona\n\nGrupos 8+: 15% descuento. ¿Alguna pregunta adicional?', intent: 'pricing.info' },
  { kw: ['guía', 'guia', 'guías', 'disponib'],
    answer: 'Contamos con guías comunitarios certificados. Temporada alta (dic-abr): reserve con 1 semana de anticipación. Temporada baja (may-nov): mayor disponibilidad. ¿Para qué fecha lo necesita?', intent: 'guide.availability' },
  { kw: ['llegar', 'cómo llego', 'ubicación', 'dirección', 'dónde', 'donde'],
    answer: 'Calobre, Veraguas. Desde Ciudad de Panamá: Carretera Interamericana → El Jagüito → Calobre → La Yeguada (~260 km, 4-5h). Se recomienda 4x4.', intent: 'location.directions' },
  { kw: ['actividad', 'actividades', 'qué hacen', 'qué ofrecen', 'experiencia'],
    answer: 'Ofrecemos: senderismo · Cascadas Celestes · kayak en laguna · agroturismo · avistamiento de aves (200+ sp.) · camping · talleres culturales.', intent: 'general.info' },
  { kw: ['camping', 'acampar', 'carpa', 'noche', 'dormir'],
    answer: 'Sí, contamos con zona de camping a orillas de la Laguna y Estación ANAM con baños y duchas. Capacidad limitada — reserve con anticipación, especialmente en feriados.', intent: 'camping.info' },
  { kw: ['cascada', 'silampa', 'celeste', 'waterfall'],
    answer: 'Cascadas Celestes: sendero ~45 min, incluida en tour $35.\nCascada La Silampa: ~1h45 min con guía. Ambas ideales para fotografía y baño en temporada seca.', intent: 'waterfall.info' },
  { kw: ['horario', 'hora', 'cuando', 'cuándo', 'apertura'],
    answer: 'Tours salen a las 7:00-8:00 AM · Acceso reserva: 7:30 AM – 4:30 PM · Atención WhatsApp: lunes a domingo, horario de oficina.', intent: 'hours.info' },
  { kw: ['hola', 'buenas', 'buenos días', 'buenas tardes', 'hey'],
    answer: '¡Hola! Soy el asistente de Ecoturismo La Yeguada OBC. Puedo ayudarte con información sobre tours, precios, cómo llegar y más. ¿En qué te puedo ayudar?', intent: 'greeting' },
  { kw: ['gracias', 'muchas gracias', 'adiós', 'adios', 'hasta luego', 'chao'],
    answer: '¡Con mucho gusto! Esperamos verte pronto en La Yeguada. Para consultas adicionales, escríbenos al WhatsApp. ¡Buen día!', intent: 'farewell' },
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
  text: '¡Hola! Soy el asistente virtual de Ecoturismo La Yeguada OBC. ¿En qué puedo ayudarte hoy?',
  time: now(),
  intent: null,
};

const ChatPanel = React.memo(function ChatPanel({ backendOnline, isOpen, onClose }) {
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

  async function clearHistory() {
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

    // Esperar el reset del backend ANTES de notificar al dashboard — si no,
    // useMetrics/Dashboard/Escalations refrescan antes de que el DELETE
    // termine y muestran por un momento los datos de antes de limpiar.
    await resetBackendMetrics();
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
          text: (res.answer || 'No pude procesar esa consulta.') + (res.escalated ? '\n\nEscalado a operador humano.' : ''),
          time: now(), intent: res.intent, score: res.score, resolved: res.resolved,
        };
      } else {
        await new Promise(r => setTimeout(r, 80));
        const t0 = Date.now();
        const match = localClassify(text);
        const resolved = !!match;
        botMsg = match
          ? { role: 'bot', text: match.answer, time: now(), intent: match.intent, score: 0.92, resolved: true }
          : { role: 'bot', text: 'Esta consulta requiere atención personalizada. También puedes escribirnos al WhatsApp +507 6XXX-XXXX.', time: now(), intent: 'unknown', resolved: false };
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
    e.target.style.height = Math.min(e.target.scrollHeight, 84) + 'px';
  }

  return (
    <aside className={`chat-root${isOpen ? ' open' : ''}`}>
      <div className="chat-close-row">
        <button className="icon-btn" onClick={onClose} aria-label="Cerrar chat">
          <Icon name="close" size={16} />
        </button>
      </div>
      <div className="chat-header">
        <div className="chat-header-left">
          <div className="chat-avatar">LY</div>
          <div>
            <div className="chat-bot-name">La Yeguada Bot</div>
            <div className="chat-bot-status">
              <span className="status-dot on" />
              {backendOnline ? 'node-nlp · En línea' : 'Demo local · En línea'}
            </div>
          </div>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={clearHistory} title="Limpiar historial">Limpiar</button>
      </div>

      <div className="chat-msgs" ref={msgsRef}>
        {messages.map((m, i) => (
          <div key={i} className={`chat-msg-row ${m.role}`}>
            <div className={`chat-bubble ${m.role}`}>{m.text}</div>
            <div className="chat-time">{m.time}</div>
            {m.intent && m.intent !== 'unknown' && (
              <span className="tag tag-accent tag-mono chat-intent-tag">{m.intent}</span>
            )}
          </div>
        ))}
        {typing && (
          <div className="chat-typing">
            <span /><span /><span />
          </div>
        )}
      </div>

      <div className="chat-input-row">
        <textarea
          ref={taRef}
          className="chat-textarea"
          rows={1}
          value={input}
          onChange={handleInput}
          onKeyDown={handleKey}
          placeholder="Escribe tu consulta..."
        />
        <button className="chat-send-btn" onClick={send} disabled={!input.trim()} aria-label="Enviar mensaje">
          <Icon name="send" size={15} />
        </button>
      </div>
    </aside>
  );
});

export default ChatPanel;
