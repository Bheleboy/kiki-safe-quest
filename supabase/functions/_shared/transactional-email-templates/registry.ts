import type * as React from 'npm:react@18.3.1'
import {
  securityAccountLocked, securityNewSignin, securityPasswordChanged, securityPinLocked,
  securitySessionLimit, securityStepupCode,
} from './security-emails.tsx'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  to?: string
}

export const TEMPLATES: Record<string, TemplateEntry> = {
  'security-stepup-code': securityStepupCode,
  'security-new-signin': securityNewSignin,
  'security-account-locked': securityAccountLocked,
  'security-session-limit': securitySessionLimit,
  'security-password-changed': securityPasswordChanged,
  'security-pin-locked': securityPinLocked,
}
