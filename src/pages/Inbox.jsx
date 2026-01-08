import React, { useEffect, useMemo, useState } from 'react';
import { Mail, RefreshCw, Copy, Check, Plus, Key } from 'lucide-react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { setCookie, getCookie, deleteCookie } from '../utils/cookies';
import EmailCard from '../components/tempmail/EmailCard';
import EmailViewer from '../components/tempmail/EmailViewer';
import LoginModal from '../components/tempmail/LoginModal';
import TokenModal from '../components/tempmail/TokenModal';

const TOKEN_KEY = 'botlynk.lastToken';
const TOKEN_COOKIE = 'botlynk_token';

const getTokenFromSearch = (search) => {
  if (!search) return '';
  const params = new URLSearchParams(search);
  const tokenParam = params.get('token');
  if (tokenParam) return tokenParam;
  if (search.startsWith('?=')) return decodeURIComponent(search.slice(2));
  return '';
};

export default function Inbox() {
  const location = useLocation();
  const navigate = useNavigate();
  const [tempMail, setTempMail] = useState(null);
  const [emails, setEmails] = useState([]);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showTokenModal, setShowTokenModal] = useState(false);
  const [modalToken, setModalToken] = useState('');
  const [modalEmail, setModalEmail] = useState('');
  const [currentToken, setCurrentToken] = useState('');

  const tokenFromUrl = useMemo(
    () => getTokenFromSearch(location.search),
    [location.search]
  );
  const stateToken = location.state?.token || '';
  const stateShowToken = Boolean(location.state?.showToken);
  const stateEmail = location.state?.email || '';

  const loadEmails = async (token) => {
    if (!token) return;
    const response = await fetch(`/.netlify/functions/getInbox?token=${encodeURIComponent(token)}`);
    if (!response.ok) {
      setEmails([]);
      return;
    }
    const data = await response.json();
    setEmails(data.inbox || []);
  };

  const loginWithToken = async (token, { silent = false, showToken = false, email = '' } = {}) => {
    setIsLoading(true);
    const results = await base44.entities.TempMail.filter({ access_token: token });

    if (results.length > 0) {
      const mail = results[0];
      setTempMail(mail);
      setSelectedEmail(null);
      setShowLoginModal(false);
      localStorage.setItem(TOKEN_KEY, token);
      setCookie(TOKEN_COOKIE, token);
      setCurrentToken(token);
      await loadEmails(token);
      if (showToken) {
        setModalToken(token);
        setModalEmail(email || mail.email_address);
        setShowTokenModal(true);
      }
      if (!silent) toast.success('Berhasil masuk!');
    } else {
      setTempMail(null);
      setEmails([]);
      localStorage.removeItem(TOKEN_KEY);
      deleteCookie(TOKEN_COOKIE);
      if (!silent) toast.error('Token tidak valid!');
      setShowLoginModal(true);
    }
    setIsLoading(false);
  };

  const refreshInbox = async () => {
    if (!tempMail) return;
    setIsRefreshing(true);
    await loadEmails(currentToken);
    setIsRefreshing(false);
    toast.success('Kotak masuk diperbarui!');
  };

  const copyEmail = () => {
    if (!tempMail) return;
    navigator.clipboard.writeText(tempMail.email_address);
    setCopied(true);
    toast.success('Email disalin!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleEmailClick = async (email) => {
    setSelectedEmail(email);
    if (!email.is_read) {
      setEmails((prev) =>
        prev.map((item) => (item.id === email.id ? { ...item, is_read: true } : item))
      );
    }
  };

  const handleDeleteEmail = async (emailId) => {
    setEmails((prev) => prev.filter((item) => item.id !== emailId));
    setSelectedEmail(null);
    toast.success('Email dihapus!');
  };

  const resetAndCreateNew = () => {
    localStorage.removeItem(TOKEN_KEY);
    deleteCookie(TOKEN_COOKIE);
    setTempMail(null);
    setEmails([]);
    setSelectedEmail(null);
    navigate('/');
  };

  useEffect(() => {
    const token =
      tokenFromUrl || stateToken || localStorage.getItem(TOKEN_KEY) || getCookie(TOKEN_COOKIE);
    if (token) {
      const shouldShowToken = stateShowToken && (stateToken || tokenFromUrl);
      loginWithToken(token, { silent: true, showToken: shouldShowToken, email: stateEmail });
    } else {
      setShowLoginModal(true);
    }
  }, [tokenFromUrl, stateToken, stateShowToken, stateEmail]);

  if (!tempMail) {
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
                  <p className="font-bold text-sm">Kotak masuk</p>
                </div>
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-lime-300 border-4 border-black font-bold
                           shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <Key className="w-5 h-5" />
                <span className="hidden sm:inline">MASUK DENGAN TOKEN</span>
              </button>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-10">
          <div className="bg-white border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
            <p className="font-bold text-lg">Token belum dimasukkan.</p>
            <p className="text-sm text-gray-600 mt-2">
              Masukkan token untuk membuka inbox, atau buat email baru di halaman utama.
            </p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => setShowLoginModal(true)}
                className="px-4 py-2 bg-cyan-300 border-3 border-black font-bold
                           shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Masuk dengan Token
              </button>
              <button
                onClick={() => navigate('/')}
                className="px-4 py-2 bg-pink-300 border-3 border-black font-bold
                           shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                           hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                Buat Email Baru
              </button>
            </div>
          </div>
        </main>

        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onLogin={loginWithToken}
          isLoading={isLoading}
        />

        <TokenModal
          isOpen={showTokenModal}
          onClose={() => setShowTokenModal(false)}
          token={modalToken}
          email={modalEmail}
        />
      </div>
    );
  }

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
                <p className="font-bold text-sm">Kotak masuk</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-violet-300 border-4 border-black p-4 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="p-2 bg-white border-3 border-black">
                <Mail className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-gray-700">Email Anda:</p>
                <p className="font-mono font-black text-lg break-all sm:truncate">
                  {tempMail.email_address}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={copyEmail}
                className={`p-2 border-3 border-black transition-all
                               ${copied ? 'bg-green-400' : 'bg-white hover:bg-gray-100'}
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                               hover:translate-x-[2px] hover:translate-y-[2px]`}
              >
                {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
              </button>
              <button
                onClick={refreshInbox}
                disabled={isRefreshing}
                className="p-2 bg-cyan-300 border-3 border-black
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                               hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                               disabled:opacity-50"
              >
                <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={resetAndCreateNew}
                className="px-4 py-2 bg-pink-400 border-3 border-black font-bold
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                               hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
              >
                <span className="hidden sm:inline">EMAIL BARU</span>
                <Plus className="w-5 h-5 sm:hidden" />
              </button>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h3 className="font-black text-xl flex items-center gap-2">
              <Mail className="w-5 h-5" />
              KOTAK MASUK
              {emails.length > 0 && (
                <span className="px-2 py-0.5 bg-pink-400 border-2 border-black text-sm">
                  {emails.filter((email) => !email.is_read).length} baru
                </span>
              )}
            </h3>

            {emails.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-white border-4 border-black p-8 text-center"
              >
                <div className="p-4 bg-gray-100 border-4 border-black inline-block mb-4">
                  <Mail className="w-12 h-12 text-gray-400" />
                </div>
                <p className="font-bold text-lg">Kotak masuk kosong</p>
                <p className="text-gray-600 mt-1">Email yang masuk akan muncul di sini</p>
                <button
                  onClick={refreshInbox}
                  className="mt-4 px-4 py-2 bg-cyan-300 border-3 border-black font-bold
                                 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                                 hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                                 inline-flex items-center gap-2"
                >
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </button>
              </motion.div>
            ) : (
              <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
                {emails.map((email) => (
                  <EmailCard
                    key={email.id}
                    email={email}
                    onClick={() => handleEmailClick(email)}
                    isSelected={selectedEmail?.id === email.id}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="hidden lg:block min-h-[400px]">
            <EmailViewer
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onDelete={handleDeleteEmail}
            />
          </div>
        </div>

        {selectedEmail && (
          <div className="fixed inset-0 bg-yellow-100 z-40 lg:hidden overflow-auto p-4">
            <EmailViewer
              email={selectedEmail}
              onBack={() => setSelectedEmail(null)}
              onDelete={handleDeleteEmail}
            />
          </div>
        )}
      </main>

      <TokenModal
        isOpen={showTokenModal}
        onClose={() => setShowTokenModal(false)}
        token={modalToken}
        email={modalEmail || tempMail.email_address}
      />
    </div>
  );
}
