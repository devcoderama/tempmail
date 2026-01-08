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

const decodeHtmlEntities = (value) => {
  if (!value) return '';
  return value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
};

const decodeQuotedPrintableText = (value) => {
  if (!value) return '';
  const softBreaksRemoved = value.replace(/=\r?\n/g, '');
  return softBreaksRemoved.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );
};

const cleanupMojibake = (value) => {
  if (!value) return '';
  return value
    .replace(/\u00c2/g, '')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .trim();
};

const cleanMimeNoise = (value) => {
  if (!value) return '';
  return value
    .replace(/^--[-_A-Za-z0-9]+.*$/gm, '')
    .replace(/^Content-Type:.*$/gim, '')
    .replace(/^Content-Transfer-Encoding:.*$/gim, '')
    .replace(/\r?\n{3,}/g, '\n\n')
    .trim();
};

const extractFromRawMime = (value) => {
  if (!value) return '';
  if (!/content-type:/i.test(value)) return value;
  const boundaryMatch = value.match(/boundary="?([^";]+)"?/i);
  if (!boundaryMatch) {
    const parts = value.split(/\r?\n\r?\n/);
    return parts.length > 1 ? parts.slice(1).join('\n\n').trim() : value;
  }
  const boundary = boundaryMatch[1];
  const parts = value.split(`--${boundary}`);
  for (const part of parts) {
    if (/content-type:\s*text\/plain/i.test(part)) {
      const body = part.split(/\r?\n\r?\n/).slice(1).join('\n\n').trim();
      if (body) return body;
    }
    if (/content-type:\s*text\/html/i.test(part)) {
      const body = part.split(/\r?\n\r?\n/).slice(1).join('\n\n').trim();
      if (body) return body;
    }
  }
  return value;
};

const stripQuotedText = (value) => {
  if (!value) return '';
  const lines = value.split(/\r?\n/);
  const cleaned = [];
  for (const line of lines) {
    if (/^On .*wrote:$/i.test(line.trim())) break;
    cleaned.push(line);
  }
  return cleaned.join('\n').trim();
};

const stripQuotedHtml = (value) => {
  if (!value) return '';
  const quoteIndex = value.search(/<div class="gmail_quote"|<blockquote/i);
  if (quoteIndex === -1) return value;
  return value.slice(0, quoteIndex).trim();
};

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
        {(() => {
          const rawText = cleanMimeNoise(extractFromRawMime(email.body_text || ''));
          const decodedText = cleanupMojibake(
            decodeHtmlEntities(decodeQuotedPrintableText(rawText))
          );
          const htmlSource = email.body_html || (looksLikeHtml(decodedText) ? decodedText : '');

          if (htmlSource) {
            return (
              <div
                className="prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: stripQuotedHtml(htmlSource) }}
              />
            );
          }

          return (
            <p className="whitespace-pre-wrap font-mono text-sm">
              {stripQuotedText(rawText) || 'Tidak ada konten.'}
            </p>
          );
        })()}
      </div>
    </div>
  );
}
