# MS2 Standalone Deployment Scope

**Module**: LDE Editor Module  
**Version**: 0.1.0  
**Target Deployment**: May 2026  
**Status**: Scope Definition  

---

## Core Features (MS2 Deliverables)

### 1. Editor Canvas and Tools

- [ ] Single-page layout canvas (7.5 × 10 inches printable)
- [ ] Fabric.js integration for canvas rendering
- [ ] Text tool: add, edit, format text elements
- [ ] Image tool: add, resize, position images from gallery
- [ ] Shape tool: rectangles, circles, lines
- [ ] Z-order management: move elements forward/backward
- [ ] Element selection: click, multi-select, drag-to-select
- [ ] Alignment tools: left, center, right, top, middle, bottom
- [ ] Spacing and distribution tools
- [ ] Element properties panel (position, size, rotation, opacity)

### 2. Document Management

- [ ] New layout creation with page templates
- [ ] Save layout (autosave every 5 seconds)
- [ ] Load existing layout by ID
- [ ] Delete layout with confirmation
- [ ] Layout listing by project
- [ ] Draft/published status toggle
- [ ] Undo/redo with 10-action depth
- [ ] Keyboard shortcuts (Ctrl+Z, Ctrl+Y, etc.)

### 3. Asset Gallery

- [ ] Project images panel (read-only in MS2)
- [ ] Project texts panel (read-only in MS2)
- [ ] Drag-and-drop from gallery to canvas
- [ ] Image preview thumbnails
- [ ] Text preview tooltips

### 4. Export Pipeline

- [ ] Export to PNG with 150 DPI
- [ ] Export to PDF (7.5 × 10 paper dimensions)
- [ ] Export to HTML (for email/web embedding)
- [ ] Batch export option
- [ ] Export filename customization
- [ ] Download link generation

### 5. User Experience

- [ ] Standalone deployment (no FWScomments dependency)
- [ ] Mock adapter support (no backend required for testing)
- [ ] Responsive UI (desktop-optimized for MS2)
- [ ] Toolbar with tool selection
- [ ] Properties panel (right sidebar)
- [ ] Layers panel (left sidebar)
- [ ] Canvas grid and snapping (optional)
- [ ] Zoom controls (fit, actual size, custom percentage)

### 6. Data Persistence

- [ ] JSON schema for LayoutDocument (designed in src/models/)
- [ ] Mock storage adapter (for standalone testing)
- [ ] Adapter interface for MongoDB (ready for FWScomments integration)
- [ ] Document versioning (version field incremented on save)
- [ ] Metadata tracking (createdAt, updatedAt, lastModifiedBy)

---

## Deliverables for MS2

| Artifact | Owner | Status |
| --- | --- | --- |
| **Module Structure** | Complete | ✅ |
| **Adapter Contracts** | Complete | ✅ |
| **Data Models** | Complete | ✅ |
| **Canvas UI** | In Development | 🔄 |
| **Export Pipeline** | In Development | 🔄 |
| **Standalone Deployment** | In Development | 🔄 |
| **Integration Guide** | Complete | ✅ |
| **User Documentation** | Pending | ⏳ |

---

## Success Criteria

- [ ] Editor runs standalone at `http://localhost:3001` without FWScomments
- [ ] User can create, edit, save, and export a single-page layout
- [ ] All exports (PNG, PDF, HTML) render correctly
- [ ] Undo/redo works for 10 recent actions
- [ ] Deployment to Vercel/Render successful with mock adapters
- [ ] Zero errors in type checking (`npm run type-check`)
- [ ] Adapter contracts allow FWScomments integration without refactoring

---

## Out of Scope (MS2)

- ❌ Multi-page layouts (design extensible; implement later)
- ❌ Collaborative editing (requires socket.io integration)
- ❌ Advanced effects (filters, shadows, gradients)
- ❌ Version history / snapshots (implement in MS3)
- ❌ Template library (hardcode one template for testing)
- ❌ Real data integration (all data from mock adapters)
- ❌ Stripe subscription enforcement (test with mock data)
- ❌ Analytics integration (log to console only)

---

## Technical Constraints

- **Node.js**: 22.16.0 (pinned)
- **React**: 18.3.1 (must match FWScomments)
- **TypeScript**: Strict mode (must match FWScomments)
- **Canvas Engine**: Fabric.js 5.3.3 (primary; Konva.js as backup)
- **UI Library**: Radix UI + Tailwind CSS (must match FWScomments)
- **Data Format**: JSON with TypeScript type safety
- **Export Quality**: PNG @ 150 DPI, PDF @ 72 DPI (print optimized)
- **Undo Depth**: 10 actions (configurable)
- **Autosave**: Every 5 seconds or on blur (debounced)

---

## Development Phases

### Phase 1: Canvas Foundation (Week 1)

- [ ] Fabric.js integration and canvas initialization
- [ ] Element creation tools (text, image, shape)
- [ ] Selection and manipulation (move, resize, rotate)
- [ ] Properties panel for element editing
- [ ] Undo/redo stack implementation

### Phase 2: Document Management (Week 2)

- [ ] Autosave mechanism with debouncing
- [ ] Storage adapter integration (mock initially)
- [ ] Load/save/delete operations
- [ ] Document state management (Zustand)
- [ ] Layout listing and project context

### Phase 3: Asset Gallery (Week 2)

- [ ] Gallery UI (images and texts panels)
- [ ] Drag-and-drop from gallery to canvas
- [ ] Gallery adapter integration
- [ ] Image preview and text preview components

### Phase 4: Export Pipeline (Week 3)

- [ ] Canvas to PNG conversion (html2canvas)
- [ ] Canvas to PDF conversion (jsPDF + html2canvas)
- [ ] Canvas to HTML conversion (SVG + CSS)
- [ ] Batch export and download links
- [ ] Export quality settings

### Phase 5: Standalone Deployment (Week 4)

- [ ] Create Next.js app folder structure
- [ ] Deploy to Vercel or Render
- [ ] Environment configuration for standalone
- [ ] Performance optimization
- [ ] User testing and feedback

---

## Performance Targets

- **Canvas Load**: < 500ms for typical layout
- **Save Operation**: < 1s (debounced autosave)
- **Export Generation**: PNG < 3s, PDF < 5s, HTML < 500ms
- **Undo/Redo**: < 100ms
- **UI Responsiveness**: 60 FPS (no jank on interactions)
- **Memory Usage**: < 200MB for typical session

---

## Testing Plan

- **Unit Tests**: Undo/redo, data models, adapter interfaces
- **Integration Tests**: Canvas + storage, export pipelines
- **End-to-End Tests**: Create layout, export, verify output
- **Performance Tests**: Load time, export speed, memory usage
- **Browser Compatibility**: Chrome, Firefox, Safari (desktop only for MS2)

---

## Customer Feedback Incorporated

From customer email (2026-05-12):

- ✅ Single-page focus (no multi-page in MS2)
- ✅ Standalone deployment first (integration deferred to MS3)
- ✅ Adapter pattern for future FWScomments integration
- ✅ Fabric.js evaluation (primary choice)
- ✅ Socket.IO optional (not required for MS2)
- ✅ MongoDB flexible (mock during MS2, real in MS3)
- ✅ Page dimensions: 7.5 × 10 inches (printable area)
- ✅ PDF export primary use case

---

## Next Action

Proceed to Phase 1: Build canvas UI with Fabric.js integration.
