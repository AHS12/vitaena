// Academic: a full CV for research and teaching. The name and contact centred on top;
// each entry's dates in a margin on the left, so a long record scans quickly; and
// publications, talks and the like as a numbered list of references.
//
// For ATS: one column, real text throughout. Each date is written just before its own
// entry, so a parser reads it as part of that entry.

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let muted = luma(95)
#let gap(n) = n * cv.design.spacing * 1em
// Wide enough for "Mar 2022 – Present" on one line: a date range split over two lines
// reads to a parser as two broken pieces.
#let margin-col = 3.2cm

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

// Sections whose entries are works to cite rather than places someone was.
#let is-references(title) = lower(title).contains(regex("publication|paper|article|book|chapter|talk|presentation|conference|poster|patent"))

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: cv.design.fonts, size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(25))
#set par(leading: 0.58em, spacing: gap(0.7), justify: true)
#set list(marker: [–], indent: 0em, body-indent: 0.5em, spacing: gap(0.4))
#set page(
  paper: cv.design.paper,
  fill: white,
  margin: (x: cv.design.margin * 1.05cm, top: cv.design.margin * 1cm, bottom: cv.design.margin * 1cm),
  header: context {
    if counter(page).get().first() > 1 and cv.name != "" {
      set text(size: 0.8em, fill: muted)
      grid(columns: (1fr, auto), cv.name, [Curriculum vitae])
      v(-0.4em)
      line(length: 100%, stroke: 0.4pt + luma(210))
    }
  },
  footer: context {
    if counter(page).final().first() > 1 {
      set text(size: 0.8em, fill: muted)
      align(center, counter(page).display("1 / 1", both: true))
    }
  },
)

// The name, centred, with the photo above it when there is one.
#align(center, {
  if cv.photo != "" {
    box(width: 2.1cm, height: 2.1cm, radius: 50%, clip: true, image(cv.photo, width: 2.1cm, height: 2.1cm, fit: "cover"))
    v(gap(0.3))
  }
  if cv.name != "" {
    text(size: 2em, weight: "bold")[#cv.name]
    linebreak()
  }
  if cv.headline != "" {
    v(gap(0.1))
    text(size: 1.1em, fill: muted)[#cv.headline]
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(gap(0.35))
    set text(size: 0.9em)
    cv.contact
      .map(c => if c.url != "" { link(c.url)[#c.text] } else { c.text })
      .enumerate()
      .map(((i, item)) => box(if i == 0 { item } else { [·#h(0.45em)#item] }))
      .join([#h(0.3em) ])
  }
})

#show heading.where(level: 2): it => {
  set text(size: 1.05em, weight: "bold", fill: accent)
  block(above: gap(1.5), below: gap(0.7), sticky: true, {
    upper(it.body)
    v(-0.55em)
    line(length: 100%, stroke: 0.5pt + accent.lighten(35%))
  })
}

// One entry: its dates in the margin, everything else beside them.
#let entry(e) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(emph(e.org)) }

  block(above: gap(0.8), below: gap(0.3), breakable: true, grid(
    columns: (margin-col, 1fr),
    column-gutter: 0.9em,
    box(text(size: 0.9em, fill: muted, e.dates)),
    {
      block(sticky: true, below: gap(0.3), {
        head.join([, ])
        if e.location != "" {
          [, ]
          text(fill: muted, e.location)
        }
      })
      set par(justify: false)
      if e.summary.len() > 0 { par(rich(e.summary)) }
      if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
    },
  ))
}

// One work in a numbered list: what it is, where it appeared, when, then any notes.
#let reference(e, n) = {
  block(above: gap(0.55), below: gap(0.3), grid(
    columns: (margin-col, 1fr),
    column-gutter: 0.9em,
    align(right, text(fill: muted, [#n.])),
    {
      set par(justify: false)
      let cite = ()
      if e.title != "" { cite.push(strong(e.title)) }
      if e.org != "" { cite.push(emph(e.org)) }
      if e.dates != "" { cite.push(e.dates) }
      cite.join([. ])
      [.]
      if e.summary.len() > 0 { [ ]; rich(e.summary) }
      for b in e.bullets {
        linebreak()
        text(size: 0.92em, fill: muted, rich(b))
      }
    },
  ))
}

#for s in cv.sections {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.paragraphs { par(rich(p)) }
  } else if s.kind == "entries" {
    if is-references(s.title) {
      for (i, e) in s.entries.enumerate() { reference(e, i + 1) }
    } else {
      for e in s.entries { entry(e) }
    }
  } else if s.kind == "details" {
    for r in s.rows {
      block(above: gap(0.45), below: gap(0.45), grid(
        columns: (margin-col, 1fr),
        column-gutter: 0.9em,
        text(size: 0.9em, fill: muted, r.label),
        r.value,
      ))
    }
  } else if s.kind == "tags" {
    for g in s.groups {
      block(above: gap(0.45), below: gap(0.45), grid(
        columns: (margin-col, 1fr),
        column-gutter: 0.9em,
        text(size: 0.9em, fill: muted, g.label),
        if g.levels { levelled(g, on: accent, style: level-style("dots")) } else { g.items },
      ))
    }
  }
}
