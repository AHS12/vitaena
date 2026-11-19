// Sidebar: a full-height column of the accent colour down the right of every page, with
// the photo, contact details, skills and other lists in white on it; the story runs in
// the wide column beside it.
//
// For ATS: the name and the main story are written first and the sidebar after them, so
// text comes out in the order a reader would want. With ATS mode on, the sidebar goes and
// everything is one column, with the contact details under the name.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(95)
#let gap(n) = n * cv.design.spacing * 1em
#let two = not cv.design.atsMode and cv.sections.any(s => s.column == "side")

// Page geometry: the side column's width, the page's right margin and the gutter. The
// coloured panel covers all of the right margin, the column and half the gutter.
#let mx = cv.design.margin * 0.9cm
#let side-width = 5.4cm
#let gutter = 1.6cm
#let panel = mx + side-width + gutter / 2

// Text arrives as spans of plain words with bold, italic or a link set on them, so
// nothing anyone types is ever read as Typst markup.
#let rich(spans) = spans.map(s => {
  let body = [#s.text]
  if s.at("bold", default: false) { body = strong(body) }
  if s.at("italic", default: false) { body = emph(body) }
  if s.at("url", default: "") != "" { body = link(s.url, body) }
  body
}).join()

// Items with a level, such as languages: the name, the word for how well when there is
// one, and the level drawn as dots, squares or a bar. The words are real text; the
// drawing adds nothing a parser reads, so it can't jumble the order.
#let level-mark(level, style, on, off) = if style == "bar" {
  box(width: 100%, height: 0.4em, radius: 0.2em, fill: off, clip: true,
    box(width: level / 5 * 100%, height: 100%, radius: 0.2em, fill: on))
} else {
  // Each of the five is drawn empty, then filled across as far as the level reaches, so
  // 4.5 fills four and half of the fifth.
  let shape(fill) = if style == "squares" { square(size: 0.55em, fill: fill) } else { circle(radius: 0.275em, fill: fill) }
  for i in range(5) {
    let part = calc.clamp(level - i, 0, 1)
    box(width: 0.55em, height: 0.55em, {
      place(shape(off))
      if part > 0 { place(box(width: part * 0.55em, height: 0.55em, clip: true, shape(on))) }
    })
    h(0.17em)
  }
}
// The style picked in Design, or the template's own when it's left to the template.
#let level-style(own) = if cv.design.levelStyle == "template" { own } else { cv.design.levelStyle }
#let levelled(g, across: 3, style: "dots", on: black, off: luma(225), soft: luma(95)) = grid(
  columns: (1fr,) * across,
  column-gutter: 1.6em,
  row-gutter: 0.75em,
  ..g.list.map(item => block(width: 100%, breakable: false, {
    // Tight under its name: the CV's paragraph spacing would float the mark away.
    set par(spacing: 0.45em)
    par({
      text(weight: "bold", item.name)
      if item.note != "" { h(1fr); text(size: 0.85em, fill: soft, item.note) }
    })
    if item.level > 0 { block(above: 0.45em, below: 0pt, level-mark(item.level, style, on, off)) }
  })),
)

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: cv.design.fonts, size: cv.design.fontSize * 1pt, lang: cv.design.lang, ligatures: false, fill: luma(25))
#set par(leading: 0.55em, spacing: gap(0.7), justify: false)
#set list(marker: [•], indent: 0.1em, body-indent: 0.55em, spacing: gap(0.45))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: mx, top: cv.design.margin * 0.9cm, bottom: cv.design.margin * 0.9cm),
  background: if two { place(right + top, rect(width: panel, height: 100%, fill: accent)) },
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      align(left, cv.name)
    }
  },
  footer: context {
    if counter(page).final().first() > 1 {
      set text(size: 0.8em, fill: muted)
      align(left, counter(page).display("1 / 1", both: true))
    }
  },
)

#let heading-main(title) = block(above: gap(1.35), below: gap(0.6), sticky: true, {
  text(size: 1.1em, weight: "bold", fill: accent, upper(title))
  v(-0.3em)
  line(length: 2.2em, stroke: 2pt + accent)
})
#let heading-side(title) = block(above: gap(1.35), below: gap(0.55), sticky: true, {
  text(size: 1.02em, weight: "bold", fill: white, upper(title))
  v(-0.4em)
  line(length: 100%, stroke: 0.6pt + white.transparentize(50%))
})

#let contact-line(items, separator) = {
  items
    .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
    .enumerate()
    .map(((i, item)) => box(if i == 0 { item } else { [#separator#item] }))
    .join([#h(0.2em) ])
}

#let entry(e, side) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  let meta = (e.location, e.dates).filter(x => x != "")
  let soft = if side { white.transparentize(25%) } else { muted }

  block(sticky: true, above: gap(0.9), below: gap(0.35), {
    head.join(if side { linebreak() } else [, ])
    if meta.len() > 0 {
      linebreak()
      text(size: 0.88em, fill: soft, if side { meta.join(linebreak()) } else { meta.join("  |  ") })
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}

#let section(s, side) = {
  if side { heading-side(s.title) } else { heading-main(s.title) }
  if s.kind == "text" {
    for p in s.paragraphs { par(rich(p)) }
  } else if s.kind == "entries" {
    for e in s.entries { entry(e, side) }
  } else if s.kind == "details" {
    for r in s.rows {
      block(above: gap(0.55), below: gap(0.55))[
        #if r.label != "" { text(weight: "bold", r.label); if side { linebreak() } else [: ] }
        #r.value
      ]
    }
  } else if s.kind == "tags" {
    for g in s.groups {
      if g.levels {
        block(above: gap(0.6), below: gap(0.6), {
          if g.label != "" { block(below: 0.6em, text(weight: "bold", g.label)) }
          if side { levelled(g, across: 1, style: level-style("bar"), on: white, off: white.transparentize(70%), soft: white.transparentize(25%)) } else { levelled(g, style: level-style("bar"), on: accent, off: accent.lighten(75%)) }
        })
      } else {
        block(above: gap(0.5), below: gap(0.5))[
          #if g.label != "" { text(weight: "bold", g.label); if side { linebreak() } else [: ] }
          #g.items
        ]
      }
    }
  }
}

#let name-block = {
  if cv.name != "" {
    text(size: 2.2em, weight: "bold", fill: luma(15))[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    text(size: 1.15em, fill: accent)[#cv.headline]
  }
}

#if two {
  let main = cv.sections.filter(s => s.column == "main")
  let side = cv.sections.filter(s => s.column == "side")

  grid(
    columns: (1fr, side-width),
    column-gutter: gutter,
    {
      name-block
      for s in main { section(s, false) }
    },
    {
      set text(size: 0.92em, fill: white)
      set list(marker: text(fill: white)[•])
      show link: set text(fill: white)
      if cv.photo != "" {
        align(center, box(width: 3cm, height: 3cm, radius: 50%, clip: true, stroke: 2pt + white, image(cv.photo, width: 3cm, height: 3cm, fit: "cover")))
      }
      if cv.contact.len() > 0 {
        heading-side(cv.words.contact)
        // One detail to a line: the column is too narrow to share.
        cv.contact.map(c => block(above: 0.5em, below: 0.5em, if c.url != "" { link(c.url)[#c.text] } else { c.text })).join()
      }
      for s in side { section(s, true) }
    },
  )
} else {
  name-block
  if cv.contact.len() > 0 {
    linebreak()
    v(0.2em)
    text(size: 0.92em, contact-line(cv.contact, [|#h(0.5em)]))
  }
  for s in cv.sections { section(s, false) }
}
