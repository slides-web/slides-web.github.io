// =============================================================================
// One section's equations. Copy the two lines below to start another file;
// each file merges into the same store, so load order between them is free.
//
// String.raw keeps every backslash literal, so MathType output is pasted in
// unchanged. JSON could not do this: it reads \f in \frac as a form feed.
//
// Keys are shared across ALL equation files. Two files defining the same key
// means the later one silently wins, so prefix keys per section if in doubt.
//
// A system of equations is an array, one String.raw per row (pq below). The
// injector writes the align, the \\ between rows and each row's \label.
// =============================================================================

window.MathEquations = window.MathEquations || {};

Object.assign(window.MathEquations, {

   park: String.raw`
{{\bf{P}}^{ - 1}} = \left[ {\begin{array}{*{20}{c}}
   {\frac{1}{{\sqrt 2 }}} & {\cos {\theta _s}} & {\sin {\theta _s}}  \\
   {\frac{1}{{\sqrt 2 }}} & {\cos \left( {{\theta _s} - \frac{{2\pi }}{3}} \right)} & {\sin \left( {{\theta _s} - \frac{{2\pi }}{3}} \right)}  \\
   {\frac{1}{{\sqrt 2 }}} & {\cos \left( {{\theta _s} + \frac{{2\pi }}{3}} \right)} & {\sin \left( {{\theta _s} + \frac{{2\pi }}{3}} \right)}  \\
\end{array}} \right]
`,

   // one String.raw per row: no \label, no \\
   pq: [
      String.raw`{p_v} &= \frac{{{X_t}{E_v}{V_e}\sin \delta  + {R_t}\left( {E_v^2 - {E_v}{V_e}\cos \delta } \right)}}{{R_t^2 + X_t^2}}`,
      String.raw`{q_v} &= \frac{{{X_t}\left( {E_v^2 - {E_v}{V_e}\cos \delta } \right) - {R_t}{E_v}{V_e}\sin \delta }}{{R_t^2 + X_t^2}}`
   ],

   zeta: String.raw`\zeta = \frac{{{D_{tr}}}}{{2{K_{tr}}{\omega _{Br}}}}`,

   // The AC current dynamics in the synchronous DQ frame, one step per key:
   // in SI units, divided by the bases, in per unit, and per unit regrouped.
   icdq1: String.raw`{L_c}\dot i_c^{DQ} =  - \left( {{R_c} + j{\omega _s}{L_c}} \right)i_c^{DQ} + v_c^{DQ} - v_h^{DQ}`,

   icdq2: String.raw`\dfrac{{{L_c}\dot i_c^{DQ}}}{{{\omega _B}{L_B}{I_B}}} =  - \dfrac{{{R_c}i_c^{DQ}}}{{{Z_B}{I_B}}} - j\dfrac{{{\omega _s}{L_c}i_c^{DQ}}}{{{\omega _B}{L_B}{I_B}}} + \dfrac{{v_c^{DQ}}}{{{V_B}}} - \dfrac{{v_h^{DQ}}}{{{V_B}}}`,

   icdq3: String.raw`\dfrac{{{{\bar L}_c}}}{{{\omega _B}}} {\dot {\bar i}}_c^{DQ} =  - {{\bar R}_c}\bar i_c^{DQ} - j{{\bar \omega }_s}{{\bar L}_c}\bar i_c^{DQ} + \bar v_c^{DQ} - \bar v_h^{DQ}`,

   icdq4: String.raw`\dfrac{{{{\bar L}_c}}}{{{\omega _B}}} {\dot {\bar i}}_c^{DQ} =  - \left( {{{\bar R}_c} + j{{\bar \omega }_s}{{\bar L}_c}} \right)\bar i_c^{DQ} + \bar v_c^{DQ} - \bar v_h^{DQ}`

});
