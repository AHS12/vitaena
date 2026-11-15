// Classic: one column, name on top, accent-coloured section rules.
//
// Reads the render model from /cv.json. Everything is written in reading order and as
// real text, so the PDF reads correctly in an ATS: no columns, no tables, nothing only
// in the page header (from page 2 it repeats the name, which the body already has), and
// ligatures off so "fi" stays two letters.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(90)
// Every gap scales with the chosen spacing.
#let gap(n) = n * cv.design.spacing * 1em

// Text arrives as spans of plain words with bold, italic or a link set on them, so
// nothing anyone types is ever read as Typst markup.
#let rich(spans) = spans.map(s => {
  let body = [#s.text]
  if s.at("bold", default: false) { body = strong(body) }
  if s.at("italic", default: false) { body = emph(body) }
  if s.at("url", default: "") != "" { body = link(s.url, body) }
  body
}).join()

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: (cv.design.font, "Inter"), size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(20))
#set par(leading: 0.55em, spacing: gap(0.7), justify: false)
#set list(marker: [•], indent: 0.2em, body-indent: 0.6em, spacing: gap(0.45))
#set page(
  paper: cv.design.paper,
  // Said outright: the preview's SVG leaves an unfilled page see-through.
  fill: white,
  margin: (x: cv.design.margin * 1cm, top: cv.design.margin * 0.9cm, bottom: cv.design.margin * 1cm),
  // From page 2, the name sits small at the top, so a loose page still says whose it is.
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      align(right, cv.name)
    }
  },
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
  block(above: gap(1.3), below: gap(0.6), sticky: true)[
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
  block(sticky: true, above: gap(0.9), below: gap(0.35), {
    head.join([, ])
    if meta.len() > 0 {
      linebreak()
      text(size: 0.92em, fill: muted, meta.join("  |  "))
    }
  })
  if e.summary.len() > 0 {
    par(rich(e.summary))
  }
  if e.bullets.len() > 0 {
    list(..e.bullets.map(b => rich(b)))
  }
}

#for s in cv.sections {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.paragraphs {
      par(rich(p))
    }
  } else if s.kind == "entries" {
    for e in s.entries {
      entry(e)
    }
  } else if s.kind == "tags" {
    for g in s.groups {
      block(above: gap(0.5), below: gap(0.5))[
        #if g.label != "" [#text(weight: "bold")[#g.label:] ]
        #g.items
      ]
    }
  }
}
