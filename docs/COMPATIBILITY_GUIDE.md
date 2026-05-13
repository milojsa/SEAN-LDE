# Compatibility Guide: LDE Editor Module & FWScomments

**Version**: 1.0  
**Date**: 2026-05-12  
**Purpose**: Define version compatibility and integration checklist

---

## Version Alignment

### Current Versions

| Component | Version | Notes |
| --- | --- | --- |
| **FWScomments (Main App)** | 1.0.0+ | Actively maintained |
| **LDE Editor Module** | 0.1.0 | MS2 Standalone |
| **Node.js** | 22.16.0 | Pinned in both projects |
| **React** | 18.3.1 | Exact match required |
| **TypeScript** | 5.8.3 | Exact match required |

### Version Compatibility Matrix

| Editor | Main App | Status | Notes |
| --- | --- | --- | --- |
| 0.1.0 | Any | ✅ Standalone | No integration; mock adapters only |
| 0.2.0 | ≥ 1.0.0 | ✅ Integrated | Real adapters; same data model |
| 1.0.0 | ≥ 2.0.0 | ⏳ Future | Multi-page support; potential breaking changes |

---

## Dependency Compatibility

### Critical Dependencies (Must Match)

```json
{
  "react": "^18.3.1",          // EXACT match
  "react-dom": "^18.3.1",      // EXACT match
  "typescript": "^5.8.3",      // EXACT match
  "next": "^16.0.10"           // EXACT match
}
```

### Optional Dependencies (Can Differ)

```json
{
  "fabric": "^5.3.3",          // Can update; interface stable
  "zustand": "^4.4.0",         // Can update; no breaking changes expected
  "framer-motion": "^11.15.0", // Can update
  "lucide-react": "^0.408.0"   // Can update; icon names stable
}
```

### DevDependencies (No Impact)

```json
{
  "@types/node": "^20.0.0",
  "@types/react": "^18.2.0",
  "eslint": "^8.56.0"
}
```

---

## Adapter Contract Stability

### Level 1: Guaranteed Stable (0.x → 1.x)

These interfaces **will not change** during 0.x series:

**StorageAdapter**
```typescript
interface StorageAdapter {
  saveLayout(document: LayoutDocument): Promise<LayoutDocument>;
  loadLayout(layoutId: string): Promise<LayoutDocument>;
  deleteLayout(layoutId: string): Promise<void>;
  listLayouts(projectId: string): Promise<LayoutDocument[]>;
  checkOwnership(layoutId: string): Promise<boolean>;
}
```

**AuthAdapter**
```typescript
interface AuthAdapter {
  getCurrentUser(): Promise<UserContext>;
  getProjectContext(): Promise<{ projectId: string; requestId?: string } | null>;
  checkPermission(action: string): Promise<boolean>;
  logAction(action: string, metadata?: Record<string, any>): Promise<void>;
}
```

**GalleryAdapter**
```typescript
interface GalleryAdapter {
  getProjectImages(projectId: string): Promise<ProjectAsset[]>;
  getProjectTexts(projectId: string): Promise<ProjectAsset[]>;
  getRequestContent(requestId: string): Promise<{ images, texts }>;
  uploadImage(projectId: string, file: File): Promise<ProjectAsset>;
  getAssetPreview(assetId: string): Promise<string>;
}
```

**ExportAdapter**
```typescript
interface ExportAdapter {
  exportPNG(layoutId: string, options?): Promise<ExportResult>;
  exportPDF(layoutId: string, options?): Promise<ExportResult>;
  exportHTML(layoutId: string, options?): Promise<ExportResult>;
  getExportHistory(layoutId: string): Promise<ExportEntry[]>;
}
```

### Level 2: Backward Compatible (With Extensions)

In 0.2.0 and later 0.x releases, new methods can be added to adapters **without breaking** existing implementations:

```typescript
// Example: Adding new method to StorageAdapter in 0.2.0
interface StorageAdapter {
  // Existing methods (unchanged)
  saveLayout(document: LayoutDocument): Promise<LayoutDocument>;
  
  // New method (doesn't break 0.1.0 implementations)
  addLayoutToGallery?(layoutId: string, templateId: string): Promise<void>;
}
```

**Rule**: New adapter methods must be optional (`?` marker) during 0.x.

### Level 3: Breaking Changes (1.0.0+)

Multi-page support in version 1.0.0 will change the `LayoutDocument` interface:

```typescript
// Current (0.x)
interface LayoutDocument {
  pages: Page[];           // Array with single page in MS2
  currentPageIndex: number;
}

// Future (1.0.0)
interface LayoutDocument {
  pages: Page[];           // Array with multiple pages
  currentPageIndex: number;
  pageOrder: string[];     // New field for reordering
}
```

**Notice Period**: 3 months warning before 1.0.0 release.

---

## Integration Checklist (MS3+)

Before integrating the editor into FWScomments, verify:

### Code Level

- [ ] Node.js version 22.16.0 pinned in both `render.yaml` (FWScomments) and `package.json` (Editor)
- [ ] React 18.3.1 in both projects (exact match)
- [ ] TypeScript 5.8.3 in both projects (exact match)
- [ ] Adapter implementations created in FWScomments:
  - [ ] `FWSStorageAdapter` implements `StorageAdapter`
  - [ ] `FWSAuthAdapter` implements `AuthAdapter`
  - [ ] `FWSGalleryAdapter` implements `GalleryAdapter`
  - [ ] `FWSExportAdapter` implements `ExportAdapter`
- [ ] All adapters tested with mock data

### Data Model Level

- [ ] MongoDB schema created for `layouts` collection
  ```javascript
  db.createCollection('layouts', {
    validator: {
      $jsonSchema: {
        bsonType: 'object',
        required: ['projectId', 'ownerId', 'pages', 'version'],
        properties: {
          projectId: { bsonType: 'string' },
          ownerId: { bsonType: 'string' },
          pages: { bsonType: 'array' },
          version: { bsonType: 'int' },
          // ... other fields from LayoutDocument
        }
      }
    }
  });
  ```
- [ ] Indexes created:
  ```javascript
  db.layouts.createIndex({ projectId: 1, ownerId: 1 });
  db.layouts.createIndex({ updatedAt: -1 });
  ```
- [ ] Migration script created to convert old `pdf_templates` to new `layouts` format
- [ ] Both schemas coexist during transition period (no data loss)

### API Level

- [ ] New API route: `GET /api/editor/layouts` (list)
- [ ] New API route: `POST /api/editor/layouts` (create/save)
- [ ] New API route: `GET /api/editor/layouts/[id]` (load)
- [ ] New API route: `DELETE /api/editor/layouts/[id]` (delete)
- [ ] New API route: `POST /api/editor/export` (PNG, PDF, HTML)
- [ ] All routes protected by `requireAuth()` middleware
- [ ] All routes enforce ownership check before returning data

### UI/UX Level

- [ ] Editor component mounted in dashboard or request detail page
- [ ] Adapters passed at mount time with correct scope
- [ ] Breadcrumbs or navigation updated to show "Layout Editor"
- [ ] Back button returns to dashboard/request
- [ ] Export buttons integrated into FWScomments UI (not just editor)
- [ ] User can see layouts list before entering editor

### Testing Level

- [ ] Unit tests for each adapter implementation
- [ ] Integration tests for editor + FWScomments storage
- [ ] End-to-end test: Create layout → Save → Export → Verify file
- [ ] Permission tests: Non-owner cannot access layout
- [ ] Performance tests: Save/load/export under 2 seconds
- [ ] Cross-browser tests: Chrome, Firefox, Safari
- [ ] Mobile responsiveness not required (desktop only for now)

### Deployment Level

- [ ] Editor module imported and bundled with FWScomments
- [ ] Environment variables for MongoDB, Stripe, SendGrid still work
- [ ] Socket.IO optional (kept or removed per customer preference)
- [ ] Render.yaml updated with editor module build step
- [ ] Vercel.json updated with editor module build configuration
- [ ] Rollback plan if editor deployment breaks main app

### Documentation Level

- [ ] Integration README updated in FWScomments
- [ ] Adapter implementations documented with examples
- [ ] Database schema documented
- [ ] API routes documented with curl examples
- [ ] User guide updated: "How to create a layout"
- [ ] Admin guide updated: "Database and migration procedures"

---

## Breaking Changes Notification

**Current Status**: No breaking changes expected until version 1.0.0

If a breaking change is discovered in 0.x series (e.g., security issue requiring interface change):
1. Version bumped to next minor (e.g., 0.1.3 → 0.2.0)
2. New adapter methods added with `?` optional marker
3. Old methods deprecated with console warning
4. 6-week sunset period for FWScomments to update
5. Breaking removal in next major version (1.0.0)

---

## Rollback Strategy

If editor integration causes issues:

1. **Immediate Rollback** (if deploying to production):
   - Revert FWScomments to commit before editor integration
   - Disable editor route in middleware
   - Keep `layouts` collection untouched

2. **Data Safety**:
   - Always maintain backup of both `pdf_templates` and new `layouts` collections
   - Run migration script in test environment first
   - Never delete `pdf_templates` during transition

3. **Communication**:
   - Notify users that layouts are temporarily unavailable
   - Estimate fix time and post-mortem
   - Verify data integrity before re-enabling

---

## Support Contacts

- **Module Issues**: LDE Editor Module maintainer
- **Integration Issues**: FWScomments lead developer
- **Data Migration Questions**: Database administrator
- **Deployment Questions**: DevOps engineer

---

## Approval Sign-Off

- [ ] FWScomments Lead Developer: Approves adapter contracts
- [ ] Database Administrator: Approves schema and migration plan
- [ ] QA Lead: Approves testing checklist
- [ ] DevOps Engineer: Approves deployment strategy
- [ ] Customer/Product Manager: Approves timeline and features

---

## Revision History

| Version | Date | Author | Changes |
| --- | --- | --- | --- |
| 1.0 | 2026-05-12 | Team | Initial compatibility guide; MS2 scope |

---

**Last Updated**: 2026-05-12  
**Next Review**: 2026-06-30 (after MS2 completion)
