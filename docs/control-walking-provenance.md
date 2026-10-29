# Recorded walking replay and telemetry

The Control walking view uses world 1 of the independent 30-second candidate test in `cycle_execution_tracking_r1/independent30/rollouts.npz`. It is a different controller and experiment from the sit-to-stand student. This candidate stopped at 27.19 s after exceeding the actual shaft-power limit; it is not an assistance-benefit demonstration.

- 681 display poses cover the complete saved 0.01–27.19 s interval, sampled at 25 Hz plus the exact final state.
- Mesh, body, muscle wrap and retained native shaft transforms come from that candidate's saved states and its exact source XML. Export calls only `mj_kinematics` and `mj_tendon`; every dynamics/forward/integration entry point is blocked.
- The static geometry is shared with the loaded native gait geometry after verification. Four compiled composite meshes retain source triangles with the existing POS5 ownership partition, avoiding duplicate faces. No source gait poses are reused.
- Actual pelvis X is subtracted uniformly from all visual positions to display the walking person in place. This is a display frame only; limb relationships, orientations and source telemetry are unchanged.
- Position and quaternion interpolation make the 25 Hz display poses continuous. Telemetry retains every original 100 Hz sample, and `sampleWalkingTelemetry` linearly interpolates only between adjacent samples for display. A source peak or limit exceedance is never clipped, smoothed away or replaced.
- The last saved requested motor torque is 7.3015676 Nm, applied motor-generated torque is 5.3952665 Nm, and absolute actual shaft endpoint power is 26.9548206 W, above the unchanged 25 W limit. Actual shaft power and motor-generated torque times drive velocity are different quantities here.

`control-walking-provenance.json` records protected source hashes, compatible mesh checks, exact face partitions, source IDs and output hashes. The export script is `scripts/export-control-walking.py`; its Python environment needs MuJoCo 3.4.0, NumPy and SciPy. Original research files remain outside the public runtime repository.
