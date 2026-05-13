'use client';

import React, { useEffect, useState } from 'react';
import { EditorComponent } from '@/ui';
import { createMockAdapters, EditorAdapters } from '@/adapters';

export default function EditorPage() {
  const [adapters, setAdapters] = useState<EditorAdapters | null>(null);
  const [layoutId, setLayoutId] = useState<string>('');

  useEffect(() => {
    // Initialize mock adapters for standalone development
    const mockAdapters = createMockAdapters();
    setAdapters(mockAdapters);

    // Create or load a layout
    const generateLayoutId = () => `layout-${Date.now()}`;
    setLayoutId(generateLayoutId());
  }, []);

  if (!adapters) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <p>Loading editor...</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      {/* Header */}
      <header style={{
        backgroundColor: '#fff',
        borderBottom: '1px solid #e5e7eb',
        padding: '16px 24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h1 style={{ fontSize: '20px', fontWeight: 'bold' }}>LDE Editor - v0.1.0</h1>
        <p style={{ fontSize: '12px', color: '#6b7280' }}>
          Layout ID: {layoutId}
        </p>
      </header>

      {/* Editor Container */}
      <main style={{ flex: 1, overflow: 'hidden' }}>
        <EditorComponent
          adapters={adapters}
          layoutId={layoutId}
          projectId="demo-project"
        />
      </main>
    </div>
  );
}
