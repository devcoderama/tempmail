import React from 'react';
import { Settings, Mail, Link as LinkIcon, CheckCircle, Copy, Zap } from 'lucide-react';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '../utils';

export default function Setup() {
  const [copiedStep, setCopiedStep] = React.useState(null);

  const webhookUrl = `${window.location.origin}/api/functions/receiveEmail`;

  const copyText = (text, step) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(step);
    toast.success('Disalin!');
    setTimeout(() => setCopiedStep(null), 2000);
  };

  const domains = [
    'botlynk.indevs.in',
    'botlynk-01.indevs.in',
    'botlynk-02.indevs.in',
    'botlynk-03.indevs.in',
    'botlynk-04.indevs.in',
  ];

  const workerCode = `export default {
  async email(message, env, ctx) {
    const emailData = {
      to: message.to,
      from: message.from,
      subject: message.headers.get('subject'),
      text: await new Response(message.raw).text(),
      html: await new Response(message.raw).text(),
      headers: Object.fromEntries(message.headers)
    };

    const response = await fetch('${webhookUrl}', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    });

    if (response.ok) {
      console.log('Email forwarded successfully');
    } else {
      console.error('Failed to forward email');
    }
  }
};`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-100 via-pink-100 to-yellow-100 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-violet-400 border-4 border-black p-6 mb-6 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-white border-3 border-black">
              <Settings className="w-8 h-8" />
            </div>
            <h1 className="text-3xl md:text-4xl font-black">SETUP PANDUAN</h1>
          </div>
          <p className="text-lg font-medium">Hubungkan Cloudflare Email Routing ke aplikasi Temp Mail</p>
        </div>

        <Link
          to={createPageUrl('Home')}
          className="inline-flex items-center gap-2 mb-6 px-4 py-2 bg-lime-300 border-4 border-black font-bold
                     shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                     hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
        >
          ← Kembali ke Home
        </Link>

        <div className="bg-white border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-pink-400 border-3 border-black flex items-center justify-center font-black text-xl flex-shrink-0">
              1
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black mb-2">AKTIFKAN BACKEND FUNCTIONS</h2>
              <div className="bg-yellow-100 border-3 border-black p-4 mb-3">
                <p className="font-bold mb-2">Lokasi:</p>
                <p className="font-mono text-sm">Dashboard → Settings → Enable Backend Functions</p>
              </div>
              <p className="font-medium">Backend functions diperlukan untuk menerima webhook dari Cloudflare.</p>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-cyan-400 border-3 border-black flex items-center justify-center font-black text-xl flex-shrink-0">
              2
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black mb-2">SETUP CLOUDFLARE EMAIL ROUTING</h2>

              <div className="space-y-4">
                <div>
                  <p className="font-bold mb-2 flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Login ke Cloudflare Dashboard
                  </p>
                  <a
                    href="https://dash.cloudflare.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white border-3 border-black font-bold
                               shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                               hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
                  >
                    <LinkIcon className="w-4 h-4" />
                    Buka Cloudflare
                  </a>
                </div>

                <div className="bg-gray-50 border-3 border-black p-4">
                  <p className="font-bold mb-2">Untuk setiap domain:</p>
                  <ul className="space-y-1 text-sm font-medium ml-4">
                    {domains.map((domain) => (
                      <li key={domain} className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                        <code className="bg-white px-2 py-1 border border-black">{domain}</code>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-lime-100 border-3 border-black p-4">
                  <p className="font-bold mb-2">Langkah-langkah:</p>
                  <ol className="list-decimal ml-6 space-y-2 font-medium">
                    <li>Pilih domain di Cloudflare Dashboard</li>
                    <li>Klik tab "Email" atau "Email Routing"</li>
                    <li>Klik "Get Started" jika belum aktif</li>
                    <li>Enable Email Routing</li>
                    <li>Pilih "Catch-all" atau buat "Custom Address"</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-yellow-400 border-3 border-black flex items-center justify-center font-black text-xl flex-shrink-0">
              3
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black mb-3">BUAT CLOUDFLARE EMAIL WORKER</h2>

              <div className="space-y-4">
                <div className="bg-pink-100 border-3 border-black p-4">
                  <p className="font-bold mb-2">Buka Workers & Pages:</p>
                  <p className="text-sm font-medium">Cloudflare Dashboard → Workers & Pages → Create Application → Create Worker</p>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold">Copy kode Worker ini:</p>
                    <button
                      onClick={() => copyText(workerCode, 'worker')}
                      className="px-3 py-1 bg-cyan-300 border-3 border-black font-bold text-sm
                                 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                                 hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                                 flex items-center gap-2"
                    >
                      {copiedStep === 'worker' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      {copiedStep === 'worker' ? 'Tersalin!' : 'Copy'}
                    </button>
                  </div>
                  <pre className="bg-gray-900 text-green-400 p-4 border-3 border-black overflow-x-auto text-xs font-mono">
{workerCode}
                  </pre>
                </div>

                <div className="bg-violet-100 border-3 border-black p-4">
                  <p className="font-bold mb-2">Deploy Worker:</p>
                  <ol className="list-decimal ml-6 space-y-1 text-sm font-medium">
                    <li>Beri nama worker (contoh: <code>email-receiver</code>)</li>
                    <li>Paste kode di atas</li>
                    <li>Klik "Save and Deploy"</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white border-4 border-black p-6 mb-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 bg-lime-400 border-3 border-black flex items-center justify-center font-black text-xl flex-shrink-0">
              4
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black mb-3">HUBUNGKAN EMAIL ROUTING KE WORKER</h2>

              <div className="space-y-4">
                <div className="bg-cyan-100 border-3 border-black p-4">
                  <p className="font-bold mb-2">Untuk setiap domain:</p>
                  <ol className="list-decimal ml-6 space-y-2 text-sm font-medium">
                    <li>Kembali ke tab Email Routing domain</li>
                    <li>Di bagian Destination Addresses atau Route</li>
                    <li>Pilih action: "Send to a Worker"</li>
                    <li>Pilih worker yang baru dibuat (<code>email-receiver</code>)</li>
                    <li>Klik Save</li>
                  </ol>
                </div>

                <div className="bg-yellow-100 border-3 border-black p-4">
                  <p className="font-bold mb-2">Catch-all Address (Recommended):</p>
                  <p className="text-sm font-medium">
                    Enable Catch-all agar semua email ke domain tersebut diteruskan ke worker,
                    tidak peduli username-nya apa (user1@, user2@, apapun@).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-lime-300 border-4 border-black p-6 shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-white border-3 border-black flex items-center justify-center font-black text-xl flex-shrink-0">
              5
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-black mb-3 flex items-center gap-2">
                <Zap className="w-6 h-6" />
                TEST EMAIL ROUTING
              </h2>

              <div className="bg-white border-3 border-black p-4 mb-3">
                <p className="font-bold mb-2">Cara test:</p>
                <ol className="list-decimal ml-6 space-y-1 text-sm font-medium">
                  <li>Buat temp mail di aplikasi ini (halaman Home)</li>
                  <li>Salin alamat email yang dibuat</li>
                  <li>Kirim email test dari Gmail/email lain ke alamat tersebut</li>
                  <li>Tunggu beberapa detik, lalu klik tombol Refresh</li>
                  <li>Email seharusnya muncul di inbox!</li>
                </ol>
              </div>

              <div className="flex gap-3">
                <Link
                  to={createPageUrl('Home')}
                  className="px-6 py-3 bg-black text-white border-4 border-black font-bold
                             shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]
                             hover:translate-x-[2px] hover:translate-y-[2px] transition-all
                             inline-flex items-center gap-2"
                >
                  <Mail className="w-5 h-5" />
                  BUAT TEMP MAIL
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-pink-300 border-4 border-black p-4 mt-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
          <p className="font-bold mb-2">Webhook URL (untuk referensi):</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white px-3 py-2 border-2 border-black font-mono text-sm break-all">
              {webhookUrl}
            </code>
            <button
              onClick={() => copyText(webhookUrl, 'webhook')}
              className="px-3 py-2 bg-cyan-300 border-3 border-black
                         shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[1px_1px_0px_0px_rgba(0,0,0,1)]
                         hover:translate-x-[2px] hover:translate-y-[2px] transition-all"
            >
              {copiedStep === 'webhook' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
