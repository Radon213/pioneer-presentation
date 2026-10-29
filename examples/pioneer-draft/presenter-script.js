// Spoken English only. Source qualifications remain in deck-data.js notes.
// Each row matches one audience build; timings include looking at the animation.
export const talk = [
  [
    [20, `Hello. I am Jongchan Mun from Pusan National University. Today, I will present our work on an active artificial knee. I will connect the joint design, the nonlinear spring, and our current control work.`],
  ],
  [
    [14, `Our project starts with older adults who need knee replacement. Joint damage can make walking and other daily tasks difficult. At this age, muscle loss can also be a concern.`],
    [18, `Knee replacement changes the damaged joint surfaces. Here, the white insert is polyethylene. The metal parts fit onto the bones. However, replacing these surfaces does not replace the muscles. The muscles must still produce movement.`],
    [24, `Muscle strength is also important during recovery. In one study of twenty patients, thigh muscle strength was sixty-two percent lower about one month after surgery. This is an early recovery result, not the rate of muscle loss in all older adults. It shows why joint repair and muscle support are related needs.`],
    [14, `Wearable devices are one way to provide support. These three open-source examples attach to the body at different places. They need an outside frame or attachment to transfer force.`],
    [15, `We ask a different design question. Could an implant also provide active support? This picture introduces the idea of adding a motor. To make that idea work, we first need the right joint mechanism.`],
  ],
  [
    [26, `A human knee does more than turn around a fixed pin. As it bends, the upper bone also moves relative to the lower bone. Please follow this curve. It shows the combination of rotation and translation. This joint-motion design began in the earlier work of our team.`],
    [24, `The mechanism uses an equivalent four-bar to create this moving path. Here, we look directly from the side. The marked point is fixed to the femoral link. Its path changes with the bend, instead of staying at one fixed hinge centre.`],
    [20, `Now follow the same bend inside the device. Joint Three moves down, and the slider moves back. We hide the outer parts so that this motion is easier to see. These movements are linked by the mechanism.`],
    [24, `From above, we can see the next effect. The slider motion produces rotation around the inner side of the knee. This is called medial-pivot rotation. The important point is that bending and this rotation come from one connected mechanism.`],
    [28, `We then add active drive. The motor sends torque through the gears toward the joint. The mechanism still provides the coupled knee motion. But the person may also move first. In that case, the joint pushes back through the drive. We therefore need to think about interaction, not only motor output.`],
    [28, `The drive has three main parts: the motor, the spring, and the output. The spring sits in series between the drive and the output. It allows some relative motion while transmitting torque. This brings us to the next question. What kind of spring stiffness do we need?`],
  ],
  [
    [24, `This is a series elastic actuator, or SEA. The input can turn while the output is held. Their angle difference winds the spring and builds torque. So the spring provides a softer connection between the motor and the person, rather than a fully rigid one.`],
    [22, `Low stiffness allows motion more easily. But it needs a larger angle change to produce the same torque. High stiffness produces torque with less travel, but gives less compliance. A single constant stiffness therefore creates a trade-off.`],
    [20, `Our goal is to start soft and become stiffer as winding grows. The curve is gentle at first, then becomes steeper. The slope is the stiffness. How can we create that change using the spring geometry?`],
    [30, `We connect two springs in series. Both carry the same torque, and their angle changes add. At first, the lower spring is much softer, so it takes most of the motion. When contact makes it much stiffer, extra motion shifts to the upper spring. The softer spring sets the combined stiffness in each region.`],
    [22, `Here, we focus on the lower spiral. As it winds, the gaps between nearby turns become smaller. Contact reduces the length that can bend freely, so the response becomes stiffer. This enlarged motion explains the idea; it is not a solved contact result.`],
    [27, `Analysis helps us inspect deformation, stress, and the torque response. The animation and this curve come from separate analyses, so we align them by angle for comparison. They are not one paired test. We still need to check the material, contact, and boundary conditions before making a strength claim.`],
    [20, `These unit curves help estimate the combined response. We add the two angles at the same torque. The dashed part uses an approximation beyond the upper spring data. This gives a design estimate, not a measured law of the final device. How should control use this elastic state?`],
  ],
  [
    [22, `Control must prepare the spring, not simply request an ideal torque at the knee. The input and output angles set its deformation. Through the nonlinear spring law, that deformation sets torque. We must choose both how much preload to build and when to build it.`],
    [22, `We study this in a coupled human-and-implant simulation using MuJoCo-Warp. A human controller drives twenty-two muscles. A separate controller drives the implant motors. Their actions interact through the body and contact. This is an engineering model, not yet a model fitted to an older patient.`],
    [27, `Standing up makes the timing easy to see. First, prepare the spring while the person is still seated. Then, provide support during the rise. Finally, adjust the spring state as the task changes. Follow the point on the torque-angle plot. The return to the chair is only a display reset.`],
    [34, `The development did not start with stable standing. These saved runs show an early human fall, an unstable implanted rise, and then the selected standing run. They are different development stages, not a controlled learning curve. We first developed the human movement. We then used a model-based teacher to search for a working assistance strategy. That teacher could use full simulation information.`],
    [27, `A real device cannot read all of that information. Our student uses motor encoder signals, a current-to-torque proxy, earlier commands, and a known local timing cue. A physics observer estimates the spring state. The student does not receive the true output angle or muscle activity. The sensing assumptions still need a hardware test.`],
    [33, `We train a student to imitate the teacher. Its memory helps it use a short history of device signals. It adjusts spring-torque targets ten times per second. The observer and motor servo then turn those targets into motor commands. The selected model is the imitation model. A later reinforcement-learning pilot did not show an added benefit, so we do not claim one.`],
    [35, `In the selected nominal simulation, the person rises and maintains standing. Notice that preload builds before the knee extends. This is a useful first execution result. However, the model coupling and chair contact still need further checks. Repeated copies of one initial condition are not different patients or a robustness test. We also have not shown that the learned student is better than the simpler controller.`],
    [25, `Walking makes the problem repeat on every step. Here, we show a separate walking experiment, not the same standing student. Follow the body, the spring-state point, and the torque together. The controller must prepare support before it is needed, then release or adjust it for the next step.`],
    [25, `This candidate stopped at twenty-seven point one nine seconds. Shaft power reached about twenty-seven watts, above the twenty-five-watt limit. So we cannot call this a completed walking result. Asking for more torque at the last moment is not enough. We need to prepare the next spring state earlier.`],
  ],
  [
    [26, `The work follows one path. First, preserve the coupled motion of the knee. Next, add a motor and nonlinear compliance. Then, prepare that elastic state at the right time. We now have a preliminary standing execution with a limited-sensing student, and a walking case that shows why timing and drive limits matter.`],
    [24, `Next, we will check the model coupling and sensing, calibrate the spring, and test different starts and disturbances. We also need valid task comparisons before claiming useful assistance. The long-term goal is support for older adults who need joint replacement and muscle assistance. Thank you for listening.`],
  ],
];

export function getTalkStage(page, step) {
  const row = talk[page - 1]?.[step];
  if (!row) return null;
  return { seconds: row[0], text: row[1], cue: `${page}-${step + 1}` };
}

export const talkSeconds = talk.flat().reduce((sum, row) => sum + row[0], 0);
export const talkWords = talk.flat().reduce((sum, row) => sum + row[1].trim().split(/\s+/).length, 0);
