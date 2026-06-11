import type { ScheduleInfo } from "@plone-collective/volto-techevent/types/schedule";
import { formatDate } from "@plone/volto/helpers/Utils/Date";
import Icon from "@plone/volto/components/theme/Icon/Icon";
import calendarSVG from "@plone/volto/icons/calendar.svg";

interface SlotDateProps {
  item: ScheduleInfo;
  shortFormat: boolean;
  locale: string;
  className?: string;
}

interface FormatProps {
  item: ScheduleInfo;
  start: Date;
  end: Date;
  locale: string;
}

function formatHour(value: Date, locale: string): string {
  return value.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

const ShortFormat: React.FC<FormatProps> = ({ item, start, end, locale }) => (
  <>
    <time className="start" dateTime={item.start}>
      {formatHour(start, locale)}
    </time>{" "}
    –{" "}
    <time className="end" dateTime={item.end}>
      {formatHour(end, locale)}
    </time>
  </>
);

const LongFormat: React.FC<FormatProps> = ({ item, start, end, locale }) => {
  const date = start.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  });
  return (
    <>
      <span className="date">{date}</span> –{' '}
      <time className="start" dateTime={item.start}>
        {formatHour(start, locale)}
      </time>{' '}
      –{' '}
      <time className="end" dateTime={item.end}>
        {formatHour(end, locale)}
      </time>
    </>
  );
};

const SlotDate: React.FC<SlotDateProps> = ({
  item,
  shortFormat,
  className,
  locale,
}) => {
  const start = item.start !== null ? new Date(item.start) : null;
  const end = item.end !== null ? new Date(item.end) : null;
  const isValid = !isNaN(start?.getTime()) && !isNaN(end?.getTime());

  return (
    <div className={`slotDate ${className || ""}`.trim()}>
      {isValid && (
        <div className="wrapper">
          <Icon name={calendarSVG} className={"categoryIcon"} />
          {shortFormat ? (
            <ShortFormat item={item} start={start} end={end} locale={locale} />
          ) : (
            <LongFormat item={item} start={start} end={end} locale={locale} />
          )}
        </div>
      )}
    </div>
  );
};

export default SlotDate;
