import React from 'react';
import { MailOpen, Mail } from 'lucide-react';

const formatTime = (date) => {
  if (!date) return '';
  const dt = new Date(date);
  return dt.toLocaleString('id-ID', { hour: '2-digit', minute: '2-digit' });
};

export default function EmailCard({ email, onClick, isSelected }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full text-left border-4 border-black p-4 transition-all bg-white
        ${isSelected ? 'shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] translate-x-[2px] translate-y-[2px]' : 'shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]'}
        ${email.is_read ? 'opacity-80' : 'bg-yellow-50'}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {email.is_read ? <MailOpen className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
          <span className="font-bold text-sm truncate">{email.from || 'Pengirim'}</span>
        </div>
        <span className="text-xs font-mono">{formatTime(email.created_date)}</span>
      </div>
      <p className="font-black mt-2 truncate">{email.subject || '(Tanpa Subjek)'}</p>
      <p className="text-sm text-gray-600 truncate">{email.preview || email.body_text || 'Isi email...'}</p>
    </button>
  );
}
