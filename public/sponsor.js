/**
 * SPONSOR ME — the embed script.
 *
 *   <script src="https://sponsor.imswarnil.com/sponsor.js"
 *           data-slot="blog-sidebar-x1a2" async></script>
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

  var frame = document.createElement('iframe');
  frame.src = origin + '/embed/' + encodeURIComponent(slot);
  frame.title = 'Sponsored';
  frame.loading = 'lazy';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('frameborder', '0');
  // It may run its own scripts and open links, and nothing else. No
  // same-origin, so it cannot reach back into the host page.
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.style.cssText =
    'display:block;width:100%;border:0;height:300px;color-scheme:normal;background:transparent;';

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
