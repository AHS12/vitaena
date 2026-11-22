// Professional: a big name, the role in the accent colour, contact details with small
// icons, and an optional round photo; below, the story on the left and skills, languages,
// projects and the like in a narrower column on the right.
//
// For ATS: every word is real text and the icons sit beside it, never instead of it. The
// right column is written after the left, so text comes out with the main story first.
// With ATS mode on it is one column, with the dates written after each place.

#import "/parts.typ": closing

#let cv = json("/cv.json")
#let accent = rgb(cv.design.accent)
#let ink = rgb("#1b2333")
#let muted = luma(95)
#let rule = luma(222)
#let gap(n) = n * cv.design.spacing * 1em
#let two = not cv.design.atsMode and cv.sections.any(s => s.column == "side")

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

// Small line icons, drawn for this template.
#let icon-svg(body) = "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='#555b66' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'>" + body + "</svg>"
#let ICONS = (
  phone: icon-svg("<path d='M5 3h4l2 5-2.5 1.6a11 11 0 0 0 5.9 5.9L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z'/>"),
  email: icon-svg("<rect x='3' y='5' width='18' height='14' rx='2'/><path d='M3 7l9 6 9-6'/>"),
  location: icon-svg("<path d='M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z'/><circle cx='12' cy='9.5' r='2.5'/>"),
  linkedin: icon-svg("<rect x='3' y='3' width='18' height='18' rx='3'/><path d='M8 11v6M8 7.5v.01M12 17v-6M12 14a3 3 0 0 1 6 0v3'/>"),
  github: icon-svg("<path d='M8 7l-5 5 5 5M16 7l5 5-5 5'/>"),
  web: icon-svg("<circle cx='12' cy='12' r='9'/><ellipse cx='12' cy='12' rx='4' ry='9'/><path d='M3 12h18'/>"),
)
#let icon(kind) = box(baseline: 0.17em, image(bytes(ICONS.at(kind, default: ICONS.web)), format: "svg", height: 0.95em))

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: cv.design.fonts, size: cv.design.fontSize * 1pt, lang: cv.design.lang, ligatures: false, fill: luma(40))

// Right to left, for Urdu: Typst flips grids and start and end by the language,
// Nastaliq's tall letters get taller line boxes, the same for Latin text so lines beside
// each other stay level, and its joined letters keep the ligatures Latin text goes without.
#set text(top-edge: 0.85em, bottom-edge: -0.35em, ligatures: true) if cv.design.rtl
#set par(leading: 0.55em, spacing: gap(0.7), justify: false)
// Chinese characters and kana are dense, and read better with more room between lines.
#set par(leading: 0.85em) if cv.design.cjk
#set list(marker: text(fill: luma(110))[•], indent: 0.1em, body-indent: 0.5em, spacing: gap(0.45))
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

// The header: name, role and contact, with the photo on the right when there is one.
#let contact-line = {
  set text(size: 0.9em, fill: luma(60))
  cv.contact
    .map(c => box({
      icon(c.kind)
      h(0.35em)
      if c.url != "" and c.kind != "phone" { link(c.url, text(fill: accent, c.text)) } else { c.text }
    }))
    .join([#h(1.1em) ])
}

#let header-text = {
  if cv.name != "" {
    text(size: 2.5em, weight: "bold", fill: ink, cv.name)
    linebreak()
  }
  if cv.headline != "" {
    v(gap(0.15))
    text(size: 1.15em, weight: "bold", fill: accent, upper(cv.headline))
    linebreak()
  }
  if cv.contact.len() > 0 {
    v(gap(0.55))
    contact-line
  }
}

#if cv.photo != "" {
  grid(
    columns: (1fr, auto),
    column-gutter: 1.2em,
    align: (start + horizon, end + horizon),
    header-text,
    box(width: 2.5cm, height: 2.5cm, radius: 50%, clip: true, image(cv.photo, width: 2.5cm, height: 2.5cm, fit: "cover")),
  )
} else {
  header-text
}

#v(gap(0.6))
#line(length: 100%, stroke: 0.6pt + rule)

// Headings: ruled in the main column, plain in the side column.
#let heading-main(title) = block(above: gap(1.3), below: gap(0.6), sticky: true, {
  text(size: 1.12em, weight: "bold", fill: ink, upper(title))
  v(-0.5em)
  line(length: 100%, stroke: 1.1pt + ink.lighten(25%))
})
#let heading-side(title) = block(above: gap(1.3), below: gap(0.55), sticky: true, text(size: 1.12em, weight: "bold", fill: ink, upper(title)))

#let entry-main(e) = {
  let place = (e.location, if two { "" } else { e.dates }).filter(x => x != "")
  // The lines under the role: the place it was, and where, each on a line of its own.
  let below = ()
  if e.org != "" { below.push(text(weight: "bold", fill: accent, e.org)) }
  if place.len() > 0 { below.push(text(size: 0.9em, fill: muted, place.join("  |  "))) }

  block(sticky: true, above: gap(0.95), below: gap(0.35), {
    if two and e.dates != "" {
      // Beside the role, as in a printed CV; ATS mode writes them after the place instead.
      // A long role wraps in its own column rather than running into the dates.
      grid(
        columns: (1fr, auto),
        column-gutter: 1em,
        text(size: 1.05em, weight: "bold", fill: ink, e.title),
        align(end, text(size: 0.9em, fill: muted, e.dates)),
      )
      v(0.65em, weak: true)
      below.join(linebreak())
    } else {
      (text(size: 1.05em, weight: "bold", fill: ink, e.title), ..below).join(linebreak())
    }
  })
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}

#let entry-side(e) = {
  block(sticky: true, above: gap(0.8), below: gap(0.25), {
    text(weight: "bold", fill: ink, e.title)
    if e.org != "" {
      linebreak()
      text(size: 0.92em, fill: accent, e.org)
    }
    let place = (e.location, e.dates).filter(x => x != "")
    if place.len() > 0 {
      linebreak()
      text(size: 0.85em, fill: muted, place.join("  |  "))
    }
  })
  set text(size: 0.92em)
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(b => rich(b))) }
}

#let tags-side(s) = {
  for g in s.groups {
    if g.label != "" {
      block(above: gap(0.6), below: gap(0.35), text(weight: "bold", fill: ink, g.label))
    }
    if g.levels {
      // Languages and the like: the name, how well, and five dots.
      for item in g.list {
        block(above: gap(0.45), below: gap(0.3), {
          text(weight: "bold", fill: ink, item.name)
          h(1fr)
          text(size: 0.88em, fill: muted, item.note)
          linebreak()
          level-mark(item.level, level-style("dots"), accent, luma(228))
        })
      }
    } else {
      block(above: gap(0.35), below: gap(0.35), {
        set text(size: 0.9em)
        g.list
          .map(item => box(stroke: 0.6pt + luma(205), inset: (x: 0.5em, y: 0.32em), radius: 2pt, if item.note != "" [#item.name (#item.note)] else [#item.name]))
          .join([#h(0.2em) ])
      })
    }
  }
}

#let tags-main(s) = {
  for g in s.groups {
    if g.levels {
      block(above: gap(0.6), below: gap(0.6), {
        if g.label != "" { block(below: 0.6em, text(weight: "bold", fill: ink, g.label)) }
        levelled(g, on: accent, style: level-style("dots"))
      })
      continue
    }
    block(above: gap(0.45), below: gap(0.45))[
      #if g.label != "" { text(weight: "bold", fill: ink, g.label); [: ] }
      #g.items
    ]
  }
}

#let section(s, side) = {
  if side { heading-side(s.title) } else { heading-main(s.title) }
  if s.kind == "text" {
    for p in s.paragraphs { par(justify: not side, rich(p)) }
  } else if s.kind == "entries" {
    for e in s.entries { if side { entry-side(e) } else { entry-main(e) } }
  } else if s.kind == "details" {
    for r in s.rows {
      block(above: gap(0.55), below: gap(0.55))[
        #if r.label != "" { text(weight: "bold", fill: ink, r.label); if side { linebreak() } else [: ] }
        #r.value
      ]
    }
  } else if s.kind == "tags" {
    if side { tags-side(s) } else { tags-main(s) }
  }
}

#if two {
  grid(
    columns: (1.68fr, 1fr),
    stroke: (x, y) => if x == 0 { if cv.design.rtl { (left: 0.6pt + rule) } else { (right: 0.6pt + rule) } },
    inset: (x, y) => if (x == 0) != cv.design.rtl { (right: 1.4em) } else { (left: 1.4em) },
    { for s in cv.sections.filter(s => s.column == "main") { section(s, false) }; closing(cv) },
    { for s in cv.sections.filter(s => s.column == "side") { section(s, true) } },
  )
} else {
  for s in cv.sections { section(s, false) }
  closing(cv)
}
