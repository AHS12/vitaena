// Modern: a tinted band with the name, then two columns. The wide column holds what
// you've done; the narrow one holds skills, languages and other lists.
//
// For ATS: the narrow column is written after the wide one, so text comes out with the
// main story first and the lists after it. With ATS mode on, everything is one column,
// in the order of the sections.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let tint = accent.lighten(92%)
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
#let two = not cv.design.atsMode and cv.sections.any(s => s.kind == "tags")

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: (cv.design.font, "Inter"), size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(20))
#set par(leading: 0.55em, spacing: gap(0.7), justify: false)
#set list(marker: text(fill: accent)[•], indent: 0.1em, body-indent: 0.55em, spacing: gap(0.45))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 0.9cm, top: cv.design.margin * 0.8cm, bottom: cv.design.margin * 0.9cm),
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      align(right, cv.name)
    }
  },
  footer: context {
    if counter(page).final().first() > 1 {
      set text(size: 0.8em, fill: muted)
      align(right, counter(page).display("1 / 1", both: true))
    }
  },
)

#show heading.where(level: 2): it => {
  set text(size: 1.05em, weight: "bold", fill: accent)
  block(above: gap(1.25), below: gap(0.55), sticky: true, upper(it.body))
}

// The name band.
#block(width: 100%, fill: tint, inset: (x: 1.2em, y: 1.1em), radius: 3pt, {
  if cv.name != "" {
    text(size: 2.1em, weight: "bold", fill: accent)[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    text(size: 1.15em)[#cv.headline]
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(gap(0.25))
    set text(size: 0.9em)
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [|#h(0.45em)#item] }))
      .join([#h(0.2em) ])
  }
})

#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  let meta = (e.location, e.dates).filter(x => x != "")

  block(sticky: true, above: gap(0.9), below: gap(0.35), {
    head.join([, ])
    if meta.len() > 0 {
      linebreak()
      text(size: 0.9em, fill: muted, meta.join("  |  "))
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}

#let section(s) = {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.paragraphs { par(rich(p)) }
  } else if s.kind == "entries" {
    for e in s.entries { entry(e) }
  } else if s.kind == "tags" {
    for g in s.groups {
      block(above: gap(0.5), below: gap(0.5))[
        #if g.label != "" { text(weight: "bold", g.label); if two { linebreak() } else [: ] }
        #g.items
      ]
    }
  }
}

#if two {
  let main = cv.sections.filter(s => s.kind != "tags")
  let side = cv.sections.filter(s => s.kind == "tags")

  grid(
    columns: (1fr, 0.42fr),
    column-gutter: 1.4em,
    { for s in main { section(s) } },
    block(width: 100%, inset: (x: 0.9em, top: 0.1em, bottom: 0.9em), fill: tint, radius: 3pt, { for s in side { section(s) } }),
  )
} else {
  for s in cv.sections { section(s) }
}
