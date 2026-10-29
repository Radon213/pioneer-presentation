# Simulation spring operating curve

`control-preload-data.js` exposes the exact constitutive equation used by both current experiments. It does not reuse the archived Ansys table, fit the current replay to an unrelated curve, or claim physical validation.

The elastic coordinate is **drive angle minus output-link angle**, in mechanical degrees. It is not anatomical knee flexion. The signed law is

\[
\tau_s(\delta)=\operatorname{sgn}(\delta)6\left[0.23577\frac{|\delta|}{101.7}+0.76423\frac{\exp(0.20960|\delta|)-1}{\exp(0.20960\cdot101.7)-1}\right]\;\mathrm{N\,m}.
\]

The STS device kernel and walking direct-force kernel use the same equation. There is no extra spring friction, hysteresis or spring-force clipping in this equation. Motor drag and physical actuator limits remain separate. The source explicitly states that the fit/calibration domain is unknown and values above absolute101.7 degrees are mathematical extrapolation. **101.7 degrees and6 Nm are normalization values**, not hard caps or proof of validation. Use a dashed segment above101.7 degrees and call the plot “Simulation spring law”.

The JSON asset retains separate actual operating paths and provenance:

| Experiment | Saved samples | Elastic deflection range | Spring torque range | Maximum equation residual |
|---|---:|---:|---:|---:|
| Selected STS student, world4 |1801|−0.04458 to98.50795°|−0.000620 to3.718819 Nm|0.00000931 Nm|
| Independent walking candidate, world1 |2719|−37.37255 to103.10483°|−0.519849 to7.589526 Nm|0.00002099 Nm|

These residuals are consistent with the saved float precision. They establish agreement between the displayed simulation law and saved simulation force channels. They do not validate manufactured spring stiffness.

For an animated point, `preloadOperatingPoint` evaluates the law at the displayed elastic deflection. It also retains `savedTorqueNm` separately. Nonlinear evaluation and linear interpolation between display samples do not commute, so this distinction prevents a moving dot from drifting away from the constitutive line. `preloadEnergyJ` is the integral of this same law, converted from degree to radian; it represents simulated elastic stored energy.

The actual STS sequence supports explaining **prepare → assist → release**:

| Recorded time | Deflection | Spring torque | Anatomical knee flexion magnitude |
|---|---:|---:|---:|
|0 s|0°|0 Nm|100.00°|
|1.2 s|44.17°|0.614 Nm|100.68°|
|1.5 s|82.40°|1.227 Nm|100.59°|
|2.0 s|97.47°|3.245 Nm|99.30°|
|2.5 s|98.20°|3.567 Nm|91.07°|
|3.5 s|98.34°|3.633 Nm|48.04°|
|4.0 s|56.33°|0.784 Nm|26.88°|
|5.0 s|1.07°|0.0149 Nm|12.43°|

The spring first reaches90 degrees at1.62 s, while knee flexion has changed by only0.106 degrees from its initial posture. This is an actual preparation phase in the selected recording; a fabricated stand-up or synthetic preload trajectory is unnecessary. Suggested explanatory windows are0.6–2.0 s preparation,2.0–3.6 s assistance and3.6–5.0 s release. These labels describe the saved sequence rather than adding phases to the controller.

All raw originals remain unchanged. SHA-256 hashes, exact source paths, world indices and constitutive checks are embedded in `assets/control-preload-curves.json`. The read-only export script is `/home/arl/Documents/Pioneer/work/control-walking-export-20261029/export_preload_curves.py`.
