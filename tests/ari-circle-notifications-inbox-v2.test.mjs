import fs from 'node:fs';
import assert from 'node:assert/strict';

const notifications = fs.readFileSync('js/ari-circle/notifications/circle-notifications.js', 'utf8');
const css = fs.readFileSync('assets/css/ari-circle-notifications-v4.css', 'utf8');

assert.match(notifications, /const VERSION = "2\.4\.0"/);
assert.match(notifications, /ari-circle-notifications-v4\.css\?v=2\.4\.0/);
assert.match(notifications, /function messageBundleKey\(/);
assert.match(notifications, /kind: ordered\.length > 1 \? "message-bundle" : "single"/);
assert.match(notifications, /sent you \$\{count\} messages/);
assert.match(notifications, /open-notification-bundle/);
assert.match(notifications, /activateMessageBundle\(/);
assert.match(notifications, /circle-notification-item--request/);
assert.match(notifications, /if \(actions\.childNodes\.length\) article\.appendChild\(actions\)/);
assert.doesNotMatch(notifications, /if \(actions\.childNodes\.length\) body\.appendChild\(actions\)/);

assert.match(css, /Version: 2\.4\.0/);
assert.match(css, /\.circle-notification-item--request/);
assert.match(css, /grid-column: 2 \/ -1 !important;/);
assert.match(css, /grid-row: 2 !important;/);
assert.match(css, /\.circle-notification-item--bundle/);
assert.match(css, /\.circle-notification-item__count/);
assert.match(css, /\.circle-notifications-toolbar \{[\s\S]*position: absolute !important;/);
assert.match(css, /\.circle-dialog__header \{[\s\S]*padding: 13px 196px 11px 16px !important;/);

console.log('ARI Circle Activity inbox V2 contracts OK');
