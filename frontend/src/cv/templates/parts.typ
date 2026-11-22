// Parts every CV template shares, imported as "/parts.typ".

// The line a CV can end with, as German and South Asian CVs do: the place and date, and
// under them the signature, or a line to sign on by hand. The three stay on one page.
#let closing(cv, rule: luma(150)) = if cv.closing != "" {
  block(breakable: false, above: 2.4em, width: 100%, {
    cv.closing
    if cv.signature != "" {
      block(above: 0.5em, image(cv.signature, height: 1.4cm))
    } else {
      block(above: 1.4cm, line(length: 5.5cm, stroke: 0.5pt + rule))
    }
  })
}
