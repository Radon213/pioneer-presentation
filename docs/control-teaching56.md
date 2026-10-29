# Source-backed Control chapter

This revision keeps six chapters, thirty audience stages and twelve minutes. Control receives ten stages/275 seconds; Conclusion becomes one stage/25 seconds. The existing cream serif shell and persistent Three.js renderer remain.

1. Elastic-state question.
2. Why the simulated teacher has information a device cannot directly sense.
3. High-preload successful teacher example (six-Nm target; actual5.4884Nm), separate from the four-Nm student.
4. Recorded human-policy development plus actual finite teacher timing/amplitude candidates. No fabricated optimizer convergence.
5. Standing teacher/student input-output contract.
6. Actual400-epoch held-out target error and imitation objective. PPO adds no demonstrated improvement.
7. Recorded teacher versus student spring-shaft torque over time, with the student model retained.
8. Walking reference optimization: periodic C2 motor path, IPOPT direct collocation, squared fixed-gait knee-moment error;480 nodes and16 evaluation points. Original20W reference preserved.
9. Walking local-sensing observer and actual knee-equivalent teacher/student torque traces. The displayed body follows the student trace used by the chart.
10. The separate latest walking candidate's terminal25W violation remains a diagnostic limitation.

## Input/output distinctions

Standing teacher uses true output motion and spring torque in model-based tracking. Standing student receives Device54: bilateral cue-phase one-hot8, motor encoder sine/cosine4, motor velocity2, ideal applied-torque/current proxy2 and past command2, over three frames. A GRU64 makes two desired-spring-torque corrections at10Hz. The physical observer and fixed motor servo operate at100Hz. Muscle activation and true output state are not actor inputs. The selected checkpoint is behavior cloning; PPO pilot best_iteration=0.

Walking student is a different learned state observer: six bilateral output-angle/output-speed/spring-torque estimates. A physical consistency projection and fixed teacher control law turn them into motor commands. It is not the standing residual GRU. Ideal cue/current and internal-clock assumptions remain explicit in the source notes.

## Source and chart integrity

`control-teaching.json` is exported read-only by `scripts/control/export_control_teaching.py`. It keeps source hashes, raw saved traces and actual training logs. No new policy, controller evaluation or physics is executed.

- Standing comparison: p24 teacher world4 versus selected p32 student world4, nominal independent four-Nm target executions. The graph is spring-shaft torque, not anatomical knee moment and not a same-state command-error metric.
- Walking: tracking_teacher_r1/final30_moments, teacher world4 and sensor student world6,20–28s. These are actual full-loop constrained virtual-work knee moments, not raw shaft torques. Source50Hz values are plotted without optimized phase shifts or amplitude gains. The separate 20N-contact aligned mean is retained in the data with its alignment description, but is not substituted for the time traces.
- Walking pose: new `control-walking-student.bin(.gz)` is exported by offline kinematics/tendon wrapping only, on the same source model and actual source frames. Raw sources, the prior failed-candidate replay, original meshes and final student files remain unchanged.
- Optimization plot: original optimal_profile_left.csv, fixed recorded gait. Torque matching error is not muscle-effort improvement. The offline20W reference and later25W free-execution test are distinct. No global optimum or matched-speed assistance benefit is claimed.

Presenter text has bold emphasis and slash breath cues. Audience slides receive no speech-script overlays or extra buttons. The5-1 conceptual footer is removed and its integral has a taller equation box.
