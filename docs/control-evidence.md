# Control chapter: evidence and presentation contract

Updated 2026-10-29. This document records source scope for the presentation; it does not modify or rerun the research simulations.

## Narrative and timing

Control joins the old Control, Simulation and Reinforcement Learning chapters. Eight stages allocate 250 s: 25, 25, 30, 35, 30, 35, 40, 30. The deck has six chapters, 29 visible states and a planned 720 s allocation. The first four chapters remain intact. Conclusion becomes chapter 6.

1. Control the Spring State: relative device angles → deformation → elastic torque.
2. Evaluate Human–Implant Interaction: separate human-muscle and motor pathways, coupled by physics.
3. Prepare, Assist, Release: intended preparation sequence, not an independently optimized result.
4. Develop a Full-State Teacher: explicit model-based teacher plus finite proposal search.
5. Operate with Device-Side Sensing: declared permitted signals and physics observer.
6. Transfer the Strategy to a Student: behavior cloning into recurrent spring-target corrections.
7. Preliminary Sit-to-Stand Evaluation: nominal execution replay, no headline benefit percentage.
8. Toward Continuous Walking Assistance: a separate failed walking candidate explains the next problem.

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

Walking figure: the displayed source excerpt is 26.95–27.19 s (last240ms), with signed gear-output-equivalent motor requests/applied torques and absolute source shaft power. It is not synchronized to the unrelated reference gait model. The power bar spans0–30W and marks25W, so the actual26.95W terminal value remains visible beyond the limit.
