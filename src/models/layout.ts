/**
 * Layout Document Model - Core data structure for editor
 * Page-based single-page design (MS2 scope)
 * Extensible for multi-page in future versions
 */

export interface PageDimensions {
  width: number; // pixels or inches
  height: number;
  unit: 'px' | 'in' | 'mm';
}

export interface PageMargins {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface Page {
  id: string; // page-${timestamp} format
  title: string;
  dimensions: PageDimensions;
  margins: PageMargins;
  backgroundColor: string; // hex color
  elements: LayoutElement[];
  version: number; // incremented on each save
}

export interface LayoutElement {
  id: string; // element-${timestamp} format
  type: 'text' | 'image' | 'shape' | 'container' | 'qrcode';
  x: number; // position in pixels
  y: number;
  width: number;
  height: number;
  rotation: number; // degrees 0-360
  zIndex: number; // layer order
  locked: boolean; // prevent accidental edits
  opacity: number; // 0-1
  properties: TextElementProperties | ImageElementProperties | ShapeElementProperties;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextElementProperties {
  text: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '500' | '600' | '700';
  fontStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right';
  color: string; // hex
  backgroundColor?: string;
  lineHeight: number;
  letterSpacing: number;
  textDecoration?: 'underline' | 'line-through' | 'none';
}

export interface ImageElementProperties {
  url: string;
  assetId?: string; // reference to gallery asset
  objectFit: 'fill' | 'contain' | 'cover' | 'scale-down';
  border?: {
    color: string;
    width: number;
    radius: number;
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface ShapeElementProperties {
  shapeType: 'rectangle' | 'circle' | 'line' | 'polygon';
  fillColor?: string;
  strokeColor?: string;
  strokeWidth: number;
  borderRadius?: number;
}

export interface LayoutDocument {
  _id?: string; // MongoDB ObjectId
  projectId: string; // FK to FWScomments project
  requestId?: string; // FK to email request (optional)
  ownerId: string; // FK to user who created layout
  title: string;
  description?: string;
  pages: Page[]; // MS2: single page; extensible for multi-page
  currentPageIndex: number; // default 0
  version: number; // document version for migration tracking
  templateId?: string; // reference to template if created from one
  status: 'draft' | 'published' | 'archived';
  metadata?: {
    tags?: string[];
    customFields?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: string; // track who last edited
}

/**
 * Document creation factory with defaults
 */
export function createEmptyLayout(
  projectId: string,
  ownerId: string
): LayoutDocument {
  const pageId = `page-${Date.now()}`;
  return {
    projectId,
    ownerId,
    title: 'Untitled Layout',
    pages: [
      {
        id: pageId,
        title: 'Page 1',
        dimensions: {
          width: 7.5,
          height: 10,
          unit: 'in',
        },
        margins: {
          top: 0.5,
          right: 0.5,
          bottom: 0.5,
          left: 0.5,
        },
        backgroundColor: '#ffffff',
        elements: [],
        version: 1,
      },
    ],
    currentPageIndex: 0,
    version: 1,
    status: 'draft',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Element creation factory
 */
export function createTextElement(
  text: string,
  x: number = 0,
  y: number = 0,
  width: number = 200,
  height: number = 100
): LayoutElement {
  return {
    id: `element-${Date.now()}`,
    type: 'text',
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    locked: false,
    opacity: 1,
    properties: {
      text,
      fontSize: 16,
      fontFamily: 'system-ui',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'left',
      color: '#000000',
      lineHeight: 1.5,
      letterSpacing: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export function createImageElement(
  url: string,
  x: number = 0,
  y: number = 0,
  width: number = 200,
  height: number = 200
): LayoutElement {
  return {
    id: `element-${Date.now()}`,
    type: 'image',
    x,
    y,
    width,
    height,
    rotation: 0,
    zIndex: 1,
    locked: false,
    opacity: 1,
    properties: {
      url,
      objectFit: 'contain',
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
