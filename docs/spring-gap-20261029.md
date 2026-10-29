# Chapter 4-5: illustrative gap closing

The native compliant-spring mesh is preserved intact. Only the presentation warp and orthographic framing change. Research sources, FEA replay, and quantitative torque curves remain unchanged.

- The 10-second wind/release loop now reaches 160 degrees rather than 54 degrees. This is deliberately exaggerated to make narrowing gaps visible; it is **not** a solved contact angle, physical travel validation, or the separate 110-degree FEA replay.
- The amplified view applies the same radius-dependent twist through the full part depth. The inner hub rotates rigidly instead of being sheared through the previous 0.4-mm axial transition. The mapping preserves cylindrical radius and height and has inverse `theta_original = theta_display - twist(r)`. No indices are clipped or triangles removed. This establishes a non-crossing continuous mapping, but is not a mechanical deformation solution.
- Orthographic field height changes from 45 mm to 43 mm. A 12.4-degree oblique view and a side inspection light reveal the real slot walls, which otherwise blend into the same-colour backing plate. Base material colours and original backing geometry remain intact. Original CAD boundaries are traced in the existing coral accent. The gap cue says “Gap closing” rather than claiming a solved contact location.
- The full-depth mode is retained during the existing camera-aligned CAD-to-FEA dissolve. Other spring stages retain their previous motion.

## Geometry spot check

The original GLB's Draco position/index buffers were decoded locally using the bundled decoder. The exposed planar face yielded the same 376 boundary segments as the runtime accent. Intersections with 720 radial rays were sorted, restricting radius to 4.1–9.9 mm. Among narrow adjacent intervals (3 micrometres to 1 mm), the minimum sampled radial interval was:

| Illustrative twist | Minimum interval |
|---|---:|
| 0 degrees | 0.789 mm |
| 54 degrees (previous maximum) | 0.688 mm |
| 130 degrees | 0.577 mm |
| 160 degrees (new maximum) | 0.543 mm |

These are display-geometry radial intervals, not a minimum three-dimensional contact gap or FEA measurement. The new maximum is approximately 31% narrower than the undeformed radial interval and 21% narrower than the previous maximum. The gap approaches but does not become mathematically zero in this invertible teaching warp.

Presenter note: “This winding is amplified to make the reduction of free space visible. The contact mechanism is conceptual here; the next view uses a separate recorded deformation field.”
