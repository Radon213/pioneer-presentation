# Control chapter: evidence and presentation contract

Updated 2026-10-29. This document records source scope for the presentation; it does not modify or rerun the research simulations.

## Narrative and timing

Control joins the old Control, Simulation and Reinforcement Learning chapters. Nine stages allocate 250 s: 22, 22, 27, 34, 27, 33, 35, 25, 25. The deck has six chapters, 30 visible states and a planned 720 s allocation. The first four chapters remain intact. Conclusion becomes chapter 6.

1. Control the Spring State: relative device angles → deformation → elastic torque.
2. Evaluate Human–Implant Interaction: separate human-muscle and motor pathways, coupled by physics.
3. Prepare, Assist, Release: intended preparation sequence, not an independently optimized result.
4. Develop a Full-State Teacher: explicit model-based teacher plus finite proposal search.
5. Operate with Device-Side Sensing: declared permitted signals and physics observer.
6. Transfer the Strategy to a Student: behavior cloning into recurrent spring-target corrections.
7. Preliminary Sit-to-Stand Evaluation: nominal execution replay, no headline benefit percentage.
8. Repeat Assistance During Walking: the actual walking candidate and its paired torque record.
9. Anticipate the Drive Limits: retain that model and focus on the terminal shaft-power exceedance.

## Sit-to-stand sources

Root:
`/home/arl/Documents/Pioneer/work/myoassist22-aakj-sts-teacher-student-2026-10-28/`

- `p32_student_PPO_physics_pilot_r1/selected_best_checkpoint_audit/independent_dwell_audit.json`: duration 18 s; 96 total numerical worlds across comparison conditions; source says `diagnostic_only=true`, `qualified=false`; all recorded hardware gates pass. Student comprises 32 nominal copies, not 96 student trials or 32 distinct starts. Quiet standing after seated state: approximately 13.21 s.
- `p32_student_PPO_physics_pilot_r1/selected_best_checkpoint_audit/recording.json`: `noise=0`; controller modes, fixed profile, source checkpoints and recording contract. Source playback is a saved simulation, not new browser physics.
- `p32_student_PPO_physics_pilot_r1/selected_best_checkpoint_audit/CANDIDATE_POLICY_CONFIG.json`: separate pending audits for equality-map freshness/native loop residuals and device–chair collision clearance. `full_seated_rise_qualified=false` and `independent_dwell_passed=false` preserve the qualified status even though nominal diagnostic criteria report success.
- `p30_physics_student_distillation_r1/TRAINING_SUMMARY.json`: behavior cloning, 400 epochs, best epoch 400.
- `p32_student_PPO_physics_pilot_r1/protocol.json`: actor Device54 with own GRU64 memory at 10 Hz; physics encoder/current observer at 100 Hz. Desired spring torque residual is passed through an explicit goal controller and the existing servo/plant limits. Critic privileged input is separate from actor input.
- `p32_student_PPO_physics_pilot_r1/training_summary.json`: three PPO updates, `best_iteration=0`. Selected model remains the initial imitation checkpoint. No PPO improvement claim.
- `runtime_p30_physics_student_r1/assist_sensors.py` and `screen_sensor_controllers.py`: exact permitted input and execution action semantics.

### Device54 is not encoder/current alone

One 18-value frame includes bilateral cue-phase one-hot values (8), motor encoder sine/cosine (4), motor encoder velocity (2), applied motor torque as an ideal current proxy (2), previous motor request (2). Three frames are concatenated. The local cue is declared, not inferred autonomously. No human-state or true spring-state channel is added to the student actor. Hardware current estimation and observer assumptions need separate validation.

### Claims retained and omitted

Retained: a completed controller implementation and preliminary nominal seated-to-standing execution in the actual 22-muscle setup, with the recorded hardware checks shown in their audit scope.

Omitted: a large success-rate headline, robustness claim, elderly/sarcopenic validation, demonstrated neural advantage, PPO gain, metabolic improvement and physical device validation. The engineering muscle-output limiter remains part of the simulated human model.

For presenter questions only: whole-record activation-squared integration is about 3.273% below position hold for the student, versus about 3.324% for zero neural residual in the same final audit. This comparison does not establish a student advantage and is not a headline graph.

## Walking sources and scope

Root:
`/home/arl/Documents/Pioneer/work/aakj-direct-torque-2026-10-27/cycle_execution_tracking_r1/`

- `FINAL_REPORT_KO.txt`: independent candidate stopped at 27.19 s; shaft power 26.9548206 W > 25 W. Motor torque/velocity remained within their stated bounds. No 30 s completion or 60 s validation.
- Motor-generated power was saturated at 25 W while motor-side kinetic energy explains the additional shaft power. Do not silently label shaft power as electrical draw or motor-generated power.
- Assistance versus position-hold speeds were mismatched beyond the tolerance. Activation differences do not establish a valid effort or metabolic comparison.
- This candidate is separate from the sit-to-stand student. A walking challenge replay must say so; any authored scene interpolation is not a new integrated or successful trajectory.

## Visual integrity

Use one persistent Three.js scene with next-driven camera/element emphasis. Use the true stored STS trajectory for the result and show its original time, including any playback speed. A conceptual spring loading sequence must be labeled as a target illustration or separated from recorded telemetry. Keep equations in rendered LaTeX. Diagrams should closely follow Diagram Design's neutral paper/ink/coral repository examples. Keep the cream academic slide shell, existing serif fonts, authors and source colors.

Walking figures now use the full saved 100 Hz record and an exact saved-state FK export from the same candidate. The first walking stage replays the full interval with a four-second moving chart window; the next focuses on 22.19–27.19 s with the same model retained. Display markers and pose transforms interpolate continuously; they do not add simulated samples or change the terminal exceedance. The actual 26.95 W terminal value remains visible beyond the 25 W limit.

## Revision 38 visual changes

The detached native spring front shot is replaced by a conceptual animated torsion diagram, integrating relative angle, torque and stored energy within the same figure. Equations sit inside the relevant nodes rather than below the whole diagram. The recorded STS model accompanies the task sequence and development snapshots. Development clips are separate saved controller configurations, not a plotted PPO improvement curve. The rear two chair legs use the prior approved render-only +0.10 m source-X correction, preserving seat height and saved dynamics.

The Prepare/Assist/Release introduction replays the first six seconds of the same student record. Phase divisions follow the source's descriptive seated/rising/standing boundaries at 0.94 and 4.79 s. Its elastic-state curve is explicitly conceptual, not a measured spring channel.


## Revision 40 readability and replay

Walking torque is displayed as a 0.24 s centred time average with rounded, segment-bounded interpolation. Power uses a 0.5 s causal mean; its numerical value is held for 0.75 s between updates and rounded to 0.1 W. Raw data, raw peak and limit events are unchanged; the terminal figure separately states the recorded 26.95 W maximum. Both walking stages run at 1x source speed, and the terminal stage plays the last five seconds.

Development now begins with an actual full ground fall from earlier human-policy training, without implants. That recorded continuation after a validity-failure flag is unscored; it is not an implant-assistance result. See control-sts-development.md for the exact source and slow-motion/hold schedule.
