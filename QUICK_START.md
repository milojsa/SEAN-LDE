# LDE Editor Module - Quick Start Guide

## 30-Second Setup

```bash
cd c:\Users\Administrator\Documents\Sean\lde-editor-module

npm install
npm run dev
```

Open browser: `http://localhost:3001`

---

## What You Get

✅ **Standalone Editor** - No FWScomments dependency  
✅ **Mock Data** - No backend setup required  
✅ **Full TypeScript** - Type-safe development  
✅ **Ready to Integrate** - Adapter pattern for FWScomments (later)

---

## Directory Structure

```
lde-editor-module/
├── src/
│   ├── adapters/          # Storage, Auth, Gallery, Export
│   ├── models/            # LayoutDocument, Page, Element schemas
│   ├── core/              # Canvas, tools, undo/redo (to implement)
│   ├── ui/                # React components (to implement)
│   ├── export/            # PNG, PDF, HTML exporters (to implement)
│   └── index.ts           # Module entry point
├── docs/
│   ├── MS2_SCOPE_TECHNICAL.md    # Feature list & phases
│   └── COMPATIBILITY_GUIDE.md    # Integration checklist
├── package.json           # 0.1.0 version
├── tsconfig.json          # Strict mode
├── .env.example           # Configuration template
├── README.md              # Full integration guide
├── CHANGELOG.md           # Version history
└── QUICK_START.md         # This file
```

---

## Running Commands

```bash
# Install dependencies
npm install

# Development server (port 3001)
npm run dev

# Type checking
npm run type-check

# Linting
npm run lint

# Production build
npm run build

# Start production server
npm run start
```

---

## Development Phases

### Phase 1: Canvas Foundation
- Build canvas UI with Fabric.js
- Implement text, image, shape tools
- Add element selection and properties

### Phase 2: Document Management
- Implement autosave
- Connect storage adapter (mock)
- Build save/load/delete UI

### Phase 3: Asset Gallery
- Create image/text gallery
- Implement drag-and-drop
- Connect gallery adapter

### Phase 4: Export Pipeline
- Build PNG, PDF, HTML exporters
- Add download functionality
- Implement batch export

### Phase 5: Deployment
- Deploy to Vercel or Render
- Performance optimization
- User testing

---

## Key Files to Know

| File | Purpose |
| --- | --- |
| `src/adapters/index.ts` | Create mock adapters with `createMockAdapters()` |
| `src/models/layout.ts` | Understand LayoutDocument structure |
| `src/ui/index.ts` | Main EditorComponent goes here |
| `README.md` | Integration guide for FWScomments |
| `docs/MS2_SCOPE_TECHNICAL.md` | Feature list and timeline |

---

## Using Mock Adapters

All adapters are included as mocks. When initializing the editor:

```typescript
import { createMockAdapters, EditorComponent } from 'lde-editor-module';

const adapters = createMockAdapters();

// Now you can use the editor standalone without any backend
<EditorComponent adapters={adapters} projectId="test-project" />
```

Mock data includes:
- ✅ Two sample images
- ✅ Two sample review texts
- ✅ In-memory layout storage
- ✅ Mock user session

---

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
cp .env.example .env.local
```

Edit for your setup:
```env
# Optional - only if connecting to real MongoDB during dev
MONGODB_URI=mongodb+srv://...
MONGODB_DB_NAME=lde_editor_dev

# Canvas settings
CANVAS_ENGINE=fabric
UNDO_DEPTH=10
AUTOSAVE_INTERVAL_MS=5000

# Export settings
EXPORT_MAX_WIDTH=7.5
EXPORT_MAX_HEIGHT=10
EXPORT_DPI=300
```

---

## Testing the Editor (Standalone)

1. Run `npm run dev`
2. Open `http://localhost:3001` in browser
3. Create a new layout
4. Add text, images, shapes
5. Test undo/redo
6. Export to PNG/PDF/HTML
7. Reload page - layout should persist (mock storage)

---

## Troubleshooting

### Port 3001 already in use
```bash
# Kill process on port 3001
lsof -i :3001 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or use different port
npm run dev -- -p 3002
```

### TypeScript errors
```bash
npm run type-check
```

### Dependencies outdated
```bash
npm update
```

### Node version mismatch
```bash
node --version  # Should be v22.16.0
nvm use 22.16.0  # If using nvm
```

---

## Next Steps After Setup

1. **Understand the Data Model** (`src/models/layout.ts`)
2. **Review Adapter Contracts** (`src/adapters/*.ts`)
3. **Read Integration Guide** (`README.md`)
4. **Start Phase 1**: Canvas implementation with Fabric.js

---

## Integration (MS3+)

When ready to integrate into FWScomments:

1. Implement 4 adapters in FWScomments
2. Import EditorComponent
3. Pass real adapters to editor
4. Mount in dashboard or request page

See `README.md` for full integration instructions.

---

## Support

- **Module Questions**: Review `src/adapters/` for contract details
- **Data Model**: See `src/models/layout.ts`
- **Integration**: Read `README.md` and `docs/COMPATIBILITY_GUIDE.md`

---

**Version**: 0.1.0  
**Last Updated**: 2026-05-12  
**Status**: Ready for Phase 1 Implementation
