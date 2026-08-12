interface CoilDividerProps {
  /** Whether the step before this connector has been completed. */
  done: boolean;
}

// A gently kinked line connecting the booking-flow steps — Locs Allure
// works with coily/kinky natural hair, so the connector echoes that
// texture instead of a plain straight rule. Two overlapping copies of the
// same path: a quiet always-visible track, and a gold copy that draws
// itself in left-to-right (via stroke-dashoffset) once the step before it
// is done. `pathLength={100}` normalizes the path to 100 units regardless
// of its actual on-screen length, so the dash math stays simple even
// though this stretches to fill whatever width the flex layout gives it.
export function CoilDivider({ done }: CoilDividerProps) {
  const path =
    'M0,10 Q5,0 10,10 Q15,20 20,10 Q25,0 30,10 Q35,20 40,10 ' +
    'Q45,0 50,10 Q55,20 60,10 Q65,0 70,10 Q75,20 80,10 Q85,0 90,10 Q95,20 100,10';

  return (
    <svg
      className="booking-step__coil"
      viewBox="0 0 100 20"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path className="booking-step__coil-track" d={path} fill="none" />
      <path
        className={`booking-step__coil-fill${done ? ' booking-step__coil-fill--done' : ''}`}
        d={path}
        fill="none"
        pathLength={100}
      />
    </svg>
  );
}
