// components/EmojiText.jsx
// Muestra texto reemplazando CUALQUIER emoji por su imagen 3D (Microsoft Fluent Emoji, licencia MIT,
// servida por el paquete npm @lobehub/fluent-emoji-3d vía jsDelivr, indexada por código Unicode).
// Así se ven igual en todos los sistemas, sin el estilo plano de Windows, incluidos los que se
// agreguen en el futuro. Si la imagen no carga (sin internet, bloqueo), se muestra el emoji nativo.
import React, { useState } from 'react';

const CDN = 'https://cdn.jsdelivr.net/npm/@lobehub/fluent-emoji-3d@1.1.0/assets/';

const EMOJI_RE = new RegExp(
  '\\p{Regional_Indicator}{2}|' +                                                    // banderas
  '\\p{Extended_Pictographic}\\p{Emoji_Modifier}?' +                                 // base (+ tono de piel)
  '(?:\\uFE0F|\\u200D\\p{Extended_Pictographic}\\p{Emoji_Modifier}?\\uFE0F?)*\\uFE0F?', // combinaciones ZWJ
  'gu',
);

const hex = (cp) => cp.toString(16);
// Archivos del CDN: con selector de variación (1f327-fe0f) o sin él (1f44b), según el emoji.
function candidates(emoji) {
  const cps = [...emoji].map((c) => c.codePointAt(0));
  const full = cps.map(hex).join('-');
  const bare = cps.filter((c) => c !== 0xfe0f).map(hex).join('-');
  return full === bare ? [full] : [full, bare];
}

function Emoji({ char }) {
  const [attempt, setAttempt] = useState(0);
  const options = candidates(char);
  if (attempt >= options.length) return char; // sin imagen: emoji nativo
  return (
    <img
      className="emoji-inline" src={`${CDN}${options[attempt]}.webp`} alt={char}
      draggable="false" loading="lazy" decoding="async"
      onError={() => setAttempt((a) => a + 1)}
    />
  );
}

export const hasEmoji = (text) => { EMOJI_RE.lastIndex = 0; return EMOJI_RE.test(text || ''); };

export default function EmojiText({ text }) {
  if (!text) return null;
  const out = [];
  let last = 0;
  let m;
  EMOJI_RE.lastIndex = 0;
  while ((m = EMOJI_RE.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    out.push(<Emoji key={m.index} char={m[0]} />);
    last = m.index + m[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}
