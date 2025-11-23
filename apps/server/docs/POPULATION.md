# Database Population Service

The database population service allows you to bootstrap your Shurai database with predefined dummy data for development and testing purposes.

## Configuration

Add the `POPULATE_ON_EMPTY` environment variable to your `.env` file in `apps/server`:

```bash
# Population mode options: NONE, ASSETS, FULL
POPULATE_ON_EMPTY=NONE
```

## Population Modes

### `NONE` (Default)
No data will be populated. Use this for production or when you want to start with an empty database.

### `ASSETS`
Populates only global assets and creates a system user:
- 1 system user with profile
- 17 global assets:
  - 10 PC component icons (PC, Monitor, Keyboard, Mouse, GPU, CPU, RAM, Storage, Headset, Webcam)
  - 3 cover images (Dark Setup, Minimalist Setup, RGB Setup)
  - 4 theme presets (Dark, Light, Cyberpunk, Nature)

**Use case:** When you want to provide users with a library of predefined assets to use in their workspaces.

### `FULL`
Populates a complete dataset including:
- 3 users (system + 2 demo users with profiles)
- 22 assets (17 global + 5 user-specific)
- 3 workspaces (2 public with shareable slugs, 1 private)
- 10 workspace items with proper hierarchy and asset references

**Use case:** For development, testing, or demo environments where you need realistic sample data.

## Behavior

- **Idempotent**: The service checks for existing data before populating. If users already exist, it skips population to avoid duplicates.
- **Automatic**: Population runs automatically during application startup via the loader system.
- **Logging**: All population activities are logged for debugging and verification.

## Example Usage

### Development with Full Data
```bash
# In apps/server/.env
POPULATE_ON_EMPTY=FULL

# Start the server
bun run dev
```

### Production
```bash
# In apps/server/.env
POPULATE_ON_EMPTY=NONE

# Start the server
bun run start
```

### Providing Assets to New Users
```bash
# In apps/server/.env
POPULATE_ON_EMPTY=ASSETS

# Start the server
bun run dev
```

## Testing

The population service has comprehensive test coverage. Run tests with:

```bash
cd apps/server
bun test test/population.test.ts
```

## Implementation Details

### File Structure
- `apps/server/src/constants/global-assets.ts` - Definitions of global assets
- `apps/server/src/services/population.service.ts` - Population logic
- `apps/server/src/loaders/population.loader.ts` - Integration with app startup
- `apps/server/test/population.test.ts` - Test suite

### Data Generated

**Demo Users:**
- `demo-user-1` (Demo User): Owner of public gaming setup and private work setup
- `demo-user-2` (Alice Johnson): Owner of minimalist productivity setup

**Public Workspaces:**
- "My Gaming Battlestation 2024" (slug: `demo-gaming-setup-2024`)
- "Minimalist Productivity Setup" (slug: `alice-minimal-setup`)

**Private Workspaces:**
- "Work From Home Setup"

All workspaces contain realistic items with proper parent-child relationships and asset references.

## Notes

- The `_id` values are randomly generated using `ObjectIdString()` helper, so they will be different on each fresh population.
- Global assets are owned by the system user to ensure they persist independently of regular user accounts.
- The service uses structured logging for observability during startup.
