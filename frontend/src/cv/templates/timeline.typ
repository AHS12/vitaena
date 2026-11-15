// Timeline: each job and degree hangs from a thin vertical line, marked by a dot, with
// its dates above it in the accent colour. Makes a career's path easy to follow.
//
// For ATS: one column, written in reading order. Each entry's dates come first in its
// own block, so they stay between the entry before and the one after. The line and dots
// are drawn, not characters.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(95)
#let line-colour = accent.lighten(65%)
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
#set par(leading: 0.55em, spacing: gap(0.7), justify: false)
#set list(marker: [•], indent: 0.1em, body-indent: 0.55em, spacing: gap(0.45))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 1cm, top: cv.design.margin * 0.9cm, bottom: cv.design.margin * 1cm),
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
  block(above: gap(1.4), below: gap(0.7), sticky: true, {
    box(circle(radius: 0.32em, fill: accent), baseline: -0.05em)
    h(0.6em)
    text(size: 1.1em, weight: "bold", fill: accent, upper(it.body))
  })
}

#let header = {
  if cv.name != "" {
    text(size: 2.2em, weight: "bold")[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    text(size: 1.15em, fill: accent)[#cv.headline]
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(0.2em)
    set text(size: 0.92em, fill: luma(60))
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [|#h(0.5em)#item] }))
      .join([#h(0.2em) ])
  }
}

#if cv.photo != "" {
  grid(columns: (1fr, auto), column-gutter: 1em, align: (left + horizon, right + horizon), header,
    box(width: 2.2cm, height: 2.2cm, radius: 50%, clip: true, image(cv.photo, width: 2.2cm, height: 2.2cm, fit: "cover")))
} else {
  header
}
#v(0.4em)
#line(length: 100%, stroke: 0.5pt + luma(215))

// The line runs down the entry's left edge; the dot sits on it beside the dates.
#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }

  block(width: 100%, above: gap(0.4), below: gap(0.4), inset: (left: 1.2em, top: 0.15em, bottom: 0.5em), stroke: (left: 1.2pt + line-colour), {
    place(left, dx: -1.2em - 0.3em + 0.6pt, dy: 0.2em, circle(radius: 0.3em, fill: white, stroke: 1.4pt + accent))
    block(sticky: true, below: gap(0.35), {
      if e.dates != "" {
        text(size: 0.88em, weight: "bold", fill: accent, e.dates)
        linebreak()
      }
      head.join([, ])
      if e.location != "" {
        linebreak()
        text(size: 0.9em, fill: muted, e.location)
      }
    })
    if e.summary.len() > 0 { par(rich(e.summary)) }
    if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
  })
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
