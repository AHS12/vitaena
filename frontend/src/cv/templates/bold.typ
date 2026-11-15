// Bold: a full-width band of the accent colour across the top of the first page, with
// the name in white; below, headings marked by a short accent bar. Confident without
// giving up a single column.
//
// For ATS: one column, written in reading order. The band is a filled block behind real
// text, so the name and contact details read as they are.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(95)
#let gap(n) = n * cv.design.spacing * 1em
#let mx = cv.design.margin * 1cm
#let mt = cv.design.margin * 0.9cm

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
#set list(marker: text(fill: accent)[▪], indent: 0.1em, body-indent: 0.55em, spacing: gap(0.45))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: mx, top: mt, bottom: cv.design.margin * 1cm),
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
  block(above: gap(1.35), below: gap(0.65), sticky: true, {
    box(width: 0.35em, height: 0.95em, fill: accent, baseline: 0.12em)
    h(0.5em)
    text(size: 1.1em, weight: "bold", fill: luma(15), upper(it.body))
  })
}

#let band = {
  set text(fill: white)
  if cv.name != "" {
    text(size: 2.3em, weight: "bold")[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    text(size: 1.15em, fill: white.transparentize(15%))[#cv.headline]
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(gap(0.3))
    set text(size: 0.92em)
    show link: set text(fill: white)
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [|#h(0.5em)#item] }))
      .join([#h(0.2em) ])
  }
}

// The band runs to the page's edges: pulled out past the margins on three sides.
#pad(left: -mx, right: -mx, top: -mt, block(width: 100%, fill: accent, inset: (x: mx, top: mt * 0.9, bottom: 1.3em), if cv.photo != "" {
  grid(columns: (1fr, auto), column-gutter: 1em, align: (left + horizon, right + horizon), band,
    box(width: 2.3cm, height: 2.3cm, radius: 50%, clip: true, stroke: 2pt + white, image(cv.photo, width: 2.3cm, height: 2.3cm, fit: "cover")))
} else {
  band
}))

#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(text(weight: "bold", fill: luma(15), e.title)) }
  if e.org != "" { head.push(text(fill: accent, weight: "bold", e.org)) }
  let meta = (e.location, e.dates).filter(x => x != "")

  block(sticky: true, above: gap(0.95), below: gap(0.35), {
    head.join([ · ])
    if meta.len() > 0 {
      linebreak()
      text(size: 0.9em, fill: muted, meta.join("  |  "))
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
