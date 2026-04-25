# Documentation Index (Start Here)

This file helps any new team member quickly understand where each product decision is documented.

## Core Product Docs

- `C02_SLA_Product_Blueprint.md`
  - product direction, stack, architecture approach
  - AI boundaries, data strategy, scalability principles
- `C02_Winning_Checklist_Menus_Routes.md`
  - complete feature checklist
  - menu/navigation structure
  - route map, MVP cut, wow features, rubric mapping

## Engineering Rules (Cursor)

- `.cursor/rules/nextjs-production-core.mdc`
  - production coding standards
- `.cursor/rules/nextjs-clean-architecture.mdc`
  - SOLID + clean architecture boundaries
- `.cursor/rules/nextjs-typescript-react-quality.mdc`
  - TypeScript/React quality and consistency standards

## Recommended Read Order for New Resources

1. `C02_SLA_Product_Blueprint.md`
2. `C02_Winning_Checklist_Menus_Routes.md`
3. `.cursor/rules/nextjs-production-core.mdc`
4. `.cursor/rules/nextjs-clean-architecture.mdc`
5. `.cursor/rules/nextjs-typescript-react-quality.mdc`

## Ownership and Change Control

- Product-level decisions go to `C02_SLA_Product_Blueprint.md`
- Feature and route changes go to `C02_Winning_Checklist_Menus_Routes.md`
- Engineering behavior updates go to `.cursor/rules/*.mdc`

## Documentation Update Rule

Whenever a major feature, architecture, or workflow changes:

1. update the relevant core doc
2. update this index if a new doc is added
3. add a short "what changed and why" note in the changed file
