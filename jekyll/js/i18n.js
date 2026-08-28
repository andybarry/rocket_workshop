/*
 * Stage One Education - client side page translation.
 *
 * Loaded only on pages whose front matter sets "i18n: true". When the active
 * language is English the engine restores/leaves the original markup untouched,
 * so the English site renders exactly as authored.
 *
 * Markup contract:
 *   data-i18n="key"            -> replaces textContent
 *   data-i18n-html="key"       -> replaces innerHTML (strings containing <strong>, <br>, entities)
 *   data-i18n-alt="key"        -> replaces the alt attribute
 *   data-i18n-title="key"      -> replaces the title attribute
 *   data-i18n-placeholder="key"
 *   data-i18n-aria-label="key"
 *
 * Page <title> and <meta name="description"> come from meta.<data-i18n-page> in
 * the dictionary.
 */
(function (window, document) {
    'use strict';

    var STORAGE_KEY = 'so_lang';
    var DEFAULT_LANG = 'en';
    var PENDING_CLASS = 'i18n-pending';
    var REVEAL_TIMEOUT_MS = 1500;
    // Dictionaries live at the site root. An absolute path is required for
    // nested generated pages such as /workshops/orlando/.
    var DICT_PATH = '/i18n/';

    /* Single source of truth for the language list. The nav dropdown is built
       from this at runtime so the markup stays ASCII and cannot drift. */
    var LANGUAGES = [
        { id: 'en', code: 'EN', label: 'English' },
        { id: 'es', code: 'ES', label: 'Espa\u00f1ol' },
        { id: 'pt-BR', code: 'PT', label: 'Portugu\u00eas' },
        { id: 'zh-Hans', code: 'CN', label: '\u7b80\u4f53\u4e2d\u6587' },
        { id: 'zh-Hant', code: 'TW', label: '\u7e41\u9ad4\u4e2d\u6587' },
        { id: 'ja', code: 'JA', label: '\u65e5\u672c\u8a9e' },
        { id: 'ko', code: 'KO', label: '\ud55c\uad6d\uc5b4' },
        { id: 'fr', code: 'FR', label: 'Fran\u00e7ais' },
        { id: 'de', code: 'DE', label: 'Deutsch' },
        { id: 'it', code: 'IT', label: 'Italiano' }
    ];

    /* Roboto and Open Sans carry no CJK glyphs, so these languages need a font
       or the browser falls back to an inconsistent system face. */
    var CJK_FONTS = {
        'zh-Hans': 'Noto Sans SC',
        'zh-Hant': 'Noto Sans TC',
        'ja': 'Noto Sans JP',
        'ko': 'Noto Sans KR'
    };

    var ATTR_KEYS = ['alt', 'title', 'placeholder', 'aria-label'];

    var root = document.documentElement;
    var dictionaries = {};
    var bindings = null;
    var originalMeta = null;
    var current = DEFAULT_LANG;
    var revealTimer = null;
    var readyCallbacks = [];
    var isReady = false;

    function each(list, fn) {
        if (!list) return;
        for (var i = 0; i < list.length; i++) fn(list[i], i);
    }

    function readStored() {
        try {
            return window.localStorage.getItem(STORAGE_KEY);
        } catch (e) {
            return null;
        }
    }

    function writeStored(value) {
        try {
            window.localStorage.setItem(STORAGE_KEY, value);
        } catch (e) { /* private browsing */ }
    }

    function isSupported(id) {
        for (var i = 0; i < LANGUAGES.length; i++) {
            if (LANGUAGES[i].id === id) return true;
        }
        return false;
    }

    function matchTag(tag) {
        if (!tag) return null;
        var lower = String(tag).replace(/_/g, '-').toLowerCase();
        if (lower.indexOf('zh') === 0) {
            return /hant|tw|hk|mo/.test(lower) ? 'zh-Hant' : 'zh-Hans';
        }
        if (lower.indexOf('pt') === 0) return 'pt-BR';
        var base = lower.split('-')[0];
        for (var i = 0; i < LANGUAGES.length; i++) {
            var id = LANGUAGES[i].id.toLowerCase();
            if (id === lower || id.split('-')[0] === base) return LANGUAGES[i].id;
        }
        return null;
    }

    function detectLanguage() {
        var tags = window.navigator.languages;
        if (!tags || !tags.length) {
            tags = [window.navigator.language || window.navigator.userLanguage || ''];
        }
        for (var i = 0; i < tags.length; i++) {
            var hit = matchTag(tags[i]);
            if (hit) return hit;
        }
        return DEFAULT_LANG;
    }

    function lookup(dict, key) {
        if (!dict || !key) return null;
        var parts = key.split('.');
        var node = dict;
        for (var i = 0; i < parts.length; i++) {
            if (node === null || typeof node !== 'object') return null;
            node = node[parts[i]];
        }
        return node === undefined ? null : node;
    }

    function addPending() {
        if (!new RegExp('(^|\\s)' + PENDING_CLASS + '(\\s|$)').test(root.className)) {
            root.className = root.className ? root.className + ' ' + PENDING_CLASS : PENDING_CLASS;
        }
    }

    function reveal() {
        if (revealTimer) {
            window.clearTimeout(revealTimer);
            revealTimer = null;
        }
        root.className = root.className
            .replace(new RegExp('(^|\\s)' + PENDING_CLASS + '(\\s|$)', 'g'), ' ')
            .replace(/\s+/g, ' ')
            .replace(/^ | $/g, '');
    }

    function loadDictionary(lang, done) {
        if (dictionaries[lang]) {
            done(true);
            return;
        }
        var request = new XMLHttpRequest();
        request.open('GET', DICT_PATH + lang + '.json', true);
        request.onreadystatechange = function () {
            if (request.readyState !== 4) return;
            if (request.status >= 200 && request.status < 300) {
                try {
                    dictionaries[lang] = JSON.parse(request.responseText);
                    done(true);
                    return;
                } catch (e) { /* fall through to failure */ }
            }
            done(false);
        };
        try {
            request.send();
        } catch (e) {
            done(false);
        }
    }

    /* Snapshots the authored English content the first time it runs, so
       switching back to English restores the exact original strings. */
    function buildBindings() {
        var out = [];
        each(document.querySelectorAll('[data-i18n]'), function (el) {
            out.push({ el: el, key: el.getAttribute('data-i18n'), kind: 'text', original: el.textContent });
        });
        each(document.querySelectorAll('[data-i18n-html]'), function (el) {
            out.push({ el: el, key: el.getAttribute('data-i18n-html'), kind: 'html', original: el.innerHTML });
        });
        each(ATTR_KEYS, function (attr) {
            each(document.querySelectorAll('[data-i18n-' + attr + ']'), function (el) {
                out.push({
                    el: el,
                    key: el.getAttribute('data-i18n-' + attr),
                    kind: 'attr',
                    attr: attr,
                    original: el.getAttribute(attr)
                });
            });
        });
        return out;
    }

    function applyBindings(dict) {
        if (!bindings) bindings = buildBindings();
        each(bindings, function (binding) {
            var value = dict ? lookup(dict, binding.key) : null;
            if (typeof value !== 'string') value = binding.original;
            if (value === null) return;
            if (binding.kind === 'text') {
                if (binding.el.textContent !== value) binding.el.textContent = value;
            } else if (binding.kind === 'html') {
                if (binding.el.innerHTML !== value) binding.el.innerHTML = value;
            } else if (binding.el.getAttribute(binding.attr) !== value) {
                binding.el.setAttribute(binding.attr, value);
            }
        });
    }

    function applyMeta(dict) {
        var pageKey = root.getAttribute('data-i18n-page');
        if (!pageKey) return;
        var descriptionEl = document.querySelector('meta[name="description"]');
        if (!originalMeta) {
            originalMeta = {
                title: document.title,
                description: descriptionEl ? descriptionEl.getAttribute('content') : null
            };
        }
        var title = dict ? lookup(dict, 'meta.' + pageKey + '.title') : null;
        document.title = typeof title === 'string' ? title : originalMeta.title;

        if (!descriptionEl || originalMeta.description === null) return;
        var description = dict ? lookup(dict, 'meta.' + pageKey + '.description') : null;
        descriptionEl.setAttribute(
            'content',
            typeof description === 'string' ? description : originalMeta.description
        );
    }

    function ensureFont(lang) {
        var family = CJK_FONTS[lang];
        var existing = document.getElementById('i18n-cjk-font');
        if (!family) {
            if (existing && existing.parentNode) existing.parentNode.removeChild(existing);
            return;
        }
        var href = 'https://fonts.googleapis.com/css2?family=' +
            family.replace(/ /g, '+') + ':wght@400;500;700&display=swap';
        if (existing) {
            if (existing.getAttribute('href') !== href) existing.setAttribute('href', href);
            return;
        }
        var link = document.createElement('link');
        link.id = 'i18n-cjk-font';
        link.rel = 'stylesheet';
        link.href = href;
        (document.head || document.getElementsByTagName('head')[0]).appendChild(link);
    }

    /* The header is fixed and each page clears it with a hardcoded top margin
       sized for the authored English row. Longer labels can push the row to a
       second line, and the taller header would then cover the top of the
       page, so the margin has to follow the real header height. English
       always returns to the authored value. */
    var authoredBodyMargin = null;
    var englishHeaderHeight = null;

    /* Records how tall the header is with the authored English labels. Must
       run while English is still on screen, so the comparison below measures
       only the growth caused by translation. */
    function measureHeader() {
        var header = document.getElementById('mainNav');
        if (header && englishHeaderHeight === null) {
            englishHeaderHeight = header.getBoundingClientRect().height;
        }
    }

    function fitHeader() {
        var header = document.getElementById('mainNav');
        var body = document.body;
        if (!header || !body || englishHeaderHeight === null) return;
        if (authoredBodyMargin === null) authoredBodyMargin = body.style.marginTop || '';

        body.style.marginTop = authoredBodyMargin;
        if (current === DEFAULT_LANG) {
            englishHeaderHeight = header.getBoundingClientRect().height;
            return;
        }

        var growth = header.getBoundingClientRect().height - englishHeaderHeight;
        if (growth <= 1) return;
        var authored = parseFloat(window.getComputedStyle(body).marginTop) || 0;
        body.style.marginTop = Math.ceil(authored + growth) + 'px';
    }

    /* The two hero headline lines are authored to sit on one line each, and
       they must stay that way in every language. Translations run longer than
       the English wording, so the type is scaled down until the wider of the
       two lines fits its column. */
    var HERO_TITLE_MIN_PX = 12;
    var heroTitleBase = null;
    var heroTitleApplied = null;
    var heroTitleEnglishEm = null;

    /* The authored English headline is wider than the text column and runs on
       into the faded edge of the photo, which is part of the design. Recording
       its width relative to its own font size gives the translations the same
       budget at any viewport, so they only shrink when they would take more
       room than English does. */
    function measureHeroTitle() {
        var title = document.querySelector('.home-room-hero__title');
        if (!title) return;
        var size = parseFloat(window.getComputedStyle(title).fontSize);
        if (!size) return;
        var widest = 0;
        each(title.querySelectorAll('.home-room-hero__title-line'), function (line) {
            if (line.scrollWidth > widest) widest = line.scrollWidth;
        });
        if (widest > 0) heroTitleEnglishEm = widest / size;
    }

    function fitHeroTitle() {
        var title = document.querySelector('.home-room-hero__title');
        if (!title) return;

        var lines = title.querySelectorAll('.home-room-hero__title-line');
        var hero = document.querySelector('.home-room-hero');
        var column = title.parentNode;
        if (!lines.length || !column || !hero) return;

        /* Clear any prior inline size so CSS clamp (cqi) can set the base. */
        title.style.fontSize = '';
        heroTitleApplied = null;
        heroTitleBase = parseFloat(window.getComputedStyle(title).fontSize) || null;
        if (!heroTitleBase) return;

        var size = heroTitleBase;
        var columnStyle = window.getComputedStyle(column);
        var columnInner = column.clientWidth -
            (parseFloat(columnStyle.paddingLeft) || 0) -
            (parseFloat(columnStyle.paddingRight) || 0);
        /* May spill into the photo fade, but must stay clear of the quote zone
           (~48%+). On mobile quotes are hidden, so the column is the limit. */
        var available = columnInner;
        if (window.matchMedia && window.matchMedia('(min-width: 768px)').matches) {
            available = Math.max(columnInner, hero.clientWidth * 0.70);
        }
        if (current !== DEFAULT_LANG && heroTitleEnglishEm) {
            available = Math.max(available, heroTitleEnglishEm * size);
        }
        if (available <= 0) return;

        var widest = function () {
            var most = 0;
            each(lines, function (line) {
                if (line.scrollWidth > most) most = line.scrollWidth;
            });
            return most;
        };

        var overflow = widest();
        if (overflow > available) {
            size = Math.max(HERO_TITLE_MIN_PX, Math.floor(size * available / overflow));
            title.style.fontSize = size + 'px';
            heroTitleApplied = size;
            while (size > HERO_TITLE_MIN_PX && widest() > available) {
                size -= 1;
                title.style.fontSize = size + 'px';
                heroTitleApplied = size;
            }
        }

        if (current === DEFAULT_LANG) {
            measureHeroTitle();
        }
    }

    /* This engine loads in <head>, so its DOMContentLoaded handler runs before
       scripts at the end of the page. Re-measure after load so fonts and
       layout are settled. */
    function refitAfterLoad() {
        var pass = function () {
            fitHeroTitle();
            fitHero();
        };
        if (document.readyState === 'complete') {
            window.setTimeout(pass, 0);
        } else {
            window.addEventListener('load', pass);
        }
    }

    /* Web fonts land after the first paint, and the CJK faces are requested
       only when one of those languages is picked. Both change text metrics, so
       the headline is measured again once the fonts are in. */
    function refitWhenFontsLoad() {
        if (!document.fonts || !document.fonts.ready || !document.fonts.ready.then) return;
        var measuredFor = current;
        document.fonts.ready.then(function () {
            if (current !== measuredFor) return;
            fitHeroTitle();
            fitHero();
        });
    }

    /* The home hero is a fixed-height box whose children are absolutely
       positioned, so no CSS rule can grow it to fit a longer translation.
       Measure the translated column and raise the height only when the text
       would otherwise be clipped. English always returns to the authored CSS
       height because the inline style is cleared. */
    function fitHero() {
        var hero = document.querySelector('.home-room-hero');
        if (!hero) return;
        var content = hero.querySelector('.home-room-hero__content');
        if (!content) return;

        /* Content is in normal flow and grows the hero; clear any stale
           inline height from older layouts / translated overflow passes. */
        hero.style.height = '';
        if (current === DEFAULT_LANG) return;

        var natural = hero.offsetHeight;
        var previousJustify = content.style.justifyContent;
        content.style.justifyContent = 'flex-start';
        var needed = content.scrollHeight;
        content.style.justifyContent = previousJustify;

        if (needed > natural) hero.style.height = needed + 'px';
    }

    var resizeTimer = null;
    function watchResize() {
        window.addEventListener('resize', function () {
            if (resizeTimer) window.clearTimeout(resizeTimer);
            resizeTimer = window.setTimeout(function () {
                fitHeader();
                fitHeroTitle();
                fitHero();
            }, 150);
        });
    }

    function updateSwitcher(lang) {
        var active = null;
        for (var i = 0; i < LANGUAGES.length; i++) {
            if (LANGUAGES[i].id === lang) active = LANGUAGES[i];
        }
        each(document.querySelectorAll('.nav-lang-code'), function (badge) {
            if (active) badge.textContent = active.code;
        });

        each(document.querySelectorAll('.nav-lang-toggle'), function (toggle) {
            if (active) {
                var dict = lang === DEFAULT_LANG ? null : dictionaries[lang];
                var changeLang = (dict && lookup(dict, 'nav.changeLanguage')) || 'Change language';
                var currentTpl = (dict && lookup(dict, 'nav.changeLanguageCurrent')) ||
                    'Change language, current language {name}';
                toggle.setAttribute('title', changeLang);
                toggle.setAttribute('aria-label', String(currentTpl).replace('{name}', active.label));
            }
        });
        each(document.querySelectorAll('.nav-lang-menu [data-lang]'), function (link) {
            var on = link.getAttribute('data-lang') === lang;
            link.parentNode.className = on ? 'nav-lang-option is-active' : 'nav-lang-option';
            link.setAttribute('aria-current', on ? 'true' : 'false');
        });
    }

    function buildSwitcher() {
        var markup = '';
        each(LANGUAGES, function (language) {
            markup += '<li class="nav-lang-option">' +
                '<a href="#" class="nav-lang-link" data-lang="' + language.id + '" lang="' + language.id + '">' +
                '<span class="nav-lang-option-code">' + language.code + '</span>' +
                '<span class="nav-lang-option-label">' + language.label + '</span>' +
                '</a></li>';
        });
        each(document.querySelectorAll('.nav-lang-menu'), function (menu) {
            if (menu.getAttribute('data-built') === 'true') return;
            menu.innerHTML = markup;
            menu.setAttribute('data-built', 'true');
            menu.onclick = function (event) {
                var node = event.target;
                while (node && node !== menu && !node.getAttribute) node = node.parentNode;
                while (node && node !== menu && !node.getAttribute('data-lang')) node = node.parentNode;
                if (!node || node === menu) return;
                if (event.preventDefault) event.preventDefault();
                setLanguage(node.getAttribute('data-lang'));
                return false;
            };
        });
    }

    function markReady() {
        if (isReady) return;
        isReady = true;
        var queued = readyCallbacks;
        readyCallbacks = [];
        each(queued, function (callback) {
            try {
                callback(current);
            } catch (e) { /* a broken listener must not block the page */ }
        });
    }

    function applyLanguage(lang) {
        var dict = lang === DEFAULT_LANG ? null : dictionaries[lang];
        applyBindings(dict);
        applyMeta(dict);
        root.setAttribute('lang', lang);
        current = lang;
        updateSwitcher(lang);
        fitHeader();
        fitHeroTitle();
        fitHero();
        refitWhenFontsLoad();
        markReady();
        if (window.jQuery) {
            try {
                window.jQuery(document).trigger('so:languagechange', [lang]);
            } catch (e) { /* optional hook */ }
        }
    }

    function setLanguage(lang) {
        if (!isSupported(lang) || lang === current) return;
        writeStored(lang);
        ensureFont(lang);
        if (lang === DEFAULT_LANG || dictionaries[lang]) {
            applyLanguage(lang);
            return;
        }
        loadDictionary(lang, function (ok) {
            if (ok) applyLanguage(lang);
        });
    }

    function whenDomReady(fn) {
        if (document.readyState === 'complete' || document.readyState === 'interactive') {
            window.setTimeout(fn, 0);
        } else {
            document.addEventListener('DOMContentLoaded', fn);
        }
    }

    var stored = readStored();
    var initial = stored && isSupported(stored) ? stored : detectLanguage();
    current = initial;

    window.SOI18n = {
        languages: LANGUAGES,
        get lang() { return current; },
        set: setLanguage,
        /* Returns a translated value, or null when English is active or the key
           is missing, so callers can fall back to their own inline English. */
        t: function (key) {
            var dict = current === DEFAULT_LANG ? null : dictionaries[current];
            var value = lookup(dict, key);
            return typeof value === 'string' ? value : null;
        },
        list: function (key) {
            var dict = current === DEFAULT_LANG ? null : dictionaries[current];
            var value = lookup(dict, key);
            return Object.prototype.toString.call(value) === '[object Array]' ? value : null;
        },
        /* Fires once the first translation pass is done, then again on every
           later language change. */
        ready: function (callback) {
            if (typeof callback !== 'function') return;
            if (isReady) {
                callback(current);
                return;
            }
            readyCallbacks.push(callback);
        }
    };

    if (initial === DEFAULT_LANG) {
        whenDomReady(function () {
            buildSwitcher();
            updateSwitcher(DEFAULT_LANG);
            measureHeader();
            measureHeroTitle();
            watchResize();
            refitAfterLoad();
            markReady();
        });
    } else {
        root.setAttribute('lang', initial);
        addPending();
        revealTimer = window.setTimeout(reveal, REVEAL_TIMEOUT_MS);
        ensureFont(initial);

        var dictLoaded = false;
        var dictSettled = false;
        var domReady = false;
        var finished = false;
        var finish = function () {
            if (finished || !domReady || !dictSettled) return;
            finished = true;
            buildSwitcher();
            /* Still showing the authored English labels at this point. */
            measureHeader();
            measureHeroTitle();
            watchResize();
            refitAfterLoad();
            if (dictLoaded) {
                applyLanguage(initial);
            } else {
                /* Dictionary unavailable: leave the English markup in place and
                   show the page rather than stranding the visitor. */
                updateSwitcher(initial);
                markReady();
            }
            reveal();
        };

        loadDictionary(initial, function (ok) {
            dictLoaded = ok;
            dictSettled = true;
            finish();
        });
        whenDomReady(function () {
            domReady = true;
            finish();
        });
    }
})(window, document);
