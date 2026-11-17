/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// Receipt with FIXED copy. Only validated, length-limited values are injected.
interface Item { label?: string; amount?: string }
interface Props { orderNumber?: string; items?: Item[]; amount?: string; date?: string; kind?: string; hasKits?: boolean; businessName?: string }

const safeOrder = (v?: string) => (v && /^KW-[A-Z0-9]{4,12}$/.test(v) ? v : 'KW-ORDER')
const safeAmount = (v?: string) => (v && /^R\d{1,6}\.\d{2}$/.test(v) ? v : '')
const safeText = (v?: string, max = 120) => (v ? String(v).replace(/[<>]/g, '').slice(0, max) : '')
const safeBusiness = (v?: string) => {
  const t = safeText(v, 80).replace(/[{}]/g, '').trim()
  return t.length >= 2 ? t : 'Boss Moves Media'
}

const Receipt = (p: Props) => {
  const items = (Array.isArray(p.items) ? p.items : []).slice(0, 12)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Your Kiki Warrior receipt</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Thank you for your order</Heading>
          <Text style={text}>
            {p.kind === 'book'
              ? "Your payment was received. Kiki's Armour of God, Premium Edition is ready to download in the Family library on your parent dashboard."
              : p.kind === 'extra_kit'
                ? 'Your payment was received and your Armour Kit order is confirmed.'
                : 'Your payment was received and the Warrior Pass is now active for your family.'}
          </Text>
          <Text style={label}>Sold by: {safeBusiness(p.businessName)}</Text>
          <Text style={label}>Order number: {safeOrder(p.orderNumber)}</Text>
          <Text style={label}>Date: {safeText(p.date, 40)}</Text>
          {items.map((it, i) => (
            <Text key={i} style={row}>{safeText(it.label)}: {safeAmount(it.amount)}</Text>
          ))}
          <Text style={total}>Total paid: {safeAmount(p.amount)}</Text>
          {p.hasKits === true && (
            <Text style={text}>Each Armour Kit holds one Armour of God coin and one Armour of God wristband. It is posted when that child finishes the course, and we will email you tracking details when it is sent.</Text>
          )}
          <Text style={footer}>This is a receipt from {safeBusiness(p.businessName)} for Kiki Warrior. Keep it for your records.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const warriorPassReceipt = {
  component: Receipt,
  subject: 'Your Kiki Warrior receipt',
  displayName: 'Warrior Pass: receipt',
  previewData: {
    orderNumber: 'KW-1A2B3C4D',
    kind: 'family_pass',
    hasKits: true,
    businessName: 'Boss Moves Media',
    items: [
      { label: 'Family Warrior Pass (Founding Family price)', amount: 'R149.00' },
      { label: 'Armour Kit for Thandi', amount: 'R99.00' },
      { label: 'Delivery to a Courier Guy locker', amount: 'R65.00' },
    ],
    amount: 'R313.00',
    date: '14 November 2026',
  },
} satisfies TemplateEntry

// Refund confirmation. FIXED copy; only a validated order number and amount are injected.
interface RefundProps { orderNumber?: string; amount?: string; kind?: string }

const Refunded = (p: RefundProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Kiki Warrior refund</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Your refund is on its way</Heading>
        <Text style={text}>We have refunded your Kiki Warrior order. Card refunds usually reach your account within 5 to 10 working days, depending on your bank.</Text>
        <Text style={label}>Order number: {safeOrder(p.orderNumber)}</Text>
        {safeAmount(p.amount) ? <Text style={total}>Refunded: {safeAmount(p.amount)}</Text> : null}
        {p.kind === 'family_pass' ? (
          <Text style={text}>The Warrior Pass on this order is no longer active. Lessons your children have already finished stay open.</Text>
        ) : p.kind === 'book' ? (
          <Text style={text}>The book on this order is no longer in your Family library.</Text>
        ) : null}
        <Text style={text}>If you did not expect this refund, reply to this email and we will help.</Text>
        <Text style={footer}>This is a refund confirmation from Kiki Warrior. Keep it for your records.</Text>
      </Container>
    </Body>
  </Html>
)

export const orderRefunded = {
  component: Refunded,
  subject: 'Your Kiki Warrior refund',
  displayName: 'Warrior Pass: refund',
  previewData: { orderNumber: 'KW-1A2B3C4D', amount: 'R249.00', kind: 'family_pass' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px', fontWeight: 'bold' as const, fontFamily: "'Oswald', Arial, sans-serif", color: '#2b3440',
  margin: '0 0 20px', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
}
const text = { fontSize: '15px', color: '#636b75', lineHeight: '1.6', margin: '0 0 20px' }
const label = { fontSize: '14px', color: '#2b3440', margin: '0 0 6px' }
const row = { fontSize: '14px', color: '#636b75', margin: '0 0 6px', paddingLeft: '8px' }
const total = { fontSize: '16px', fontWeight: 'bold' as const, color: '#2b3440', margin: '14px 0 20px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
