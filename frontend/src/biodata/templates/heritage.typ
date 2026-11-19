// Heritage: the traditional biodata. A double border with corner ornaments, a centred
// heading line and name, the photo at the top right, details in aligned columns with
// a colon between label and value, and the family in a ruled table.
//
// Reads the render model from /biodata.json. Every ornament is drawn from shapes, so
// nothing depends on a font having a particular symbol.

#let b = json("/biodata.json")
#let accent = rgb(b.design.accent)
#let muted = luma(90)
#let tint = accent.lighten(90%)
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

// A small diamond, the one ornament everything here is made of.
#let diamond(size, fill: accent) = box(width: size * 1.42, height: size * 1.42, align(center + horizon, rotate(45deg, square(size: size, fill: fill))))

// Each corner: a diamond where the borders turn, and a smaller one a little way along
// each side, so the corners read as decorated rather than just joined. `p` is how far
// the corner is from the page's edges.
#let corner(h, v, p) = {
  let sx = if h == left { 1 } else { -1 }
  let sy = if v == top { 1 } else { -1 }
  // Centres a diamond x across and y down from the page's corner.
  let at(x, y, size) = {
    let half = size * 0.71
    place(h + v, dx: sx * (x - half), dy: sy * (y - half), diamond(size))
  }
  at(p, p, 7pt)
  at(p + 13pt, p, 3pt)
  at(p, p + 13pt, 3pt)
}

#let border = if b.design.border {
  let outer = b.design.margin * 0.42cm
  let inner = outer + 4pt
  place(top + left, dx: outer, dy: outer, rect(width: 100% - 2 * outer, height: 100% - 2 * outer, stroke: 1.4pt + accent))
  place(top + left, dx: inner, dy: inner, rect(width: 100% - 2 * inner, height: 100% - 2 * inner, stroke: 0.5pt + accent))
  for (h, v) in ((left, top), (right, top), (left, bottom), (right, bottom)) { corner(h, v, outer + 2pt) }
}

// A heading, label or relation with its second label, in another language, under it or
// after it, smaller. Without one, just the first.
#let under(first, second) = if second == "" { first } else { stack(dir: ttb, spacing: 0.25em, first, text(size: 0.82em, second)) }
#let after(first, second) = if second == "" { first } else [#first#h(0.5em)#text(size: 0.8em, weight: "regular")[#second]]

#set document(title: if b.name != "" { b.name + " – Biodata" } else { "Biodata" }, author: b.name)
// Spacing letters out breaks the line that joins Bangla letters, so only Latin text gets it.
#set text(font: b.design.fonts, size: b.design.fontSize * 1pt, lang: b.design.lang, ligatures: false, fill: luma(20))

// Right to left, for Urdu: Typst flips grids and start and end by the language,
// Nastaliq's tall letters get taller line boxes, the same for Latin text so lines beside
// each other stay level, and its joined letters keep the ligatures Latin text goes without.
#set text(top-edge: 0.85em, bottom-edge: -0.35em, ligatures: true) if b.design.rtl
#set par(leading: 0.6em, spacing: gap(0.7), justify: false)
#set list(marker: [•], indent: 0.2em, body-indent: 0.6em, spacing: gap(0.45))
#set page(
  paper: b.design.paper,
  // Said outright: the preview's SVG leaves an unfilled page see-through.
  fill: white,
  // A little more room than the margin asks, so the text stays clear of the border.
  margin: b.design.margin * 1cm + (if b.design.border { 0.25cm } else { 0cm }),
  background: border,
  footer: context {
    let total = counter(page).final().first()
    if total > 1 {
      set text(size: 0.8em, fill: muted)
      align(center, counter(page).display("1 / 1", both: true))
    }
  },
)

// A heading centred between two rules, with a diamond at each inner end.
#show heading.where(level: 2): it => block(above: gap(1.3), below: gap(0.75), sticky: true, grid(
  columns: (1fr, auto, auto, auto, 1fr),
  column-gutter: 0.5em,
  align: horizon,
  line(length: 100%, stroke: 0.5pt + accent),
  diamond(3.5pt),
  text(size: 1.1em, weight: "bold", fill: accent, tracking: if b.design.latin { 0.04em } else { 0em }, upper(it.body)),
  diamond(3.5pt),
  line(length: 100%, stroke: 0.5pt + accent),
))

// The top: the heading line and its picture and the name, centred, with the photo
// level with them on the right and an empty column of the same width on the left, so
// the centre stays the page's centre.
#let side = 3.2cm
#let middle = {
  set align(center)
  if b.headingImage != "" { image(b.headingImage, height: 1.2cm) }
  if b.heading != "" { block(above: 0.4em, below: 0.9em, text(fill: accent, style: "italic", b.heading)) }
  if b.name != "" {
    text(size: 2.1em, weight: "bold", fill: accent, tracking: if b.name.contains(regex("[^\\p{Latin}\\p{Common}\\p{Inherited}]")) { 0em } else { 0.02em })[#b.name]
    v(0.1em)
    grid(columns: (1.6cm, auto, 1.6cm), column-gutter: 0.4em, align: horizon, line(length: 100%, stroke: 0.5pt + accent), diamond(4pt), line(length: 100%, stroke: 0.5pt + accent))
  }
}

#if b.photo != "" {
  grid(columns: (side, 1fr, side), column-gutter: 0.8em, align: (start, center + horizon, end + top), [], middle,
    box(width: side, height: side, stroke: 1pt + accent, inset: 2pt, box(width: 100%, height: 100%, clip: true, image(b.photo, width: 100%, height: 100%, fit: "cover"))))
} else {
  middle
}

#let details(rows) = grid(
  columns: (36%, auto, 1fr),
  column-gutter: 0.7em,
  row-gutter: gap(0.6),
  ..rows.map(r => (text(fill: muted, under(r.label, r.second)), if r.label != "" { text(fill: muted, ":") } else { [] }, r.value)).flatten(),
)

#let family(members) = table(
  columns: (auto, 1fr, 1fr, auto),
  stroke: 0.5pt + accent.lighten(50%),
  inset: (x: 0.6em, y: gap(0.45)),
  fill: (x, y) => if y == 0 { tint },
  table.header(..(b.words.relation, b.words.name, b.words.work, b.words.note).map(h => text(weight: "bold", fill: accent, h))),
  ..members.map(m => (strong(under(m.relation, m.second)), m.name, m.work, text(fill: muted, m.note))).flatten(),
)

#let entry(e) = block(above: gap(0.8), below: gap(0.4), breakable: false, {
  let head = (e.title, e.org).filter(x => x != "")
  strong(head.join([, ]))
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
