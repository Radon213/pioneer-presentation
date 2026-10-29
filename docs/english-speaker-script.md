# Pioneer — English speaker script

1355 words · 12 minutes allocated · 6 chapters · 30 audience stages.

**Bold words** carry the main emphasis. A **/** marks a short breath or pause; do not read the slash aloud. Keep the sentences simple and let the animation finish the explanation. The allocation averages about 113 spoken words per minute, including pauses. At 120 words per minute, the text takes about 11 minutes 17 seconds. Rehearse once and adjust pauses to your pace.

## Presenter mode

Open the audience presentation, then press **S**. Move the audience window onto the projector with **extended display**. Keep the presenter window on your own monitor. Mirroring displays both windows identically. Both windows must use the same site and browser profile. The speaker window shows the current stage, its short spoken script, the next stage, and an elapsed timer. It does not load another 3D scene.

Start the timer at the first spoken word. **Right / Space** advances, **Left** returns, holding an arrow speeds navigation, **T** starts or pauses the timer, and **R** resets it. The timer is for rehearsal and delivery; it never changes the audience slide automatically. Technical provenance stays in the collapsed source-notes area, separate from the spoken text.

The cue numbers below use **chapter–stage** (for example, 5-1), not the zero-based URL fragment.

## 1. Nonlinear SEA Preload Control for Knee Assistance under Limited Runtime Sensing

### 1-1 · 00:00–00:20 · 20 seconds

Hello. / I am **Jongchan Mun** from Pusan National University. Today, I will present our work / on an **active artificial knee**. I will connect the joint design, / the **nonlinear spring**, / and our current control work.

## 2. Background

### 2-1 · 00:20–00:34 · 14 seconds

Our project starts with **older adults** / who need knee replacement. Joint damage can make walking / and other daily tasks difficult. At this age, / **muscle loss** can also be a concern.

### 2-2 · 00:34–00:52 · 18 seconds

Knee replacement changes the **damaged joint surfaces**. Here, / the white insert is **polyethylene**. The metal parts fit onto the bones. However, / replacing these surfaces does not replace the **muscles**. The muscles must still produce movement.

### 2-3 · 00:52–01:16 · 24 seconds

Muscle strength is also important during recovery. In one study of twenty patients, / thigh muscle strength was **sixty-two percent lower** / about **one month after surgery**. This is an early recovery result, / not the rate of muscle loss in all older adults. It shows why **joint repair and muscle support** / are related needs.

### 2-4 · 01:16–01:30 · 14 seconds

**Wearable devices** are one way to provide support. These three open-source examples / attach to the body at different places. They need an **outside frame or attachment** / to transfer force.

### 2-5 · 01:30–01:45 · 15 seconds

We ask a different design question. Could an implant also provide **active support**? This picture introduces the idea / of adding a **motor**. To make that idea work, / we first need the right joint mechanism.

## 3. Hardware

### 3-1 · 01:45–02:11 · 26 seconds

A human knee does more / than turn around a **fixed pin**. As it bends, / the upper bone also moves / relative to the lower bone. Please follow this curve. It shows the combination / of **rotation and translation**. This joint-motion design began / in the earlier work of our team.

### 3-2 · 02:11–02:35 · 24 seconds

The mechanism uses an **equivalent four-bar** / to create this moving path. Here, / we look directly from the side. The marked point is fixed / to the **femoral link**. Its path changes with the bend, / instead of staying at one fixed hinge centre.

### 3-3 · 02:35–02:55 · 20 seconds

Now follow the same bend / inside the device. **Joint Three moves down**, / and the **slider moves back**. We hide the outer parts / so that this motion is easier to see. These movements are linked / by the mechanism.

### 3-4 · 02:55–03:19 · 24 seconds

From above, / we can see the next effect. The slider motion produces rotation / around the **inner side of the knee**. This is called **medial-pivot rotation**. The important point is / that bending and this rotation / come from **one connected mechanism**.

### 3-5 · 03:19–03:47 · 28 seconds

We then add **active drive**. The motor sends torque / through the **gears** toward the joint. The mechanism still provides / the coupled knee motion. But the person may also move first. In that case, / the joint pushes back through the drive. We therefore need to think about **interaction**, / not only motor output.

### 3-6 · 03:47–04:15 · 28 seconds

The drive has three main parts: / the **motor**, / the **spring**, / and the **output**. The spring sits in series / between the drive and the output. It allows some relative motion / while transmitting torque. This brings us to the next question. What kind of **spring stiffness** / do we need?

## 4. Nonlinear Torsion Spring

### 4-1 · 04:15–04:39 · 24 seconds

This is a **series elastic actuator**, / or SEA. The input can turn / while the output is held. Their **angle difference** winds the spring / and builds torque. So the spring provides a **softer connection** / between the motor and the person, / rather than a fully rigid one.

### 4-2 · 04:39–05:01 · 22 seconds

**Low stiffness** allows motion more easily. But it needs a **larger angle change** / to produce the same torque. **High stiffness** produces torque with less travel, / but gives **less compliance**. A single constant stiffness / therefore creates a trade-off.

### 4-3 · 05:01–05:21 · 20 seconds

Our goal is to **start soft** / and **become stiffer** as winding grows. The curve is gentle at first, / then becomes steeper. The **slope is the stiffness**. How can we create that change / using the spring geometry?

### 4-4 · 05:21–05:51 · 30 seconds

We connect **two springs in series**. Both carry the same torque, / and their angle changes add. At first, / the lower spring is **much softer**, / so it takes most of the motion. When contact makes it much stiffer, / extra motion shifts to the **upper spring**. The **softer spring** sets the combined stiffness / in each region.

### 4-5 · 05:51–06:13 · 22 seconds

Here, / we focus on the **lower spiral**. As it winds, / the gaps between nearby turns become smaller. **Contact** reduces the length / that can bend freely, / so the response becomes **stiffer**. This enlarged motion explains the idea; / it is not a solved contact result.

### 4-6 · 06:13–06:40 · 27 seconds

Analysis helps us inspect **deformation, stress, and torque**. The animation and this curve / come from **separate analyses**, / so we align them by angle for comparison. They are not one paired test. We still need to check / the material, contact, and boundary conditions / before making a **strength claim**.

### 4-7 · 06:40–07:00 · 20 seconds

These unit curves help estimate / the **combined response**. We add the two angles / at the **same torque**. The dashed part uses an approximation / beyond the upper spring data. This gives a **design estimate**, / not a measured law of the final device. How should control use / this **elastic state**?

## 5. Control

### 5-1 · 07:00–07:16 · 16 seconds

Control must prepare the **spring state**, / not simply request knee torque. The input and output angles / set spring deformation and torque. The question is / **how much preload**, / and **when**.

### 5-2 · 07:16–07:36 · 20 seconds

We study this / in a **human-and-implant simulation**. One controller drives twenty-two muscles. Another drives the implant motors. The simulator can show their full state. But a real device / sees only **local sensor signals**. This gap motivates our teacher-student approach.

### 5-3 · 07:36–07:59 · 23 seconds

Here, / a successful teacher run uses a six-newton-metre target. The recorded spring torque / reaches about **five point five newton metres**. Notice the **preload before the rise**. The moving point shows / how spring deformation becomes support. This example shows the teacher, / before we limit its sensing.

### 5-4 · 07:59–08:31 · 32 seconds

We first developed the human movement, / then searched for assistance. We tested torque targets / of two, four, and six newton metres, / with two **start times**. We first checked **task success and hardware limits**. Among valid runs, / we compared muscle effort. This was a small **parameter search**, / not a global optimum. The saved failures show why both timing and size matter.

### 5-5 · 08:31–09:00 · 29 seconds

The **teacher** reads true motor motion, / output motion, / and spring torque from the simulator. The **student** gets three recent sets / of eighteen local signals. These include encoder readings, / a current-based torque estimate, / earlier commands, / and a timing cue. Its memory predicts two torque-target corrections / at **ten hertz**. An observer and motor servo / turn these into motor commands.

### 5-6 · 09:00–09:30 · 30 seconds

We train the standing student / to **imitate the teacher**. This graph shows target error / on data kept out of training. The model learns from recorded examples / over four hundred training passes. We selected this **imitation model**. A later reinforcement-learning pilot / did not show an added benefit. Lower prediction error alone / also does not prove **better physical assistance**.

### 5-7 · 09:30–10:02 · 32 seconds

Now compare the **spring torque over time**. These are actual teacher and student runs / using the same four-newton-metre setting. They differ from the six-newton-metre example earlier. The student can rise / and keep standing in this **nominal simulation**. This is a first execution result. It is **not a robustness test**. Model coupling, chair contact, / and sensing still need checks.

### 5-8 · 10:02–10:34 · 32 seconds

Walking uses a different teacher. We start with a **fixed gait**, / then optimize a smooth, repeating motor path. The aim is to match the desired **knee torque**. The search also limits torque, / power, / speed, / and voltage. It uses sixteen path points / and four hundred eighty time points. This gives a **local solution** / for that gait, / not a general walking policy.

### 5-9 · 10:34–11:07 · 33 seconds

The walking student learns an **observer**, / rather than the standing student's action model. From local signals, / it estimates output motion and spring torque. The same teacher control rule / then uses these estimates. Here, / we compare the **knee-equivalent torque** / from separate thirty-second teacher and student runs. The curves show tracking / under this nominal condition. They do not yet prove **useful muscle assistance**.

### 5-10 · 11:07–11:35 · 28 seconds

Finally, / this separate walking candidate stopped / at **twenty-seven point one nine seconds**. Shaft power reached about twenty-seven watts, / above its twenty-five-watt limit. So we cannot call this / a completed walking result. The lesson is to **prepare the spring earlier**, / then check task success and drive limits together.

## 6. Conclusion

### 6-1 · 11:35–12:00 · 25 seconds

The work connects **coupled knee motion**, / **nonlinear compliance**, / and control from local signals. We now have preliminary standing execution / and walking torque tracking in simulation. Next, / we will check coupling and sensing, / calibrate the spring, / and make fair task comparisons. The goal remains **support for older adults** / who need joint replacement and muscle assistance. Thank you.
