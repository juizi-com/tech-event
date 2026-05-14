import React from 'react';
import { Container } from '@plone/components';
import type {
  SessionInfo,
  TrainingInfo,
} from '@plone-collective/volto-techevent/types/schedule';

interface SessionPosterProps {
  content: SessionInfo | TrainingInfo;
}

/**
 * SessionPoster component.
 * Renders the uploaded session poster image.
 */
const SessionPoster: React.FC<SessionPosterProps> = ({ content }) => {
  const poster = content.session_poster;

  if (!poster?.download) return null;

  // Use the 'large' scale (800px) if available, fall back to full image
  const src = poster.scales?.large?.download ?? poster.download;
  const width = poster.scales?.large?.width ?? undefined;
  const height = poster.scales?.large?.height ?? undefined;

  return (
    <Container className="session-poster">
      <img
        src={src}
        alt={`${content.title} poster`}
        width={width}
        height={height}
        className="session-poster-image"
      />
    </Container>
  );
};

export default SessionPoster;