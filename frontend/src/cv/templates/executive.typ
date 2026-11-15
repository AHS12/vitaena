// Executive: everything centred on a quiet axis. The name is large and centred over a
// double rule, headings are centred between two short rules, and each role's organisation
// is set in italics. Suits senior, legal, finance and other traditional roles.
//
// For ATS: one column, written in reading order. The rules beside each heading are drawn
// lines, not characters, so the heading reads as one word.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(95)
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
#set text(font: (cv.design.font, "Inter"), size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(25))
#set par(leading: 0.58em, spacing: gap(0.7), justify: true)
#set list(marker: [–], indent: 0.2em, body-indent: 0.6em, spacing: gap(0.45))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 1.1cm, top: cv.design.margin * 1cm, bottom: cv.design.margin * 1cm),
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      align(center, cv.name)
    }
  },
  footer: context {
    if counter(page).final().first() > 1 {
      set text(size: 0.8em, fill: muted)
      align(center, counter(page).display("1 / 1", both: true))
    }
  },
)

#show heading.where(level: 2): it => {
  block(above: gap(1.4), below: gap(0.7), sticky: true, width: 100%, {
    set text(size: 1.05em, weight: "bold", fill: accent)
    grid(
      columns: (1fr, auto, 1fr),
      column-gutter: 0.8em,
      align: horizon,
      line(length: 100%, stroke: 0.5pt + accent.lighten(40%)),
      upper(it.body),
      line(length: 100%, stroke: 0.5pt + accent.lighten(40%)),
    )
  })
}

#{
  set align(center)
  if cv.photo != "" {
    box(width: 2.3cm, height: 2.3cm, radius: 50%, clip: true, image(cv.photo, width: 2.3cm, height: 2.3cm, fit: "cover"))
    v(0.3em)
  }
  // The photo carries no text, so the name is still the first thing a parser reads.
  if cv.name != "" {
    block(below: 0.5em, text(size: 2.3em, weight: "bold", fill: luma(15))[#cv.name])
  }
  if cv.headline != "" {
    block(below: 0.6em, text(size: 1.15em, fill: accent)[#cv.headline])
  }
  if cv.contact.len() > 0 {
    set text(size: 0.92em, fill: luma(60))
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [·#h(0.5em)#item] }))
      .join([#h(0.35em) ])
  }
  v(0.5em)
  line(length: 100%, stroke: 1.2pt + accent)
  v(-0.75em)
  line(length: 100%, stroke: 0.4pt + accent)
}

#let entry(e) = {
  let meta = (e.location, e.dates).filter(x => x != "")

  block(sticky: true, above: gap(1), below: gap(0.4), {
    if e.title != "" { text(weight: "bold", e.title) }
    if e.title != "" and e.org != "" [, ]
    if e.org != "" { emph(e.org) }
    if meta.len() > 0 {
      linebreak()
      text(size: 0.9em, fill: muted, meta.join("  ·  "))
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}

#for s in cv.sections {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.paragraphs { par(rich(p)) }
  } else if s.kind == "entries" {
    for e in s.entries { entry(e) }
  } else if s.kind == "tags" {
    for g in s.groups {
      block(above: gap(0.5), below: gap(0.5))[
        #if g.label != "" [#text(weight: "bold")[#g.label:] ]
        #g.items
      ]
    }
  }
}
