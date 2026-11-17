import { ImageResponse } from 'next/og';

// The card people actually see when a link is pasted into WhatsApp or Instagram.
// Rendered at request time rather than shipped as a PNG so the wording stays in sync
// with the page copy. No webfont is loaded: ImageResponse would have to fetch it, and
// a card that sometimes fails to render is worse than one in the default sans.
export const runtime = 'edge';
export const alt = 'Anonify — anonymous messages, filtered on arrival';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

const OLIVE = '#51602E';
const PAPER = '#EEF1E4';
const SAGE = '#B3C186';
const CLAY = '#BC6C25';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: OLIVE,
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: CLAY,
              display: 'flex',
            }}
          />
          <div
            style={{
              fontSize: 26,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: SAGE,
              display: 'flex',
            }}
          >
            anonify.in
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          <div style={{ fontSize: 132, fontWeight: 700, color: PAPER, display: 'flex' }}>
            Anonify
          </div>
          <div style={{ fontSize: 44, color: PAPER, opacity: 0.92, display: 'flex' }}>
            Share one link. Read what people really think.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: `2px solid ${SAGE}`,
            paddingTop: '28px',
          }}
        >
          <div style={{ fontSize: 32, color: SAGE, display: 'flex', gap: '20px' }}>
            <span>Anonymity.</span>
            <span>Honesty.</span>
            <span>Freedom.</span>
          </div>
          <div style={{ fontSize: 26, color: PAPER, opacity: 0.75, display: 'flex' }}>
            Abuse filtered before delivery
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
