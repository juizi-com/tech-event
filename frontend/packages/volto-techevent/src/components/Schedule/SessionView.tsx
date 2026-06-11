import React from "react";
import { Container } from "@plone/components";
import { useSelector } from "react-redux";
import type {
  SessionInfo,
  TrainingInfo,
} from "@plone-collective/volto-techevent/types/schedule";
import SessionMetadata from "@plone-collective/volto-techevent/components/Schedule/SessionMetadata";
import SessionTrack from "@plone-collective/volto-techevent/components/Schedule/SessionTrack";
import SessionAudience from "@plone-collective/volto-techevent/components/Schedule/SessionAudience";
import SessionLevel from "@plone-collective/volto-techevent/components/Schedule/SessionLevel";
import SessionMaterials from "@plone-collective/volto-techevent/components/Schedule/SessionMaterials";
import PresenterTile from "@plone-collective/volto-techevent/components/Presenter/PresenterTile";
import Video from "@plone-collective/volto-techevent/components/Video/Video";
import messages from "@plone-collective/volto-techevent/messages";
import { useIntl } from "react-intl";
import SessionPoster from "@plone-collective/volto-techevent/components/Schedule/SessionPoster";

interface SessionViewProps {
  content: SessionInfo | TrainingInfo;
}

/**
 * Build a new ISO date string that uses the date from occurrenceParam but
 * preserves the original time-of-day (in UTC) from the source string.
 */
function shiftToOccurrenceDate(
  original: string,
  occurrenceParam: string
): string {
  const src = new Date(original);
  const [year, month, day] = occurrenceParam.split("-").map(Number);
  return new Date(
    Date.UTC(year, month - 1, day, src.getUTCHours(), src.getUTCMinutes(), src.getUTCSeconds())
  ).toISOString();
}

/**
 * SessionView view component.
 * @function SessionView
 * @param content - Content object.
 * @returns Markup of the component.
 */
const SessionView: React.FC<SessionViewProps> = ({ content }) => {
  const { title, description, text, presenters } = content;
  const portal_type = content["@type"];
  const intl = useIntl();

  // Read the ?occurrence=YYYY-MM-DD param from the Volto Redux router state.
  // Volto populates state.router on both server and client from the same source,
  // so both renders see the same value — no hydration mismatch.
  const router = useSelector((state: any) => state.router);
  const occurrenceParam: string | null = router?.location?.query?.occurrence || null;

  // Build effectiveContent: identical to content except start/end are shifted
  // to the clicked occurrence date when the param is present.
  const effectiveContent = React.useMemo(() => {
    if (!occurrenceParam || !content.start) return content;
    const effectiveStart = shiftToOccurrenceDate(content.start, occurrenceParam);
    let effectiveEnd = content.end;
    if (content.end) {
      const durationMs =
        new Date(content.end).getTime() - new Date(content.start).getTime();
      effectiveEnd = new Date(
        new Date(effectiveStart).getTime() + durationMs
      ).toISOString();
    }
    return { ...content, start: effectiveStart, end: effectiveEnd };
  }, [occurrenceParam, content]);

  // Determine whether the registration button should be shown.
  // We use `end` rather than `start` so the button remains visible while the
  // session is actively in progress, and only disappears once it has finished.
  // For recurring events the button is always shown — future occurrences may
  // still be upcoming even if an earlier one has passed.
  const hasRecurrence = Boolean(content.recurrence);
  const sessionEnd = effectiveContent.end ? new Date(effectiveContent.end) : null;
  const isUpcoming = hasRecurrence || (sessionEnd ? sessionEnd > new Date() : true);

  return (
    <Container
      id="page-document"
      className={`view-wrapper session-view ${portal_type}`}
    >
      <Container className={"wrapper"}>
        <SessionTrack item={effectiveContent} />
        <SessionMetadata item={effectiveContent} shortDate={false} />
        {content.recurrence && (
          <div className="session-recurrence-label">This is a recurring event</div>
        )}
        <Container className={"sessionWrapper"}>
          <Container className="sessionData">
            <Container className="sessionHeader">
              <h1 className="sessionTitle">{title}</h1>
              <div className="sessionDescription">{description}</div>
              <div className="sessionAudienceLevel">
                <SessionAudience item={effectiveContent} />
                <SessionLevel item={effectiveContent} />
              </div>
            </Container>

            {content.session_video && content.session_video.length > 0 && (
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

            {/* Only show the registration button if the session hasn't ended yet,
                or if it is a recurring event (future occurrences may still be upcoming). */}
            {content.session_registration_url && isUpcoming && (
              <Container className="sessionRegistration sessionSection">
                <a
                  href={content.session_registration_url}
                  className="session-registration-button"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {intl.formatMessage(messages.register)}
                </a>
              </Container>
            )}

            <Container className="sessionPresenters mobile">
              <h3>Presenters</h3>
              <div>
                {presenters &&
                  presenters.map((presenter, i) => (
                    <PresenterTile key={i} item={presenter} />
                  ))}
              </div>
            </Container>

            {content.session_poster && (
              <Container className="sessionPoster sessionSection">
                <h3>{intl.formatMessage(messages.poster)}</h3>
                <SessionPoster content={content} />
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

            {content.alternative_rooms &&
              content.alternative_rooms.length > 0 && (
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

            {content.items && content.items.length > 0 && (
              <Container className="sessionMaterials sessionSection">
                <h3>{intl.formatMessage(messages.materials)}</h3>
                <SessionMaterials content={content} />
              </Container>
            )}
          </Container>
          <Container className="sessionPresenters desktop">
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