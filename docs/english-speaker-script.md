# Pioneer — English speaker script

1366 words · 12 minutes allocated · 6 chapters · 30 audience stages.

Use short pauses to follow each animation. The allocation averages about 114 words per minute, including pauses. At 120 words per minute, the spoken text takes about 11 minutes 23 seconds, leaving roughly 37 seconds for pauses. Rehearse once and adjust the pauses to your pace.

## Presenter mode

Open the audience presentation, then press **S**. Move the audience window onto the projector with **extended display**. Keep the presenter window on your own monitor. Mirroring displays both windows identically. Both windows must use the same site and browser profile. The speaker window shows the current stage, its short spoken script, the next stage, and an elapsed timer. It does not load another 3D scene.

Start the timer at the first spoken word. **Right / Space** advances, **Left** returns, holding an arrow speeds navigation, **T** starts or pauses the timer, and **R** resets it. The timer is for rehearsal and delivery; it never changes the audience slide automatically. Technical provenance stays in the collapsed source-notes area, separate from the spoken text.

The cue numbers below use **chapter–stage** (for example, 5-1), not the zero-based URL fragment.

## 1. Nonlinear SEA Preload Control for Knee Assistance under Limited Runtime Sensing

### 1-1 · 00:00–00:20 · 20 seconds

Hello. I am Jongchan Mun from Pusan National University. Today, I will present our work on an active artificial knee. I will connect the joint design, the nonlinear spring, and our current control work.

## 2. Background

### 2-1 · 00:20–00:34 · 14 seconds

Our project starts with older adults who need knee replacement. Joint damage can make walking and other daily tasks difficult. At this age, muscle loss can also be a concern.

### 2-2 · 00:34–00:52 · 18 seconds

Knee replacement changes the damaged joint surfaces. Here, the white insert is polyethylene. The metal parts fit onto the bones. However, replacing these surfaces does not replace the muscles. The muscles must still produce movement.

### 2-3 · 00:52–01:16 · 24 seconds

Muscle strength is also important during recovery. In one study of twenty patients, thigh muscle strength was sixty-two percent lower about one month after surgery. This is an early recovery result, not the rate of muscle loss in all older adults. It shows why joint repair and muscle support are related needs.

### 2-4 · 01:16–01:30 · 14 seconds

Wearable devices are one way to provide support. These three open-source examples attach to the body at different places. They need an outside frame or attachment to transfer force.

### 2-5 · 01:30–01:45 · 15 seconds

We ask a different design question. Could an implant also provide active support? This picture introduces the idea of adding a motor. To make that idea work, we first need the right joint mechanism.

## 3. Hardware

### 3-1 · 01:45–02:11 · 26 seconds

A human knee does more than turn around a fixed pin. As it bends, the upper bone also moves relative to the lower bone. Please follow this curve. It shows the combination of rotation and translation. This joint-motion design began in the earlier work of our team.

### 3-2 · 02:11–02:35 · 24 seconds

The mechanism uses an equivalent four-bar to create this moving path. Here, we look directly from the side. The marked point is fixed to the femoral link. Its path changes with the bend, instead of staying at one fixed hinge centre.

### 3-3 · 02:35–02:55 · 20 seconds

Now follow the same bend inside the device. Joint Three moves down, and the slider moves back. We hide the outer parts so that this motion is easier to see. These movements are linked by the mechanism.

### 3-4 · 02:55–03:19 · 24 seconds

From above, we can see the next effect. The slider motion produces rotation around the inner side of the knee. This is called medial-pivot rotation. The important point is that bending and this rotation come from one connected mechanism.

### 3-5 · 03:19–03:47 · 28 seconds

We then add active drive. The motor sends torque through the gears toward the joint. The mechanism still provides the coupled knee motion. But the person may also move first. In that case, the joint pushes back through the drive. We therefore need to think about interaction, not only motor output.

### 3-6 · 03:47–04:15 · 28 seconds

The drive has three main parts: the motor, the spring, and the output. The spring sits in series between the drive and the output. It allows some relative motion while transmitting torque. This brings us to the next question. What kind of spring stiffness do we need?

## 4. Nonlinear Torsion Spring

### 4-1 · 04:15–04:39 · 24 seconds

This is a series elastic actuator, or SEA. The input can turn while the output is held. Their angle difference winds the spring and builds torque. So the spring provides a softer connection between the motor and the person, rather than a fully rigid one.

### 4-2 · 04:39–05:01 · 22 seconds

Low stiffness allows motion more easily. But it needs a larger angle change to produce the same torque. High stiffness produces torque with less travel, but gives less compliance. A single constant stiffness therefore creates a trade-off.

### 4-3 · 05:01–05:21 · 20 seconds

Our goal is to start soft and become stiffer as winding grows. The curve is gentle at first, then becomes steeper. The slope is the stiffness. How can we create that change using the spring geometry?

### 4-4 · 05:21–05:51 · 30 seconds

We connect two springs in series. Both carry the same torque, and their angle changes add. At first, the lower spring is much softer, so it takes most of the motion. When contact makes it much stiffer, extra motion shifts to the upper spring. The softer spring sets the combined stiffness in each region.

### 4-5 · 05:51–06:13 · 22 seconds

Here, we focus on the lower spiral. As it winds, the gaps between nearby turns become smaller. Contact reduces the length that can bend freely, so the response becomes stiffer. This enlarged motion explains the idea; it is not a solved contact result.

### 4-6 · 06:13–06:40 · 27 seconds

Analysis helps us inspect deformation, stress, and the torque response. The animation and this curve come from separate analyses, so we align them by angle for comparison. They are not one paired test. We still need to check the material, contact, and boundary conditions before making a strength claim.

### 4-7 · 06:40–07:00 · 20 seconds

These unit curves help estimate the combined response. We add the two angles at the same torque. The dashed part uses an approximation beyond the upper spring data. This gives a design estimate, not a measured law of the final device. How should control use this elastic state?

## 5. Control

### 5-1 · 07:00–07:22 · 22 seconds

Control must prepare the spring, not simply request an ideal torque at the knee. The input and output angles set its deformation. Through the nonlinear spring law, that deformation sets torque. We must choose both how much preload to build and when to build it.

### 5-2 · 07:22–07:44 · 22 seconds

We study this in a coupled human-and-implant simulation using MuJoCo-Warp. A human controller drives twenty-two muscles. A separate controller drives the implant motors. Their actions interact through the body and contact. This is an engineering model, not yet a model fitted to an older patient.

### 5-3 · 07:44–08:11 · 27 seconds

Standing up makes the timing easy to see. First, prepare the spring while the person is still seated. Then, provide support during the rise. Finally, adjust the spring state as the task changes. Follow the point on the torque-angle plot. The return to the chair is only a display reset.

### 5-4 · 08:11–08:45 · 34 seconds

The development did not start with stable standing. These saved runs show an early human fall, an unstable implanted rise, and then the selected standing run. They are different development stages, not a controlled learning curve. We first developed the human movement. We then used a model-based teacher to search for a working assistance strategy. That teacher could use full simulation information.

### 5-5 · 08:45–09:12 · 27 seconds

A real device cannot read all of that information. Our student uses motor encoder signals, a current-to-torque proxy, earlier commands, and a known local timing cue. A physics observer estimates the spring state. The student does not receive the true output angle or muscle activity. The sensing assumptions still need a hardware test.

### 5-6 · 09:12–09:45 · 33 seconds

We train a student to imitate the teacher. Its memory helps it use a short history of device signals. It adjusts spring-torque targets ten times per second. The observer and motor servo then turn those targets into motor commands. The selected model is the imitation model. A later reinforcement-learning pilot did not show an added benefit, so we do not claim one.

### 5-7 · 09:45–10:20 · 35 seconds

In the selected nominal simulation, the person rises and maintains standing. Notice that preload builds before the knee extends. This is a useful first execution result. However, the model coupling and chair contact still need further checks. Repeated copies of one initial condition are not different patients or a robustness test. We also have not shown that the learned student is better than the simpler controller.

### 5-8 · 10:20–10:45 · 25 seconds

Walking makes the problem repeat on every step. Here, we show a separate walking experiment, not the same standing student. Follow the body, the spring-state point, and the torque together. The controller must prepare support before it is needed, then release or adjust it for the next step.

### 5-9 · 10:45–11:10 · 25 seconds

This candidate stopped at twenty-seven point one nine seconds. Shaft power reached about twenty-seven watts, above the twenty-five-watt limit. So we cannot call this a completed walking result. Asking for more torque at the last moment is not enough. We need to prepare the next spring state earlier.

## 6. Conclusion

### 6-1 · 11:10–11:36 · 26 seconds

The work follows one path. First, preserve the coupled motion of the knee. Next, add a motor and nonlinear compliance. Then, prepare that elastic state at the right time. We now have a preliminary standing execution with a limited-sensing student, and a walking case that shows why timing and drive limits matter.

### 6-2 · 11:36–12:00 · 24 seconds

Next, we will check the model coupling and sensing, calibrate the spring, and test different starts and disturbances. We also need valid task comparisons before claiming useful assistance. The long-term goal is support for older adults who need joint replacement and muscle assistance. Thank you for listening.

## Replay identity for rehearsal

Stage 5-3 uses the recorded model-based teacher preload example: p24 confirmation, world 6, actual peak 5.4884 N·m, 18-second recording with 13.21 seconds of final quiet standing. Its spoken text describes preparation, assistance and release without assigning a policy identity. This is separate from the limited-sensing student result in 5-7. The 6 N·m value is a teacher target; it must not be reported as an achieved 6 N·m spring torque. Neither example is a clinical or robustness result.

## Editing

The spoken source is `examples/pioneer-draft/presenter-script.js`. Existing technical and source notes stay in `deck-data.js`. If stage counts change, update this script and its timing together. The current document keeps 4-4 and 4-7 separate; their proposed merge has not been applied.
