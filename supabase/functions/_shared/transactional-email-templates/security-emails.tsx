/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Button, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// Security notices use FIXED copy. Only a few validated values are injected,
// so these templates cannot be abused to send arbitrary content.
interface Props {
  code?: string
  device?: string
  when?: string
  revokeUrl?: string
}

const REVOKE_PREFIX = 'https://kikiwarrior.com/security/revoke?token='
const safeCode = (c?: string) => (c && /^\d{6}$/.test(c) ? c : '------')
const safeDevice = (d?: string) => (d ? String(d).slice(0, 160) : 'Unknown device')
const safeWhen = (w?: string) => (w ? String(w).slice(0, 60) : new Date().toUTCString())
const safeRevoke = (u?: string) =>
  u && u.startsWith(REVOKE_PREFIX) && /^[A-Za-z0-9_-]+$/.test(u.slice(REVOKE_PREFIX.length)) ? u : undefined

const Layout = ({ preview, heading, lines, button }: {
  preview: string
  heading: string
  lines: string[]
  button?: { label: string; url?: string }
}) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{preview}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>{heading}</Heading>
        {lines.map((l, i) => (
          <Text key={i} style={text}>{l}</Text>
        ))}
        {button?.url ? (
          <Button style={btn} href={button.url}>{button.label}</Button>
        ) : null}
        <Text style={footer}>This is a security notice from Kiki Warrior.</Text>
      </Container>
    </Body>
  </Html>
)

const StepUp = (p: Props) => (
  <Layout
    preview="Your Kiki Warrior sign-in code"
    heading={`Sign-in code: ${safeCode(p.code)}`}
    lines={[
      `Your Kiki Warrior sign-in code is ${safeCode(p.code)}. It expires in 10 minutes.`,
      'If you did not try to sign in, change your password.',
    ]}
  />
)

const NewSignin = (p: Props) => (
  <Layout
    preview="New sign-in to your Kiki Warrior account"
    heading="New sign-in"
    lines={[
      'There was a new sign-in to your Kiki Warrior account.',
      `When: ${safeWhen(p.when)}. Device: ${safeDevice(p.device)}.`,
      'If this was you, there is nothing to do. If it was not you, tap the button below to sign out everywhere.',
    ]}
    button={{ label: "This wasn't me", url: safeRevoke(p.revokeUrl) }}
  />
)

const AccountLocked = (p: Props) => (
  <Layout
    preview="Your Kiki Warrior account was paused"
    heading="Account paused"
    lines={[
      'Your Kiki Warrior account was paused after several failed sign-in attempts.',
      `When: ${safeWhen(p.when)}. Approximate device: ${safeDevice(p.device)}.`,
      'If this was you, wait a little and try again. If it was not you, we recommend changing your password.',
    ]}
  />
)

const SessionLimit = (p: Props) => (
  <Layout
    preview="You were signed out on another device"
    heading="Signed out on another device"
    lines={[
      'You were signed out on another device because your account was signed in on a new one.',
      `New sign-in: ${safeWhen(p.when)} on ${safeDevice(p.device)}.`,
      'If this was not you, change your password straight away.',
    ]}
  />
)

const PasswordChanged = (p: Props) => (
  <Layout
    preview="Your Kiki Warrior password was changed"
    heading="Password changed"
    lines={[
      'Your Kiki Warrior password was changed and other devices have been signed out.',
      `When: ${safeWhen(p.when)}. Device: ${safeDevice(p.device)}.`,
      'If you did not do this, tap the button below straight away.',
    ]}
    button={{ label: "This wasn't me", url: safeRevoke(p.revokeUrl) }}
  />
)

const PinLocked = (p: Props) => (
  <Layout
    preview="Your Kiki Warrior parent PIN was locked"
    heading="Parent PIN locked"
    lines={[
      'Someone entered the wrong parent PIN several times, so parent areas are locked for a while.',
      `When: ${safeWhen(p.when)}. Device: ${safeDevice(p.device)}.`,
      'If this was not you or your family, sign in and change your password.',
    ]}
  />
)

const preview = { when: 'Sat, 10 Oct 2026 14:00:00 GMT', device: 'Chrome on Windows' }

export const securityStepupCode = {
  component: StepUp, subject: 'Your Kiki Warrior sign-in code', displayName: 'Security: sign-in code',
  previewData: { code: '123456' },
} satisfies TemplateEntry
export const securityNewSignin = {
  component: NewSignin, subject: 'New sign-in to your Kiki Warrior account', displayName: 'Security: new sign-in',
  previewData: { ...preview, revokeUrl: `${REVOKE_PREFIX}example` },
} satisfies TemplateEntry
export const securityAccountLocked = {
  component: AccountLocked, subject: 'Your Kiki Warrior account was paused', displayName: 'Security: account paused',
  previewData: preview,
} satisfies TemplateEntry
export const securitySessionLimit = {
  component: SessionLimit, subject: 'You were signed out on another device', displayName: 'Security: signed out elsewhere',
  previewData: preview,
} satisfies TemplateEntry
export const securityPasswordChanged = {
  component: PasswordChanged, subject: 'Your Kiki Warrior password was changed', displayName: 'Security: password changed',
  previewData: { ...preview, revokeUrl: `${REVOKE_PREFIX}example` },
} satisfies TemplateEntry
export const securityPinLocked = {
  component: PinLocked, subject: 'Your Kiki Warrior parent PIN was locked', displayName: 'Security: PIN locked',
  previewData: preview,
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px', fontWeight: 'bold' as const, fontFamily: "'Oswald', Arial, sans-serif", color: '#2b3440',
  margin: '0 0 20px', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
}
const text = { fontSize: '15px', color: '#636b75', lineHeight: '1.6', margin: '0 0 20px' }
const btn = {
  backgroundColor: '#d97b2a', color: '#ffffff', fontSize: '14px', fontWeight: 'bold' as const,
  fontFamily: "'Oswald', Arial, sans-serif", borderRadius: '12px', padding: '14px 28px', textDecoration: 'none',
  textTransform: 'uppercase' as const, letterSpacing: '1px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
