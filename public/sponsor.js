/**
 * SPONSOR ME — the embed script.
 *
 *   <script src="https://sponsor.imswarnil.com/sponsor.js"
 *           data-slot="blog-sidebar-x1a2" async></script>
 *
 * Add data-view="board" for the whole leaderboard instead of the single
 * winning ad. The board is responsive to the box you put it in — a 300px
 * sidebar and a 900px article get different layouts from the same tag — so
 * there is nothing to configure beyond the width of the element it lands in.
 *
 * THE THEME. By default the unit follows the reader's own light/dark setting.
 * A site that is always one or the other pins it and stops guessing:
 *
 *   <script src="…/sponsor.js" data-slot="…" data-theme="dark" async></script>
 *
 * Or, to place it somewhere specific rather than where the tag sits:
 *
 *   <div id="my-ad"></div>
 *   <script src="…/sponsor.js" data-slot="…" data-target="#my-ad" async></script>
 *
 * WHY AN IFRAME AND NOT INJECTED HTML. An iframe cannot read the host page's
 * cookies or DOM, and its styles cannot be broken by the host's stylesheet —
 * which is not a small thing: injected ad markup inherits whatever the host
 * does to `a` and `img`, and the result is an ad that looks broken on exactly
 * the sites it is being paid to appear on.
 *
 * NO DEPENDENCIES, NO COOKIES, NO TRACKING. This file reads nothing about the
 * visitor and stores nothing on their machine. It creates one iframe.
 *
 * THE HEIGHT IS RESERVED BEFORE THE FRAME LOADS, so the host page does not
 * shift when the ad arrives. The frame posts its real height back and the
 * script only ever GROWS it — a shrink would pull the page up under the
 * reader's cursor, which is the layout shift this exists to avoid.
 *
 * Plain ES5-ish on purpose: it runs on every site the creator has ever built,
 * and a build step for twenty lines of DOM work would be a dependency with no
 * upside.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  var slot = script.getAttribute('data-slot');
  if (!slot) return;

  // The origin this script was served from IS the platform. Derived rather
  // than hardcoded, so a staging deploy embeds itself and not production.
  var origin = new URL(script.src, window.location.href).origin;
  var target = script.getAttribute('data-target');
  var view = script.getAttribute('data-view');
  // Only the two words the embed acts on. Anything else is dropped rather
  // than forwarded, because this value ends up in the URL of a page request.
  var theme = script.getAttribute('data-theme');
  if (theme !== 'light' && theme !== 'dark') theme = null;

  var query = [];
  if (view) query.push('view=' + encodeURIComponent(view));
  if (theme) query.push('theme=' + theme);

  var frame = document.createElement('iframe');
  frame.src =
    origin + '/embed/' + encodeURIComponent(slot) + (query.length ? '?' + query.join('&') : '');
  frame.title = 'Sponsored';
  frame.loading = 'lazy';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('frameborder', '0');
  // It may run its own scripts and open links, and nothing else. No
  // same-origin, so it cannot reach back into the host page.
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  /* A board is taller than a single unit, so it starts taller — the frame
     posts its real height back and the script grows to it, but the reserved
     height is what stops the host page shifting before that happens. */
  /* `color-scheme: light dark` rather than `normal`: the embed supports a dark
     theme now, and pinning the frame to light would leave its scrollbars and
     form controls light inside a dark unit. The unit paints no background of
     its own, so the host page shows through either way. */
  frame.style.cssText =
    'display:block;width:100%;border:0;height:' +
    (view ? 520 : 300) +
    'px;color-scheme:light dark;background:transparent;';

  var mount = target ? document.querySelector(target) : null;
  if (mount) mount.appendChild(frame);
  else script.parentNode.insertBefore(frame, script.nextSibling);

  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return;
    if (!event.data || event.data.type !== 'sponsorme:height') return;
    if (event.data.slot !== slot) return;
    var h = parseInt(event.data.height, 10);
    if (h > 0 && h !== frame.offsetHeight) frame.style.height = h + 'px';
  });
})();
