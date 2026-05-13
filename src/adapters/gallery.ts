/**
 * Gallery Adapter - Defines interface for loading project content
 * Used to populate image and text galleries for the editor
 * The main FWScomments app will implement this to serve its project data
 */

export interface ProjectAsset {
  id: string;
  type: 'image' | 'text';
  url?: string;
  content?: string;
  name: string;
  uploadedAt: Date;
}

export interface GalleryAdapter {
  /**
   * Get all images available for a project
   * Returns download URLs for use in canvas
   */
  getProjectImages(projectId: string): Promise<ProjectAsset[]>;

  /**
   * Get all text snippets available for a project
   * Used to populate text gallery/suggestions
   */
  getProjectTexts(projectId: string): Promise<ProjectAsset[]>;

  /**
   * Get content from a specific email request
   * Returns images and texts associated with the request
   */
  getRequestContent(requestId: string): Promise<{
    images: ProjectAsset[];
    texts: ProjectAsset[];
  }>;

  /**
   * Upload a new image to project gallery
   * Called when user drags/pastes image into editor
   */
  uploadImage(projectId: string, file: File): Promise<ProjectAsset>;

  /**
   * Get preview/thumbnail for an asset
   * Used in gallery UI for quick preview
   */
  getAssetPreview(assetId: string): Promise<string>;
}

/**
 * Mock gallery adapter for standalone MS2 development
 */
export class MockGalleryAdapter implements GalleryAdapter {
  private mockImages: ProjectAsset[] = [
    {
      id: 'img-001',
      type: 'image',
      url: 'https://via.placeholder.com/800x600?text=Sample+Image+1',
      name: 'Sample Image 1',
      uploadedAt: new Date(),
    },
    {
      id: 'img-002',
      type: 'image',
      url: 'https://via.placeholder.com/800x600?text=Sample+Image+2',
      name: 'Sample Image 2',
      uploadedAt: new Date(),
    },
  ];

  private mockTexts: ProjectAsset[] = [
    {
      id: 'txt-001',
      type: 'text',
      content: 'Great work on the project! Looking forward to seeing more.',
      name: 'Review Comment 1',
      uploadedAt: new Date(),
    },
    {
      id: 'txt-002',
      type: 'text',
      content: 'This is excellent. Keep up the momentum!',
      name: 'Review Comment 2',
      uploadedAt: new Date(),
    },
  ];

  async getProjectImages(projectId: string): Promise<ProjectAsset[]> {
    return this.mockImages;
  }

  async getProjectTexts(projectId: string): Promise<ProjectAsset[]> {
    return this.mockTexts;
  }

  async getRequestContent(requestId: string): Promise<{
    images: ProjectAsset[];
    texts: ProjectAsset[];
  }> {
    return {
      images: this.mockImages,
      texts: this.mockTexts,
    };
  }

  async uploadImage(projectId: string, file: File): Promise<ProjectAsset> {
    return {
      id: `img-${Date.now()}`,
      type: 'image',
      url: URL.createObjectURL(file),
      name: file.name,
      uploadedAt: new Date(),
    };
  }

  async getAssetPreview(assetId: string): Promise<string> {
    const asset = [
      ...this.mockImages,
      ...this.mockTexts,
    ].find((a) => a.id === assetId);
    return asset?.url || asset?.content || '';
  }
}
