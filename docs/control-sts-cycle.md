# Repeating the nominal recorded stand-up

`sampleSitStandCycle(elapsed, options)` schedules display of the existing selected-student poses; it never runs a policy or simulation. The default cycle is 14.6 s:

1. Play source time 0–8 s forward over 8.6 display seconds. A 0.6 s raised-cosine velocity ramp at each end gives smooth start/stop, with normal 1× playback between the ramps.
2. Hold the final standing pose for 1 s.
3. Return through the recorded poses in reverse for 4 s, with a quintic ease to give zero velocity at both ends.
4. Hold the initial seated pose for 1 s, then repeat until navigation leaves the slide.

The reverse segment is a **presentation reset**, not recorded sit-down control or an additional validated result. Display **Replay reset** during the return and seated hold, and hide power/torque result markers while `telemetryValid` is false. The original source time and recorded telemetry remain unchanged.

```js
const cycle = sampleSitStandCycle(clock, {sourceEnd: 8});
sts.setProgress(cycle.sourceTime / sts.durationSeconds);
// cycle.replayDirection is +1 (forward), -1 (reverse), or 0 (hold).
// Pass cycle.phaseLabel, cycle.resetting, and cycle.telemetryValid to the panel.
```

The introductory replay may use `{sourceEnd: 6}` for a 12.6 s display cycle. Other options are `sourceStart`, `forwardEase`, `forwardDuration`, `standingHold`, `returnDuration`, and `seatedHold`; durations are seconds. The defaults preserve continuity in source position and source velocity at every segment and cycle boundary. Quantitative labels should report source time, not the display clock or reverse-derived mechanics.

This scheduler applies only to the nominal introduction/evaluation replays. The separately sourced controller-development failure sequence retains its own timing and provenance.
