import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Copy, Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function TokenModal({ isOpen, onClose, token, email }) {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const tokenLink = `${window.location.origin}/inbox?token=${encodeURIComponent(token)}`;

  const copyToken = () => {
    navigator.clipboard.writeText(token);
    setCopied(true);
    toast.success('Token disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const copyLink = () => {
    navigator.clipboard.writeText(tokenLink);
    setCopiedLink(true);
    toast.success('Link disalin!');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white border-4 border-black max-w-lg w-full p-4 sm:p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] max-h-[85vh] overflow-y-auto"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-black">TOKEN AKSES</h3>
            <p className="text-sm font-medium">Simpan token ini untuk login kembali.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 border-3 border-black bg-pink-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-yellow-100 border-4 border-black p-4 mb-4">
          <p className="text-sm font-bold text-gray-600 mb-1">Email</p>
          <p className="font-mono font-black text-lg break-all">{email}</p>
        </div>

        <div className="bg-lime-200 border-4 border-black p-4">
          <p className="text-sm font-bold text-gray-600 mb-2">Token Akses</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono font-black text-base sm:text-xl tracking-widest break-all">
              {token}
            </p>
            <button
              onClick={copyToken}
              className="w-full sm:w-auto px-4 py-2 bg-cyan-300 border-3 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {copied ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  TERSALIN
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  COPY TOKEN
                </span>
              )}
            </button>
          </div>
        </div>

        <div className="mt-4 bg-cyan-100 border-4 border-black p-4">
          <p className="text-sm font-bold text-gray-600 mb-1">Link Login Instan</p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-mono text-xs sm:text-sm break-all">{tokenLink}</p>
            <button
              onClick={copyLink}
              className="w-full sm:w-auto px-4 py-2 bg-lime-300 border-3 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                         hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {copiedLink ? (
                <span className="inline-flex items-center gap-2">
                  <Check className="w-5 h-5" />
                  LINK TERSALIN
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <Copy className="w-5 h-5" />
                  COPY LINK LOGIN
                </span>
              )}
            </button>
          </div>
        </div>

        <p className="mt-4 text-sm font-medium bg-white border-3 border-black p-3">
          Inbox hanya tersimpan di browser (localStorage). Tidak ada penyimpanan di server.
        </p>

        <button
          onClick={onClose}
          className="mt-4 w-full py-3 bg-pink-300 border-4 border-black font-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                     hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)] hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          TUTUP
        </button>
      </motion.div>
    </div>
  );
}
