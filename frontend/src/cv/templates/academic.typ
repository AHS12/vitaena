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

// Sections whose entries are works to cite rather than places someone was.
#let is-references(title) = lower(title).contains(regex("publication|paper|article|book|chapter|talk|presentation|conference|poster|patent"))

#set document(title: if cv.name != "" { cv.name + " – CV" } else { "CV" }, author: cv.name)
#set text(font: (cv.design.font, "Inter"), size: cv.design.fontSize * 1pt, lang: "en", ligatures: false, fill: luma(25))
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
  } else if s.kind == "tags" {
    for g in s.groups {
      block(above: gap(0.45), below: gap(0.45), grid(
        columns: (margin-col, 1fr),
        column-gutter: 0.9em,
        text(size: 0.9em, fill: muted, g.label),
        g.items,
      ))
    }
  }
}
