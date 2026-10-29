# Presentation layout and motion revision 46

The canvas stays 1920 × 1080. Margins are 76 px horizontally and 52 px above the
header; the figure spans y=210…972. Each stage declares its own right-copy
measure and vertical placement in `deck-data.js`. Hard line breaks have been
removed from the audience paragraphs so the authored measure controls wrapping.
A larger red takeaway replaces the former small blue question. Original
transition questions and evidence boundaries remain in presenter notes.

The right copy reveals characters in sentence order while retaining bold text
and full layout dimensions. One Web Animations clock controls the reveal, so
held-key speed changes also accelerate it. A complete screen-reader text copy
is present immediately. Reduced motion displays all text without typing or
spatial exit. The previous copy moves upward while fading. A single persistent
Three.js renderer continues behind the text transitions.

The footer lists six clickable chapters; the active chapter has red emphasis.
Links support keyboard focus and Enter, cancel queued navigation, and animate
the existing scene to the chosen chapter. The small within-chapter indicator
remains alongside the page number.

Initial progress is a monotonic weighted work percentage, not an ETA. CAD,
metadata, musculoskeletal anatomy, gait transfer and mesh setup have fixed
weights; requested supplementary sources share a reserved weight. Byte progress
is used only during measured transfers, followed by decode/parse/build
checkpoints. The final reserve completes only after the first scene is ready.
No loading timer invents byte completion.
