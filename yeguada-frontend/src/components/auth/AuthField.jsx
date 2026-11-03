// components/auth/AuthField.jsx — campo con icono, y botón mostrar/ocultar en contraseñas
import React, { useState, useId } from 'react';
import Icon from '../Icon';

export default function AuthField({ label, icon, type = 'text', error, ...inputProps }) {
  const id = useId();
  const [shown, setShown] = useState(false);
  const isPassword = type === 'password';

  return (
    <div className="auth-field">
      <label htmlFor={id} className="auth-label">{label}</label>
      <div className={`auth-input-wrap${error ? ' has-error' : ''}`}>
        {icon && <Icon name={icon} size={17} className="auth-input-icon" />}
        <input
          id={id}
          className="auth-input"
          type={isPassword && shown ? 'text' : type}
          aria-invalid={!!error}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button" className="auth-eye" tabIndex={-1}
            onClick={() => setShown((s) => !s)}
            aria-label={shown ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <Icon name={shown ? 'eyeOff' : 'eye'} size={17} />
          </button>
        )}
      </div>
      {error && <p className="auth-field-error">{error}</p>}
    </div>
  );
}
