# Recorded sit-to-stand development replay

The animated sequence uses **three separately recorded controller-development snapshots**, rather than synthetic falls or a fabricated reinforcement-learning curve:

1. **Early strategy**: `p5_momentum_screen_r1`, world 0, recorded through its last active sample at 3.59 s. The attempt fails the task and loses support/balance.
2. **Stand-up, then loss of balance**: `p13_momentum_duration_screen_r2_0`, world 2, through its last active sample at 5.32 s. The pelvis reaches approximately 0.90 m but the attempt does not complete the standing task.
3. **Successful student**: the existing selected limited-sensing BC student, world 4, 18 s. This is the same qualified-as-diagnostic nominal result already used by the presentation. PPO did not supply a measured improvement.

The first two clips stop at the last `active_before` sample. Later automatic reset poses in their source arrays are excluded. Do not describe these snapshots as successive PPO checkpoints or assume that changing human/controller profiles is a controlled intervention.

`control-sts-development.bin.gz` contains actual offline forward-kinematic transforms and muscle wrapping paths at 25 Hz, interpolated for display. Every retained mesh and geom transform is checked against the exact historical model before sharing the selected student's geometry. No integration, policy execution, pose repair, or invented fall is performed. The two historical assets load lazily only when the development sequence is requested.

## Chair correction

The replay visually translates **`chair_leg_3` and `chair_leg_4` by +0.10 m along source X**, exactly matching `student_success_chair_legs_adjusted_r1/CHAIR_LEG_ADJUSTMENT_AUDIT.json`. This positions the rear legs below the seat. The 40 cm seat and all recorded human/device trajectories are unchanged. This is a visualization correction, not a rerun of the physical experiment.

## Runtime integration

```js
await sts.ensureDevelopment();
sts.setDevelopmentProgress(clockSeconds / sts.getDevelopmentDuration());
const {developmentLabel, developmentIndex, developmentCount, sourceTime} = sts.getValues();
```

The sequence lasts approximately 26.89 s at recorded speed. A trial boundary explicitly resets to the next trial's first recorded state; no interpolated bridge is presented as physical motion. Use `sts.setAttempt('student')` before ordinary selected-student playback after the development slide. `setProgress(1)` retains the final standing pose next to later explanatory charts.

Regenerate with the existing MuJoCo 3.4 environment:

```
/home/arl/Documents/Pioneer/work/myoassist-knee-2026-10-25/.venv/bin/python scripts/control/export_sts_development.py
```

The source paths and SHA-256 hashes, last active sample indices, physics-call audit, and geometry differences are recorded in `control-sts-development-provenance.json`. Source models, arrays, evaluation reports, and checkpoints are read-only throughout export.
