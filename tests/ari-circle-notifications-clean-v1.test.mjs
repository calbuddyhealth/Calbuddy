import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('assets/css/ari-circle-notifications-v4.css', 'utf8');

test('Activity notification sheet owns compact mobile layout', () => {
  assert.match(css, /#circle-notifications-dialog \.circle-notifications-toolbar[\s\S]*flex-direction:\s*row\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-dialog__header \.circle-icon-button[\s\S]*width:\s*40px\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*position:\s*static\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*display:\s*grid\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*!important/);
});

test('Unread notifications use restrained emphasis instead of full card weight', () => {
  assert.match(css, /\.circle-notification-item\[data-read="false"\][\s\S]*background:\s*rgba\(238,244,255,\.40\)\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item,[\s\S]*box-shadow:\s*none\s*!important/);
  assert.match(css, /\.circle-notification-item\[data-read="false"\] \.circle-notification-item__time[\s\S]*color:\s*#4774e8\s*!important/);
});

test('Request actions remain inside their notification row', () => {
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*grid-column:\s*2 \/ -1\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*grid-row:\s*2\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions \.circle-button,[\s\S]*height:\s*34px\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-action[\s\S]*transform:\s*none\s*!important/);
});
