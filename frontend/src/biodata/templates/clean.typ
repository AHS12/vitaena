// Clean: one column, a thin accent rule under each heading, and the photo beside the
// name. The plainest biodata, for those who want no ornament.
//
// Reads the render model from /biodata.json. Details are two aligned columns of label
// and value, and the family a table, so each reads across at a glance.

#let b = json("/biodata.json")
#let accent = rgb(b.design.accent)
#let muted = luma(95)
// Every gap scales with the chosen spacing.
#let gap(n) = n * b.design.spacing * 1em

// Text arrives as spans of plain words with bold, italic or a link set on them, so
// nothing anyone types is ever read as Typst markup.
#let rich(spans) = spans.map(s => {
  let body = [#s.text]
  if s.at("bold", default: false) { body = strong(body) }
  if s.at("italic", default: false) { body = emph(body) }
  if s.at("url", default: "") != "" { body = link(s.url, body) }
  body
}).join()

// A heading, label or relation with its second label, in another language, under it or
// after it, smaller. Without one, just the first.
#let under(first, second) = if second == "" { first } else { stack(dir: ttb, spacing: 0.25em, first, text(size: 0.82em, second)) }
#let after(first, second) = if second == "" { first } else [#first#h(0.5em)#text(size: 0.8em, weight: "regular")[#second]]

#set document(title: if b.name != "" { b.name + " – Biodata" } else { "Biodata" }, author: b.name)
#set text(font: b.design.fonts, size: b.design.fontSize * 1pt, lang: b.design.lang, ligatures: false, fill: luma(20))

// Right to left, for Urdu: Typst flips grids and start and end by the language,
// Nastaliq's tall letters get taller line boxes, the same for Latin text so lines beside
// each other stay level, and its joined letters keep the ligatures Latin text goes without.
#set text(top-edge: 0.85em, bottom-edge: -0.35em, ligatures: true) if b.design.rtl
#set par(leading: 0.6em, spacing: gap(0.7), justify: false)
// Chinese characters and kana are dense, and read better with more room between lines.
#set par(leading: 0.85em) if b.design.cjk
#set list(marker: [•], indent: 0.2em, body-indent: 0.6em, spacing: gap(0.45))
#set page(
  paper: b.design.paper,
  // Said outright: the preview's SVG leaves an unfilled page see-through.
  fill: white,
  margin: b.design.margin * 1cm,
  // The border sits halfway between the page's edge and its text.
  background: if b.design.border {
    let inset = b.design.margin * 0.5cm
    place(top + left, dx: inset, dy: inset, rect(width: 100% - 2 * inset, height: 100% - 2 * inset, stroke: 0.8pt + accent))
  },
  footer: context {
    let total = counter(page).final().first()
    if total > 1 {
      set text(size: 0.8em, fill: muted)
      align(center, counter(page).display("1 / 1", both: true))
    }
  },
)

#show heading.where(level: 2): it => {
  set text(size: 1.1em, weight: "bold", fill: accent)
  block(above: gap(1.3), below: gap(0.7), sticky: true)[
    #it.body
    #v(-0.5em)
    #line(length: 100%, stroke: 0.5pt + accent)
  ]
}

// The heading line and its picture, centred above everything, when there are any.
#if b.headingImage != "" or b.heading != "" {
  align(center, {
    if b.headingImage != "" { image(b.headingImage, height: 1.3cm) }
    if b.heading != "" { block(above: 0.4em, text(fill: accent, b.heading)) }
  })
  v(gap(0.6))
}

#let name-block = if b.name != "" {
  text(size: 2.2em, weight: "bold", fill: accent)[#b.name]
}

#if b.photo != "" {
  grid(columns: (1fr, auto), column-gutter: 1.2em, align: (start + horizon, end + top), name-block,
    box(width: 3.4cm, height: 3.4cm, radius: 4pt, clip: true, image(b.photo, width: 3.4cm, height: 3.4cm, fit: "cover")))
} else {
  name-block
}

#let details(rows) = grid(
  columns: (36%, 1fr),
  column-gutter: 1em,
  row-gutter: gap(0.55),
  ..rows.map(r => (text(fill: muted, under(r.label, r.second)), r.value)).flatten(),
)

#let family(members) = table(
  columns: (auto, 1fr, 1fr, auto),
  stroke: (x, y) => if y > 0 { (top: 0.4pt + luma(220)) },
  // Room between columns as padding, not a gutter, so each row's line runs unbroken.
  inset: (x, y) => if b.design.rtl { (right: 0pt, left: if x < 3 { 1em } else { 0pt }, y: gap(0.45)) } else { (left: 0pt, right: if x < 3 { 1em } else { 0pt }, y: gap(0.45)) },
  ..members.map(m => (strong(under(m.relation, m.second)), m.name, m.work, text(fill: muted, m.note))).flatten(),
)

#let entry(e) = block(above: gap(0.8), below: gap(0.4), breakable: false, {
  let head = (e.title, e.org).filter(x => x != "")
  strong(head.join(b.words.comma))
  let meta = (e.location, e.dates).filter(x => x != "")
  if meta.len() > 0 {
    linebreak()
    text(size: 0.92em, fill: muted, meta.join("  |  "))
  }
  if e.summary.len() > 0 { par(rich(e.summary)) }
  if e.bullets.len() > 0 { list(..e.bullets.map(x => rich(x))) }
})

#for s in b.sections {
  heading(level: 2, after(s.title, s.second))
  if s.kind == "details" {
    details(s.rows)
  } else if s.kind == "family" {
    family(s.members)
  } else if s.kind == "text" {
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
