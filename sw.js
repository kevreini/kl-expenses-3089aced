// Papaya push: shows each push as one notification and, on a tap, opens Papaya on the right screen.
// No fetch handler, no cache, no network of its own. Served next to index.html, registered with scope './'.
'use strict';

var PAPAYA_SCREENS = ['#todo', '#money', '#groceries'];

function papayaText_(v) {
  return typeof v === 'string' ? v : '';
}

// Only the three app screens are kept; anything else opens the app itself.
function papayaScreen_(v) {
  return PAPAYA_SCREENS.indexOf(v) >= 0 ? v : '';
}

function papayaPayload_(data) {
  if (!data) return {};
  try {
    var d = data.json();
    return d && typeof d === 'object' ? d : {};
  } catch (e) {
    return {};
  }
}

self.addEventListener('install', function () {
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(self.clients.claim());
});

// Every push shows a notification (iOS requires one), even when the payload cannot be read.
self.addEventListener('push', function (event) {
  var d = papayaPayload_(event.data);
  var opts = { body: papayaText_(d.body) || 'Something new in Papaya', data: { url: papayaScreen_(d.url) }, icon: 'icon-192.png?v=papaya' };
  var tag = papayaText_(d.tag);
  if (tag) opts.tag = tag;
  event.waitUntil(self.registration.showNotification(papayaText_(d.title) || 'Papaya', opts));
});

// A tap: an open Papaya window comes to the front on that screen (with no screen named it only comes to the
// front: navigating a hashed page to the bare scope would reload it); with none open, a new one opens there.
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  var data = event.notification.data;
  var scope = self.registration.scope;
  var hash = papayaScreen_(data && data.url);
  var target = scope + hash;
  event.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var w = list[i];
      if (typeof w.url === 'string' && w.url.indexOf(scope) === 0 && typeof w.focus === 'function') {
        return w.focus().then(function (f) {
          var c = f || w;
          if (hash && typeof c.navigate === 'function') return c.navigate(target).then(null, function () {});
        }).then(null, function () {});
      }
    }
    return self.clients.openWindow(target);
  }));
});
