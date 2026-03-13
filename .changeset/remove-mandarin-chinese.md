---
default: patch
---

Remove Mandarin Chinese from the project:

- delete `README.zh.md` and `docs/DEMO-SCRIPT.zh.md`
- remove `zh` locale from core types, i18n, and locales
- remove Chinese keywords from ant-colony parser regex patterns
- remove Chinese detection from colony status and scout quorum
- translate Chinese JSDoc comments to English
- update language selectors across all READMEs
