import React from 'react';
import { Container } from '@plone/components';
import { Embed } from 'semantic-ui-react';

interface VideoProps {
  url: string;
}

/**
 * Video component.
 * @function Video
 * @param url - Video URL
 * @returns Markup of the component.
 */
const Video: React.FC<VideoProps> = ({ url }) => {
  if (!url || typeof url !== 'string') return null;

  const videoSource = 'youtube';
  let videoId: string | null = null;

  if (url.match(/.be\//)) {
    videoId = url.match(/^.*\.be\/([^?]*)/)?.[1] ?? null;
  } else if (url.match(/[?&]v=/)) {
    videoId = url.match(/[?&]v=([^&]*)/)?.[1] ?? null;
  }

  if (!videoId) return null;

  return (
    <Container className="video embed">
      <Embed
        id={videoId}
        source={videoSource}
        icon="play"
        defaultActive
        autoplay={false}
      />
    </Container>
  );
};

export default Video;
