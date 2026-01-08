# BotLynk - Mail

Temp mail UI bertema neobrutalism dengan token akses. Semua data inbox disimpan di browser (localStorage) untuk demo lokal.

## Prasyarat

- Node.js 18+ dan npm

## Instalasi

```bash
npm install
```

## Menjalankan di lokal

```bash
npm run dev
```

Lalu buka `http://localhost:5173`.

## Build produksi

```bash
npm run build
npm run preview
```

## Deploy ke Netlify

1. Push repo ini ke GitHub/GitLab.
2. Di Netlify, pilih **New site from Git**.
3. Pilih repo.
4. Set Build command: `npm run build`.
5. Set Publish directory: `dist`.
6. Deploy.

## Setup Cloudflare Email Routing (untuk produksi)

Catatan: Netlify tidak menerima email inbound. Email harus ditangkap di Cloudflare lalu diteruskan ke backend Anda.

### 1) Aktifkan backend functions

Jika memakai Netlify Functions, pastikan backend functions aktif di pengaturan proyek Netlify Anda.

### 2) Aktifkan Email Routing

Lakukan untuk setiap domain di `domains.json`.

- Cloudflare Dashboard -> Domain -> Email -> Email Routing
- Klik **Get started**, aktifkan Email Routing.
- Pastikan MX record mengikuti instruksi Cloudflare.

### 3) Buat Worker Email

Buat Worker di Cloudflare lalu deploy. Contoh handler (forward ke webhook backend Anda):

```js
export default {
  async email(message, env, ctx) {
    const emailData = {
      to: message.to,
      from: message.from,
      subject: message.headers.get("subject"),
      text: await new Response(message.raw).text(),
      html: await new Response(message.raw).text(),
      headers: Object.fromEntries(message.headers),
    };

    await fetch("https://botlynk.indevs.in/.netlify/functions/receiveEmail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(emailData),
    });
  },
};
```

### 4) Hubungkan Routing ke Worker

Untuk tiap domain:

- Email Routing -> Routes
- Pilih action **Send to a Worker**
- Pilih Worker yang dibuat
- Simpan

### 5) Uji

- Buat alamat temp mail di UI.
- Kirim email dari Gmail ke alamat tersebut.
- Pastikan backend menerima webhook dari Worker.

## Struktur data domain

Lihat `domains.json`.

## Struktur folder

```
.
├── domains.json
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
└── src
    ├── api
    │   └── base44Client.js
    ├── components
    │   └── tempmail
    │       ├── DomainSelector.jsx
    │       ├── EmailCard.jsx
    │       ├── EmailViewer.jsx
    │       ├── LoginModal.jsx
    │       └── TokenModal.jsx
    ├── pages
    │   ├── Home.jsx
    │   └── Inbox.jsx
    ├── utils
    │   ├── cookies.js
    │   └── index.js
    ├── App.jsx
    ├── index.css
    └── main.jsx
```

## Tema UI

- Neobrutalism: border tebal, shadow keras, kontras warna tinggi, dan layout tegas.
- Warna dominan: pink, cyan, lime, dan kuning sebagai latar.
- Tipografi: Space Grotesk + IBM Plex Mono untuk kesan modern dan teknikal.

## Catatan

- Demo ini menyimpan inbox di browser (localStorage) dan tidak menyimpan di server.
- Untuk produksi, Anda perlu backend yang menyimpan inbox (D1/KV/R2) dan endpoint API.
