# Website Recommendations — Capturing the Tour-Operator Buyer

*Follow-up to `french-operator-research-log.md` · September 2026*

Each recommendation traces to a specific step in the persona research log
where the buyer searched, missed the site, and moved on. Ordered by
expected impact. File references are to the current codebase.

---

## 1. Make the French content indexable *(log steps 1–2 — highest impact)*

**Problem.** The site's French translation exists only as client-side
JavaScript: `js/i18n.js` swaps text from `i18n/fr.json` after page load,
keyed off `localStorage`. There are no French URLs, no `hreflang`
alternates, and search engines index the English text only. A French
buyer's query — *voyage scolaire scientifique États-Unis*, *séjour STEM
USA* — can never land on this site, even though the full translation
already exists and that search space is empty of competitors.

**Change.**
- Generate static French pages at build time under `/fr/…/` URLs, reusing
  the existing `i18n/fr.json` dictionaries. The site already has the
  pattern for this: a generator plugin (`_plugins/discovery_page_generator.rb`)
  stamps pages from data files — a sibling `i18n_page_generator.rb` can
  stamp translated variants of the i18n-enabled pages the same way, so
  translations stay in one place (the JSON dictionaries) with no
  duplicated copy.
- Add `<link rel="alternate" hreflang="fr" …>` (and the other nine
  languages when their pages exist) plus `hreflang="x-default"` in
  `_layouts/default.html`.
- Keep the JS switcher for in-page language changes; it and the static
  pages share the same dictionaries.

Start with French only — it's the language with a validated empty search
space; add other languages when a market case appears.

## 2. A French « Séjour scientifique aux USA » landing page *(steps 1–2)*

**Problem.** Even with indexable French, no current page answers the
query the French buyer actually types. Their vocabulary is *voyage
scolaire*, *séjour scientifique*, *lycéens* — not "STEM tour."

**Change.** One French-first page (e.g. `/fr/sejour-scientifique-usa/`)
written for the French planner, not translated from English marketing
copy:
- Title on the query: « Séjour scientifique aux États-Unis pour groupes
  scolaires — ateliers d'ingénierie livrés à l'hôtel ».
- The immersion angle: workshops run in English by real engineers — a
  hands-on *immersion linguistique* argument teachers can sell to parents.
- Signals that Stage One understands French school travel: works with
  operators and receptive agencies, familiar with the realities of
  itineraries, evening slots, chaperone ratios.
- CTA in French, and state clearly that inquiries in French are welcome.

## 3. Dedicated "Evening Activities" landing pages *(steps 7–8)*

**Problem.** The buyer's highest-intent queries — "evening activity for
student tour group hotel," "hands-on engineering workshop delivered to
student group hotel" — matched no dedicated page. The concept exists in
the copy, but only as sentences buried inside
`_data/discovery/group_types.yml` and `cities.yml`; no page's title, H1,
or URL commits to it.

**Change.** Add an `evening-activities` entry to
`_data/discovery/group_types.yml` — the generator produces
`/workshops/evening-activities/` with zero template work:
- `seo_title`: "Evening STEM Activities for Student Tour Groups —
  Delivered to Your Hotel | Stage One Education"
- Headline and intro built around the buyer's own words: the dead hotel
  evening, no transportation, instructor and equipment included, turns
  downtime into the highlight of the trip.
- Because discovery pages are i18n-enabled, this page is also the French
  « activité de soirée » page once #1 ships.

City pages (`cities.yml`) already mention evening sessions — link them to
this page so "evening activity Boston student group"-type queries have a
path too.

## 4. A "For Tour Operators & DMCs" partner page *(steps 9, 10, 12)*

**Problem.** The buyer concluded suppliers like Stage One "are reached
only through operator partnerships" and handed the search to a receptive
DMC. When that DMC (or a WorldStrides/EF program designer, or a French
operator) goes looking, there is no page speaking to them as a trade
partner — `educational-tours` speaks to them as a customer.

**Change.** A B2B page (`/workshops/tour-operators/`, same data-driven
route) that says what a trade buyer needs to hear:
- One contact, turn-key delivery, identical format across all 11 cities —
  multi-city programs stay consistent.
- Operator logistics answered up front: booking lead times, group-size
  scaling, insurance/COI documentation available, how coordination works
  with the operator rather than the school.
- Explicit welcome for international operators and receptive agencies,
  with the French page from #2 cross-linked.

## 5. Publish a sample itinerary *(step 5)*

**Problem.** The buyer's first English move was to study itineraries —
that's how this industry thinks. The site describes workshops but never
shows one sitting inside a real tour week.

**Change.** A "Sample Itineraries" page (EN + FR) with two or three
compact examples — e.g. the 9-day Boston→NYC→DC circuit from the research
log, a 5-day Boston program, an Orlando/KSC week — each showing the
workshop in its evening slot alongside the daytime anchors (MIT, Museum
of Science, Smithsonian). Link each city name to its existing
`/locations/…/` page. This is content operators can lift directly into
their own proposals, which is exactly why they'll link to and remember it.

## 6. Technical SEO baseline *(all steps — the site never ranked)*

**Problem.** The site has none of the basics that let the pages above
compete: no `sitemap.xml`, no `robots.txt`, no structured data, no
canonical/meta automation beyond hand-set fields. `_config.yml` is
12 lines with no plugins.

**Change.**
- Add `jekyll-sitemap` and a `robots.txt` pointing to it.
- Add `jekyll-seo-tag` (or extend `default.html`) for canonical, Open
  Graph, and Twitter tags site-wide.
- Add JSON-LD: `Service` + `provider` schema on workshop and discovery
  pages, `FAQPage` where pages carry Q&A-shaped copy.
- Submit the sitemap in Search Console and watch which of the new pages'
  queries actually draw impressions — that's the feedback loop for #2–#5.

## 7. Put the buyer's words in titles, not paragraphs *(steps 7–10)*

**Problem.** The four missed queries all contained phrases the site only
whispers: "delivered to your hotel," "evening activity," "instructor and
equipment included." They appear mid-paragraph in data files but almost
never in a `seo_title`, headline, or fact-card title where they carry
ranking and click weight.

**Change.** A copy pass over `_data/discovery/group_types.yml`,
`cities.yml`, and `workshops.yml`:
- `educational-tours` seo_title → mention evening/hotel delivery, e.g.
  "Engineering Workshops for Educational Tours — Evening Programs at Your
  Hotel."
- Promote "Delivered to Your Hotel" from body copy into fact-card titles
  and `cta_heading`s wherever the audience is a touring group.
- Keep the phrasing consistent so one vocabulary accumulates weight,
  rather than five synonyms splitting it.

## 8. Companion moves off the website *(step 12)*

Not website changes, but the research showed procurement runs through
directories the site can't reach organically; listing there is cheap and
targets exactly the intermediaries who get asked "who can fill our
evening?":
- Francophone USA DMC channels: receptifs.com, KAPYTO, Réceptif Voyages.
- French operator ecosystem: UNOSEL member outreach (SILC, CEI, Nacel,
  Verdié, La Ligue de l'enseignement, ECI).
- US trade: SYTA membership/directory; direct pitches to WorldStrides and
  EF program designers, who already package "robotics workshops led by
  MIT PhD graduates" and evening STEM.

---

## Suggested order

| Phase | Items | Rationale |
|---|---|---|
| Quick wins (days) | #6 sitemap/robots/meta, #7 copy pass, #3 evening page | Data-file and config changes only; the discovery generator does the rest |
| Core build (1–2 weeks) | #1 static French pages + hreflang, #2 French landing page | Unlocks the empty French search space; the translations already exist |
| Content (ongoing) | #4 operator/DMC page, #5 sample itineraries | B2B capture and link-worthy planning content |
| Off-site (parallel) | #8 directories and outreach | Reaches the intermediaries search can't |
