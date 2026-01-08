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

## Netlify DB (Neon)

1) Buat Netlify Database, lalu set env `NETLIFY_DATABASE_URL` atau `NETLIFY_DATABASE_URL_UNPOOLED`.
2) Set env `VITE_TOKEN_HMAC_SECRET` (random string) untuk token HMAC.
3) Set env keamanan:
   - `VITE_APP_BEARER_TOKEN`
   - `VITE_APP_VERSION` (contoh: `1`)
   - Frontend: `VITE_APP_BEARER_TOKEN`, `VITE_TOKEN_HMAC_SECRET`, `VITE_APP_VERSION`
4) Email masuk akan disimpan ke tabel `inbox_messages` (dibuat otomatis).
3) Endpoint:
   - `POST /.netlify/functions/receiveEmail`
   - `POST /.netlify/functions/createTempMail`
   - `GET /.netlify/functions/getInbox?token=...`
   - `POST /.netlify/functions/deleteEmail`

## Struktur data domain

Lihat `domains.json`.

## Realtime relay (tanpa simpan riwayat)

Mode ini hanya meneruskan email **saat device online**, tanpa menyimpan di server. Inbox yang tampil tetap hanya di localStorage device masing-masing.

### 1) Deploy Cloudflare Worker + Durable Object

Di folder `cloudflare/email-relay/` sudah ada `worker.js` dan `wrangler.toml`. Deploy dengan:

```
wrangler deploy
```

### 2) Set Vite env untuk relay URL

Tambahkan `.env`:

```
VITE_RELAY_URL=https://botlynk-mail-relay.<your-subdomain>.workers.dev
```

### 3) Hubungkan Email Routing ke Worker

Di Cloudflare Email Routing, arahkan inbound email ke Worker tersebut.

## Struktur folder

```
.
├── domains.json
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── cloudflare
│   └── email-relay
│       ├── worker.js
│       └── wrangler.toml
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
