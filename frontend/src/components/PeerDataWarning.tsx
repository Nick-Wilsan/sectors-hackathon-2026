/**
 * Every score in this product is a percentile against a peer group. When a
 * peer's financial report fails to download, that company drops out of the
 * group and every percentile computed from it shifts — silently, because the
 * numbers still render and nothing errors.
 *
 * This banner exists so that shift is never invisible. It is deliberately
 * plain about the consequence rather than reassuring.
 */
export function PeerDataWarning({ failures, groupSize }: { failures: number; groupSize: number }) {
  if (!failures || failures <= 0) return null;

  return (
    <div className="flex items-start gap-space-8 rounded border border-state-warning/40 bg-state-warning/10 px-space-12 py-space-8">
      <span className="material-symbols-outlined mt-[1px] text-[16px] text-state-warning">warning</span>
      <p className="font-body-sm text-body-sm text-state-warning">
        <strong>{failures} emiten pembanding gagal dimuat</strong> saat skor ini dihitung, sehingga kelompok pembanding hanya berisi{' '}
        {groupSize} emiten. Karena skor berupa persentil terhadap kelompok itu, angka di halaman ini bisa berbeda dari hasil saat seluruh data
        tersedia. Muat ulang halaman untuk mencoba lagi.
      </p>
    </div>
  );
}
