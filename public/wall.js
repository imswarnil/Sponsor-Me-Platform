/* sponsor.imswarnil.com — embeddable sponsor wall.

   <script src="https://sponsor.imswarnil.com/wall.js"
           data-wall="inline"        sidebar | inline | full
           data-height="120"         optional; the wall auto-sizes without it
           data-heading="Sponsors"   optional heading inside the frame
           async></script>

   Injects an iframe rather than writing into the host page: the host's CSS
   cannot break the wall, and the wall's CSS cannot touch the host. The frame
   reports its own height back so there is no scrollbar and no guessing.
*/
(function () {
  var ALLOWED = { sidebar: 1, inline: 1, full: 1 };

  function originOf(src) {
    try { return new URL(src, location.href).origin; } catch (e) { return location.origin; }
  }

  function mount(script) {
    if (script.__wallMounted) return;
    script.__wallMounted = true;

    var layout = script.getAttribute('data-wall') || 'inline';
    if (!ALLOWED[layout]) layout = 'inline';
    var origin = originOf(script.src);

    var qs = 'layout=' + encodeURIComponent(layout);
    var limit = script.getAttribute('data-limit');
    if (limit) qs += '&limit=' + encodeURIComponent(limit);
    var heading = script.getAttribute('data-heading');
    if (heading) qs += '&heading=' + encodeURIComponent(heading);

    var frame = document.createElement('iframe');
    frame.src = origin + '/embed/wall?' + qs;
    frame.title = 'Sponsors';
    frame.loading = 'lazy';
    frame.setAttribute('scrolling', 'no');
    frame.style.cssText =
      'border:0;display:block;width:100%;max-width:100%;color-scheme:normal;' +
      'height:' + (parseInt(script.getAttribute('data-height'), 10) || 140) + 'px;';

    // The frame posts its height once it has drawn; until then the inline
    // height above holds the space, so the host page never jumps.
    window.addEventListener('message', function (e) {
      if (e.origin !== origin) return;
      var d = e.data;
      if (!d || d.type !== 'sponsor-wall-height' || d.layout !== layout) return;
      if (typeof d.height === 'number' && d.height > 0) frame.style.height = d.height + 'px';
    });

    script.parentNode.insertBefore(frame, script.nextSibling);
  }

  var scripts = document.querySelectorAll('script[data-wall]');
  for (var i = 0; i < scripts.length; i++) mount(scripts[i]);
})();
