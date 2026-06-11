import React from "react";
import { Container } from "@plone/components";
import UniversalLink from "@plone/volto/components/manage/UniversalLink/UniversalLink";
import { flattenToAppURL } from "@plone/volto/helpers/Url/Url";
import type { BrainSessionInfo } from "@plone-collective/volto-techevent/types/schedule";
import SessionMetadata from "@plone-collective/volto-techevent/components/Schedule/SessionMetadata";
import SessionTrack from "@plone-collective/volto-techevent/components/Schedule/SessionTrack";
import SessionAudience from "@plone-collective/volto-techevent/components/Schedule/SessionAudience";
import SessionLevel from "@plone-collective/volto-techevent/components/Schedule/SessionLevel";
import SessionPresenters from "@plone-collective/volto-techevent/components/Schedule/SessionPresenters";

interface SessionTileProps {
  item: BrainSessionInfo;
  showDescription: boolean;
  showAudience: boolean;
  showLevel: boolean;
  shortDate: boolean;
  occurrenceDate?: string; //for accepting date prop when passed down from listing block for recurrence handling
}

const SessionTile: React.FC<SessionTileProps> = ({
  item,
  showDescription,
  showAudience,
  showLevel,
  shortDate = false,
  showRoom = true,
  occurrenceDate,
}) => {
  const uid = item.UID;
  const type = item["@type"];
  const href = occurrenceDate
    ? `${flattenToAppURL(item["@id"])}?occurrence=${occurrenceDate}`
    : flattenToAppURL(item["@id"]);

  return (
    <Container
      className={`sessionTile ${type} ${uid} state-${item.review_state}`}
    >
      <SessionTrack item={item} />
      <SessionMetadata item={item} shortDate={shortDate} showRoom={showRoom} />
      <Container className="sessionData">
        <Container className="sessionHeader">
          <h3 className="sessionTitle">
            <UniversalLink
              href={href}
              className={"title"}
            >
              {item.title}
            </UniversalLink>
          </h3>
          {showDescription && (
            <div className="sessionDescription">{item.description}</div>
          )}
          <div className="sessionAudienceLevel">
            {showAudience && <SessionAudience item={item} />}
            {showLevel && <SessionLevel item={item} />}
          </div>
        </Container>
        <Container className="sessionBody">
          {item.presenters && <SessionPresenters item={item} />}
        </Container>
      </Container>
    </Container>
  );
};

export default SessionTile;
