Remus
=====

Remus is a JSON-based format for representing musical data. To work with remus data, the `remus` JavaScript library is provided.  

## Basic structure

Remus is a hierarchical structure of musical objects where the root object is the [`Song`](class/lib/classes/event/song.js~Song.html). Conceptually, a song consists of

* a timeline
* objects relating to the timeline
* objects that do not relate to the timeline, and therefore have no timing (a resource pool)

Examples of the latter can be links, audio files not [yet] used in the actual song, imported lyrics, MIDI-files, etc.

Technically, objects on the timeline are stored under one of two JS keys: `events` and `metas`. This is similar (but not identical) to how MIDI files use “events” and “meta events”. The event list contains the objects that actually “sounds”, notes, chords and audio file references, while the meta list contains information such as tempo, time and key signature.

The event list may also contain other containers to created nested objects of arbitrary depth. (Note however that there are restrictions for where certain objects can be stored)

## Items

All objects in remus document are referred to as _items_ and inherit from the [`Item`](class/lib/classes/item.js~Item.html) class. All items have a `type`, a string denoting the class name. When loading remus using the `remus` library, items are instantiated to the JS class named by their specified `type`.

Here follows an overview over the various item classes. Detailed documentation is available in the source files of the respective item class.

### Abstract classes
- [`Item`](class/lib/classes/item.js~Item.html)
Ancestor of all items
- [`Event`](class/lib/classes/event/event.js~Event.html)
Ancestor of all items that have a position on the timeline
- [`Meta`](class/lib/classes/event/meta.js~Meta.html)
  Meta events
- [`EventContainer`](class/lib/classes/event/event-container.js~EventContainer.html)
  Events containing other events

### Basic types
- [`Duration`](class/lib/classes/duration.js~Duration.html)
  Durations in various units
- [`Pitch`](class/lib/classes/pitch.js~Pitch.html)
  Pitch representation
- [`Interval`](class/lib/classes/interval.js~Interval.html)
  Pitch intervals
- [`Harmony`](class/lib/classes/harmony.js~Harmony.html)
  Chords (e.g. dominant or minor seventh)
- [`Mode`](class/lib/classes/mode.js~Mode.html)
  Modes and scales (e.g. major, dorian, minor penta)

### Events
- [`Note`](class/lib/classes/event/note.js~Note.html)
  A single note (essentially a Pitch placed on the timeline)
- [`NoteChord`](class/lib/classes/event/note-chord.js~NoteChord.html)
  A “chord” of simultanous notes
- [`Chord`](class/lib/classes/event/chord.js~Chord.html)
  A chord (essentially a Harmony placed on the timeline)
- [`Rest`](class/lib/classes/event/rest.js~Rest.html)

### Meta-events
- [`Time`](class/lib/classes/meta/time.js~Time.html)
  A time signature such as 4/4 or 6/8
- [`Key`](class/lib/classes/meta/key.js~key.html)
  Key signature
- [`Tempo`](class/lib/classes/meta/tempo.js~Tempo.html)
  Tempo indication or tempo change
- [`Clef`](class/lib/classes/meta/clef.js~Clef.html)
  Clef (for sheet music generation)


## Coercing and type inference

Most of the `Item` classes has a `coerce` method that simplifies creation of instances.

For example, this is an easy way to create a [`Pitch`](class/lib/classes/pitch.js~Pitch.html) object:

```
Pitch.coerce("Ab4")
// equivalent to
new Pitch({coord: [40, 68]})
```

(For information of supported formats, see the documentation of the respective `Item` class)

In places where a specific `Item` class is expected, its `coerce` method is called automatically. Therefore it is often not needed to specify a complete JS object.

For example, the [`Key`](class/lib/classes/meta/key.js~key.html) class has two members called `root` and `mode` which are of type `Pitch` and `Mode` respectively. The following code works as expected:

```
new Key({pitch: "Bb", mode: "minor"})
```

This is because under the hood, the `Key` constructor calls `Pitch.coerce` on the string `"Bb"` and `Mode.coerce` on the string `"minor"`, resulting in a `Pitch` and a `Mode` object.

As an another example, this is a valid representation of a [`NoteChord`](class/lib/classes/event/note-chord.js~NoteChord.html):

```
{
  "type": "NoteChord",
  "duration": "3/16 wn",
  "events": [
    {"pitch": "D5"},
    {"pitch": "Bb4"},
    {"pitch": "F4"}
  ]
}
```

Notice that

- the duration is coerced to a `Duration` object
- the default event type of `NoteChord` is `Note`, so the
  three elements in the event list doesn't need `type: "Note"`
- the duration of the `NoteChord` is inherited by the notes
- the pitches of the individual notes are coerced into `Pitch` objects

This is usually preferable to specifying every object in full:

```
{
  "type": "NoteChord",
  "duration": {
    "type": "Duration",
    "value": "3/16",
    "unit": "wn"
  },
  "events": [
    {
      "type": "Note",
      "pitch": {
        "type": "Pitch",
        "coord": [43, 74]
      }
    },
    {
      "type": "Note",
      "pitch": {
        "type": "Pitch",
        "coord": [41, 70]
      }
    },
    {
      "type": "Note",
      "pitch": {
        "type": "Pitch",
        "coord": [38, 65]
      }
    }
  ]
}
```

## Positioning

Events are generally positioned in relation to their parent container. For example, notes specify their position in relation to their voice.

Each event has an anchor point, which is normally the “start” of the event. It may however be changed so that e.g. voices with pickups to sync to other events on their first downbeat, rather than their first note.

## Resolving

Remus is designed with flexibility and extendability as high priorities. The flip side is that parsing remus may be a complex process since the code needs knowledge about the various concepts and representations supported by remus.

To facilitate things, the remus library can _resolve_ a remus object. This means that is walks through its structure, expands inherited properties, converts various units etc. The result is then cached in each remus object.

```
let remus = loadSomeComplexRemusFile();
remus.resolve();
let note = remus.findEvent('Note');
note.cache.absWn
  => the absolute position of note in wn (whole notes)
```

For detailed documentation of the timeline-related cache keys, see [`Event`](class/lib/classes/event/event.js~Event.html).