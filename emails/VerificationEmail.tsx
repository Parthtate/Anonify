import {
  Body,
  Button,
  Container,
  Font,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { BrandMark } from './BrandMark';

interface VerificationEmailProps {
  username: string;
  otp: string;
  /** Absolute link to the verify page with the code prefilled. */
  verifyUrl?: string;
}

// Email clients strip stylesheets, SVG and JS, so everything here is inline, table-safe
// and degrades to squares-and-text in old Outlook without losing meaning.
const paper = '#EEF1E4';
const white = '#FFFFFF';
const olive = '#51602E';
const moss = '#657B3D';
const sage = '#B3C186';
const ink = '#2B2A26';
const muted = '#6B6A62';
const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
const mono = "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace";

const clay = '#BC6C25';

export default function VerificationEmail({ username, otp, verifyUrl }: VerificationEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head>
        <Font
          fontFamily="Playfair Display"
          fallbackFontFamily="Georgia"
          webFont={{
            url: 'https://fonts.gstatic.com/s/playfairdisplay/v30/nuFvD-vYSZviVYUb_rj3ij__anPXJzDwcbmjWBN2PKdFvXDXbtY.woff2',
            format: 'woff2',
          }}
          fontWeight={700}
          fontStyle="normal"
        />
      </Head>
      <Preview>{`${otp} is your Anonify code — someone's about to write to you`}</Preview>
      <Body style={{ margin: 0, padding: '32px 16px', backgroundColor: paper, fontFamily: sans }}>
        <Container style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
          <BrandMark />

          {/* Chunky bottom edge stands in for a shadow, which most clients drop. */}
          <Section style={{ backgroundColor: sage, borderRadius: '26px', padding: '0 0 7px' }}>
            <Section
              style={{
                backgroundColor: white,
                border: `3px solid ${olive}`,
                borderRadius: '24px',
                padding: '36px 28px 30px',
                textAlign: 'center',
              }}
            >
              <Text style={{ margin: 0, fontSize: '46px', lineHeight: '46px' }}>👀</Text>

              <Heading
                as="h1"
                style={{
                  margin: '14px 0 0',
                  fontFamily: serif,
                  fontSize: '28px',
                  lineHeight: '34px',
                  fontWeight: 700,
                  color: ink,
                }}
              >
                Someone&apos;s about to write to you
              </Heading>

              <Text
                style={{
                  margin: '12px 0 0',
                  fontSize: '15px',
                  lineHeight: '23px',
                  color: muted,
                }}
              >
                Pop in this code and <strong style={{ color: ink }}>@{username}</strong> goes live.
                Then your link is ready to share.
              </Text>

              {/* Single text node with letter-spacing: copies cleanly as one number. */}
              <Section
                style={{
                  margin: '24px 0 0',
                  backgroundColor: paper,
                  border: `2px dashed ${moss}`,
                  borderRadius: '16px',
                  padding: '18px 10px',
                }}
              >
                <Text
                  style={{
                    margin: 0,
                    fontFamily: mono,
                    fontSize: '34px',
                    lineHeight: '40px',
                    fontWeight: 700,
                    letterSpacing: '9px',
                    textIndent: '9px',
                    color: olive,
                    textAlign: 'center',
                  }}
                >
                  {otp}
                </Text>
              </Section>

              <Text style={{ margin: '10px 0 0', fontSize: '13px', color: muted }}>
                Select the code to copy it — or skip that and tap below.
              </Text>

              {verifyUrl && (
                <Button
                  href={verifyUrl}
                  style={{
                    display: 'block',
                    margin: '20px auto 0',
                    backgroundColor: clay,
                    color: white,
                    borderRadius: '12px',
                    padding: '14px 22px',
                    fontSize: '15px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    textAlign: 'center',
                  }}
                >
                  Verify my email →
                </Button>
              )}

              <Text style={{ margin: '14px 0 0', fontSize: '12px', color: muted }}>
                Good for one hour. One use only.
              </Text>
            </Section>
          </Section>

          <Text
            style={{
              margin: '26px 0 0',
              textAlign: 'center',
              fontFamily: serif,
              fontSize: '17px',
              lineHeight: '26px',
              color: olive,
            }}
          >
            Nobody will know who writes.
            <br />
            Only you&apos;ll know what they said. 🤫
          </Text>

          <Hr style={{ margin: '28px 0 0', border: 'none', borderTop: `1px solid ${sage}` }} />

          <Text style={{ margin: '18px 0 0', fontSize: '13px', lineHeight: '20px', color: muted }}>
            Didn&apos;t sign up? Someone probably mistyped their email. You can ignore this — no
            inbox is created until the code is used.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
