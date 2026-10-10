# Architecture rules
- Homepage section exports live in a dedicated landing module and derive lesson/module/reward counts from existing course and armour data to prevent duplicated content drifting.
- Homepage actions use the shared Button with asChild for navigation; auth and cookie consent remain owned by the existing application shell.
- Non-home presentation uses scoped editorial styles and shared public-page framing so visual consistency does not alter homepage composition or application behavior.
- Serve brand font weights locally through global font-face declarations to keep typography reliable without remote stylesheet dependencies.
- Password sign-in goes through the `secure-login` edge function and every data table carries a RESTRICTIVE `require_registered_session` policy; sessions must be registered in `user_sessions` (device-bound) or they cannot read/write data, so direct auth-API sessions are useless.
- Security edge functions share helpers in `supabase/functions/_shared/security.ts` and send branded notices through the existing `auth_emails` queue to avoid a second email pipeline.
