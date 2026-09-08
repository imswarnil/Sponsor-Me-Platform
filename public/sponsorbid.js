/**
 * SPONSORBID — the embed script.
 *
 * One <script> tag on any of the creator's sites, and the board appears:
 *
 *   <script src="https://sponsor.imswarnil.com/sponsorbid.js"
 *           data-format="rect" async></script>
 *
 * Or, to place it somewhere specific rather than where the tag sits:
 *
 *   <div id="sponsorbid"></div>
 *   <script src="https://sponsor.imswarnil.com/sponsorbid.js" data-target="#sponsorbid" async></script>
 *
 * WHY AN IFRAME AND NOT INJECTED HTML. An iframe cannot read the host page's
 * cookies, cannot see its DOM, and cannot have its own CSS broken by the host's
 * stylesheet. That last one is not a small thing: injected ad markup inherits
 * whatever the host site does to `a` and `img`, and the result is an ad that
 * looks broken on exactly the sites it is being paid to appear on.
 *
 * NO DEPENDENCIES, NO TRACKING, NO COOKIES. This file reads nothing about the
 * visitor and sets nothing on their machine. It creates one iframe.
 *
 * THE HEIGHT IS RESERVED BEFORE THE FRAME LOADS, from the format, so the host
 * page does not shift when the board arrives. The frame then posts its real
 * height back and the script adjusts — accepting the message only from this
 * script's own origin, because a height message from anywhere else is somebody
 * else resizing an element on a page they do not own.
 *
 * Vanilla ES5-ish on purpose: it runs on every site the creator has ever
 * built, including the older ones, and a build step for eleven lines of DOM
 * work would be a dependency with no upside.
 */
(function () {
  'use strict';

  var script = document.currentScript;
  if (!script) return;

  // The origin this script was served from IS the platform. Deriving it rather
  // than hardcoding means a staging deploy embeds itself, not production.
  var origin = new URL(script.src, window.location.href).origin;

  var format = script.getAttribute('data-format') || 'inline';
  var target = script.getAttribute('data-target');

  /* Reserved heights, in px, matching the design system's --ad-h for each
     format plus room for the label. The iframe is created at this height and
     only ever grows to fit — it must never come back shorter and collapse the
     space the page already gave it. */
  var HEIGHTS = { leader: 190, rect: 560, sky: 900, card: 320, inline: 320 };
  var height = HEIGHTS[format] || HEIGHTS.inline;

  var frame = document.createElement('iframe');
  frame.src = origin + '/embed/board?format=' + encodeURIComponent(format);
  frame.title = 'Sponsors';
  frame.loading = 'lazy';
  frame.setAttribute('scrolling', 'no');
  frame.setAttribute('frameborder', '0');
  // Let it run its own scripts and open links, and nothing else. No
  // same-origin, so it cannot reach back into this page.
  frame.setAttribute('sandbox', 'allow-scripts allow-popups allow-popups-to-escape-sandbox');
  frame.style.cssText =
    'display:block;width:100%;border:0;height:' + height + 'px;color-scheme:normal;';

  var mount = target ? document.querySelector(target) : null;
  if (mount) {
    mount.appendChild(frame);
  } else {
    // No target: sit exactly where the tag is.
    script.parentNode.insertBefore(frame, script.nextSibling);
  }

  window.addEventListener('message', function (event) {
    if (event.origin !== origin) return;
    if (!event.data || event.data.type !== 'sponsorbid:height') return;
    var h = parseInt(event.data.height, 10);
    // Only ever grow. A shrink would pull the page up under the reader's
    // cursor, which is the layout shift this whole design exists to avoid.
    if (h > 0 && h > frame.offsetHeight) frame.style.height = h + 'px';
  });
})();
