import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { flattenToAppURL } from '@plone/volto/helpers/Url/Url';
import SessionTile from '@plone-collective/volto-techevent/components/Schedule/SessionTile';

import { getAPIResourceWithAuth } from '@plone/volto/helpers';

interface PresenterImage {
  download: string;
  width: number;
  height: number;
}

interface PresenterSummary {
  '@id': string;
  title: string;
  image_scales?: {
    image?: Array<{
      scales?: Record<string, PresenterImage>;
      download?: string;
    }>;
  };
}

const PresenterImage: React.FC<{ presenter: PresenterSummary }> = ({
  presenter,
}) => {
  const imageData = presenter.image_scales?.image?.[0];
  if (!imageData) return null;
  const src =
    imageData.scales?.thumb?.download ?? imageData.download;
  if (!src) return null;
  const fullSrc = src.startsWith('http')
    ? flattenToAppURL(src)
    : `${flattenToAppURL(presenter['@id'])}/${src}`;
  return (
    <img
      src={fullSrc}
      alt={presenter.title}
      className="presenter-image"
    />
  );
};

function formatDay(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-GB', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const ScheduleGridVariation: React.FC<{ isEditMode?: boolean }> = ({
  isEditMode,
}) => {
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const content = useSelector((state: any) => state.content.data);
  const token = useSelector(
    (state: any) => state.userSession?.token,
  );

useEffect(() => {
  if (!content?.['@id']) return;
  const contentUrl = flattenToAppURL(content['@id']);
  const url = `/++api++${contentUrl}/@schedule`;
  const headers: Record<string, string> = {
  Accept: 'application/json',
  'X-CSRF-Token': 'nocheck',
};
if (token) {
  headers['Authorization'] = `Bearer ${token}`;
}

  const fetchWithRetry = (retries: number) => {
    fetch(url, { headers })
      .then((res) => {
        if (!res.ok && retries > 0) {
          setTimeout(() => fetchWithRetry(retries - 1), 500);
          return;
        }
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        console.log('Schedule data:', data);
        setDays(data.items || []);
        setLoading(false);
      })
      .catch((err) => {
        if (retries > 0) {
          setTimeout(() => fetchWithRetry(retries - 1), 500);
        } else {
          console.error('Schedule fetch error:', err);
          setLoading(false);
        }
      });
  };

  fetchWithRetry(3);
}, [content, token]);

  if (loading) return <div className="schedule-grid-loading">Loading schedule...</div>;
  if (!days.length) return null;

  return (
    <div className="schedule-grid-variation">
      {days.map((day) => (
        <div key={day.id} className="schedule-day">
          <h3 className="schedule-day-title">{formatDay(day.id)}</h3>
          <div className="schedule-day-items">
            {day.items.map((item: any, index: number) => (
              <div
                key={`${item.UID}-${index}`}
                className="card-container session"
              >
                <div className="item">
                  <SessionTile
                    item={item}
                    showDescription
                    showLevel
                    showAudience
                  />
                  {item.presenters?.length > 0 && (
                    <div className="schedule-presenters">
                      {item.presenters.map((presenter: PresenterSummary) => (
                        <div
                          key={presenter['@id']}
                          className="schedule-presenter"
                        >
                          <PresenterImage presenter={presenter} />
                          <span className="presenter-name">
                            {presenter.title}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ScheduleGridVariation;