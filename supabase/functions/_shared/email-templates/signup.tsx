/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface SignupEmailProps {
  siteName: string
  siteUrl: string
  recipient: string
  confirmationUrl: string
}

export const SignupEmail = ({
  siteName,
  siteUrl,
  recipient,
  confirmationUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Welcome to Kiki Warrior — verify your email to get started!</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Welcome, Warrior! 🛡️</Heading>
        <Text style={text}>
          Thanks for joining{' '}
          <Link href={siteUrl} style={link}>
            <strong>Kiki Warrior</strong>
          </Link>
          — internet safety for families.
        </Text>
        <Text style={text}>
          Please verify your email address (
          <Link href={`mailto:${recipient}`} style={link}>
            {recipient}
          </Link>
          ) to activate your parent account and start protecting your family online.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Verify My Email
        </Button>
        <Text style={footer}>
          If you didn't create a Kiki Warrior account, you can safely ignore this email.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px',
  fontWeight: 'bold' as const,
  fontFamily: "'Oswald', Arial, sans-serif",
  color: '#2b3440',
  margin: '0 0 20px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px',
}
const text = {
  fontSize: '15px',
  color: '#636b75',
  lineHeight: '1.6',
  margin: '0 0 24px',
}
const link = { color: '#d97b2a', textDecoration: 'underline' }
const button = {
  backgroundColor: '#d97b2a',
  color: '#ffffff',
  fontSize: '14px',
  fontWeight: 'bold' as const,
  fontFamily: "'Oswald', Arial, sans-serif",
  borderRadius: '12px',
  padding: '14px 28px',
  textDecoration: 'none',
  textTransform: 'uppercase' as const,
  letterSpacing: '1px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
