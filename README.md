# Pioneer · ICCAS 2026 presentation

Working source and public presentation with continuous Three.js scenes. Current slide revision: `revision-20261029-19`.

- [Presentation](https://radon213.github.io/pioneer-presentation/examples/pioneer-draft/index.html)
- Right / Space: next stage. Left: previous stage. Hold an arrow for fast navigation.
- F: fullscreen. S: presenter notes in a separate window. Use an extended display for presenting.
- A current desktop browser with WebGL is required. Recorded simulation and FEA are replayed in Three.js; a simulation server is not required.

## Editing and validation

Edit `examples/pioneer-draft/deck-data.js`, the scene modules and `style.css` in this repository. The build script generates the HTML and slide manifest from the chapter data. Node.js and Python 3 are sufficient; there are no npm dependencies to install.

```sh
npm run build
npm test
npm run manifest
npm run check
python3 -m http.server 8875 --bind 127.0.0.1
```

Open `http://127.0.0.1:8875/examples/pioneer-draft/index.html`. Commit and push to `main` to update GitHub Pages. Local edits do not automatically publish. Keep the relative `examples/pioneer-interactive/{assets,vendor}` layout.

For asset changes, compare transfer, parsing/memory, mesh preparation and frame costs. The opt-in `?benchmark=unique-run-name` mode reports local loading and replay timings; omit it for presenting. Preserve colours, geometry ownership, bilateral reflection, all source motion frames and continuous transitions.

This is ongoing research. Recorded motion and illustrative FEA replay are not clinical validation or proof of assistance benefit. Only runtime data and small authoring/validation tools belong here; research archives, Blender projects, older experiments and unrelated workspace files remain outside the public repository.

Third-party notices are in `THIRD_PARTY_NOTICES.md` and the corresponding source directories.

## Background sequence

The five Background builds follow joint degeneration, conventional replacement, age-related muscle capacity, three source-composed wearable examples, and a conventional replacement plus source BLDC motor concept, including its shaft. The completed Pioneer assembly is withheld in the last concept build.

HMEDI, OpenExo and Dephy ExoBoot retain their actual MyoAssist human attachments. Their small source-keyframe motion is a kinematic illustration, not a learned assistance result. The 4.42 MB compressed examples prepare on demand while the preceding Background stage is shown; they are absent from the cover download. Quantitative source/provenance and licenses are in `assets/myoassist-examples/`.

The cover restores the four retained native femur/tibia shafts from the existing anatomy meshes and attaches them to the saved bilateral gait bone frames; source gait transforms remain unchanged. The Background surgery build separates the bones, shows explanatory femoral/tibial preparation, inserts the conventional components, presents the polyethylene insert from above, then returns and reduces the joint. This visual sequence is not a surgical planning result. The muscle build uses the original neutral paths from the 80-muscle `myo_sim` model (40 left-side paths); authored tapered display envelopes improve legibility without claiming segmented muscle volumes or activation results. The source count, license and tendon SHA256 are included in `assets/myoleg80-muscles.json`. This adds about 8.5 kB to the lazy muscle step and reuses the loaded native shaft geometries.

All continuous 3D scenes use orthographic projection. Source geometry and camera orientation are retained independently of framing; the Background insert inspection is aligned with the tibial proximal axis and magnified to a 105 mm field height. Femoral and tibial components approach along the bone axis, from below and above respectively.
