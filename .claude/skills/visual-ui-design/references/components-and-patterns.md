# Components and patterns

Select components by semantics and workflow before visual treatment or library availability. For each important component record its job, use/avoid conditions, priority, content rules, relevant states, keyboard/screen-reader/touch/responsive/localization behavior, and the visual variables allowed to change without changing meaning.

| Need | Prefer | Do not confuse with |
|---|---|---|
| Immediate action | Button | Navigation or persistent selection |
| Navigate | Link/navigation item | Momentary action |
| Choose one value | Radio/select/segmented control | Action buttons |
| Toggle setting | Switch/checkbox | Momentary action |
| Peer destinations | Tabs/navigation | Filter chips |
| Temporary contextual task | Dialog/sheet/popover | Unnecessary new page |
| Dense comparison | Table/list | Decorative card grid |

For dashboards, editors, search, settings, onboarding, media tools, and data entry: identify the dominant task and content unit; keep primary actions stable; define transitions/recovery; preserve context during comparison/editing; hide only genuinely secondary content; avoid nesting surfaces solely for decoration.
