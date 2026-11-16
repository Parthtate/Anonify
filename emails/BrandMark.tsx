import { Section, Text } from '@react-email/components';

const paper = '#EEF1E4';
const olive = '#51602E';
const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";

/**
 * The Anonify "A" monogram as the email display picture. Built from a styled div
 * because Gmail strips <svg>, and a hosted PNG would break whenever the app runs
 * somewhere the mail client cannot reach (localhost). Old Outlook ignores
 * border-radius and renders a square tile, which still reads as the mark.
 * line-height does the vertical centring — flexbox is unreliable in email.
 */
export function BrandMark() {
  return (
    <Section style={{ textAlign: 'center' }}>
      <div
        style={{
          width: '56px',
          height: '56px',
          margin: '0 auto',
          backgroundColor: olive,
          borderRadius: '15px',
          textAlign: 'center',
        }}
      >
        <span
          style={{
            fontFamily: serif,
            fontSize: '32px',
            fontWeight: 700,
            lineHeight: '56px',
            color: paper,
          }}
        >
          A
        </span>
      </div>
      <Text
        style={{
          margin: '10px 0 24px',
          fontFamily: serif,
          fontSize: '20px',
          fontWeight: 700,
          letterSpacing: '3px',
          color: olive,
        }}
      >
        ANONIFY
      </Text>
    </Section>
  );
}
