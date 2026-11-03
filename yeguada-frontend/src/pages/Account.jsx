// pages/Account.jsx — Mi cuenta: perfil, apariencia y seguridad (se abre desde el menú del perfil)
import React, { useState } from 'react';
import Icon from '../components/Icon';
import ChangePasswordCard from '../components/ChangePasswordCard';
import { SettingsLayout, Group, Row } from '../components/Settings';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { roleLabel } from '../utils/roles';

const TABS = [
  { id: 'profile', label: 'Perfil' },
  { id: 'appearance', label: 'Apariencia' },
  { id: 'security', label: 'Seguridad' },
];
const THEMES = [
  { id: 'system', label: 'Sistema', icon: 'desktop' },
  { id: 'light', label: 'Claro', icon: 'sun' },
  { id: 'dark', label: 'Oscuro', icon: 'moon' },
];
const initials = (name = '') => name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || '?';

export default function Account() {
  const { user, signOut } = useAuth();
  const { pref, setPref } = useTheme();
  const [tab, setTab] = useState('profile');

  return (
    <SettingsLayout title="Mi cuenta" subtitle={user.email} tabs={TABS} active={tab} onChange={setTab}>
      {tab === 'profile' && (
        <>
          <div className="profile-hero">
            <div className="profile-avatar">{initials(user.name)}</div>
            <div>
              <div className="profile-name">{user.name}</div>
              <div className="profile-mail">{user.email}</div>
            </div>
            <span className="tag tag-accent" style={{ marginLeft: 'auto' }}>{roleLabel(user.role)}</span>
          </div>
          <Group>
            <Row label="Rol">{roleLabel(user.role)}</Row>
            <Row label="Correo">{user.email}</Row>
          </Group>
          <Group>
            <Row label="Cerrar sesión" desc="Salir de este dispositivo.">
              <button className="btn btn-danger-ghost btn-sm" onClick={signOut}><Icon name="logout" size={15} /> Cerrar sesión</button>
            </Row>
          </Group>
        </>
      )}

      {tab === 'appearance' && (
        <Group title="Tema" note="“Sistema” sigue el modo claro u oscuro de tu dispositivo.">
          <div className="theme-options" role="radiogroup" aria-label="Tema">
            {THEMES.map((t) => (
              <button
                key={t.id} role="radio" aria-checked={pref === t.id}
                className={`theme-option${pref === t.id ? ' active' : ''}`}
                onClick={() => setPref(t.id)}
              >
                <span className={`theme-preview ${t.id}`} aria-hidden="true"><Icon name={t.icon} size={20} /></span>
                <span>{t.label}</span>
              </button>
            ))}
          </div>
        </Group>
      )}

      {tab === 'security' && (
        <Group title="Contraseña" note="Al cambiarla se cierran tus otras sesiones abiertas y recibirás un aviso por correo.">
          <div className="settings-form"><ChangePasswordCard /></div>
        </Group>
      )}
    </SettingsLayout>
  );
}
