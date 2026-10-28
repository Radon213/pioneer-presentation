# Pioneer · ICCAS 2026 presentation

Working source and public presentation with continuous Three.js scenes. Current slide revision: `revision-20261029-12`.

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

The five Background builds follow joint degeneration, conventional replacement, age-related muscle capacity, three source-composed wearable examples, and a conventional replacement plus original Maxon motor concept. The completed Pioneer assembly is withheld in the last concept build.

HMEDI, OpenExo and Dephy ExoBoot retain their actual MyoAssist human attachments. Their small source-keyframe motion is a kinematic illustration, not a learned assistance result. The 4.42 MB compressed examples prepare on demand while the preceding Background stage is shown; they are absent from the cover download. Quantitative source/provenance and licenses are in `assets/myoassist-examples/`.
