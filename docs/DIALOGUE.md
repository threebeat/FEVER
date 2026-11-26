# FEVER • Recording script
## Night shift / call 01 / Relay Six

The table is the game's cue sheet. The executable reads these rows directly. Keep each ID and the column order when revising a take. All actors are silent in this edition. Captions retain their authored timing, including during a missing take. Silence, rifle reports, animal movement and equipment sounds have separate sound events.

| Cue ID | Speaker | Path | Seconds | Priority | Line | Trigger and delivery |
| --- | --- | --- | ---: | ---: | --- | --- |
| R6_001 | DISPATCH | radio | 4.1 | 2 | Seventeen, county lost the repeater at nine. Somebody inside keeps keying the line. | Inbound in the sheriff's aircraft. Routine handoff. No ominous inflection. |
| R6_002 | COLE | world | 3.2 | 1 | Road's under water. This is as close as they can put us. | Beside Reed in the cabin. Raise the voice just enough to carry. |
| R6_003 | DISPATCH | radio | 3.5 | 1 | Relay Six lists one night custodian. Call me when you've got him. | Landing. The shift log is wrong. Dispatch believes it. |
| R6_004 | COLE | world | 2.0 | 2 | I've got the door. | At the intake panel. Occupied with the latch. |
| R6_005 | BELL | world | 2.8 | 1 | Cole. These kennel cards have times of death. | At the numbered cards inside intake. Quiet discovery. |
| R6_006 | IVES | world | 2.6 | 1 | Stop order's signed. The pumps are still running. | Passing the infusion log in the kennel aisle. Clinical concern. |
| R6_007 | BELL | world | 1.2 | 4 | On the left! | The moving kennel latch. Sudden, directional warning. |
| R6_008 | COLE | world | 1.7 | 3 | It's pulling back. Let it. | After the appendage recoils behind the mesh. Speaking to Reed. |
| R6_009 | IVES | world | 2.1 | 2 | There's a man on the floor. | Ives sees the patient through the isolation entrance. |
| R6_010 | IVES | world | 2.8 | 2 | Sir? I'm a paramedic. Can you open your eyes? | At the patient's shoulder. Close, level, loud enough for him alone. |
| R6_011 | BELL | world | 1.8 | 3 | Ives. Your sleeve. | Something has crossed from the patient to the medic. Disbelief. |
| R6_012 | COLE | world | 1.6 | 4 | Back up, Reed. | Ives stands and turns. Short and involuntary. |
| R6_013 | COLE | world | 3.0 | 2 | Wall set's got power. Try County. | The room falls quiet. Exhausted. |
| R6_014 | REED | radio | 3.6 | 3 | County, Seventeen. One patient. One of ours down. Send another crew. | Reed uses the isolation-room radio. Deliberate, effortful report. |
| R6_015 | DISPATCH | radio | 3.4 | 3 | Copy, Seventeen. Second crew is rolling. Keep the line open. | End of the first call. Leave a beat before the last sentence. |

## Delivering takes

Record dry mono PCM WAV at 48 kHz, signed 16-bit little-endian, one file per line. Keep a little room before the first consonant. Deliver the full tails without radio EQ, echo or camera processing. Place the takes in `assets/voice/R6_001.wav` through `R6_015.wav` beside the executable, then relaunch. The runtime detects individual takes. Spatial lines follow the named actor. Radio lines use the wearer's receiver. Playback and captions share a scheduler. Captions last at least the written duration and automatically extend for a longer take. A priority-4 warning can interrupt a lower-priority line. The next line begins after a short gap. Priority-1 observations expire when an urgent cue supersedes them.

The dog uses claw scrape, cage rattle and tissue friction. The medic's transformation uses a torn sleeve, dropped equipment and a body impact. Any future human scream or breath performance needs its own recording cue before it ships.
