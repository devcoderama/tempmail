import React from 'react';
import { Trash2, ArrowLeft } from 'lucide-react';

const formatDate = (date) => {
  if (!date) return '';
  return new Date(date).toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const looksLikeHtml = (value) => /<\/?[a-z][\s\S]*>/i.test(value || '');

export default function EmailViewer({ email, onBack, onDelete }) {
  if (!email) {
    return (
      <div className="bg-white border-4 border-black p-8 h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
        <p className="font-bold">Pilih email untuk melihat isi.</p>
      </div>
    );
  }

  return (
    <div className="bg-white border-4 border-black p-6 h-full shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <div className="flex items-start justify-between gap-3 mb-4">
        <button
          onClick={onBack}
          className="lg:hidden px-3 py-2 border-3 border-black bg-cyan-200 font-bold flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali
        </button>
        <button
          onClick={() => onDelete(email.id)}
          className="px-3 py-2 border-3 border-black bg-pink-300 font-bold flex items-center gap-2"
        >
          <Trash2 className="w-4 h-4" />
          Hapus
        </button>
      </div>
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-600">Dari</p>
        <p className="font-mono font-black">{email.from || 'Pengirim'}</p>
      </div>
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-600">Subjek</p>
        <p className="font-black text-lg">{email.subject || '(Tanpa Subjek)'}</p>
      </div>
      <div className="mb-4">
        <p className="text-sm font-bold text-gray-600">Waktu</p>
        <p className="font-mono">{formatDate(email.created_date)}</p>
      </div>
      <div className="border-3 border-black p-4 bg-yellow-50">
        {email.body_html || looksLikeHtml(email.body_text) ? (
          <div
            className="prose prose-sm max-w-none"
            dangerouslySetInnerHTML={{ __html: email.body_html || email.body_text || '' }}
          />
        ) : (
          <p className="whitespace-pre-wrap font-mono text-sm">
            {email.body_text || 'Tidak ada konten.'}
          </p>
        )}
      </div>
    </div>
  );
}
