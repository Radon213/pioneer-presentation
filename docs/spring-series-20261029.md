# Spring comparison and series estimate

`examples/pioneer-draft/spring-series-data.js` retains the finite source rows in `archived-spring-chart.js` and exposes source comparison, a strictly overlapping series calculation, and a separately named analytical completion. The source CSV files are not modified.

## Assembly mapping and common axes

The user's presentation assignment is lower/contact-compliant spring → `P2_a07_b10`, upper spring → `P2_a07_b20`. This is a presentation assignment; the CSV metadata does not independently link these solver runs to current native CAD versions.

Both raw component graphs use exactly **0–120° and 0–20 N·m**, with the same physical tick spacing. This makes b20 appear low on the full-scale chart, because its supplied calculation ends at 45° and 1.0921 N·m. Independently normalising its height would exaggerate its torque response.

The b10 loading points run 1.2–120° and 0.059299–17.251 N·m. The b20 loading points run 0.45–45° and 0.044673–1.0921 N·m. Neither initial torque is available at zero deflection; no (0,0) datum is fabricated. The torque decrease at b10 29.213→32.288° is retained, including in derived curves.

## Correct series operation

Series springs carry equal torque. Their deflections add:

`δ_total(τ) = δ_lower(τ) + δ_upper(τ)`

Adding torques at equal angle would describe a parallel connection and must not be used. As b10 has a nonmonotone segment, the calculation preserves its source angle order rather than replacing the entire curve with one inverse. The monotone b20 table is inverted by piecewise-linear interpolation at each b10 torque. A point is inserted at the exact upper endpoint of the common torque domain.

`SERIES_COMPOSITION` contains only the overlap **0.059299–1.0921 N·m**, ending at **115.018393° total deflection**. Its local low/higher-overlap fits are 0.007997 and 0.018183 N·m/degree. These are not the full high-torque stiffness of the assembly.

## Local line approximations

All fits use ordinary least squares with a free intercept, with explicit selected angle ranges. Numbers are rounded here only; exported values retain precision.

| Quantity | Branch range | N·m/degree | N·m/radian |
| --- | --- | ---: | ---: |
| b10 low | 33.826–59.007° | 0.013599 | 0.779158 |
| b10 high | 81.627–120° | 0.362997 | 20.798201 |
| b20 low | 6.3844–22.616° | 0.022390 | 1.282831 |
| b20 terminal | 34.149–45° | 0.028080 | 1.608871 |
| Source-only series low | 45.969–88.977° total | 0.007997 | 0.458219 |
| Source-only series higher overlap | 102.017–115.018° total | 0.018183 | 1.041800 |

The component called the stiffer/upper spring is stiffer initially, but it is not stiffer than the b10 contact-hardening branch at high angles. This is a numerical consequence of the supplied tables and should not be hidden by independent graph normalisation.

## Explicit analytical completion

The parent requested an approximate full series trend with clear separation from solver output. `SERIES_LINEAR_ESTIMATE` therefore uses actual interpolation inside the overlap, then assumes that the upper spring retains its terminal local slope of **0.028080 N·m/degree**, continuously anchored at the last source point (45°, 1.0921 N·m). This is an analytical assumption, not a new FEA result. All points beyond 1.0921 N·m are marked `extrapolated`; draw that continuation dashed and display the model label.

This model's high branch has approximate stiffness **0.026064 N·m/degree (1.493363 N·m/radian)** over total deflection **209.704–740.457°**. The very large inferred upper-spring angle is not verified available travel or physical feasibility. Its composite graph consequently needs a separately labelled 0–800° axis; it cannot be compressed into a 0–120° graph while retaining correct physical coordinates. The source component graphs still share their identical physical axes. A full-range series law for the actual hardware requires upper-spring data over the intended torque/travel range.

## Validation

`node --test examples/pioneer-draft/tests/spring-series-data.test.mjs` checks exact source retention, common axes, equal-torque deflection addition, preservation of the torque drop, rejection of out-of-range source inversion, slope-unit conversion, and continuity/marking of the separately modelled continuation. No research solver settings or original files are changed.

## Presentation geometry and animation

The source CAD remains intact. The compliant lower unit is `weak_spring_top`;
the upper unit is `strong_spring_bottom` in the original export names. Their
open spiral faces point in opposite R5 axial directions. The upper unit is
turned 180 degrees about its own radial axis for the explanatory face views;
its axial centre is preserved. The camera is an OrthographicCamera aligned
exactly to the spring axis, without the previous small oblique component.
Coral accents follow actual planar-face boundary edges and the same display
warp as the original mesh. These winding/contact animations are illustrative,
not added finite-element frames or material-yield simulations.

The conceptual contact diagram has a continuous torque and an immediate
increase in tangent stiffness at its normalized threshold. The threshold is
not a calibrated contact angle. The source loading curves are unchanged.

The 4-5 to 4-6 handoff retains camera orientation, target and orthographic
scale, and cross-dissolves a registered native coil into the representative
FEA geometry. Different source geometries are not claimed to be node-equivalent.
