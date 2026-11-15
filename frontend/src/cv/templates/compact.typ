// Compact: everything about an entry's heading on one line, tight spacing, made to fit
// a resume on one page.
//
// One column, reading order kept: the dates follow the job on the same line, written in
// the text after it, not set in a column of their own.

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
#set text(font: (cv.design.font, "Inter"), size: (cv.design.fontSize - 0.5) * 1pt, lang: "en", ligatures: false, fill: luma(20))
#set par(leading: 0.5em, spacing: gap(0.55), justify: false)
#set list(marker: [•], indent: 0.1em, body-indent: 0.5em, spacing: gap(0.35))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 0.85cm, top: cv.design.margin * 0.75cm, bottom: cv.design.margin * 0.85cm),
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
  set text(size: 1em, weight: "bold", fill: accent)
  block(above: gap(1), below: gap(0.45), sticky: true, {
    upper(it.body)
    h(0.6em)
    box(width: 1fr, baseline: -0.3em, line(length: 100%, stroke: 0.5pt + accent.lighten(40%)))
  })
}

#align(center)[
  #if cv.name != "" { text(size: 1.8em, weight: "bold")[#cv.name] }
  #if cv.headline != "" {
    linebreak()
    text(size: 1.05em, fill: muted)[#cv.headline]
  }
  #if cv.contact.len() > 0 {
    linebreak()
    set text(size: 0.9em)
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [|#h(0.4em)#item] }))
      .join([#h(0.15em) ])
  }
]

#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  let meta = (e.location, e.dates).filter(x => x != "")

  block(sticky: true, above: gap(0.7), below: gap(0.3), {
    head.join([, ])
    if meta.len() > 0 {
      text(fill: muted)[ — #meta.join(" | ")]
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
      block(above: gap(0.35), below: gap(0.35))[
        #if g.label != "" [#text(weight: "bold")[#g.label:] ]
        #g.items
      ]
    }
  }
}
