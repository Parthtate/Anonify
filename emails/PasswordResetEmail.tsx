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

interface PasswordResetEmailProps {
  username: string;
  resetUrl: string;
}

const paper = '#EEF1E4';
const white = '#FFFFFF';
const olive = '#51602E';
const sage = '#B3C186';
const clay = '#BC6C25';
const ink = '#2B2A26';
const muted = '#6B6A62';
const serif = "'Playfair Display', Georgia, 'Times New Roman', serif";
const sans = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";

export default function PasswordResetEmail({ username, resetUrl }: PasswordResetEmailProps) {
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
      <Preview>{`Reset the password for @${username} on Anonify`}</Preview>
      <Body style={{ margin: 0, padding: '32px 16px', backgroundColor: paper, fontFamily: sans }}>
        <Container style={{ width: '100%', maxWidth: '560px', margin: '0 auto' }}>
          <BrandMark />

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
              <Text style={{ margin: 0, fontSize: '46px', lineHeight: '46px' }}>🔑</Text>

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
                Let&apos;s get you back in
              </Heading>

              <Text style={{ margin: '12px 0 0', fontSize: '15px', lineHeight: '23px', color: muted }}>
                Someone asked to reset the password for{' '}
                <strong style={{ color: ink }}>@{username}</strong>. If that was you, pick a new
                one here.
              </Text>

              <Button
                href={resetUrl}
                style={{
                  display: 'block',
                  margin: '24px auto 0',
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
                Choose a new password →
              </Button>

              <Text style={{ margin: '14px 0 0', fontSize: '12px', color: muted }}>
                This link works once, and expires in an hour.
              </Text>
            </Section>
          </Section>

          <Hr style={{ margin: '28px 0 0', border: 'none', borderTop: `1px solid ${sage}` }} />

          <Text style={{ margin: '18px 0 0', fontSize: '13px', lineHeight: '20px', color: muted }}>
            Didn&apos;t ask for this? You can ignore this email — your password stays exactly as it
            is until this link is used.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}
