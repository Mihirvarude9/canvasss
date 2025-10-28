import { useState, useEffect } from 'react';
import { Library } from '@/components/Library';
import { SideNav } from '@/components/SideNav';
import { VideoCanvas } from '@/components/VideoCanvas';
import { VideoInspector } from '@/components/VideoInspector';
import { VideoSelector } from '@/components/VideoSelector';
import { useVideoStore } from '@/store/videoStore';

const Video = () => {
  // Video store is used by child components
  useVideoStore();

  useEffect(() => {
    // Load video assets when component mounts
    // This will be handled by the video store
  }, []);

  return (
    <div className="flex h-screen w-full overflow-hidden">
      <SideNav
        active="videos"
        onSelect={(key) => {
          if (key === 'uploads') {
            window.dispatchEvent(new Event('library:openUpload'));
          } else if (key === 'photos') {
            window.dispatchEvent(new CustomEvent('library:setTab', { detail: 'images' }));
          } else if (key === 'videos') {
            window.dispatchEvent(new CustomEvent('library:setTab', { detail: 'videos' }));
          }
        }}
      />
      <Library defaultTab="videos" />
      
      <div className="flex-1 relative">
        <VideoCanvas />
        <VideoSelector />
      </div>

      <VideoInspector />
    </div>
  );
};

export default Video;
