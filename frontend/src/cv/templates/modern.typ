// Modern: a tinted band with the name, then two columns. The wide column holds what
// you've done; the narrow one holds skills, languages, projects and other lists.
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
#let two = not cv.design.atsMode and cv.sections.any(s => s.column == "side")

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

// The name band, with the photo at its right when there is one.
#let band = {
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
}

#block(width: 100%, fill: tint, inset: (x: 1.2em, y: 1.1em), radius: 3pt, if cv.photo != "" {
  grid(columns: (1fr, auto), column-gutter: 1em, align: (left + horizon, right + horizon), band,
    box(width: 2.1cm, height: 2.1cm, radius: 50%, clip: true, image(cv.photo, width: 2.1cm, height: 2.1cm, fit: "cover")))
} else {
  band
})

// In the narrow column, place and dates each get a line: side by side they wrap mid-date.
#let entry(e, side) = {
  let head = ()
  if e.title != "" { head.push(strong(e.title)) }
  if e.org != "" { head.push(e.org) }
  let meta = (e.location, e.dates).filter(x => x != "")

  block(sticky: true, above: gap(0.9), below: gap(0.35), {
    head.join([, ])
    if meta.len() > 0 {
      linebreak()
      text(size: 0.9em, fill: muted, if side { meta.join(linebreak()) } else { meta.join("  |  ") })
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}

#let section(s, side) = {
  heading(level: 2, s.title)
  if s.kind == "text" {
    for p in s.paragraphs { par(rich(p)) }
  } else if s.kind == "entries" {
    for e in s.entries { entry(e, side) }
  } else if s.kind == "tags" {
    for g in s.groups {
      if g.levels {
        block(above: gap(0.6), below: gap(0.6), {
          if g.label != "" { block(below: 0.6em, text(weight: "bold", g.label)) }
          levelled(g, across: if two { 1 } else { 3 }, style: level-style("bar"), on: accent, off: accent.lighten(75%))
        })
      } else {
        block(above: gap(0.5), below: gap(0.5))[
          #if g.label != "" { text(weight: "bold", g.label); if two { linebreak() } else [: ] }
          #g.items
        ]
      }
    }
  }
}

#if two {
  let main = cv.sections.filter(s => s.column == "main")
  let side = cv.sections.filter(s => s.column == "side")

  grid(
    columns: (1fr, 0.42fr),
    column-gutter: 1.4em,
    { for s in main { section(s, false) } },
    // Space at the start of a block is dropped, so the first heading's gap above it
    // would vanish: the inset gives the tinted panel its own room at the top.
    block(width: 100%, inset: (x: 1.1em, top: 1em, bottom: 1.1em), fill: tint, radius: 3pt, { for s in side { section(s, true) } }),
  )
} else {
  for s in cv.sections { section(s, false) }
}
