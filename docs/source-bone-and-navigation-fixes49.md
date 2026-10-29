# Revision 49: source bones, surgery sequence and overlay cleanup

The saved cover gait is the actual recorded device-worn simulation. Its original
export filter included group 0 anatomy and group 2 device visuals but excluded
the four **group 1 CAD bone** geoms in the source XML. The presentation later
filled that omission with native STS femur/tibia surfaces and a world-up 55 mm
cut. Those substitutions did not match the source implant's machined interfaces.

This revision removes that substitution and shader clipping. It loads the exact
source CAD femur/tibia OBJ surfaces and XML local transforms, follows the saved
femur/tibia body poses, and shares the original left geometry through a proven
right reflection. All source model/mesh/trace files remain untouched. The export
report and hashes are in `gait-source-bones49.json`. Across every saved gait frame,
placements agree with the independent saved CAD registration to within 1 µm.

The source mesh is preserved without decimation: 423680 femur triangles and
437054 tibia triangles per side. Bilateral buffers are shared; compressed transfer
increases by 7918897 bytes. The added load participates in the overall progress
indicator. No new solver or clinical result is claimed. The cover magnifier now
includes the actual bone/stem interfaces and renders only the left source limb.

Background 2-2 now shows the polyethylene insert top view **first**, returns to
the normal oblique view, separates and prepares the bones, inserts the femoral
component upward and the tibial component downward, and finally reduces the
joint. The sequence also runs when that URL is opened directly. Independent
sequence tests ensure the camera returns before either axial insertion begins.

Hardware 3-1 retains only the link-fixed trajectory and the label **Rotation +
translation**. Camera framing follows visible bone surfaces plus the complete
trajectory, targeting 84% of the available figure height during side/top orbit.
The neutral Z +21 mm reference and the motion source are unchanged.

The residual spring overlay was a visibility bug: inline `display:flex` on 4-1
out-ranked the hidden rule. Display layout is now declared in CSS, and the hidden
rule is authoritative. θin and θout in 4-1 now share the same SVG left anchor and
font size.

4-2 keeps the trade-off prose only in the right body. Duplicate pros/cons below
the graph are removed; curve labels and synchronized same-torque points remain.
