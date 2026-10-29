# Control chapter: saved student sit-to-stand replay

The browser layer replays the full saved 18-second nominal selected-student recording. It does not run a controller, integrate physics, synthesize a gait, or repair source states. Both implants and all four retained native femur/tibia shafts are rendered in the same existing Three.js scene.

## Source and display contract

- Source: `p32_student_PPO_physics_pilot_r1/selected_best_checkpoint_audit/actual_trace.npz`, world 4, controller mode 7.
- Exact model: `runtime_p30_physics_student_r1/path48_15/chair22.xml`, SHA-256 `264b1348b75070fd3fc04439db6fe4d3aebef194f63f69e1af629577d1277995`.
- The 100 Hz rendering control grid contains one initial row followed by 1,800 qpos/qvel rows that are bit-identical to the selected source trace.
- Display samples every fourth saved row: 451 original poses, 25 Hz, 0–18 seconds. Runtime interpolates only between consecutive recorded transforms. Source poses and source timing are not corrected.
- Offline export calls only MuJoCo kinematics and tendon wrapping. No integration, forward dynamics, contact/constraint solution, learning or new performance evaluation is performed.
- Existing native gait mesh buffers are shared only after verifying compatibility with this STS model. Four incompatible compiled composite meshes are embedded from the matching STS source. Native POS5/SLPT source faces are partitioned exactly once and rendered on their existing native body frames; no duplicate faces are introduced.
- Full original femur/tibia shaft meshes and their existing bone-local registration are reused on the actual STS bone-body frames. Only the implant-replaced knee ends use the cover's existing shaft-end clipping.
- Chair seat and four legs are exact source box geometries, transforms and colours, including the 40 cm seat top. The chair has not been remodeled to suggest a different source collision setup.

## Telemetry

`getValues()` returns **left-side** values. `kneeAngleDeg` preserves the source signed convention (approximately −100° seated); a UI may label `abs(kneeAngleDeg)` explicitly as flexion magnitude.

`motorPowerW` means the saved last held applied motor-generated torque multiplied by the saved drive-coordinate speed, output-referred. It is **not** the physical output-shaft power and must not be compared to a physical shaft-power limit under an ambiguous label. `sourceRecordedPowerPeakW` is the corresponding saved cumulative absolute command-power peak.

Requests, applied effort and spring torque are the source last held controls at the end-of-step row. The initial display pose repeats the first recorded control values. Source qpos/qvel correspond to the end-of-step state; a pre-action observer estimate is not substituted for the true post-action spring deflection.

The small `phaseLabel` is descriptive, using the source recorded seated duration (0.94 s) and final quiet-standing interval (13.21 s) for approximate boundaries. It is not a new task-success detector.

## Research scope

The final selected model is a behavior-cloned limited-sensing GRU residual student with a physical observer and fixed motor servo. The PPO pilot added no measured gain. Nominal repeated successful stand-up executions do not establish clinical benefit, general robustness or the contribution of the neural residual. Constraint refresh, loop-closure residual and device/chair collision audits remain open.

The machine-readable JSON records all source paths, hashes, geometry compatibility checks, source-face partitions, output hashes and the unchanged-source audit. Transfer payload: 2,765,661 bytes gzip; decoded binary: 5,391,192 bytes. Original mesh and research assets remain outside this compact replay payload.
