import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Mail, Key, Plus, Zap, Shield, Clock, Loader2, ExternalLink, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { setCookie } from '../utils/cookies';
import { generateTokenForEmail, decodeTokenToEmail } from '../utils/token';
import DomainSelector, { DOMAINS } from '../components/tempmail/DomainSelector';
import LoginModal from '../components/tempmail/LoginModal';

function generateRandomUsername() {
  const adjectives = ['quick', 'lazy', 'happy', 'bright', 'cool', 'fast', 'smart', 'bold'];
  const nouns = ['tiger', 'eagle', 'wolf', 'bear', 'fox', 'hawk', 'lion', 'deer'];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999);
  return `${adj}${noun}${num}`;
}

export default function Home() {
  const [selectedDomain, setSelectedDomain] = useState(DOMAINS[0] || '');
  const [username, setUsername] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [savedMails, setSavedMails] = useState([]);
  const [savedPage, setSavedPage] = useState(1);
  const navigate = useNavigate();

  const fullEmail = username ? `${username}@${selectedDomain}` : '';

  const loadSavedMails = async () => {
    const list = await base44.entities.TempMail.filter({}, '-created_date');
    setSavedMails(list);
  };

  const createTempMail = async () => {
    if (!username.trim()) {
      toast.error('Masukkan username terlebih dahulu!');
      return;
    }

    setIsCreating(true);
    const token = generateTokenForEmail(fullEmail);

    const newTempMail = await base44.entities.TempMail.create({
      email_address: fullEmail,
      domain: selectedDomain,
      access_token: token,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      is_active: true,
    });

    setSavedMails((prev) => [newTempMail, ...prev]);
    localStorage.setItem('botlynk.lastToken', token);
    setCookie('botlynk_token', token);
    setIsCreating(false);
    toast.success('Email sementara berhasil dibuat!');
    setSavedPage(1);
    navigate(`/inbox?token=${encodeURIComponent(token)}`, {
      state: { showToken: true, token, email: fullEmail },
    });
  };

  const loginWithToken = async (token) => {
    setIsLoading(true);
    const emailFromToken = decodeTokenToEmail(token);
    if (!emailFromToken) {
      toast.error('Token tidak valid!');
      setIsLoading(false);
      return;
    }

    const results = await base44.entities.TempMail.filter({ access_token: token });
    let mail = results[0];

    if (!mail) {
      const [name, domain] = emailFromToken.split('@');
      mail = await base44.entities.TempMail.create({
        email_address: emailFromToken,
        domain: domain || DOMAINS[0] || '',
        access_token: token,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_active: true,
      });
      if (name) setUsername(name);
      if (domain) setSelectedDomain(domain);
      setSavedMails((prev) => [mail, ...prev]);
    }

    setShowLoginModal(false);
    localStorage.setItem('botlynk.lastToken', token);
    setCookie('botlynk_token', token);
    toast.success('Berhasil masuk!');
    navigate('/inbox');
    setIsLoading(false);
  };

  useEffect(() => {
    setUsername(generateRandomUsername());
    loadSavedMails();
  }, []);

  const pageSize = 5;
  const totalPages = Math.max(1, Math.ceil(savedMails.length / pageSize));
  const pagedMails = savedMails.slice((savedPage - 1) * pageSize, savedPage * pageSize);

  const deleteSavedMail = async (mailId) => {
    await base44.entities.TempMail.delete(mailId);
    setSavedMails((prev) => prev.filter((item) => item.id !== mailId));
    toast.success('Email tersimpan dihapus!');
    setSavedPage((prev) => {
      const nextTotal = Math.max(1, Math.ceil((savedMails.length - 1) / pageSize));
      return Math.min(prev, nextTotal);
    });
  };

  return (
    <div className="min-h-screen bg-yellow-100">
      <header className="bg-pink-400 border-b-4 border-black">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-cyan-300 border-4 border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <Mail className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">BOTLYNK - MAIL</h1>
                <p className="font-bold text-sm">Email Sementara Instan</p>
              </div>
            </div>

            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-lime-300 border-4 border-black font-bold
                         shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                         hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              <Key className="w-5 h-5" />
              <span className="hidden sm:inline">AKSES DENGAN TOKEN</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white border-4 border-black p-6 md:p-8 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]"
          >
            <h2 className="text-2xl font-black mb-6 flex items-center gap-2">
              <Plus className="w-6 h-6" />
              BUAT EMAIL SEMENTARA
            </h2>

            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <input
                type="text"
                value={username}
                onChange={(event) =>
                  setUsername(event.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''))
                }
                placeholder="username"
                className="flex-1 px-4 py-3 border-4 border-black font-mono text-lg
                           focus:outline-none focus:ring-0"
              />
              <DomainSelector selectedDomain={selectedDomain} onSelect={setSelectedDomain} />
            </div>

            {fullEmail && (
              <div className="bg-gray-100 border-4 border-black p-4 mb-6">
                <p className="text-sm font-bold text-gray-600 mb-1">Preview Email:</p>
                <p className="font-mono text-lg font-bold break-all">{fullEmail}</p>
              </div>
            )}

            <div className="bg-yellow-100 border-4 border-black p-4 mb-6">
              <p className="text-sm font-bold">Privasi lokal</p>
              <p className="text-sm font-medium">
                Pesan disimpan hanya di localStorage browser. Server tidak menyimpan inbox Anda.
              </p>
            </div>

            <button
              onClick={createTempMail}
              disabled={isCreating || !username.trim()}
              className="w-full py-4 bg-lime-400 border-4 border-black font-black text-xl
                         shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,1)]
                         hover:translate-x-[3px] hover:translate-y-[3px] transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isCreating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  MEMBUAT...
                </>
              ) : (
                <>
                  <Zap className="w-6 h-6" />
                  BUAT SEKARANG
                </>
              )}
            </button>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8">
            {[
              { icon: Zap, title: 'Instan', desc: 'Buat email dalam hitungan detik', color: 'bg-cyan-300' },
              { icon: Shield, title: 'Aman', desc: 'Lindungi privasi Anda', color: 'bg-pink-300' },
              { icon: Clock, title: 'Sementara', desc: 'Otomatis kedaluwarsa', color: 'bg-lime-300' },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`${feature.color} border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]`}
              >
                <feature.icon className="w-8 h-8 mb-2" />
                <h3 className="font-black text-lg">{feature.title}</h3>
                <p className="font-medium text-sm">{feature.desc}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-black">EMAIL TERSIMPAN</h3>
              <button
                onClick={loadSavedMails}
                className="px-3 py-2 bg-white border-3 border-black font-bold
                           shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Refresh
              </button>
            </div>

            {savedMails.length === 0 ? (
              <div className="bg-white border-4 border-black p-6 text-center shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                <p className="font-bold">Belum ada email tersimpan.</p>
                <p className="text-sm text-gray-600">Email yang dibuat akan muncul di sini.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pagedMails.map((mail) => (
                  <div
                    key={mail.id}
                    className="bg-white border-4 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                  >
                    <p className="font-mono font-bold break-all">{mail.email_address}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      Dibuat: {new Date(mail.created_date).toLocaleString('id-ID')}
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={() =>
                          navigate(`/inbox?token=${encodeURIComponent(mail.access_token)}`)
                        }
                        className="px-3 py-2 bg-cyan-300 border-3 border-black font-bold
                                   shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                                   inline-flex items-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Buka Inbox
                      </button>
                      <button
                        onClick={() => deleteSavedMail(mail.id)}
                        className="px-3 py-2 bg-pink-300 border-3 border-black font-bold
                                   shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                                   hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                                   inline-flex items-center gap-2"
                      >
                        <Trash2 className="w-4 h-4" />
                        Hapus
                      </button>
                    </div>
                  </div>
                ))}

                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={() => setSavedPage((prev) => Math.max(1, prev - 1))}
                    disabled={savedPage === 1}
                    className="px-3 py-2 bg-white border-3 border-black font-bold disabled:opacity-50
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                               hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Sebelumnya
                  </button>
                  <span className="text-sm font-bold">
                    Halaman {savedPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setSavedPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={savedPage === totalPages}
                    className="px-3 py-2 bg-white border-3 border-black font-bold disabled:opacity-50
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                               hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onLogin={loginWithToken}
        isLoading={isLoading}
      />
    </div>
  );
}
