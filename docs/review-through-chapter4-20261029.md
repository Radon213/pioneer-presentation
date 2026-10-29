# Visual review through Chapter 4 — revision 48

Reviewed the actual browser-rendered cover and all 18 Background / Hardware /
Spring stages, advancing with the presentation keys. Static captures were
supplemented with multiple phases of the bone inspection, implant insertion,
side/top orbit, gear close-up, spring winding, contact and FEA playback.
Reference viewport: 1422 × 800, with the presentation's fixed 16:9 canvas.
Screenshots are retained outside the public runtime under
`/home/arl/Documents/Pioneer/deploy/proofs/revision48/`.

## Findings and corrections

| Stage | Review and action |
| --- | --- |
| Cover | Walking femur/tibia, bilateral device, authors and PNU signature present. Knee magnifier was overwriting the left edge of the adjacent FEA spring; moved the spring right within its existing viewport. |
| 2-1 | Two small flexions lead into the actual tibial-surface top view, then the surface leaders appear. Older-adult framing and red emphasis retained. |
| 2-2 | Reviewed bone separation, opposite axial insertion directions, enlarged insert inspection and reduction. Red highlight clears; original educational display fit retained. |
| 2-3 | MyoLeg80 muscles and large 100 → 38 strength bars retained; source identifies the early postoperative cohort, not sarcopenia prevalence. |
| 2-4 | Three mounted source models and their device names are visible, without stretched external pictures. |
| 2-5 | Conventional implant + BLDC motor, with names beneath and no leader arrows. |
| 3-1 | Joint/trajectory framing was unnecessarily small. Replaced diagonal-based padding with inspected-cube extent framing; shortened descriptive leaders. The link-fixed neutral Z +21 mm reference is unchanged. |
| 3-2 | Exact side view, no axial pivot and no femoral shell. Removed nonparticipating translucent fasteners that looked detached. Core joint hardware and explicitly requested highlighted parts remain. |
| 3-3 | Slider/J3 coupling retained; hide the femoral shell and incidental fasteners during mechanism explanation. |
| 3-4 | Live medial-pivot angle and center retained; same reduced contextual-part visibility. |
| 3-5 | Inspected moving gears close-up followed by wider continuous flexion. Part49 retained. |
| 3-6 | Motor / intact spring assembly / output only, separated along their own axes. Clamps, inter-unit connection and M3 screws retained. |
| 4-1 | Assembly returns from axial explosion, output held, input winds. Equation was still too small and low; enlarged it and moved it immediately above the winding/torque figure. |
| 4-2 | Low/high stiffness pros and cons, common-torque moving points and matching unequal rotations retained. Removed tiny detached arc fragments; put live angles beneath their spring units. |
| 4-3 | Tangent-stiffness equation and compliant-to-stiff response retained; same improved model labels. |
| 4-4 | Separated opposite spiral faces, real-edge highlight and horizontal deflection-addition animation retained. Added upper/stiffer and lower/compliant labels directly below the units. |
| 4-5 | Lower spring only; contact ring and slope change retained. Removed the diagonal leader/text across the spiral; contact label is below it. |
| 4-6 | Camera-aligned CAD/FEA handoff, native model hidden and large FEA/curve retained. Replaced misleading paired “reaction torque” prose with deformation/stress and torque–rotation comparison. Visible note states separate analyses aligned by rotation. Static 110° equation now denotes maximum angle and sits above the FEA spring rather than at the distant bottom edge. |
| 4-7 | Both raw charts retain identical physical axes. Series continuation remains dashed; accompanying copy explicitly calls it a linear upper-unit approximation. Raw points and numerical calculations are unchanged. |

Hardware now has stage-specific subtitles rather than repeating the same
chapter-wide subtitle in all six stages. The cream/serif shell, typewriter
body, upward text exit, chapter TOC and one persistent WebGL scene are retained.

## Evidence boundaries

- Educational bone cuts / component display fit are not a surgical plan.
- Native comparison motion, distributed CAD spring warp and contact marker
  explain mechanics; they are not measured contact or stress solutions.
- Representative FEA and supplied ANSYS torque tables are separate analyses.
  Stress normalization retains the original global maximum; no material/yield
  value has been fabricated.
- The high-angle series continuation is an analytical extrapolation, not
  verified physical travel or a new solver result. See
  `spring-series-20261029.md` for source ranges and fitting details.
- Original research sources and mesh asset files were not changed by this pass.
- Control content and source replay behavior were outside this review's scope;
  only their shared module cache-version references were refreshed.
