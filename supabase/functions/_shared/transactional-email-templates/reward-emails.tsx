/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'
import { Body, Container, Head, Heading, Html, Preview, Text } from 'npm:@react-email/components@0.0.22'
import type { TemplateEntry } from './registry.ts'

// Armour Kit earned. FIXED copy; only a first name and a delivery point are injected, both cleaned and length-limited.
interface Props { childName?: string; deliveryPoint?: string | null }

const safeName = (v?: string) => {
  const t = v ? String(v).replace(/[<>{}]/g, '').trim().slice(0, 40) : ''
  return t || 'Your child'
}
const safeText = (v?: string | null, max = 160) => (v ? String(v).replace(/[<>{}]/g, '').trim().slice(0, max) : '')

/** What is inside the kit. Shown as fixed copy in the email. */
export const KIT_CONTENTS = [
  'The Kiki Warrior Armour Kit, the physical reward for finishing every lesson',
]

const RewardUnlocked = (p: Props) => {
  const name = safeName(p.childName)
  const point = safeText(p.deliveryPoint)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${name} has earned the Armour Kit`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{name} has earned the Armour Kit</Heading>
          <Text style={text}>{name} finished every lesson in the Kiki Warrior course. Well done to you both.</Text>
          <Text style={label}>What is in the kit</Text>
          {KIT_CONTENTS.map((c) => <Text key={c} style={row}>{c}</Text>)}
          {point ? (
            <>
              <Text style={label}>Delivery point on file</Text>
              <Text style={row}>{point}</Text>
              <Text style={text}>We are getting it ready. You will get tracking details by email when it ships.</Text>
            </>
          ) : (
            <Text style={text}>
              We need your delivery details before we can send it. Open the parent dashboard on Kiki Warrior and add them under Warrior Pass. You will get tracking details by email when it ships.
            </Text>
          )}
          <Text style={footer}>You are receiving this because your family has the Kiki Warrior Pass.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const rewardUnlocked = {
  component: RewardUnlocked,
  subject: (data: Record<string, any>) => `${safeName(data?.childName)} has earned the Armour Kit`,
  displayName: 'Warrior Pass: Armour Kit earned',
  previewData: { childName: 'Thandi', deliveryPoint: '12 Acacia Road, Parkhurst, Johannesburg, 2193' },
} satisfies TemplateEntry

// Armour Kit shipped. FIXED copy; child names, courier, waybill and an https tracking link are cleaned and length-limited.
interface ShippedProps { childNames?: string[]; courier?: string; waybill?: string; trackingUrl?: string | null }

const safeUrl = (v?: string | null) => {
  if (!v || typeof v !== 'string' || v.length > 500) return ''
  try { const u = new URL(v); return u.protocol === 'https:' ? u.toString() : '' } catch { return '' }
}

const RewardShipped = (p: ShippedProps) => {
  const names = (Array.isArray(p.childNames) ? p.childNames : []).slice(0, 8).map((n) => safeName(n))
  const who = names.length === 0 ? 'Your Armour Kit' : names.length === 1 ? `${names[0]}'s Armour Kit` : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}'s Armour Kits`
  const courier = safeText(p.courier, 60)
  const waybill = safeText(p.waybill, 60)
  const url = safeUrl(p.trackingUrl)
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>{`${who} is on its way`}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>{who} is on its way</Heading>
          <Text style={text}>Good news. The parcel has left us and is on its way to the delivery point you gave us.</Text>
          {courier ? (<><Text style={label}>Courier</Text><Text style={row}>{courier}</Text></>) : null}
          {waybill ? (<><Text style={label}>Tracking number</Text><Text style={row}>{waybill}</Text></>) : null}
          {url ? (<><Text style={label}>Track the parcel</Text><Text style={row}><a href={url} style={link}>{url}</a></Text></>) : null}
          <Text style={text}>If anything looks wrong with the delivery, reply to this email and we will help.</Text>
          <Text style={footer}>You are receiving this because your family has the Kiki Warrior Pass.</Text>
        </Container>
      </Body>
    </Html>
  )
}

export const rewardShipped = {
  component: RewardShipped,
  subject: (data: Record<string, any>) => {
    const n = Array.isArray(data?.childNames) ? data.childNames.length : 0
    return n > 1 ? 'Your Armour Kits are on their way' : 'Your Armour Kit is on its way'
  },
  displayName: 'Warrior Pass: Armour Kit shipped',
  previewData: { childNames: ['Thandi'], courier: 'The Courier Guy', waybill: 'TCG123456789', trackingUrl: 'https://www.thecourierguy.co.za/tracking' },
} satisfies TemplateEntry

const main = { backgroundColor: '#ffffff', fontFamily: "'DM Sans', Arial, sans-serif" }
const container = { padding: '32px 28px' }
const h1 = {
  fontSize: '24px', fontWeight: 'bold' as const, fontFamily: "'Oswald', Arial, sans-serif", color: '#2b3440',
  margin: '0 0 20px', textTransform: 'uppercase' as const, letterSpacing: '0.5px',
}
const text = { fontSize: '15px', color: '#636b75', lineHeight: '1.6', margin: '0 0 20px' }
const label = { fontSize: '14px', fontWeight: 'bold' as const, color: '#2b3440', margin: '0 0 6px' }
const row = { fontSize: '14px', color: '#636b75', margin: '0 0 14px', paddingLeft: '8px' }
const footer = { fontSize: '12px', color: '#999999', margin: '32px 0 0' }
const link = { color: '#d9762b', textDecoration: 'underline' }
