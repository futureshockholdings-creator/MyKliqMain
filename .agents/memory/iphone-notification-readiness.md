---
name: iPhone notification readiness
description: User-confirmed home-screen badge recovery and limits of account-wide notification status.
---

Do not treat the in-app notification switch or another registered device as proof that the installed iPhone PWA has working notification permission and registration.

**Why:** After the corrected frontend and workers were live, the user reported no iPhone home-screen badge and no MyKliq Badges setting. The in-app push switch was already on. The user confirmed that turning it off and back on restored the home-screen bubble. This establishes recovery after re-enabling, not which underlying permission or subscription state was responsible.

**How to apply:** Distinguish account-wide push registration from readiness of the current installation. If the user reports this symptom again, check current-device permission and subscription before changing badge logic or recommending a reinstall. Avoid claiming the exact failure mechanism without device evidence.
