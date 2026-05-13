'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function SharePage() {
  const params = useSearchParams();
  const [html, setHtml] = useState('');
  const shareId = params.get('id');

  useEffect(() => {
    if (!shareId) return;
    const payload = window.localStorage.getItem(`lde:share:${shareId}`) || '';
    setHtml(payload);
  }, [shareId]);

  if (!shareId) {
    return <div style={{ padding: 24 }}>Missing share id.</div>;
  }

  if (!html) {
    return <div style={{ padding: 24 }}>Shared layout not found in this browser context.</div>;
  }

  return (
    <div
      style={{ minHeight: '100vh', background: '#f3f4f6' }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
