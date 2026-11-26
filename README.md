# FEVER

One night, three police bodycams. Drive as Reed with Cole in the passenger seat. The two of you answer a late disturbance at a Michigan animal-control facility. Reed carries a service pistol. Pick up a Louisiana deputy's recording when a daughter asks someone to check her mother's house. Before dawn, follow a Vermont officer up a ski-area service road outside Stowe.

**[Download FEVER for Windows x64](https://github.com/threebeat/FEVER/releases/latest/download/FEVER-Windows-x64.zip)**. Extract the ZIP and open **FEVER.exe**. The native game runs on Windows 10/11 with a Direct3D 11 feature-level 11_0 graphics device. Begin Shift starts in Michigan. Select Recording opens any call directly. Firing Range offers seven weapons and resetting steel plates. Practice leaves the call checkpoint intact. Both visual modes and the camera, mouse and stick adjustments are in Options. Settings and checkpoints live in `%LOCALAPPDATA%\FEVER\shift.dat`.

![In-car recordings and on-foot views in Michigan, Louisiana and Vermont, plus the training annex](https://github.com/threebeat/FEVER/releases/latest/download/FEVER-recordings.jpg)

## Controls

| Action | Keyboard and mouse | Xbox-compatible pad |
| --- | --- | --- |
| Walk / look | WASD / mouse | Left / right stick |
| Aim / fire | Hold right / left mouse | Hold LT / RT |
| Equipped weapon | Wheel or 1, 2, 3 | Tap Y |
| Reload / interact | R / E | X, context sensitive |
| Flashlight | F | D-pad up |
| Sprint / crouch / hop | Shift / left Ctrl / Space | Left stick click / B / A |
| UV light in Vermont | V | D-pad left |
| Seven range weapons | 1 through 7, wheel or issue bench | Y or X at bench |
| Slide | Left Ctrl during a sprint | B during a sprint |
| Pause / menu selection | Esc, arrows, Enter or mouse | Start, D-pad, A / B |
| Frame-time display / reload tuning | F3 / F5 | — |

## Design and research

- [Game and technical design](docs/DESIGN.md) covers the three playable calls, native runtime decision, bodycam optics, world-space anatomy, material pipeline, AI, audio and low-end performance targets.
- [What other engines can teach us](docs/ENGINE-RESEARCH.md) compares shipped games and developer talks. Each technology has a use in FEVER and a test to decide whether it earns its cost.
- [Patrol and handling research](docs/PATROL-AND-HANDLING.md) connects references from Reissad, Infinity Ward, DICE, Wolfire, Epic and Unity with FEVER’s implementation and test cases. It includes the police and in-car reference material.
- [Recording script](docs/DIALOGUE.md) contains all 38 dialogue lines with timing, speaker, location and direction. Captions work now. Supply dry mono 48 kHz 16-bit WAV takes under `assets/voice` to enable speech.
- [Open/closed-door listening comparison](docs/media/kennel-door.flac) plays one shot twice from the same spot. Listen to the steps during recovery.

## Build from source

Use Visual Studio 2022's Desktop development with C++ workload, a Windows SDK and CMake 3.20 or later. The executable, renderer, gameplay, animation and audio are C++17. The release includes cooked art. To regenerate the additional character poses, range models and signs, install Node.js 20 or newer, Python 3 and Pillow, then configure CMake with `-DFEVER_RECOOK_ART=ON`. A source checkout missing the new models runs the cook automatically.

```powershell
cmake -S . -B build -A x64
cmake --build build --config Release --parallel
ctest --test-dir build -C Release --output-on-failure
.\build\Release\FEVER.exe
```

CMake copies the runtime assets and cue sheet next to the executable. The portable simulation tests also build on Linux using the same CMake project without `-A x64`. Optional editing tools are Node for `node tools/import-relay.mjs` and Python/Pillow for `python tools/bake-graphics.py`. Neither is required to play. The graphics sheet cooker uses the DejaVu Sans Mono and Open Sans Condensed Bold fonts listed in the script.

**Verification.** `python tools/audit-assets.py` inspects every mesh and texture mip chain. `FEVER.exe --verify` asks the Windows software Direct3D driver to exercise the actual renderer and save reference images under `proof`. The [Windows workflow](https://github.com/threebeat/FEVER/actions/workflows/desktop.yml) builds the native edition and runs the three calls, both Vermont endings and the range.

**Hardware report.** In the extracted game's folder run `.\FEVER.exe --benchmark`. It writes **FEVER-benchmark.csv** alongside the executable. The test requests the hardware adapter and a 1920×1080 output, warms both modes, and records 128 frames per mode. Rows contain the adapter, actual render dimensions, simulation CPU time, rendering submission CPU time and timestamped GPU time. A disjoint GPU timer is left blank. This is a synchronized render-cost comparison. F3 during ordinary play measures delivered frame pacing including presentation.
