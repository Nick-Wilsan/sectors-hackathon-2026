"""
Verifikasi independen Skor Fundamental Komposit (F-01) — Stocket.

Tujuan: membuktikan skor yang ditampilkan aplikasi benar, bukan sekadar
konsisten dengan dirinya sendiri. Skrip ini ditulis dari spesifikasi formula,
bukan diterjemahkan dari kode TypeScript, dan membaca payload MENTAH dari cache
Sectors — tidak mengimpor satu baris pun kode aplikasi.

Formula (Technical Spec bagian 11, keputusan 4 September 2026):

    Skor = sigma(persentil_i x bobot_i)

    Persentil dihitung terhadap seluruh emiten dalam sub-sektor yang sama
    (emiten target ikut menjadi anggota kelompok), memakai konvensi average-rank
    untuk nilai seri, dan nilai kosong dikeluarkan dari kelompok.

      ROE                          25%   makin tinggi makin baik
      Margin Laba Bersih           20%   makin tinggi makin baik
      DER                          20%   makin RENDAH makin baik (persentil dibalik)
      Margin Arus Kas Operasional  20%   makin tinggi makin baik
      ROA                          15%   makin tinggi makin baik

    Bila tepat satu komponen kosong pada emiten target, bobot komponen yang
    tersisa dinormalisasi ulang agar totalnya kembali 1. Bila lebih dari satu
    komponen kosong, emiten dinyatakan datanya tidak memadai dan tidak diberi skor.

Cara pakai (backend harus berjalan di port 4000; 0 kredit bila cache hangat):

    python docs/verifikasi/verify_score.py

Keluar dengan kode 0 bila seluruh emiten uji cocok, 1 bila ada yang tidak.
"""

import glob
import hashlib
import json
import os
import sys
import urllib.request

REPO = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
CACHE_DIR = os.path.join(REPO, "backend", ".cache")
API = "http://localhost:4000"

# Sama dengan DEFAULT_GROUP_LIMIT di backend/src/analysis/scoreService.ts.
# Menentukan URL daftar sub-sektor mana yang dicari di cache, bukan bagian dari
# perhitungan skor.
GROUP_LIMIT = 150

BOBOT = [
    ("roe", "ROE", 0.25, "tinggi"),
    ("npm", "Margin Laba Bersih", 0.20, "tinggi"),
    ("der", "DER", 0.20, "rendah"),
    ("ocf", "Margin Arus Kas Operasional", 0.20, "tinggi"),
    ("roa", "ROA", 0.15, "tinggi"),
]

# Nama komponen pada keluaran API, untuk penjajaran saat membandingkan.
NAMA_API = {"roe": "roe", "npm": "netProfitMargin", "der": "der",
            "ocf": "ocfMargin", "roa": "roa"}

# Letak tiap rasio di dalam payload mentah Sectors.
LETAK = [
    ("roe", "profitability", "roe"),
    ("npm", "profitability", "net_profit_margin"),
    ("der", "leverage", "debt_to_equity_ratio"),
    ("ocf", "liquidity", "operating_cash_flow_margin"),
    ("roa", "profitability", "roa"),
]


def baca_cache_url(url):
    """Payload mentah untuk sebuah URL Sectors, bila ada di cache."""
    p = os.path.join(CACHE_DIR, hashlib.sha256(url.encode()).hexdigest() + ".json")
    if not os.path.exists(p):
        return None
    return json.load(open(p, encoding="utf-8"))["value"]


def daftar_sub_sektor(slug):
    """Daftar emiten satu sub-sektor, apa adanya dari Sectors."""
    url = ("https://api.sectors.app/v2/companies/"
           "?where=sub_sector+%3D+%27{}%27&limit={}".format(slug, GROUP_LIMIT))
    v = baca_cache_url(url)
    if v is None:
        raise SystemExit(
            "Daftar sub-sektor '%s' belum ada di cache. Buka halaman salah satu "
            "emiten sub-sektor itu lebih dulu (biaya 1 kredit)." % slug)
    return [r["symbol"] for r in v["results"]]


def indeks_laporan():
    """symbol -> blok financials, dipungut dari seluruh berkas cache."""
    hasil, bentrok = {}, set()
    for f in glob.glob(os.path.join(CACHE_DIR, "*.json")):
        try:
            v = json.load(open(f, encoding="utf-8"))["value"]
        except Exception:
            continue
        if not isinstance(v, dict):
            continue
        sym, fin = v.get("symbol"), v.get("financials")
        if not sym or not fin:
            continue
        if sym in hasil and hasil[sym] != fin:
            bentrok.add(sym)
        hasil[sym] = fin
    return hasil, sorted(bentrok)


def rasio_tahun_terakhir(fin):
    """Lima rasio dari tahun laporan terbaru."""
    arr = (fin or {}).get("historical_financial_ratio") or []
    if not arr:
        return None
    r = max(arr, key=lambda e: int(e["year"]))
    out = {"year": r.get("year")}
    for kunci, grup, medan in LETAK:
        out[kunci] = (r.get(grup) or {}).get(medan)
    return out


def persentil(nilai, kelompok):
    """Average-rank: (jumlah di bawah + jumlah seri / 2) / n x 100."""
    bersih = [v for v in kelompok if v is not None]
    n = len(bersih)
    if n == 0:
        return 50.0, 0
    di_bawah = sum(1 for v in bersih if v < nilai)
    seri = sum(1 for v in bersih if v == nilai)
    return (di_bawah + seri / 2) / n * 100, n


def hitung_skor(target_sym, simbol_kelompok, laporan):
    kelompok, tanpa_laporan = [], []
    for s in simbol_kelompok:
        fin = laporan.get(s)
        if fin is None:
            tanpa_laporan.append(s)
            continue
        r = rasio_tahun_terakhir(fin)
        if r is not None:
            kelompok.append(r)

    target = rasio_tahun_terakhir(laporan.get(target_sym))
    if target is None:
        return {"status": "inadequate", "score": None, "tanpa_laporan": tanpa_laporan}

    hilang = [k for k, _, _, _ in BOBOT if target[k] is None]
    if len(hilang) > 1:
        return {"status": "inadequate", "score": None, "hilang": hilang,
                "tanpa_laporan": tanpa_laporan}

    ada = [(k, lab, w, arah) for k, lab, w, arah in BOBOT if target[k] is not None]
    total_bobot = sum(w for _, _, w, _ in ada)

    rincian, total = [], 0.0
    for k, lab, w, arah in ada:
        p, n = persentil(target[k], [g[k] for g in kelompok])
        if arah == "rendah":
            p = 100 - p
        bobot_dipakai = w / total_bobot
        total += p * bobot_dipakai
        rincian.append({"key": k, "label": lab, "raw": target[k],
                        "persentil": p, "bobot": bobot_dipakai, "n": n})

    return {"status": "ok" if not hilang else "partial",
            "score": round(total * 100) / 100, "year": target["year"],
            "rincian": rincian, "ukuran_kelompok": len(kelompok),
            "hilang": hilang, "tanpa_laporan": tanpa_laporan}


def keluaran_aplikasi(symbol):
    with urllib.request.urlopen("%s/api/emiten/%s/skor" % (API, symbol.split(".")[0]),
                                timeout=120) as r:
        return json.load(r)


def bandingkan(target_sym, slug):
    simbol = daftar_sub_sektor(slug)
    laporan, bentrok = indeks_laporan()
    saya = hitung_skor(target_sym, simbol, laporan)
    app = keluaran_aplikasi(target_sym)

    print("=" * 78)
    print("%s  — sub-sektor '%s', %d emiten dalam daftar Sectors"
          % (target_sym, slug, len(simbol)))
    print("=" * 78)
    if saya.get("tanpa_laporan"):
        print("  PERINGATAN %d emiten tanpa laporan ter-cache: %s"
              % (len(saya["tanpa_laporan"]), ", ".join(saya["tanpa_laporan"])))
    if bentrok:
        print("  PERINGATAN payload financials bentrok untuk:", ", ".join(bentrok))

    n_app = app["components"][0]["groupSize"] if app.get("components") else None
    print("  Ukuran kelompok : python %s | aplikasi %s" % (saya.get("ukuran_kelompok"), n_app))
    print("  Tahun laporan   : python %s | aplikasi %s" % (saya.get("year"), app.get("year")))
    print("  Status          : python %s | aplikasi %s" % (saya["status"], app["status"]))
    print()
    print("  %-30s %13s %11s %11s" % ("Komponen", "Nilai mentah", "Pst-python", "Pst-aplikasi"))

    peta = {c["key"]: c for c in app.get("components", [])}
    cocok = True
    for c in saya.get("rincian", []):
        a = peta.get(NAMA_API[c["key"]])
        if a is None:
            print("  %-30s  TIDAK ADA DI KELUARAN APLIKASI" % c["label"])
            cocok = False
            continue
        if abs(c["persentil"] - a["percentile"]) > 1e-9 or abs(c["raw"] - a["rawValue"]) > 1e-9:
            cocok = False
        print("  %-30s %13.6f %11.4f %11.4f" % (c["label"], c["raw"], c["persentil"], a["percentile"]))

    selisih = (saya["score"] or 0) - (app["score"] or 0)
    print()
    print("  SKOR AKHIR       python %.2f | aplikasi %.2f | selisih %.2e"
          % (saya["score"], app["score"], selisih))
    lolos = cocok and abs(selisih) < 0.005
    print("  ==> %s" % ("COCOK" if lolos else "TIDAK COCOK"))
    print()
    return lolos


# Emiten uji: dua sub-sektor berbeda dengan ukuran kelompok yang jauh berbeda
# (48 vs 12), agar pembagi persentil ikut teruji.
KASUS_UJI = [("BBCA.JK", "banks"), ("BBRI.JK", "banks"), ("BIRD.JK", "transportation")]

if __name__ == "__main__":
    hasil = [bandingkan(sym, slug) for sym, slug in KASUS_UJI]
    print("=" * 78)
    print("RINGKASAN: %d dari %d emiten cocok" % (sum(hasil), len(hasil)))
    sys.exit(0 if all(hasil) else 1)
