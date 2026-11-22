// Compact: everything about an entry's heading on one line, tight spacing, made to fit
// a resume on one page.
//
// One column, reading order kept: the dates follow the job on the same line, written in
// the text after it, not set in a column of their own.

#import "/parts.typ": closing

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
#set text(font: cv.design.fonts, size: (cv.design.fontSize - 0.5) * 1pt, lang: cv.design.lang, ligatures: false, fill: luma(20))

// Right to left, for Urdu: Typst flips grids and start and end by the language,
// Nastaliq's tall letters get taller line boxes, the same for Latin text so lines beside
// each other stay level, and its joined letters keep the ligatures Latin text goes without.
#set text(top-edge: 0.85em, bottom-edge: -0.35em, ligatures: true) if cv.design.rtl
#set par(leading: 0.5em, spacing: gap(0.55), justify: false)
// Chinese characters and kana are dense, and read better with more room between lines.
#set par(leading: 0.85em) if cv.design.cjk
#set list(marker: [•], indent: 0.1em, body-indent: 0.5em, spacing: gap(0.35))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 0.85cm, top: cv.design.margin * 0.75cm, bottom: cv.design.margin * 0.85cm),
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
    head.join(cv.words.comma)
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
  } else if s.kind == "details" {
    for r in s.rows {
      block(above: gap(0.2), below: gap(0.2))[
        #if r.label != "" [#text(weight: "bold")[#r.label:] ]
        #r.value
      ]
    }
  } else if s.kind == "tags" {
    for g in s.groups {
      if g.levels {
        block(above: gap(0.45), below: gap(0.45), {
          if g.label != "" { block(below: 0.5em, text(weight: "bold", g.label)) }
          levelled(g, across: 4, on: accent, style: level-style("dots"))
        })
      } else {
        block(above: gap(0.35), below: gap(0.35))[
          #if g.label != "" [#text(weight: "bold")[#g.label:] ]
          #g.items
        ]
      }
    }
  }
}

#closing(cv)
