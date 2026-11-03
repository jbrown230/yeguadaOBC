// components/auth/PasswordStrength.jsx — checklist en vivo (misma política que el backend)
import React from 'react';
import Icon from '../Icon';

export function passwordChecks(pw) {
  return [
    { ok: pw.length >= 10, label: '10+ caracteres' },
    { ok: /[A-Za-z]/.test(pw), label: 'Letras' },
    { ok: /\d/.test(pw), label: 'Números' },
  ];
}
export const passwordValid = (pw) => passwordChecks(pw).every((c) => c.ok);

export default function PasswordStrength({ value }) {
  if (!value) return null;
  const checks = passwordChecks(value);
  const score = checks.filter((c) => c.ok).length + (value.length >= 14 ? 1 : 0);
  return (
    <div className="pw-meter" aria-live="polite">
      <div className="pw-bars" data-score={score}>
        {[0, 1, 2, 3].map((i) => <span key={i} className={i < score ? 'on' : ''} />)}
      </div>
      <ul className="pw-checks">
        {checks.map((c) => (
          <li key={c.label} className={c.ok ? 'ok' : ''}>
            <Icon name="check" size={12} strokeWidth={2.5} />{c.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
