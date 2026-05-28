from collective.techevent.utils import find_event_root
from plone.dexterity.content import DexterityContent
from zope.interface import provider
from zope.schema.interfaces import IVocabularyFactory
from zope.schema.vocabulary import SimpleTerm
from zope.schema.vocabulary import SimpleVocabulary


@provider(IVocabularyFactory)
def session_tracks(context: DexterityContent) -> SimpleVocabulary:
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for track in (event_root.tracks or []):
        terms.append(SimpleTerm(track["id"], track["id"], track["title"]))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def session_levels(context: DexterityContent) -> SimpleVocabulary:
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for level in (event_root.levels or []):
        terms.append(SimpleTerm(level["id"], level["id"], level["title"]))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def session_audiences(context: DexterityContent) -> SimpleVocabulary:
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for group in (event_root.audience or []):
        terms.append(SimpleTerm(group["id"], group["id"], group["title"]))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def durations_keynote(context: DexterityContent) -> SimpleVocabulary:
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for duration in (event_root.durations_keynote or []):
        terms.append(SimpleTerm(duration["id"], duration["id"], duration["title"]))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def durations_talk(context: DexterityContent) -> SimpleVocabulary:
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for duration in (event_root.durations_talk or []):
        terms.append(SimpleTerm(duration["id"], duration["id"], duration["title"]))
    return SimpleVocabulary(terms)


@provider(IVocabularyFactory)
def durations_training(context: DexterityContent) -> SimpleVocabulary:
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for duration in (event_root.durations_training or []):
        terms.append(SimpleTerm(duration["id"], duration["id"], duration["title"]))
    return SimpleVocabulary(terms)

@provider(IVocabularyFactory)
def session_rooms(context: DexterityContent) -> SimpleVocabulary:
    """Available Session Rooms."""
    terms = []
    event_root = find_event_root(context)
    if not event_root:
        return SimpleVocabulary(terms)
    for room in (getattr(event_root, 'rooms', None) or []):
        terms.append(SimpleTerm(room["id"], room["id"], room["title"]))
    return SimpleVocabulary(terms)