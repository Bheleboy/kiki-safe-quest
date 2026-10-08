# Architecture rules
- Homepage section exports live in a dedicated landing module and derive lesson/module/reward counts from existing course and armour data to prevent duplicated content drifting.
- Homepage actions use the shared Button with asChild for navigation; auth and cookie consent remain owned by the existing application shell.
