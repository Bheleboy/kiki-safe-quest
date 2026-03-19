/// <reference types="npm:@types/react@18.3.1" />

import * as React from 'npm:react@18.3.1'

import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
} from 'npm:@react-email/components@0.0.22'

interface RecoveryEmailProps {
  siteName: string
  confirmationUrl: string
}

export const RecoveryEmail = ({
  siteName,
  confirmationUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Reset your Kiki Warrior password</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Reset Your Password 🔑</Heading>
        <Text style={text}>
          We received a request to reset your Kiki Warrior password. Click
          the button below to choose a new one.
        </Text>
        <Button style={button} href={confirmationUrl}>
          Reset Password
        </Button>
        <Text style={footer}>
          If you didn't request this, you can safely ignore this email. Your password won't be changed.
        </Text>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail

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
