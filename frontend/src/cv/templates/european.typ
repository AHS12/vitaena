// European: laid out like a Europass CV. A band of colour with the name and contact
// details, section headings across the page, dates and labels in a narrow left column,
// and languages on the European scale as a grid of the five skills, with mother tongues
// named first. Not the European Union's own Europass, whose name and logo are theirs.
//
// For ATS: one column, real text throughout. Each date is written just before its own
// entry, and the language grid reads row by row: a language, then its five levels.

#import "/parts.typ": closing

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(100)
#let gap(n) = n * cv.design.spacing * 1em
#let mx = cv.design.margin * 1.05cm
#let mt = cv.design.margin * 1cm
// Wide enough for "01/2022 – 06/2024" on one line: a range split over two lines reads to
// a parser as two broken pieces.
#let label-col = 3.5cm
#let gutter = 1.1em

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
#set list(marker: [•], indent: 0em, body-indent: 0.5em, spacing: gap(0.35))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: mx, top: mt, bottom: cv.design.margin * 1cm),
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      align(end, cv.name)
    }
  },
  footer: context {
    if counter(page).final().first() > 1 {
      set text(size: 0.8em, fill: muted)
      align(end, counter(page).display("1 / 1", both: true))
    }
  },
)

#let band = {
  set text(fill: white)
  if cv.name != "" {
    text(size: 2.1em, weight: "bold")[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    text(size: 1.1em, fill: white.transparentize(12%))[#cv.headline]
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(gap(0.35))
    set text(size: 0.9em)
    show link: set text(fill: white)
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [|#h(0.5em)#item] }))
      .join([#h(0.2em) ])
  }
}

// The band runs to the page's edges: pulled out past the margins on three sides.
#pad(left: -mx, right: -mx, top: -mt, block(width: 100%, fill: accent, inset: (x: mx, top: mt * 0.85, bottom: 1.2em), if cv.photo != "" {
  grid(columns: (1fr, auto), column-gutter: 1em, align: (start + horizon, end + horizon), band,
    box(width: 2.6cm, height: 3.2cm, radius: 2pt, clip: true, stroke: 1.5pt + white, image(cv.photo, width: 2.6cm, height: 3.2cm, fit: "cover")))
} else {
  band
}))

#show heading.where(level: 2): it => {
  block(above: gap(1.5), below: gap(0.7), sticky: true, grid(
    columns: (auto, 1fr),
    column-gutter: 0.6em,
    align: horizon,
    text(size: 1em, weight: "bold", fill: accent, tracking: if cv.design.latin { 0.05em } else { 0em }, upper(it.body)),
    line(length: 100%, stroke: 0.7pt + accent.lighten(30%)),
  ))
}

// A row: what's in the left column, quiet and to the end, and what's beside it.
#let row(left, right, above: 0.55) = block(above: gap(above), below: gap(0.3), breakable: true, grid(
  columns: (label-col, 1fr),
  column-gutter: gutter,
  align(end, box(text(size: 0.9em, fill: muted, left))),
  right,
))

// One job or school: its dates on the left; what, where and what was done beside them.
#let entry(e) = row(e.dates, {
  block(sticky: true, below: gap(0.3), {
    if e.title != "" { text(weight: "bold", e.title) }
    let place = ()
    if e.org != "" { place.push(text(fill: accent, e.org)) }
    if e.location != "" { place.push(text(fill: muted, e.location)) }
    if place.len() > 0 {
      if e.title != "" { linebreak() }
      place.join([#h(0.4em)|#h(0.4em)])
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}, above: 0.8)

// Languages on the European scale: mother tongues named, then a grid of the others, a
// row each, its five skills' levels across.
#let cefr-grid(g) = {
  let native = g.cefr.filter(i => i.native)
  let others = g.cefr.filter(i => not i.native)
  let w = cv.words.cefr
  if native.len() > 0 {
    row(w.motherTongue, native.map(i => i.name).join(cv.words.comma), above: 0.45)
  }
  if others.len() > 0 {
    block(above: gap(0.6), below: gap(0.4), {
      set text(size: 0.92em)
      table(
        columns: (label-col + gutter, ..(1fr,) * 5),
        stroke: (x, y) => if y == 0 { (bottom: 0.6pt + accent.lighten(30%)) } else { (bottom: 0.4pt + luma(225)) },
        inset: (x: 0.35em, y: 0.45em),
        align: (x, y) => if x == 0 { start + horizon } else { center + horizon },
        table.header(
          text(size: 0.85em, fill: muted, g.label),
          ..(w.listening, w.reading, w.interaction, w.production, w.writing).map(t => text(size: 0.8em, fill: muted, t)),
        ),
        ..others.map(i => (text(weight: "bold", i.name), ..i.levels.map(l => if l == "" { text(fill: muted)[–] } else { l }))).flatten(),
      )
    })
  }
}

#for s in cv.sections {
  heading(level: 2, s.title)
  if s.kind == "text" {
    row([], { for p in s.paragraphs { par(rich(p)) } }, above: 0.3)
  } else if s.kind == "entries" {
    for e in s.entries { entry(e) }
  } else if s.kind == "details" {
    for r in s.rows { row(r.label, r.value, above: 0.4) }
  } else if s.kind == "tags" {
    for g in s.groups {
      if g.cefr != none {
        cefr-grid(g)
      } else {
        row(g.label, if g.levels { levelled(g, on: accent, style: level-style("squares")) } else { g.items }, above: 0.45)
      }
    }
  }
}

#closing(cv)
