# LDE Editor Module - Integration Guide

**Version:** 0.1.0 (MS2 Standalone)  
**Status:** In Development  
**Last Updated:** 2026-05-12

---

## Overview

The Layout Design Editor (LDE) Module is a standalone visual editor for creating page-based layouts. It is designed to be deployed independently during MS2 for testing and refinement, then integrated into the main FWScomments application later.

### Key Architecture

- **Independent Module**: Lives outside the main FWScomments project
- **Adapter Pattern**: Uses pluggable adapters for storage, auth, gallery, and export
- **Standalone Ready**: Can run with mock adapters during MS2 or connect to real data with FWScomments adapters in MS3
- **Version Stable**: Semantic versioning ensures compatibility; breaking changes are documented

---

## Setup Instructions

### Prerequisites

- Node.js 22.16.0 or higher
- npm or yarn package manager

### 1. Initialize Module

```bash
# Clone or navigate to the module folder
cd lde-editor-module

# Install dependencies
npm install

# Create .env.local from template
cp .env.example .env.local

# Edit .env.local with your MongoDB URI for standalone development
# (If you're using mock adapters, this is optional)
```

### 2. Run Standalone (MS2)

```bash
# Development server on port 3001
npm run dev

# Open browser to http://localhost:3001
```

The standalone version uses `MockAdapters` by default, so you can test the editor UI without any backend dependencies.

### 3. Build and Export

```bash
# Compile TypeScript
npm run type-check

# Production build
npm build

# This creates dist/ folder with compiled module
```

---

## Adapter Interfaces

The editor communicates with the outside world through four pluggable adapters:

### 1. **StorageAdapter** (`src/adapters/storage.ts`)

Persists layouts to a database.

```typescript
interface StorageAdapter {
  saveLayout(document: LayoutDocument): Promise<LayoutDocument>;
  loadLayout(layoutId: string): Promise<LayoutDocument>;
  deleteLayout(layoutId: string): Promise<void>;
  listLayouts(projectId: string): Promise<LayoutDocument[]>;
  checkOwnership(layoutId: string): Promise<boolean>;
}
```

**FWScomments Implementation** (MS3+):
- Save/load layouts from MongoDB `layouts` collection
- Enforce ownership checks against logged-in user
- Increment version on each save for audit trail

### 2. **AuthAdapter** (`src/adapters/auth.ts`)

Provides user context and permissions.

```typescript
interface AuthAdapter {
  getCurrentUser(): Promise<UserContext>;
  getProjectContext(): Promise<{ projectId: string; requestId?: string } | null>;
  checkPermission(action: string): Promise<boolean>;
  logAction(action: string, metadata?: Record<string, any>): Promise<void>;
}
```

**FWScomments Implementation** (MS3+):
- Return NextAuth session user
- Pull project/request from URL params or database
- Check Stripe subscription for export limits
- Log actions to `userActivities` collection for analytics

### 3. **GalleryAdapter** (`src/adapters/gallery.ts`)

Loads project assets (images, texts) for the editor to display.

```typescript
interface GalleryAdapter {
  getProjectImages(projectId: string): Promise<ProjectAsset[]>;
  getProjectTexts(projectId: string): Promise<ProjectAsset[]>;
  getRequestContent(requestId: string): Promise<{ images, texts }>;
  uploadImage(projectId: string, file: File): Promise<ProjectAsset>;
  getAssetPreview(assetId: string): Promise<string>;
}
```

**FWScomments Implementation** (MS3+):
- Query `uploads` and `reviews` collections for images
- Extract text from review comments
- Integrate with Cloudinary for image storage
- Implement permission checks for cross-project access

### 4. **ExportAdapter** (`src/adapters/export.ts`)

Generates PNG, PDF, and HTML exports of layouts.

```typescript
interface ExportAdapter {
  exportPNG(layoutId: string, options?): Promise<ExportResult>;
  exportPDF(layoutId: string, options?): Promise<ExportResult>;
  exportHTML(layoutId: string, options?): Promise<ExportResult>;
  getExportHistory(layoutId: string): Promise<ExportEntry[]>;
}
```

**FWScomments Implementation** (MS3+):
- Use existing Puppeteer pipeline for PDF
- Leverage html2canvas for PNG
- Implement rate limiting per subscription tier
- Store export history in `layoutExports` collection

---

## Data Model Contract

All layouts conform to the `LayoutDocument` interface (src/models/layout.ts):

```typescript
interface LayoutDocument {
  _id?: string;              // MongoDB ObjectId
  projectId: string;         // FK to FWScomments project
  requestId?: string;        // FK to email request (optional)
  ownerId: string;           // FK to user
  title: string;
  pages: Page[];             // MS2: single page; extensible
  currentPageIndex: number;  // default 0
  version: number;           // for migration tracking
  status: 'draft' | 'published' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}
```

### Page Dimensions (MS2)

- **Default**: 7.5 × 10 inches (printable area)
- **Margins**: 0.5 inches on all sides
- **Color**: White background (#ffffff)

---

## Integration into FWScomments (MS3+)

### When Ready to Integrate

1. **Implement Adapters**

   Create adapter implementations in FWScomments:
   ```typescript
   // src/lib/lde-editor/adapters.ts
   import { StorageAdapter, AuthAdapter, GalleryAdapter, ExportAdapter } from 'lde-editor-module';

   export class FWSStorageAdapter implements StorageAdapter {
     async saveLayout(document: LayoutDocument): Promise<LayoutDocument> {
       const db = await clientPromise;
       return db.collection('layouts').insertOne(document);
     }
     // ... implement other methods
   }

   export class FWSAuthAdapter implements AuthAdapter {
     constructor(session: Session) { this.session = session; }
     async getCurrentUser(): Promise<UserContext> {
       return {
         userId: this.session.user.id,
         email: this.session.user.email,
         projectId: getProjectFromRequest(),
         role: 'owner',
       };
     }
     // ... implement other methods
   }
   ```

2. **Mount Editor Component**

   In dashboard or request page:
   ```typescript
   import { EditorComponent } from 'lde-editor-module';
   import { FWSStorageAdapter, FWSAuthAdapter, FWSGalleryAdapter, FWSExportAdapter } from '@/lib/lde-editor/adapters';

   export default function LayoutPage({ projectId, requestId }) {
     const adapters = {
       storage: new FWSStorageAdapter(),
       auth: new FWSAuthAdapter(session),
       gallery: new FWSGalleryAdapter(projectId),
       export: new FWSExportAdapter(projectId),
     };

     return <EditorComponent adapters={adapters} layoutId={layoutId} />;
   }
   ```

3. **Migrate Existing Data**

   Move old PDF template layouts to new format:
   ```bash
   npm run migrate-layouts   # FWScomments task to run
   ```

---

## Versioning and Compatibility

### Semantic Versioning

- **0.1.0 (MS2)**: Initial standalone release
  - Single-page layouts
  - Fabric.js canvas engine
  - Mock adapters for testing
  - PNG, PDF, HTML exports

- **0.2.0 (MS3)**: Integration release
  - FWScomments adapters included
  - Same adapter contracts (backward compatible)
  - Performance optimizations

- **1.0.0 (Future)**: Stable API
  - Multi-page support (breaking change to LayoutDocument)
  - Additional canvas engines (Konva.js option)
  - Collaboration features

### Compatibility Matrix

| Editor Version | FWScomments Version | Status |
| --- | --- | --- |
| 0.1.x | Any | Standalone (mock adapters only) |
| 0.2.x | ≥ 1.0.0 | Integrated |
| 1.0.x | ≥ 2.0.0 | Multi-page support |

### Breaking Changes Policy

Breaking changes only in major version updates and are documented in `CHANGELOG.md`.

---

## Development Workflow

### Running Tests

```bash
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
```

### Type Checking

```bash
npm run type-check    # TypeScript validation
```

### Linting

```bash
npm run lint          # ESLint validation
```

---

## Known Limitations (MS2)

- ✅ Single-page layouts only (multi-page is a future feature)
- ✅ Undo depth limited to 10 actions (configurable)
- ✅ Export quality set to 150 DPI by default (adjustable)
- ✅ No collaborative editing (planned for MS3)
- ✅ Fabric.js is the default canvas engine (Konva.js support TBD)

---

## Support and Questions

For integration questions or adapter specification details, refer to:

- **Adapter Contracts**: `src/adapters/*.ts`
- **Data Model**: `src/models/layout.ts`
- **Example Mock Implementation**: `src/adapters/index.ts` (MockAdapters)

---

## File Structure Reference

```
lde-editor-module/
├── src/
│   ├── adapters/          # Storage, auth, gallery, export contracts
│   ├── models/            # LayoutDocument, Page, LayoutElement schemas
│   ├── core/              # Canvas engine, undo/redo, autosave logic
│   ├── ui/                # React components (built in MS2)
│   ├── export/            # Export pipelines (built in MS2)
│   └── index.ts           # Main module export
├── docs/                  # Additional documentation
├── public/                # Static assets
├── package.json           # 0.1.0 version, adapter contract in metadata
├── tsconfig.json          # Strict mode matching FWScomments
└── .env.example           # Configuration template
```

---

## Next Steps

1. **MS2 Priorities**:
   - Build canvas UI with Fabric.js
   - Implement text, image, shape tools
   - Build export pipeline (PNG, PDF, HTML)
   - Deploy standalone to Vercel/Render

2. **MS3 Preparation**:
   - Review adapter implementations in FWScomments
   - Plan MongoDB schema for layouts collection
   - Design migration script for old pdf_templates

3. **Future (MS3+)**:
   - Multi-page support (version 1.0.0)
   - Collaborative editing
   - Template library
   - Advanced effects (shadows, filters, etc.)
