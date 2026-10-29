// Spoken English only. Source qualifications remain in deck-data.js notes.
// Each row matches one audience build; timings include looking at the animation.
export const talk = [
  [
    [20, `Hello. / I am **Jongchan Mun** from Pusan National University. Today, I will present our work / on an **active artificial knee**. I will connect the joint design, / the **nonlinear spring**, / and our current control work.`],
  ],
  [
    [14, `Our project starts with **older adults** / who need knee replacement. Joint damage can make walking / and other daily tasks difficult. At this age, / **muscle loss** can also be a concern.`],
    [18, `Knee replacement changes the **damaged joint surfaces**. Here, / the white insert is **polyethylene**. The metal parts fit onto the bones. However, / replacing these surfaces does not replace the **muscles**. The muscles must still produce movement.`],
    [24, `Muscle strength is also important during recovery. In one study of twenty patients, / thigh muscle strength was **sixty-two percent lower** / about **one month after surgery**. This is an early recovery result, / not the rate of muscle loss in all older adults. It shows why **joint repair and muscle support** / are related needs.`],
    [14, `**Wearable devices** are one way to provide support. These three open-source examples / attach to the body at different places. They need an **outside frame or attachment** / to transfer force.`],
    [15, `We ask a different design question. Could an implant also provide **active support**? This picture introduces the idea / of adding a **motor**. To make that idea work, / we first need the right joint mechanism.`],
  ],
  [
    [26, `A human knee does more / than turn around a **fixed pin**. As it bends, / the upper bone also moves / relative to the lower bone. Please follow this curve. It shows the combination / of **rotation and translation**. This joint-motion design began / in the earlier work of our team.`],
    [24, `The mechanism uses an **equivalent four-bar** / to create this moving path. Here, / we look directly from the side. The marked point is fixed / to the **femoral link**. Its path changes with the bend, / instead of staying at one fixed hinge centre.`],
    [20, `Now follow the same bend / inside the device. **Joint Three moves down**, / and the **slider moves back**. We hide the outer parts / so that this motion is easier to see. These movements are linked / by the mechanism.`],
    [24, `From above, / we can see the next effect. The slider motion produces rotation / around the **inner side of the knee**. This is called **medial-pivot rotation**. The important point is / that bending and this rotation / come from **one connected mechanism**.`],
    [28, `We then add **active drive**. The motor sends torque / through the **gears** toward the joint. The mechanism still provides / the coupled knee motion. But the person may also move first. In that case, / the joint pushes back through the drive. We therefore need to think about **interaction**, / not only motor output.`],
    [28, `The drive has three main parts: / the **motor**, / the **spring**, / and the **output**. The spring sits in series / between the drive and the output. It allows some relative motion / while transmitting torque. This brings us to the next question. What kind of **spring stiffness** / do we need?`],
  ],
  [
    [24, `This is a **series elastic actuator**, / or SEA. The input can turn / while the output is held. Their **angle difference** winds the spring / and builds torque. So the spring provides a **softer connection** / between the motor and the person, / rather than a fully rigid one.`],
    [22, `**Low stiffness** allows motion more easily. But it needs a **larger angle change** / to produce the same torque. **High stiffness** produces torque with less travel, / but gives **less compliance**. A single constant stiffness / therefore creates a trade-off.`],
    [20, `Our goal is to **start soft** / and **become stiffer** as winding grows. The curve is gentle at first, / then becomes steeper. The **slope is the stiffness**. How can we create that change / using the spring geometry?`],
    [30, `We connect **two springs in series**. Both carry the same torque, / and their angle changes add. At first, / the lower spring is **much softer**, / so it takes most of the motion. When contact makes it much stiffer, / extra motion shifts to the **upper spring**. The **softer spring** sets the combined stiffness / in each region.`],
    [22, `Here, / we focus on the **lower spiral**. As it winds, / the gaps between nearby turns become smaller. **Contact** reduces the length / that can bend freely, / so the response becomes **stiffer**. This enlarged motion explains the idea; / it is not a solved contact result.`],
    [27, `Analysis helps us inspect **deformation, stress, and torque**. The animation and this curve / come from **separate analyses**, / so we align them by angle for comparison. They are not one paired test. We still need to check / the material, contact, and boundary conditions / before making a **strength claim**.`],
    [20, `These unit curves help estimate / the **combined response**. We add the two angles / at the **same torque**. The dashed part uses an approximation / beyond the upper spring data. This gives a **design estimate**, / not a measured law of the final device. How should control use / this **elastic state**?`],
  ],
  [
    [16, `Control must prepare the **spring state**, / not simply request knee torque. The input and output angles / set spring deformation and torque. The question is / **how much preload**, / and **when**.`],
    [20, `Our implant sits **inside the body**. / This makes sensors on the output shaft / or spring hard to place. The simulator can show these **hidden states**. A device must use **motor-side signals**. This is why we use / a teacher and a student.`],
    [23, `Here, / a successful teacher run uses a six-newton-metre target. The recorded spring torque / reaches about **five point five newton metres**. Notice the **preload before the rise**. The moving point shows / how spring deformation becomes support. This example shows the teacher, / before we limit its sensing.`],
    [32, `We first developed the human movement, / then searched for assistance. We tested torque targets / of two, four, and six newton metres, / with two **start times**. We first checked **task success and hardware limits**. Among valid runs, / we compared muscle effort. This was a small **parameter search**, / not a global optimum. The saved failures show why both timing and size matter.`],
    [29, `The **teacher** sees true output motion / and spring torque. The **student** must work / without those sensor readings. It uses three frames / of eighteen local signals: motor encoders, / speed, / a current-based torque estimate, / past commands, / and a timing cue. Its memory predicts two torque-target corrections / at **ten hertz**. An observer and servo / turn them into motor commands.`],
    [30, `We train the standing student / to **imitate the teacher**. This graph shows target error / on data kept out of training. The model learns from recorded examples / over four hundred training passes. We selected this **imitation model**. A later reinforcement-learning pilot / did not show an added benefit. Lower prediction error alone / also does not prove **better physical assistance**.`],
    [32, `Now compare the **spring torque over time**. These are actual teacher and student runs / using the same four-newton-metre setting. They differ from the six-newton-metre example earlier. The student can rise / and keep standing in this **nominal simulation**. This is a first execution result. It is **not a robustness test**. Model coupling, chair contact, / and sensing still need checks.`],
    [32, `Walking uses a different teacher. We start with a **fixed gait**, / then optimize a smooth, repeating motor path. The aim is to match the desired **knee torque**. The search also limits torque, / power, / speed, / and voltage. It uses sixteen path points / and four hundred eighty time points. This gives a **local solution** / for that gait, / not a general walking policy.`],
    [33, `The walking student learns an **observer**, / rather than the standing student's action model. From local signals, / it estimates output motion and spring torque. The same teacher control rule / then uses these estimates. Here, / we compare the **knee-equivalent torque** / from separate thirty-second teacher and student runs. The curves show tracking / under this nominal condition. They do not yet prove **useful muscle assistance**.`],
    [28, `Finally, / this separate walking candidate stopped / at **twenty-seven point one nine seconds**. Shaft power reached about twenty-seven watts, / above its twenty-five-watt limit. So we cannot call this / a completed walking result. The lesson is to **prepare the spring earlier**, / then check task success and drive limits together.`],
  ],
  [
    [25, `The work connects **coupled knee motion**, / **nonlinear compliance**, / and control from local signals. We now have preliminary standing execution / and walking torque tracking in simulation. Next, / we will check coupling and sensing, / calibrate the spring, / and make fair task comparisons. The goal remains **support for older adults** / who need joint replacement and muscle assistance. Thank you.`],
  ],
];

export function getTalkStage(page, step) {
  const row = talk[page - 1]?.[step];
  if (!row) return null;
  return { seconds: row[0], text: row[1], cue: `${page}-${step + 1}` };
}

export const talkSeconds = talk.flat().reduce((sum, row) => sum + row[0], 0);
// Formatting is presenter-only; pause marks are not spoken words.
export function spokenText(text) {
  return String(text).replace(/\*\*/g, '').replace(/\s*\/\s*/g, ' ').trim();
}

export function countSpokenWords(text) {
  const plain = spokenText(text);
  return plain ? plain.split(/\s+/).length : 0;
}

// A small, safe subset of Markdown. Other markup is rendered as plain text.
export function scriptParts(text) {
  return String(text).split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map(part => ({
    text: part.startsWith('**') && part.endsWith('**') ? part.slice(2, -2) : part,
    strong: part.startsWith('**') && part.endsWith('**'),
  }));
}

export const talkWords = talk.flat().reduce((sum, row) => sum + countSpokenWords(row[1]), 0);
