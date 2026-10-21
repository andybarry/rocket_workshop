function s$t({ chatMessages: a, setChatMessages: n, onPromptSubmitted }) {
  const [r, u] = Je.useState(""), [c, f] = Je.useState(null), [d, p] = Je.useState(null), [y, m] = Je.useState("keyboard"), [_, w] = Je.useState(null), [R, h] = Je.useState(false), F = Je.useRef(null), v = Je.useRef(null), C = () => {
    const Z = v.current;
    if (!Z || !Z.clientWidth) return;
    Z.style.height = "auto";
    const De = getComputedStyle(Z), se = parseFloat(De.borderTopWidth) + parseFloat(De.borderBottomWidth);
    Z.style.height = `${Math.ceil(Z.scrollHeight + se)}px`;
  };
  Je.useLayoutEffect(() => {
    C();
  }, [r, _, R, c]), Je.useEffect(() => {
    var xe;
    const Z = v.current;
    if (!Z) return;
    let De = Z.clientWidth;
    const se = new ResizeObserver(() => {
      const V = Z.clientWidth;
      V !== De && (De = V, C());
    });
    return se.observe(Z), (xe = document.fonts) == null || xe.ready.then(() => {
      Z.isConnected && C();
    }), () => se.disconnect();
  }, []);
  const S = Je.useRef(a);
  S.current = a, Je.useEffect(() => {
    var De;
    const Z = (De = F.current) == null ? void 0 : De.parentElement;
    Z && Z.scrollTo({ top: a.length ? Z.scrollHeight : 0, behavior: a.length ? "smooth" : "instant" });
  }, [a]), Je.useEffect(() => {
    var Z;
    (Z = v.current) == null || Z.focus({ preventScroll: true });
  }, []), Je.useEffect(() => {
    var Z;
    R || (Z = v.current) == null || Z.focus({ preventScroll: true });
  }, [R]), Je.useEffect(() => {
    let Z;
    const De = $$e((se, xe = {}) => {
      u(se), Object.hasOwn(xe, "audio") && p(xe.audio), Object.hasOwn(xe, "image") && f(xe.image), m(xe.image || xe.audio ? "upload" : "keyboard"), w(null), cancelAnimationFrame(Z), Z = requestAnimationFrame(() => {
        var V;
        C(), (V = v.current) == null || V.focus({ preventScroll: true });
      });
    });
    return () => {
      De(), cancelAnimationFrame(Z);
    };
  }, []);
  const j = Je.useRef(null), I = Je.useRef(false);
  I.current = R, j.current = (Z) => {
    if (I.current) return;
    const De = "My website has an error. Please fix it!\n\n```\n" + String(Z).slice(0, 1500) + "\n```";
    z(De, (se, xe) => bRe(se, xe));
  }, Je.useEffect(() => qUt((Z) => {
    var De;
    return (De = j.current) == null ? void 0 : De.call(j, Z);
  }), []);
  function U() {
    AUt(), h(false);
  }
  function O(Z, De) {
    const se = _Ut(Z);
    if (se.length === 0) return { filesChanged: [], checkpointId: null };
    const xe = Lx(De);
    for (const { path: V, content: _e } of se) ls(V, _e);
    return { filesChanged: se.map((V) => V.path), checkpointId: xe };
  }
  async function z(Z, De) {
    const se = [...S.current, { role: "user", content: Z }], xe = { role: "assistant", content: "" }, V = () => n([...se, { ...xe }]);
    V(), h(true);
    const _e = Z.slice(0, 60) || "AI change";
    try {
      const ut = se.map(({ role: Ae, content: Le }) => ({ role: Ae, content: Le }));
      await De(ut, (Ae) => {
        xe.content += Ae, V();
      });
      const dt = O(xe.content, _e);
      dt.filesChanged.length > 0 && (Object.assign(xe, dt), V());
    } catch (ut) {
      if (ut.name === "AbortError") {
        const dt = O(xe.content, _e);
        dt.filesChanged.length > 0 && (Object.assign(xe, dt), V());
      } else xe.content = `Error: ${ut.message}`, V();
    }
    h(false);
  }
  async function G(Z) {
    var se, xe;
    if (Z.preventDefault(), !r.trim() && !c && !d || R) return;
    onPromptSubmitted?.("studio");
    if (c) {
      const V = c, _e = r.trim();
      f(null), u(""), (se = v.current) == null || se.focus({ preventScroll: true }), await oe(V, _e);
      return;
    }
    const De = r.trim() || `Add my audio file "${d.name}" to the website with a play button.`;
    p(null), u(""), (xe = v.current) == null || xe.focus({ preventScroll: true }), await z(De, (V, _e) => bRe(V, _e));
  }
  async function oe(Z, De) {
    if (R) return;
    const se = `\u{1F4F7} Use this reference photo to build my website.${De.trim() ? ` Notes: ${De.trim()}` : ""}`;
    await z(se, (xe, V) => BUt(xe.slice(0, -1), Z, De, V));
  }
  function Ce(Z) {
    Z.key === "Enter" && !Z.shiftKey && (Z.preventDefault(), G(Z));
  }
  return Q.jsxs(Q.Fragment, { children: [a.length > 0 && Q.jsx("div", { className: "chat-header", children: Q.jsx("button", { type: "button", className: "chat-clear", title: "Clear chat", onClick: () => {
    window.confirm("Clear the whole chat history? Your website is not affected.") && n([]);
  }, children: "Clear chat" }) }), Q.jsx("div", { className: "chat-scroll-area", children: Q.jsxs("div", { className: "chat-messages", children: [a.length === 0 && Q.jsxs("div", { className: "chat-welcome", children: [Q.jsxs("div", { className: "chat-suggestions", children: [Q.jsx("h4", { className: "suggestions-heading", children: "Things to try" }), Q.jsxs("button", { type: "button", onClick: () => {
    var Z;
    return (Z = document.querySelector('[aria-label="Photograph a paper sketch"]')) == null ? void 0 : Z.click();
  }, children: [Q.jsx("span", { className: "suggestion-icon", children: Q.jsxs("svg", { "className": "", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "M14.5 4h-5L7.5 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2.5l-2-3Z" }), Q.jsx("circle", { "cx": 12, "cy": 13, "r": 3.5 })] }) }), Q.jsxs("span", { className: "suggestion-copy", children: [Q.jsx("span", { className: "suggestion-title", children: "Draw your website on paper" }), Q.jsx("span", { className: "suggestion-description", children: "Take a photo and turn it into a website" })] }), Q.jsxs("svg", { "className": "suggestion-chevron", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m9 5 7 7-7 7" })] })] }), Q.jsxs("button", { type: "button", onClick: () => u("Make the header use a gradient background with animated text"), children: [Q.jsx("span", { className: "suggestion-icon", children: Q.jsxs("svg", { "className": "", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m14 5 5-2 2 2-2 5-8 8-4-4 7-9Z" }), Q.jsx("path", { "d": "M7 14c-3 0-4 2-4 4 0 1-1 2-2 2 4 2 8 0 8-3m5-12 5 5" })] }) }), Q.jsxs("span", { className: "suggestion-copy", children: [Q.jsx("span", { className: "suggestion-title", children: "Change the header style" }), Q.jsx("span", { className: "suggestion-description", children: "Update the look and layout" })] }), Q.jsxs("svg", { "className": "suggestion-chevron", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m9 5 7 7-7 7" })] })] }), Q.jsxs("button", { type: "button", onClick: () => {
    z$e() === "convert" && u(q$e);
  }, children: [Q.jsx("span", { className: "suggestion-icon", children: Q.jsxs("svg", { "className": "", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "M14 2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h7M14 2l5 5h-5V2M17 13v8m-4-4h8" })] }) }), Q.jsxs("span", { className: "suggestion-copy", children: [Q.jsx("span", { className: "suggestion-title", children: "Add a new page with navigation" }), Q.jsx("span", { className: "suggestion-description", children: "Create another page and menu links" })] }), Q.jsxs("svg", { "className": "suggestion-chevron", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m9 5 7 7-7 7" })] })] }), Q.jsxs("button", { type: "button", onClick: () => u("Add a photo gallery section with a grid layout"), children: [Q.jsx("span", { className: "suggestion-icon", children: Q.jsxs("svg", { "className": "", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("rect", { "x": 3, "y": 3, "width": 18, "height": 18, "rx": 2 }), Q.jsx("circle", { "cx": 8, "cy": 8, "r": 1.5 }), Q.jsx("path", { "d": "m21 15-6-6-7 7-2-2-3 3" })] }) }), Q.jsxs("span", { className: "suggestion-copy", children: [Q.jsx("span", { className: "suggestion-title", children: "Add a photo gallery" }), Q.jsx("span", { className: "suggestion-description", children: "Show multiple images on your website" })] }), Q.jsxs("svg", { "className": "suggestion-chevron", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m9 5 7 7-7 7" })] })] }), Q.jsxs("button", { type: "button", onClick: () => u("Create a dark mode toggle"), children: [Q.jsx("span", { className: "suggestion-icon", children: Q.jsxs("svg", { "className": "", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z" })] }) }), Q.jsxs("span", { className: "suggestion-copy", children: [Q.jsx("span", { className: "suggestion-title", children: "Add dark mode" }), Q.jsx("span", { className: "suggestion-description", children: "Give your website a darker theme" })] }), Q.jsxs("svg", { "className": "suggestion-chevron", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m9 5 7 7-7 7" })] })] }), Q.jsxs("button", { type: "button", onClick: () => u("Add a contact form with name, email, and message fields"), children: [Q.jsx("span", { className: "suggestion-icon", children: Q.jsxs("svg", { "className": "", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("rect", { "x": 3, "y": 5, "width": 18, "height": 14, "rx": 2 }), Q.jsx("path", { "d": "m3 6 9 7 9-7" })] }) }), Q.jsxs("span", { className: "suggestion-copy", children: [Q.jsx("span", { className: "suggestion-title", children: "Add a contact form" }), Q.jsx("span", { className: "suggestion-description", children: "Let visitors send you a message" })] }), Q.jsxs("svg", { "className": "suggestion-chevron", "viewBox": "0 0 24 24", "fill": "none", "stroke": "currentColor", "strokeWidth": 1.8, "strokeLinecap": "round", "strokeLinejoin": "round", "aria-hidden": "true", children: [Q.jsx("path", { "d": "m9 5 7 7-7 7" })] })] })] })] }), a.map((Z, De) => {
    var se;
    return Q.jsxs("div", { className: `chat-bubble chat-${Z.role}`, children: [Q.jsx("div", { className: "chat-bubble-label", children: Z.role === "user" ? "You" : "AI" }), Q.jsx("div", { className: "chat-bubble-content", children: Z.role === "assistant" ? Q.jsx(l$t, { content: Z.content }) : Z.content }), Z.role === "assistant" && ((se = Z.filesChanged) == null ? void 0 : se.length) > 0 && Q.jsx(o$t, { filesChanged: Z.filesChanged, checkpointId: Z.checkpointId })] }, De);
  }), Q.jsx("div", { ref: F })] }) }), Q.jsx("form", { className: "chat-input-area", onSubmit: G, children: Q.jsxs("div", { className: "chat-composer-box", children: [Q.jsx(a$t, { audio: d, onRemoveAudio: () => p(null), image: c, setImage: (Z) => {
    f(Z), Z && p(null);
  }, disabled: R, inputMode: y, onInputModeChange: m, onInputHintChange: w }), Q.jsxs("div", { className: "chat-prompt-field", children: [Q.jsx("textarea", { ref: v, value: r, onChange: (Z) => {
    u(Z.target.value), m("keyboard");
  }, onKeyDown: Ce, placeholder: _ || (R ? "AI is working \u2014 type your next idea..." : d ? "Add optional notes for this audio..." : c ? "Add optional notes for this photo..." : "Describe what you want to build..."), rows: 2 }), R ? Q.jsx("button", { type: "button", className: "chat-stop-btn", onClick: U, children: "Stop" }) : Q.jsx("button", { type: "submit", className: "chat-go-btn", "aria-label": "Send message", disabled: !r.trim() && !c && !d, children: "Go" })] })] }) })] });
}
