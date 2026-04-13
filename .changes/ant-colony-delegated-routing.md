---
default: minor
---

Add delegated adaptive routing support for ant-colony.

- add default caste and worker-class routing categories for scouts, workers, soldiers, and specialized worker classes
- resolve colony models through adaptive-routing delegated policy when explicit model overrides are absent
- allow ant-colony config to override default routing categories without changing adaptive-routing policy
- include effective ant route details in the final colony report
