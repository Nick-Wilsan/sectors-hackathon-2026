# Sectors Hackathon 2026 — Track 3 Market Intelligence

Lapisan penerjemah data pasar modal Indonesia (via [Sectors API](https://docs.sectors.app/)) menjadi skor, perbandingan, dan penjelasan berbahasa awam untuk investor pemula.

Dokumen acuan lengkap ada di [`docs/`](./docs): PRD, Technical Spec, dan API & Data Dictionary.

> Produk ini bersifat informasi dan analisis, bukan rekomendasi investasi. Seluruh keputusan investasi merupakan tanggung jawab pengguna.

## Struktur Proyek

```
backend/     Express + TypeScript — lapisan data, analisis, dan AI
  src/data/       Klien Sectors API + normalisasi + cache
  src/analysis/   Skor komposit, persentil, anomali, pola, indikator
  src/ai/         Integrasi Gemini (Google AI Studio)
  src/routes/     Endpoint yang dipakai frontend
frontend/    React + Vite + TypeScript — UI screener, grafik, dan panel tanya jawab
docs/        PRD, Technical Spec, API & Data Dictionary, Roadmap
```

## Menjalankan secara lokal

### Backend

```bash
cd backend
cp .env.example .env   # isi SECTORS_API_KEY dan GEMINI_API_KEY
npm run dev
```

### Frontend

```bash
cd frontend
npm run dev
```

## Kredensial

API key **tidak pernah** disimpan di repo. Isi `backend/.env` (sudah di-`.gitignore`) berdasarkan `backend/.env.example`.
