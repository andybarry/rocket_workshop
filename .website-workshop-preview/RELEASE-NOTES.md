# Live Preview navigation fix

## Compiler import validation and smaller narrow tabs — released October 21, 2026

Release `studio-20261021T195723Z` is active for `/website-workshop/`.
The Website, Image and Voice tab icons are now 13px (previously 15px) when
Create is at or below the 260px icon-only breakpoint. The complete application
was published, including the compiler and generation validation changes below.
All 20 regression tests pass. All 34 release files passed live HTTP, SHA-256
and JavaScript MIME verification. A fresh live studio rendered its student
website without browser errors; resizing Create confirmed all three icons
measure 13 by 13 pixels. Existing panel and resize modules are unchanged.
Management, backend and student source files were not changed by deployment.
Previous release `studio-20261021T192731Z` remains available for rollback.
See `deployment/studio-20261021T195723Z/live-verification.json` and
`deployment/studio-20261021T195723Z/live-narrow-tab-icons.png`.

Reproduced Demo/B26's changing unexpected-identifier errors. Pages import data
using `../reefFishData`, but the old regex rewriter only recognized `./` paths.
The static imports survived inside async registry factories, invalidating the
entire generated script even when the affected pages were unused. Renaming the
import or replacing App.jsx therefore could not fix the underlying compiler.

The release application now uses `module-compiler.js`: Babel parses imports
and exports, resolves paths relative to each file (including parent folders,
index files and TS/TSX), preserves named/re-exported bindings, and validates
the final script before creating a preview. Router adapters and inspector
instrumentation are retained. No student project files were rewritten.

`generation-validation.js` validates complete candidate projects before they
are saved. Invalid AI responses get at most two repair attempts with the actual
compiler diagnostic. Failed or cancelled generations preserve current files;
successful updates are committed together with a single undo checkpoint.
Concurrent edits to a touched file and node switches prevent stale application.
This is compile validation, not a guarantee of all future runtime behavior.

Validation: 20 passing tests, including the production chat application flow,
local imports/re-exports, cancellation, bounded repairs, and prior panel and
preview-navigation regressions. An isolated browser rendered the unchanged
Demo/B26 snapshot and verified fish selection, nested page navigation, hook
state and retaining a working preview after invalid code. The actual local
studio loaded without errors. No paid generation requests were used in tests.
See `tests/module-compiler.test.mjs` and `tests/demo-B26-compiler-fixed.png`.
Diagnostics/fixtures are outside the release app directories and must not be
published. These application changes are included in `studio-20261021T195723Z`.

## Narrow Create layout release — October 21, 2026

Release `studio-20261021T192731Z` is active for `/website-workshop/`.
Only `website-workshop/local-overrides.css` differs from the previous release.
Create now resizes down to 180px while retaining its original starting width.
At narrow widths, Website/Image/Voice tabs display icons with accessible text
labels; labels reappear when widened. Summary and suggestion text scales to fit,
and the Website heading always remains on one line. Media selectors stay inside
their cards. Go uses clearer typography and sits above the single-row input icons.

Local browser checks covered both resize edges, the 180px minimum, all three
tabs, keyboard tab navigation, widening to restore labels, text containment,
and refresh restoring the initial width. The complete application was packaged;
the existing drag, resize, editor, drawing and preview scripts are unchanged.
All 32 application files passed live HTTP status, SHA-256 and JavaScript MIME
checks. Management, backend and student files were unchanged. The previous
release `studio-20261021T190214Z` remains available for rollback. Reload tabs.
See `deployment/studio-20261021T192731Z/live-verification.json`.

## Single-row Website input release — October 21, 2026

Release `studio-20261021T190214Z` is active for `/website-workshop/`.
Only `website-workshop/local-overrides.css` differs from the preceding release.
At narrow Create widths, all six input icons stay on one row. The input remains
visible while the chat and suggestions scroll above it. Local browser checks
covered a 230px-wide, 360px-tall card and the normal app at minimum and wider sizes.

The complete application was packaged, preserving the existing drag, resize,
editor, drawing and preview modules byte for byte. All 32 application files
passed live HTTP status, SHA-256 and JavaScript MIME verification. Management,
backend and student files were unchanged. The previous workshop release
`studio-20261021T185316Z` remains available for rollback. Reload existing tabs.
See `deployment/studio-20261021T190214Z/live-verification.json`.

## Complete Create UI release — October 21, 2026

Release `studio-20261021T185316Z` is active for `/website-workshop/`.
The full workshop directory was published, including the panel layout/order,
resize, editor split, drawing/phone, prompt image, and preview safety modules.
The application bundle is `assets/index-e18a7712c7de11b5.js`.

This release includes the wider initial Create card; integrated Website, Image,
and Voice tabs with icons and updated colors/spacing; compact Things to try;
the three summary illustrations and solid background colors; compact summary
headings after a valid submission; gray input icons with blue active/hover
states; and full-height resize areas above and below the existing edge tabs.

Live verification found that Monaco's scrollbar could cover the extended Code
resize area. The resize buttons now sit above that layer. Live Preview also
ignores pointer input only during an active edge resize, so crossing the iframe
does not interrupt the gesture. Normal preview input resumes when resizing ends.

All 32 application files passed HTTP status, SHA-256 and executable-script MIME
checks. Seven panel-order and preview-navigation regression tests passed. The
submission handlers were separately tested with local simulated AI responses
for all three Go buttons, Enter, empty prompts, and tab-switch persistence.
Live browser checks confirmed Create resizing above/below its tabs, actual card
dragging to the last slot and back, correct outer-edge visibility, expanded Code
resizing from 582px to 542px and back, collapsed Code with no resize tabs, loaded
Image/Voice illustrations and solid backgrounds. Test order and widths were restored.

See `deployment/studio-20261021T185316Z/live-verification.json` and
`deployment/live-complete-release-20261021.png`. Management files are unchanged
and also match their live hashes; no backend or student files were edited.
The preceding full release `studio-20261021T184731Z` and earlier
`studio-20261021T173017Z` remain available on the server. Existing browser tabs
need a reload. Do not deploy the parent directory's fixtures or screenshots.

## Panel controls production fix — October 21, 2026

Release `studio-20261021T173017Z` is active for `/website-workshop/`.
The prior deployment included every panel file, but nginx served
`panel-order.mjs` as `application/octet-stream`. Browsers rejected the module,
so `panel-layout.js` never initialized the panel IDs that resizing also needs.
The earlier byte/checksum verification did not catch this browser failure.

The module is now `panel-order.js`, and `panel-layout.js` imports that filename.
Deployment verification now requires a JavaScript MIME type for every JS module,
as well as HTTP 200 and matching SHA-256 bytes. All 29 files pass. Seven panel and
preview regression tests also pass.

Actual browser tests on the live studio confirmed:
- Four drag headings and the appropriate card edge tabs initialize.
- Create resizes from 179px to 229px and returns to its starting width.
- Dragging Create to the last position moves the entire card, updates the other
  cards and outer-edge tabs, and preserves the preview iframe instance.
- Expanded Code resizes from 479px to 439px and back; its handles disappear when
  collapsed, and Learn has no handles.
- The original panel order and widths were restored after verification.

Only the workshop frontend symlink changed; management, the API and student
files were untouched. The previous release remains at
`/home/abarry/musicgen/frontend-releases/studio-20261020T192919Z` for rollback.
Existing browser tabs need a page reload to load the repaired modules.

## Original navigation fix

The fragment link `href="#studio"` previously resolved against the containing
workshop URL and loaded another studio inside the `srcdoc` preview.

The application now scrolls fragment links within the student document, while
respecting custom click handlers and development-mode inspection. A bootstrap
guard stops the studio bundle from mounting in a managed preview frame.
The parent restores the last compiled student document after accidental
navigation. An automatic redirect loop is limited to one recovery until a real
user interaction or Refresh; repeated automatic redirects use the existing
preview error area.

## Release contents

Publish the complete `website-workshop/` application directory, including its
updated `index.html`, `assets/index-fkdtBi_i.js`, and the new
`studio-bootstrap.js`, `preview-navigation.js`, and `preview-safety.js`.
Do not deploy just the JavaScript bundle: the bootstrap guard must be the
entry point. Serve these files from the same `/website-workshop/` path and
invalidate cached HTML and changed JavaScript together.

The protection does not depend on localhost or a particular hostname. It does
not require a backend endpoint or a student data migration. Do not publish the
parent directory's test fixtures, screenshots, or Vite files.

## Production deployment — October 20, 2026

Release `studio-20261020T192919Z` is live at:

- https://ai.stageoneeducation.com/website-workshop/
- https://ai.stageoneeducation.com/manage-servers/

The release includes all local workshop UI, editor, drawing, phone sketch,
image-prompt and preview-navigation changes, plus the management OpenAI key
table update removing the DALL-E columns and warning. Existing API settings
and backend code were not changed.

The release was packaged from the two local application directories. Modified
bundles received new content-based filenames to avoid immutable browser caches.
All 29 published application files returned HTTP 200 and matched the package's
SHA-256 checksums; see `deployment/studio-20261020T192919Z/live-verification.json`.
Browser checks passed for student sign-in, the studio panels and drawing popup,
expanded code development mode, the preview guard markers, and the management
table's four columns. Seven automated regression tests passed before release.

Server release directory:
`/home/abarry/musicgen/frontend-releases/studio-20261020T192919Z`.
The `build/website-workshop`, `build/manage-servers` and `build/manage_servers`
symlinks now select this release. Older immutable assets were retained for open
tabs. No service restart was needed.

Previous frontends and student sessions are backed up under
`/home/abarry/musicgen/backups/frontend-releases/studio-20261020T192919Z`.
Original frontend folders were also retained. Rollback on the server:

```sh
python3 /home/abarry/publish-static.py rollback studio-20261020T192919Z
```

The edited frontend files in this workspace remain the source for this release.
The separate `music-gen` source checkout has not received these frontend edits;
rebuilding its older frontend sources would omit them. Preserve or port these changes
before using that checkout's general `update_site` script for a future release.

## Backend follow-up — removing existing workshop IDs with spaces

On October 20, 2026, `api/musicgen.py` was separately updated in the local
`music-gen` source checkout and on the live server. The `secure_filename` naming
restriction now applies only to `add` in `manage_website_workshops`, so existing
IDs such as `New Haven AM July 27` and `New Haven PM July 27` can be removed by
their exact name. Authentication and path validation remain in place.

Four isolated regression tests reproduce the old failure and pass with the fix.
Tests are in `music-gen/api/test_workshop_removal.py` and this workspace's
`deployment/test_workshop_removal.py`. The source SHA-256 is
`efc8bf4aebff0f8d5ffb86b982a16422f87c89f9a50b368d75c036e18f1dfc8d`.
Gunicorn workers were gracefully reloaded and all three are healthy. Authenticated
list requests succeed through both localhost and the production URL. No active
workshops were removed during verification, and student files were not changed.
The previous API file is retained beside it as
`musicgen.py.before-workshop-removal-7de8b4fd89fd`.

## Verification

Run from the repository root:

```powershell
node --test .website-workshop-preview/preview-navigation.test.mjs
node .website-workshop-preview/prepare-preview-regression.mjs
```

With the local server running, open `/tests/preview-regression.html` and choose
**Run regression checks**. It uses a generated copy of the actual compiler with
the studio mount removed, so it cannot load or autosave a student session.
The fixture uses the same iframe sandbox as Live Preview.

Checks cover repeated and encoded fragment links, empty/missing/malformed
targets, preserved click handlers/input, inspection, forced studio navigation,
and recovery-loop prevention. Also verify keyboard Enter, repeated genuine
redirect-button clicks, normal multi-page navigation, inspector Escape, and
Refresh in the studio.
