import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

const css = fs.readFileSync('assets/css/ari-circle-notifications-v4.css', 'utf8');

test('Activity notification sheet owns compact mobile layout', () => {
  assert.match(css, /#circle-notifications-dialog \.circle-notifications-toolbar[\s\S]*flex-direction:\s*row\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-dialog__header \.circle-icon-button[\s\S]*width:\s*40px\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*position:\s*static\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions[\s\S]*flex-direction:\s*row\s*!important/);
});

test('Unread notifications use restrained emphasis instead of full card weight', () => {
  assert.match(css, /\.circle-notification-item\[data-read="false"\][\s\S]*rgba\(236,243,255,\.42\)/);
  assert.match(css, /box-shadow:\s*inset 2px 0 0 rgba\(47,100,255,\.22\)\s*!important/);
});

test('Request actions remain inside their notification row', () => {
  assert.match(css, /#circle-notifications-dialog \.circle-notification-item__actions \.circle-button[\s\S]*height:\s*32px\s*!important/);
  assert.match(css, /#circle-notifications-dialog \.circle-notification-action[\s\S]*transform:\s*none\s*!important/);
});
