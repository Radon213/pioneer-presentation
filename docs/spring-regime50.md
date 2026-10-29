# 4-4: the stiffness-setting spring changes after contact

k1 denotes the initially compliant lower/contact spring; k2 is the upper spring.
The series tangent stiffness is `(1/k1 + 1/k2)^-1`.

- Before contact: `k1 << k2`, so `keq ≈ k1`.
- After contact stiffens the lower unit: `k1 >> k2`, so `keq ≈ k2`.

The revised conceptual plot shows both unit curves and their series response at
common torque, rather than a lateral curve-merging animation. A synchronized
loading cycle highlights the two limiting regimes. Lower-unit deflection grows
predominantly first; after contact, most additional deflection goes to the upper
unit. The native CAD units wind with those same qualitative deflections.

The dimensionless illustration uses tenfold stiffness separation on either side
of contact. The equivalent stiffness is within 10% of the smaller stiffness in
each branch. This is a teaching model, not a fitted CAD/ANSYS law; no source curve,
FEA frame, contact solution, or quantitative result was changed.
