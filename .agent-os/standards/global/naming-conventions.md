# Standard: Global Naming Conventions
# Applies to: all code in this project

## Files and Folders
- Python files: snake_case (user_service.py, deal_router.py)
- React/TS files: PascalCase for components (DealCard.tsx), camelCase for hooks (useDealStore.ts)
- Folders: kebab-case (deal-detail/, api-client/)
- Test files: same name + .test suffix (deal_service.test.py, DealCard.test.tsx)

## Python (Backend)
- Classes: PascalCase (DealService, UserSchema)
- Functions/methods: snake_case (get_deal_by_id, create_user)
- Constants: UPPER_SNAKE_CASE (MAX_PAGE_SIZE, JWT_ALGORITHM)
- Private methods: prefix underscore (_validate_token)
- Type hints: always required on all function signatures

## TypeScript (Frontend)
- Components: PascalCase (PipelineBoard, DealCard)
- Hooks: camelCase, prefixed use (useDeals, useAuthStore)
- Types/Interfaces: PascalCase, no I-prefix (Deal, User, ApiResponse)
- Constants: UPPER_SNAKE_CASE (PIPELINE_STAGES, API_BASE_URL)
- Event handlers: prefixed handle (handleStageChange, handleSubmit)

## Database
- Tables: snake_case plural (users, deals, stage_histories)
- Columns: snake_case (first_name, created_at, owner_id)
- Foreign keys: {table_singular}_id (company_id, owner_id)
- Indexes: idx_{table}_{column} (idx_deals_owner_id)
- Constraints: uq_{table}_{column}, fk_{table}_{ref_table}

## API Routes
- Base path: /api/v1/
- Resources: lowercase plural nouns (/deals, /contacts, /companies)
- Nested: /deals/{id}/activities, /companies/{id}/contacts
- Actions that aren't CRUD: /deals/{id}/stage, /auth/refresh
