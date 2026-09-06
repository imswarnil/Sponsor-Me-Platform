/* Be My Sponsor — embeddable widget.
   Usage: <script src="https://<host>/widget.js" data-slot="sl_xxxx" async></script>
   Injects an iframe that reserves exact dimensions (zero layout shift) and serves the slot. */
(function () {
  function originOf(src) {
    try { return new URL(src, location.href).origin; } catch (e) { return location.origin; }
  }
  function mount(script) {
    if (script.__bmsMounted) return;
    script.__bmsMounted = true;
    var slot = script.getAttribute('data-slot');
    if (!slot) return;
    var w = parseInt(script.getAttribute('data-width'), 10) || 300;
    var h = parseInt(script.getAttribute('data-height'), 10) || 250;
    var origin = originOf(script.src);

    var frame = document.createElement('iframe');
    frame.src = origin + '/embed/' + encodeURIComponent(slot);
    frame.width = w;
    frame.height = h;
    frame.title = 'Sponsorship slot';
    frame.loading = 'lazy';
    frame.setAttribute('scrolling', 'no');
    frame.style.cssText =
      'border:0;display:block;width:' + w + 'px;height:' + h + 'px;max-width:100%;color-scheme:normal;';
    script.parentNode.insertBefore(frame, script.nextSibling);
  }

  var scripts = document.querySelectorAll('script[data-slot]');
  for (var i = 0; i < scripts.length; i++) mount(scripts[i]);
})();
