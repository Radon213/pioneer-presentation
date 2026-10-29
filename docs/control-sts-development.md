# Recorded sit-to-stand development replay

The animated sequence uses **three separately recorded controller-development snapshots**, rather than synthetic falls or a fabricated reinforcement-learning curve:

1. **Early human-policy training**: the earlier bare-human `baseline_development/threshold_0.51/trace.npz`, world 24, 0.01–9.51 s. It rises, loses balance and falls completely to the ground. The source simulation continued recording physical motion after its validity failure; this unscored continuation makes the fall visible. No implants are displayed, and both femur/tibia knee ends remain intact.
2. **Stand-up, then loss of balance**: `p13_momentum_duration_screen_r2_0`, world 2, through its last active sample at 5.32 s. The pelvis reaches approximately 0.90 m but the attempt does not complete the standing task.
3. **Successful student**: the existing selected limited-sensing BC student, world 4, 18 s. This is the same qualified-as-diagnostic nominal result already used by the presentation. PPO did not supply a measured improvement.

The second clip stops at its last `active_before` sample, before a later automatic reset. The first clip intentionally includes its existing recorded continuation after validity failure, through the complete ground fall and settling. It is a demonstration of the early human-policy problem, not an implant-assistance result. Do not describe these snapshots as successive PPO checkpoints or assume that changing human/controller profiles is a controlled intervention.

`control-sts-development.bin.gz` contains actual offline forward-kinematic transforms and muscle wrapping paths at the source 20 Hz for the early bare-human fall and 25 Hz for the implanted attempt, interpolated for display. Missing implant tendon slots in the bare-human model remain empty; source tendon names map explicitly. Every retained mesh and geom transform is checked against the exact historical model before sharing the selected student's geometry. No integration, policy execution, pose repair, or invented fall is performed. The two historical assets load lazily only when the development sequence is requested.

## Chair correction

The replay visually translates **`chair_leg_3` and `chair_leg_4` by +0.10 m along source X**, exactly matching `student_success_chair_legs_adjusted_r1/CHAIR_LEG_ADJUSTMENT_AUDIT.json`. This positions the rear legs below the seat. The 40 cm seat and all recorded human/device trajectories are unchanged. This is a visualization correction, not a rerun of the physical experiment.

## Runtime integration

```js
await sts.ensureDevelopment();
sts.setDevelopmentProgress(clockSeconds / sts.getDevelopmentDuration());
const {developmentLabel, developmentIndex, developmentCount, sourceTime} = sts.getValues();
```

The two failed clips play at 0.75× source speed and hold their final recorded pose for 1.5 s each. The successful student plays its first 8 s at 1×, including the rise and approximately 3 s of standing. The full 18 s nominal replay remains available on the later evaluation slide. Total development-sequence duration is approximately 30.75 s; playback changes never alter the underlying recorded poses or telemetry. The slide uses `getPoseBounds()` with a damped camera follow so the falling body stays large and inside its model lane. `getDevelopmentBounds()` remains available for the full trajectory extent; ordinary `getBounds()` retains the successful student's framing. A trial boundary explicitly resets to the next trial's first recorded state; no interpolated bridge is presented as physical motion. Use `sts.setAttempt('student')` before ordinary selected-student playback after the development slide. `setProgress(1)` retains the final standing pose next to later explanatory charts.

Regenerate with the existing MuJoCo 3.4 environment:

```
/home/arl/Documents/Pioneer/work/myoassist-knee-2026-10-25/.venv/bin/python scripts/control/export_sts_development.py
```

The source paths and SHA-256 hashes, last active sample indices, physics-call audit, and geometry differences are recorded in `control-sts-development-provenance.json`. Source models, arrays, evaluation reports, and checkpoints are read-only throughout export.
