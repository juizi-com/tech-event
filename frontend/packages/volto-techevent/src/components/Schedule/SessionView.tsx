import React from 'react';
import { Container } from '@plone/components';
import type {
  SessionInfo,
  TrainingInfo,
} from '@plone-collective/volto-techevent/types/schedule';
import SessionMetadata from '@plone-collective/volto-techevent/components/Schedule/SessionMetadata';
import SessionTrack from '@plone-collective/volto-techevent/components/Schedule/SessionTrack';
import SessionAudience from '@plone-collective/volto-techevent/components/Schedule/SessionAudience';
import SessionLevel from '@plone-collective/volto-techevent/components/Schedule/SessionLevel';
import SessionMaterials from '@plone-collective/volto-techevent/components/Schedule/SessionMaterials';
import PresenterTile from '@plone-collective/volto-techevent/components/Presenter/PresenterTile';
import Video from '@plone-collective/volto-techevent/components/Video/Video';
import messages from '@plone-collective/volto-techevent/messages';
import { useIntl } from 'react-intl';

import SessionPoster from '@plone-collective/volto-techevent/components/Schedule/SessionPoster';

interface SessionViewProps {
  content: SessionInfo | TrainingInfo;
}

/**
 * SessionView view component.
 * @function SessionView
 * @param content - Content object.
 * @returns Markup of the component.
 */
const SessionView: React.FC<SessionViewProps> = ({ content }) => {
  const { title, description, text, presenters } = content;
  const portal_type = content['@type'];
  const intl = useIntl();

  return (
    <Container
      id="page-document"
      className={`view-wrapper session-view ${portal_type}`}
    >
      <Container className={'wrapper'}>
        <SessionTrack item={content} />
        <SessionMetadata item={content} shortDate={false} />
        <Container className={'sessionWrapper'}>
          <Container className="sessionData">
            <Container className="sessionHeader">
              <div className="sessionTitle">{title}</div>
              <SessionAudience item={content} />
              <SessionLevel item={content} />
              <div className="sessionDescription">{description}</div>
            </Container>

            {content.alternative_rooms && content.alternative_rooms.length > 0 && (
  <Container className="sessionAlternativeRooms sessionSection">
    <h3>{intl.formatMessage(messages.alternativeRooms)}</h3>
    <ul className="alternative-rooms-list">
      {content.alternative_rooms.map((room) => (
        <li key={room.token} className="alternative-room-item">
          {room.title}
        </li>
      ))}
    </ul>
  </Container>
)}

            {content?.text?.data && (
              <Container className="sessionBody sessionSection">
                <h3>{intl.formatMessage(messages.details)}</h3>
                <div
                  className="sessionText"
                  dangerouslySetInnerHTML={{ __html: text.data }}
                />
              </Container>
            )}

            {content.requirements && (
              <Container className="sessionBody sessionSection">
                <h3>{intl.formatMessage(messages.requirements)}</h3>
                <div
                  className="sessionText"
                  dangerouslySetInnerHTML={{
                    __html: content.requirements.data,
                  }}
                />
              </Container>
            )}

            {content.session_video && (
  <Container className="sessionVideo sessionSection">
    <h3>{intl.formatMessage(messages.video)}</h3>
    <div className="session-video-grid">
      {(Array.isArray(content.session_video)
        ? content.session_video
        : [content.session_video]
      ).map((url, index) => (
        <Video key={index} url={url} />
      ))}
    </div>
  </Container>
)}
            
            {content.session_poster && ( /**Poster*/
              <Container className="sessionPoster sessionSection">
                <h3>{intl.formatMessage(messages.poster)}</h3>
                <SessionPoster content={content} />
              </Container>
            )}

            {content.session_registration_url && (/**Registration button */
              <Container className="sessionRegistration sessionSection">
               
                <a href={content.session_registration_url} className="session-registration-button" target="_blank" rel="noopener noreferrer">
                  {intl.formatMessage(messages.register)}
                </a>
              </Container>
            )}

            {content.items && content.items.length > 0 && (
              <Container className="sessionMaterials sessionSection">
                <h3>{intl.formatMessage(messages.materials)}</h3>
                <SessionMaterials content={content} />
              </Container>
            )}
          </Container>
          <Container className="sessionPresenters">
            {presenters &&
              presenters.map((presenter, i) => (
                <PresenterTile key={i} item={presenter} />
              ))}
          </Container>
        </Container>
      </Container>
    </Container>
  );
};

export default SessionView;
