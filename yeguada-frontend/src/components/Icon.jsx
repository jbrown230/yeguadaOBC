// components/Icon.jsx — authored single-stroke icon set (no external icon library)
import React from 'react';

const paths = {
  menu: <><line x1="3.5" y1="6" x2="20.5" y2="6" /><line x1="3.5" y1="12" x2="20.5" y2="12" /><line x1="3.5" y1="18" x2="20.5" y2="18" /></>,
  close: <><line x1="6" y1="6" x2="18" y2="18" /><line x1="18" y1="6" x2="6" y2="18" /></>,
  bell: <><path d="M6 10a6 6 0 0 1 12 0c0 4 1.5 5.5 2 6.5H4c.5-1 2-2.5 2-6.5Z" /><path d="M10 19.5a2 2 0 0 0 4 0" /></>,
  search: <><circle cx="10.5" cy="10.5" r="6.5" /><line x1="20" y1="20" x2="15.3" y2="15.3" /></>,
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  send: <path d="M4 12 20 4 13 20l-2.2-7L4 12Z" />,
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="3.5" width="7" height="7" rx="1.5" /><rect x="3.5" y="13.5" width="7" height="7" rx="1.5" /><rect x="13.5" y="13.5" width="7" height="7" rx="1.5" /></>,
  target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="4" /><circle cx="12" cy="12" r="0.6" fill="currentColor" /></>,
  book: <><path d="M4 5.5C4 4.7 4.7 4 5.5 4H12v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" /><path d="M20 5.5c0-.8-.7-1.5-1.5-1.5H12v16h6.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" /></>,
  activity: <polyline points="3 12 8 12 10.5 5 14 19 16.5 12 21 12" />,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 13.5a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.9 2.9l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.9-2.9l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1h-.2a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.6-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.9-2.9l.1.1a1.7 1.7 0 0 0 1.9.3h.1a1.7 1.7 0 0 0 1-1.6v-.2a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.9 2.9l-.1.1a1.7 1.7 0 0 0-.3 1.9v.1a1.7 1.7 0 0 0 1.6 1h.2a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.6 1Z" /></>,
  chat: <path d="M4 5.5A1.5 1.5 0 0 1 5.5 4h13A1.5 1.5 0 0 1 20 5.5v9A1.5 1.5 0 0 1 18.5 16H10l-4.5 4v-4h-.02A1.5 1.5 0 0 1 4 14.5v-9Z" />,
  plus: <><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></>,
  trash: <><path d="M5 7h14" /><path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /><path d="M7 7l1 12.5A1.5 1.5 0 0 0 9.5 21h5a1.5 1.5 0 0 0 1.5-1.5L17 7" /></>,
  edit: <><path d="M14.5 4.5l5 5L8 21H3v-5L14.5 4.5Z" /></>,
  clock: <><circle cx="12" cy="12" r="8.5" /><polyline points="12 7.5 12 12 15.5 14" /></>,
  chevronRight: <polyline points="9 6 15 12 9 18" />,
  users: <><circle cx="9" cy="8.5" r="3" /><path d="M2.8 19c.6-3 3-5 6.2-5s5.6 2 6.2 5" /><path d="M16 5.3c1.5.4 2.6 1.7 2.6 3.3 0 1.6-1.1 2.9-2.6 3.3" /><path d="M18.8 19c-.4-2-1.5-3.6-3.1-4.5" /></>,
};

export default function Icon({ name, size = 18, strokeWidth = 1.75, className, style }) {
  const content = paths[name];
  if (!content) return null;
  return (
    <svg
      width={size} height={size} viewBox="0 0 24 24"
      fill="none" stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      className={className} style={style}
      aria-hidden="true"
    >
      {content}
    </svg>
  );
}
