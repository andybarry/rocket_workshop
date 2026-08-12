/*
 * Clipping detector (not shipped with the site).
 *
 * Paste-able body for Runtime.evaluate. Cycles the page through every
 * language without reloading and reports elements whose translated text is
 * cut off, plus any language that makes the document scroll sideways.
 *
 * An element counts as clipped when its content is larger than its box and
 * the box (or an ancestor) hides the overflow, so the extra text is
 * genuinely invisible rather than merely wrapped onto another line.
 */
(function () {
    var LANGS = ['en', 'es', 'pt-BR', 'zh-Hans', 'zh-Hant', 'ja', 'ko', 'fr', 'de', 'it'];
    var SLACK = 2;

    function describe(el) {
        var id = el.tagName.toLowerCase();
        if (el.id) id += '#' + el.id;
        if (el.className && typeof el.className === 'string') {
            id += '.' + el.className.trim().split(/\s+/).slice(0, 3).join('.');
        }
        var key = el.getAttribute('data-i18n') || el.getAttribute('data-i18n-html') || '';
        return id + (key ? ' [' + key + ']' : '');
    }

    function hides(style, axis) {
        var value = axis === 'x' ? style.overflowX : style.overflowY;
        return value === 'hidden' || value === 'clip';
    }

    function scan() {
        var issues = [];
        var nodes = document.querySelectorAll('[data-i18n], [data-i18n-html]');
        for (var i = 0; i < nodes.length; i++) {
            var el = nodes[i];
            if (!el.offsetParent && el.offsetHeight === 0) continue;
            /* Bootstrap's screen-reader text is a deliberately clipped 1px
               box, so it always looks like an overflow and never is one. */
            if (el.closest('.sr-only')) continue;
            var style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden') continue;

            if (el.scrollHeight > el.clientHeight + SLACK && hides(style, 'y')) {
                issues.push({
                    where: describe(el),
                    kind: 'text taller than its box',
                    detail: el.scrollHeight + 'px content in ' + el.clientHeight + 'px box'
                });
            }
            if (el.scrollWidth > el.clientWidth + SLACK && hides(style, 'x')) {
                issues.push({
                    where: describe(el),
                    kind: 'text wider than its box',
                    detail: el.scrollWidth + 'px content in ' + el.clientWidth + 'px box'
                });
            }

            /* Text can also spill past a fixed-height ancestor that hides the
               overflow, which the element's own metrics cannot reveal. */
            var rect = el.getBoundingClientRect();
            var parent = el.parentElement;
            while (parent && parent !== document.body) {
                var pStyle = window.getComputedStyle(parent);
                if (hides(pStyle, 'y') || hides(pStyle, 'x')) {
                    var pRect = parent.getBoundingClientRect();
                    if (rect.bottom > pRect.bottom + SLACK || rect.right > pRect.right + SLACK ||
                        rect.top < pRect.top - SLACK || rect.left < pRect.left - SLACK) {
                        issues.push({
                            where: describe(el),
                            kind: 'spills past clipped ancestor ' + describe(parent),
                            detail: 'overflow ' +
                                Math.round(Math.max(0, rect.bottom - pRect.bottom)) + 'px bottom, ' +
                                Math.round(Math.max(0, rect.right - pRect.right)) + 'px right'
                        });
                    }
                    break;
                }
                parent = parent.parentElement;
            }
        }

        /* The desktop bar is a single row by design. Longer labels can push it
           onto a second row, which no clipping check would notice. */
        var bar = document.querySelector('.navbar-nav');
        if (bar && window.getComputedStyle(bar).float !== 'none') {
            /* Items sit a pixel or two apart because of their own borders, so
               group the tops into rows instead of counting exact values. */
            var tops = [];
            var items = bar.children;
            for (var j = 0; j < items.length; j++) {
                if (window.getComputedStyle(items[j]).display === 'none') continue;
                tops.push(items[j].getBoundingClientRect().top);
            }
            tops.sort(function (a, b) { return a - b; });
            var rowCount = tops.length ? 1 : 0;
            for (var k = 1; k < tops.length; k++) {
                if (tops[k] - tops[k - 1] > 8) rowCount++;
            }
            if (rowCount > 1) {
                issues.push({
                    where: 'nav .navbar-nav',
                    kind: 'nav bar wraps onto more than one row',
                    detail: rowCount + ' rows'
                });
            }
            var barRect = bar.getBoundingClientRect();
            if (barRect.left < 0) {
                issues.push({
                    where: 'nav .navbar-nav',
                    kind: 'nav bar runs past the left edge',
                    detail: Math.round(-barRect.left) + 'px off-screen'
                });
            }
        }

        var sideways = document.documentElement.scrollWidth - window.innerWidth;
        if (sideways > SLACK) {
            issues.push({
                where: 'document',
                kind: 'page scrolls sideways',
                detail: sideways + 'px wider than the viewport'
            });
        }
        return issues;
    }

    /* The header is fixed and the page clears it with a top margin. What
       matters is not the absolute overlap, which some pages already have by
       design, but whether a translation makes it worse than English. */
    function coveredHeight() {
        var header = document.getElementById('mainNav');
        if (!header || window.getComputedStyle(header).position !== 'fixed') return 0;
        var clearance = parseFloat(window.getComputedStyle(document.body).marginTop) || 0;
        return header.getBoundingClientRect().height - clearance;
    }

    function settle() {
        return document.fonts && document.fonts.ready
            ? document.fonts.ready.then(function () {
                return new Promise(function (r) { setTimeout(r, 250); });
            })
            : new Promise(function (r) { setTimeout(r, 400); });
    }

    function useLanguage(lang) {
        if (!window.SOI18n || window.SOI18n.lang === lang) return settle();
        window.SOI18n.set(lang);
        return new Promise(function (resolve) {
            var tries = 0;
            (function poll() {
                if (window.SOI18n.lang === lang || tries++ > 60) return resolve();
                setTimeout(poll, 100);
            })();
        }).then(settle);
    }

    var report = {};
    var covered = {};
    return LANGS.reduce(function (chain, lang) {
        return chain.then(function () {
            return useLanguage(lang).then(function () {
                var issues = scan();
                covered[lang] = coveredHeight();
                if (lang !== 'en' && covered[lang] > covered.en + SLACK) {
                    issues.push({
                        where: 'header #mainNav',
                        kind: 'fixed header covers more of the page than in English',
                        detail: Math.round(covered[lang] - covered.en) + 'px more'
                    });
                }
                if (issues.length) report[lang] = issues;
            });
        });
    }, Promise.resolve()).then(function () {
        return useLanguage('en');
    }).then(function () {
        return JSON.stringify({
            page: location.pathname,
            width: window.innerWidth,
            report: report
        });
    });
})()
