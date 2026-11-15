// Classic: one column, name on top, accent-coloured section rules.
//
// Reads the render model from /cv.json. Everything is written in reading order and as
// real text, so the PDF reads correctly in an ATS: no columns, no tables, no text in
// the page header, and ligatures off so "fi" stays two letters.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(90)

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: "Inter", size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(20))
#set par(leading: 0.55em, spacing: 0.7em, justify: false)
#set list(marker: [•], indent: 0.2em, body-indent: 0.6em, spacing: 0.45em)
#set page(
  paper: cv.design.paper,
  // Said outright: the preview's SVG leaves an unfilled page see-through.
  fill: white,
  margin: (x: 1.8cm, top: 1.6cm, bottom: 1.8cm),
  footer: context {
    let total = counter(page).final().first()
    if total > 1 {
      set text(size: 0.8em, fill: muted)
      align(right, counter(page).display("1 / 1", both: true))
    }
  },
)

#show heading.where(level: 2): it => {
  set text(size: 1.1em, weight: "bold", fill: accent)
  block(above: 1.3em, below: 0.6em, sticky: true)[
    #upper(it.body)
    #v(-0.55em)
    #line(length: 100%, stroke: 0.6pt + accent)
  ]
}

// Header: the name is the document's first text, then the headline and contact.
#if cv.name != "" {
  text(size: 2.1em, weight: "bold")[#cv.name]
  linebreak()
}
#if cv.headline != "" {
  text(size: 1.15em, fill: muted)[#cv.headline]
  linebreak()
}
#if cv.contact.len() > 0 {
  v(0.2em)
  set text(size: 0.92em)
  // Each item is one unbreakable box: a long address wrapped at its hyphen reads to a
  // parser as two broken words. Lines break only between items, and each separator
  // travels with the item after it, so none is left hanging at a line's end.
  cv.contact
    .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
    .enumerate()
    .map(((i, item)) => box(if i == 0 { item } else { [|#h(0.5em)#item] }))
    .join([#h(0.2em) ])
}

// Dates sit inline after the location rather than right-aligned: a column of dates
// down the right edge is read by text extractors as its own column, away from its job.
#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  let meta = (e.location, e.dates).filter(x => x != "")

  // The heading lines stay with what follows them, but a long entry may still break.
  block(sticky: true, above: 0.9em, below: 0.35em, {
    head.join([, ])
    if meta.len() > 0 {
      linebreak()
      text(size: 0.92em, fill: muted, meta.join("  |  "))
    }
  })
  if e.summary != "" {
    par(e.summary)
  }
  if e.bullets.len() > 0 {
    list(..e.bullets.map(b => [#b]))
  }
}

#for s in cv.sections {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.text.split("\n").filter(p => p.trim() != "") {
      par(p)
    }
  } else if s.kind == "entries" {
    for e in s.entries {
      entry(e)
    }
  } else if s.kind == "tags" {
    for g in s.groups {
      block(above: 0.5em, below: 0.5em)[
        #if g.label != "" [#text(weight: "bold")[#g.label:] ]
        #g.items
      ]
    }
  }
}
