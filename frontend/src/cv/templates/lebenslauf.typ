// Lebenslauf: the tabular CV of Germany, Austria and Switzerland. The name and contact
// on the left with a passport-shaped photo on the right, then every section as a table:
// dates or labels in a narrow left column, the rest beside them. Quiet, with one accent,
// and the place, date and signature at the end when the CV has them.
//
// For ATS: one column, real text throughout. Each date is written just before its own
// entry, so a parser reads it as part of that entry.

#import "/parts.typ": closing

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(95)
#let gap(n) = n * cv.design.spacing * 1em
// Wide enough for "03.2022 – 06.2024" or "Mar 2022 – Present" on one line: a range split
// over two lines reads to a parser as two broken pieces.
#let label-col = 3.6cm
#let gutter = 1em

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

// Right to left, for Urdu: Typst flips grids and start and end by the language,
// Nastaliq's tall letters get taller line boxes, the same for Latin text so lines beside
// each other stay level, and its joined letters keep the ligatures Latin text goes without.
#set text(top-edge: 0.85em, bottom-edge: -0.35em, ligatures: true) if cv.design.rtl
#set par(leading: 0.6em, spacing: gap(0.65), justify: false)
// Chinese characters and kana are dense, and read better with more room between lines.
#set par(leading: 0.85em) if cv.design.cjk
#set list(marker: [–], indent: 0em, body-indent: 0.5em, spacing: gap(0.35))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 1.05cm, top: cv.design.margin * 1cm, bottom: cv.design.margin * 1cm),
  footer: context {
    if counter(page).final().first() > 1 {
      set text(size: 0.8em, fill: muted)
      align(end, counter(page).display("1 / 1", both: true))
    }
  },
)

// The name and contact on the left; the photo, passport-shaped, on the right.
#let header = {
  if cv.name != "" {
    text(size: 2em, weight: "bold")[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    v(gap(0.15))
    text(size: 1.1em, fill: accent)[#cv.headline]
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(gap(0.5))
    set text(size: 0.92em)
    // One detail to a line, as a Lebenslauf lists them.
    cv.contact.map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text }).join(linebreak())
  }
}

#if cv.photo != "" {
  grid(columns: (1fr, auto), column-gutter: 1.2em, align: (start + bottom, end + top), header,
    box(width: 3.5cm, height: 4.5cm, radius: 2pt, clip: true, stroke: 0.5pt + luma(210), image(cv.photo, width: 3.5cm, height: 4.5cm, fit: "cover")))
} else {
  header
}

#show heading.where(level: 2): it => {
  set text(size: 1em, weight: "bold", fill: accent, tracking: if cv.design.latin { 0.06em } else { 0em })
  block(above: gap(1.6), below: gap(0.75), sticky: true, {
    upper(it.body)
    v(-0.5em)
    line(length: 100%, stroke: 0.6pt + accent.lighten(40%))
  })
}

// A row of the table: what's in the left column, and what's beside it.
#let row(left, right, above: 0.55) = block(above: gap(above), below: gap(0.3), breakable: true, grid(
  columns: (label-col, 1fr),
  column-gutter: gutter,
  box(text(fill: muted, left)),
  right,
))

// One job or school: its dates on the left; what, where and what was done beside them.
#let entry(e) = row(e.dates, {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  block(sticky: true, below: gap(0.3), {
    head.join(cv.words.comma)
    if e.location != "" {
      linebreak()
      text(size: 0.92em, fill: muted, e.location)
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}, above: 0.8)

#for s in cv.sections {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.paragraphs { par(rich(p)) }
  } else if s.kind == "entries" {
    for e in s.entries { entry(e) }
  } else if s.kind == "details" {
    for r in s.rows { row(r.label, r.value, above: 0.4) }
  } else if s.kind == "tags" {
    for g in s.groups {
      row(g.label, if g.levels { levelled(g, on: accent, style: level-style("dots")) } else { g.items }, above: 0.45)
    }
  }
}

#closing(cv)
