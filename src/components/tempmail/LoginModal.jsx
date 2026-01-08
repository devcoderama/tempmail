import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, X, Loader2 } from 'lucide-react';

export default function LoginModal({ isOpen, onClose, onLogin, isLoading }) {
  const [token, setToken] = useState('');

  if (!isOpen) return null;

  const submit = (event) => {
    event.preventDefault();
    if (!token.trim()) return;
    onLogin(token.trim());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={submit}
        className="bg-white border-4 border-black max-w-md w-full p-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <div>
            <h3 className="text-2xl font-black">MASUK DENGAN TOKEN</h3>
            <p className="text-sm font-medium">Token ini membuka inbox yang tersimpan.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 border-3 border-black bg-pink-300"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <label className="block font-bold mb-2">Token Akses</label>
        <input
          value={token}
          onChange={(event) => setToken(event.target.value)}
          placeholder="contoh: abcd-1234"
          className="w-full px-4 py-3 border-4 border-black font-mono text-lg"
        />

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full py-3 bg-lime-300 border-4 border-black font-black
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                     disabled:opacity-50"
        >
          {isLoading ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              MEMPROSES
            </span>
          ) : (
            <span className="inline-flex items-center gap-2">
              <Key className="w-5 h-5" />
              MASUK
            </span>
          )}
        </button>
      </motion.form>
    </div>
  );
}
