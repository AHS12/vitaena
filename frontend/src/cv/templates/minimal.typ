// Minimal: no rules or colour bars, generous white space, the accent only on the name.
//
// One column, written in reading order, ligatures off: the same ATS rules as Classic.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(105)
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
#set text(font: (cv.design.font, "Inter"), size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(30))
#set par(leading: 0.6em, spacing: gap(0.75), justify: false)
#set list(marker: [–], indent: 0em, body-indent: 0.6em, spacing: gap(0.5))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 1.15cm, top: cv.design.margin * 1.1cm, bottom: cv.design.margin * 1cm),
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      align(right, cv.name)
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
  // No letter-spacing: spaced-out capitals come out of a PDF as "S U M M A R Y".
  set text(size: 0.9em, weight: "bold", fill: muted)
  block(above: gap(1.8), below: gap(0.8), sticky: true, upper(it.body))
}

#if cv.name != "" {
  text(size: 2.3em, weight: "regular", fill: accent)[#cv.name]
  linebreak()
}
#if cv.headline != "" {
  v(gap(0.1))
  text(size: 1.1em)[#cv.headline]
  linebreak()
}
#if cv.contact.len() > 0 {
  v(gap(0.4))
  set text(size: 0.9em, fill: muted)
  cv.contact
    .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
    .enumerate()
    .map(((i, item)) => box(if i == 0 { item } else { [·#h(0.45em)#item] }))
    .join([#h(0.25em) ])
}

#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  let meta = (e.location, e.dates).filter(x => x != "")

  block(sticky: true, above: gap(1.1), below: gap(0.4), {
    head.join([, ])
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
        #if g.label != "" [#text(fill: muted)[#g.label:] ]
        #g.items
      ]
    }
  }
}
