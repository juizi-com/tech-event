from collective.techevent.behaviors.schedule import IScheduleSlot
from collective.techevent.utils.vocabularies import get_vocabulary_for_attr
from copy import deepcopy
from datetime import datetime
from datetime import timedelta
from dateutil.parser import parse
from dateutil.rrule import rrulestr
from plone import api
from plone.dexterity.content import DexterityContent
from plone.restapi.interfaces import ISerializeToJsonSummary
from plone.restapi.serializer.converters import json_compatible
from plone.restapi.services import Service
from typing import Any
from zope.component import getMultiAdapter

from plone.protect.interfaces import IDisableCSRFProtection
from zope.interface import alsoProvides


def dict_as_sorted_list(data: dict, enforceIso: bool = False) -> list[dict]:
    keys = sorted(data.keys())
    local_data = deepcopy(data)
    if enforceIso:
        for raw_key in keys:
            key = parse(raw_key).strftime("%Y-%m-%dT%H:%M:%S%z")
            if key == raw_key:
                continue
            values = local_data.pop(raw_key)
            if key not in local_data:
                local_data[key] = {}
            local_data[key].update(values)
        keys = [parse(raw_key).strftime("%Y-%m-%dT%H:%M:%S%z") for raw_key in keys]
    response = []
    keys = sorted(local_data.keys())
    for key in keys:
        response.append({"id": key, "items": local_data[key]})
    return response


def expand_recurring_slots(slots: list[dict]) -> list[dict]:
    """Expand recurring slots into multiple occurrences based on recurrence rule."""
    response = []
    for slot in slots:
        recurrence = slot.get("recurrence")
        if not recurrence:
            response.append(slot)
            continue

        raw_start = slot.get("start")
        raw_end = slot.get("end")
        if not raw_start or not raw_end:
            response.append(slot)
            continue

        start_dt = parse(raw_start)
        end_dt = parse(raw_end)
        duration = end_dt - start_dt

        try:
            rule = rrulestr(recurrence, dtstart=start_dt, ignoretz=False)
            occurrences = list(rule)
            if not occurrences:
                response.append(slot)
                continue
            for occurrence in occurrences:
                new_slot = deepcopy(slot)
                new_slot["start"] = occurrence.isoformat()
                new_slot["end"] = (occurrence + duration).isoformat()
                response.append(new_slot)
        except Exception:
            # If recurrence parsing fails, fall back to original slot
            response.append(slot)

    return response


def process_trainings(slots: list[dict]) -> list[dict]:
    """Break whole day training sessions as 2 slots."""
    response = []
    for slot in slots:
        raw_start = slot["start"]
        raw_end = slot["end"]
        if slot.get("@type") != "Training" or not (raw_start and raw_end):
            response.append(slot)
            continue
        start = parse(raw_start)
        end = parse(raw_end)
        if (end - start).seconds > 14400:
            new_end = (start + timedelta(seconds=14400)).isoformat()
            slot["end"] = new_end
            response.append(slot)
            slot = deepcopy(slot)
            new_start = (end - timedelta(seconds=14400)).isoformat()
            slot["start"] = new_start
            slot["end"] = raw_end
            response.append(slot)
        else:
            response.append(slot)
    return response


def round_time(dt: datetime) -> datetime:
    """Round datetime up to the next quarter (00, 15, 30, 45), ignoring seconds and microseconds."""
    minute = ((dt.minute + 14) // 15) * 15
    if minute == 60:
        dt = dt.replace(hour=(dt.hour + 1) % 24, minute=0, second=0, microsecond=0)
    else:
        dt = dt.replace(minute=minute, second=0, microsecond=0)
    return dt


def time_slot(value: datetime) -> str:
    return f"time-{round_time(value).strftime('%H%M')}"


def group_slots(slots: list[dict], rooms_vocab: dict[str, str]) -> list[dict]:
    response = []
    days = {}

    # Expand recurring slots before processing
    slots = expand_recurring_slots(slots)

    # Pre-process training slots to split long sessions
    slots = process_trainings(slots)
    for slot in slots:
        start = slot.get("start", "")
        if not start:
            continue
        day = start[0:10]
        days.setdefault(day, []).append(slot)

    response = dict_as_sorted_list(days)
    for day in response:
        rooms = set()

        for slot in day["items"]:
            room_tokens = (
                [r.get("token") for r in slot.get("room", [])]
                if slot.get("room")
                else []
            )
            rooms.update(room_tokens or ["_all_"])

        other_rooms = [room for room in rooms if room not in rooms_vocab]
        vocab_rooms = [room for room in rooms_vocab if room in rooms]
        ordered_rooms = other_rooms + vocab_rooms
        day["rooms"] = [[room, rooms_vocab.get(room, room)] for room in ordered_rooms]

        for slot in day["items"]:
            start_dt = parse(slot.get("start")) if slot.get("start") else None
            end_dt = parse(slot.get("end")) if slot.get("end") else None
            room_tokens = (
                [r.get("token") for r in slot.get("room", [])]
                if slot.get("room")
                else []
            )
            if slot.get("@type") == "Keynote":
                slot["gridColumn"] = "room-1 / room-all"
            elif room_tokens:
                token = room_tokens[0]
                if token in vocab_rooms:
                    track_index = vocab_rooms.index(token) + 1
                    slot["gridColumn"] = f"room-{track_index}"
                else:
                    slot["gridColumn"] = "room-1"
            else:
                slot["gridColumn"] = "room-1 / room-all"
            if start_dt and end_dt:
                slot["gridRow"] = f"{time_slot(start_dt)} / {time_slot(end_dt)}"
            else:
                slot["gridRow"] = ""
            slot["gridHeight"] = round(
                ((end_dt - start_dt).seconds // 60 if start_dt and end_dt else 0) / 15
            )

    return response


class ScheduleGet(Service):
    """Service to get the conference schedule."""

    context: DexterityContent

    def reply(self) -> dict[str, list[dict]]:
        alsoProvides(self.request, IDisableCSRFProtection)
        rooms = self.get_rooms()
        raw_slots = self.get_slots()
        slots = group_slots(raw_slots, rooms)
        return json_compatible({"items": slots})

    def _serialize_brain(self, brain) -> dict[str, Any]:
        obj = brain.getObject()
        result = getMultiAdapter((obj, self.request), ISerializeToJsonSummary)()
        # Include recurrence if available
        recurrence = getattr(obj, "recurrence", None)
        if recurrence:
            result["recurrence"] = recurrence
        # Enrich presenters using catalog brain to get pre-computed image_scales
        presenters = getattr(obj, "presenters", None)
        if presenters:
            enriched = []
            for rel in presenters:
                presenter_obj = rel.to_object
                if presenter_obj:
                    brains = api.content.find(UID=presenter_obj.UID())
                    if brains:
                        summary = getMultiAdapter(
                            (brains[0], self.request), ISerializeToJsonSummary
                        )()
                        enriched.append(summary)
            if enriched:
                result["presenters"] = enriched
        return result

    def get_rooms(self) -> dict[str, str]:
        rooms = get_vocabulary_for_attr("room", self.context)
        if not rooms:
            return {}
        return {room.token: room.title for room in rooms}

    def get_slots(self) -> list[dict[str, Any]]:
        alsoProvides(self.request, IDisableCSRFProtection)
        portal = api.portal.get()
        review_states = getattr(self.context, "schedule_review_states", None)
        results = api.content.find(
            context=portal,
            object_provides=IScheduleSlot,
            review_state=list(set(review_states or []).union({"published"})),
            sort_on="start",
            sort_order="ascending",
        )
        return [self._serialize_brain(brain) for brain in results]

    