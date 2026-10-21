/* oxlint-disable next/no-img-element -- ImageResponse generates a PNG with Satori, which requires native img elements. */
import { ImageResponse } from 'next/og';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const alt = 'Beata Shop — Wear what you mean';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpenGraphImage() {
  const logo = `data:image/png;base64,${readFileSync(join(process.cwd(), 'public', 'beata-logo.png')).toString('base64')}`;
  return new ImageResponse(
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', background: '#f3e3d4', color: '#25140e', padding: 70 }}>
      <div style={{ width: '54%', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
        <img src={logo} width={430} height={150} alt="" style={{ objectFit: 'contain', objectPosition: 'left center' }} />
        <div style={{ marginTop: 55, display: 'flex', whiteSpace: 'pre-line', fontSize: 78, lineHeight: .88, letterSpacing: '-5px', fontWeight: 800 }}>{'WEAR WHAT\nYOU MEAN.'}</div>
      </div>
      <div style={{ width: '46%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 46, background: '#bd6b49', color: '#fff8ef' }}>
        <div style={{ display: 'flex', whiteSpace: 'pre-line', fontSize: 36, fontWeight: 800 }}>{'OUT OF OFFICE\nMENTALLY'}</div>
        <div style={{ alignSelf: 'flex-end', padding: '16px 20px', border: '2px solid rgba(255,255,255,.55)', fontSize: 28, fontWeight: 800 }}>PROBABLY TOMORROW</div>
        <div style={{ fontSize: 18, letterSpacing: '3px' }}>FUNNY TEXT · GOOD CLOTHES</div>
      </div>
    </div>,
    size,
  );
}
