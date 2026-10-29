# Hardware chapter motion revision

The six builds retain one original CAD instance and one renderer:

1. Native bone surfaces: qualitative flexion, roll/glide and medial-side rotation. Visual references are the master's interim presentation printed page 4 (PPTX slide 6, `image22.gif`) and its sagittal bone-motion GIF (printed page 3; PPTX slide 5, `image17.gif`). The GIF frames were inspected locally, not added as runtime video. This Three.js motion is an explanatory reconstruction, not recovered cadaver measurements or solved contact.
2. The equivalent four-bar overlays J1–J4 on the source mechanism. J2 remains an equivalent virtual point (dashed ring), never a new physical pin. The traced femoral reference is rigidly fixed to the J2–J3 body (`condyle_right`), with neutral URDF coordinates [0, 0, 0.021] m. The point is transformed from that body’s neutral local frame through every source pose; it is not attached to J2. Its path depends on this reference-point choice and is not a fitted patient trajectory. This build uses an exact orthographic sagittal view.
3. One source-kinematic cycle shows J3 descent, slider retreat and medial rotation together. Linkage base, surrounding inserts, fasteners, bearings and covers are translucent (retained rather than omitted); source POS5 ownership is unchanged. Overlay displacement and angle come from the exact same interpolated source frame.
4. The camera rotates toward the axial view. A world-space sector and live degrees mark the actual source pivot axis, without multiplying the displayed angle for emphasis.
5. Continuous flexion/extension reveals the motor and gears, using all nine restored joint coordinates. No assistance outcome is claimed from this replay.
6. The motor withdraws along its actual shaft axis, and the output separates along the original R5 axis. The two springs stay assembled at their source spacing, with complete original meshes including clamps and inter-spring connecting geometry. No spring explosion or coil-face subset is used in this build. The JSM support stays with the spring assembly. Peek_Bushing, both POS5 parts and Helical 1M 21T remain opaque at their original assembly locations, with faint supporting linkage context. Pins, shoulder bolts and incidental washers remain hidden here. All offsets reset on exit; source joints are not reparented by the presentation.

The replay traverses source phase 0–0.86 over 7.6 seconds and reverses smoothly, using the same clock as held-key navigation. Reduced/static motion retains a representative source pose. Hidden tabs pause through the existing application visibility handler. No new binary assets or rendering dependencies were added.

Revision 25: all projected circle markers compensate for nonuniform SVG viewport scaling. Hardware leaders and labels are hidden during camera/explosion transitions, then fade in for 0.35 s after settling. Pure source-data tests verify the neutral 21 mm point and its rigid attachment throughout every archived mechanism frame.

Revision 30: E-LBBH6L original source subtree 357 is removed from its wrong composite owner and attached to the pre-existing `e_lbbh6l__1_` slider link. Source triangle counts, original materials and joint actions are preserved. See `slider-bearing-binding-audit.json` for 263-pose verification. The corrected, source-preserving Blender/URDF package is retained locally at `work/slider-frame-repair-20261029/source-package/`.

Revision 46: the original native composite grouping also placed the cross-roller cages and eight CBSTSSR fasteners under the rotating linkage, and kept both inner linear-guide rails with the outer rails. The presentation derivative now partitions those exact named source subtrees and binds the inner rails plus four inner fasteners to the translating slider. The four outer fasteners stay with the fixed tibial race. Both roller cages retain their neutral registration and are fixed to the outer race as requested; the original URDF grouped their empty frames with the slider, so this deliberate derivative mate correction is recorded separately from the unchanged research source. No vendor parts or duplicate faces are introduced: 680,404 source triangles remain exactly once across 66 rendered meshes. The transfer is 8,657,013 bytes gzip, an increase of about 80 KiB from splitting original composite meshes.

The two `12mm_m3_shcs` spring screws were already present in the source and exported mesh. Their disappearance was a chapter visibility filter, not a missing Part Studio conversion. The drive explanation restores both screws with the intact spring assembly. The new derivative Blender and corrected URDF package are retained locally in `work/hardware-ownership46/source-package/`; `hardware-ownership46-audit.json` records the source node IDs and 263-pose rigid-registration checks.

The native-bone explanation now uses the same J2–J3 rigid-body transform as the femoral reference starting at neutral URDF Z +21 mm. The camera continuously moves between exact sagittal and axial views. The next step deliberately holds axial rotation neutral to isolate sagittal four-bar motion; the following step restores the coupled source motion. The gear explanation first holds a gear close-up, then moves continuously to the complete drive. These presentation compositions do not alter the source recorded kinematics.

## Presentation revision 46

The new derivative source-mesh ownership audit is recorded in
`hardware-ownership46-audit.json`. Original triangle counts are unchanged;
inner guide rails and their four bolts follow slider translation, while the
outer rails, roller cages and outer four bolts remain in the tibial frame.
The M3 × 12 mm spring fasteners were already in the source geometry and are
restored through visibility conditions rather than by adding duplicate parts.

Stage 3-2 temporarily neutralizes the axial-pivot display coordinate to explain
the sagittal four-bar alone. Other mechanism stages preserve the source coupled
motion. This isolated display is not a new dynamics validation.

Stage 4-1 reassembles the motor, native spring cartridge and output. Its eight
second winding/release cycle locks the output and splits a maximum illustrative
24 degree input between the two spring units (71% / 29%). The vertical torque
bar is qualitative, normalized from zero to one. It is not an ANSYS load point
or a calibrated physical torque result. The cover knee inset magnifies the
actual saved walking frame and knee-flexion angle; it introduces no stress
field or additional gait claim.
