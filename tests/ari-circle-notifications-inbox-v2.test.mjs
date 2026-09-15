import fs from 'node:fs';
import assert from 'node:assert/strict';

const notifications = fs.readFileSync('js/ari-circle/notifications/circle-notifications.js', 'utf8');
const css = fs.readFileSync('assets/css/ari-circle-notifications-v4.css', 'utf8');

assert.match(notifications, /const VERSION = "2\.4\.1"/);
assert.match(notifications, /ari-circle-notifications-v4\.css\?v=2\.4\.1/);
assert.match(notifications, /function messageBundleKey\(/);
assert.match(notifications, /kind: ordered\.length > 1 \? "message-bundle" : "single"/);
assert.match(notifications, /sent you \$\{count\} messages/);
assert.match(notifications, /open-notification-bundle/);
assert.match(notifications, /activateMessageBundle\(/);
assert.match(notifications, /circle-notification-item--request/);
assert.match(notifications, /if \(actions\.childNodes\.length\) article\.appendChild\(actions\)/);
assert.doesNotMatch(notifications, /if \(actions\.childNodes\.length\) body\.appendChild\(actions\)/);
assert.match(notifications, /const href = clean\(notification\?\.data\?\.href\)/);
assert.match(notifications, /url\.origin === window\.location\.origin/);
assert.match(notifications, /window\.location\.assign\(url\.href\)/);
assert.match(notifications, /circle:notification-open-system/);

assert.match(css, /Version: 2\.4\.0/);
assert.match(css, /\.circle-notification-item--request/);
assert.match(css, /grid-column: 2 \/ -1 !important;/);
assert.match(css, /grid-row: 2 !important;/);
assert.match(css, /\.circle-notification-item--bundle/);
assert.match(css, /\.circle-notification-item__count/);
assert.match(css, /\.circle-notifications-toolbar \{[\s\S]*position: absolute !important;/);
assert.match(css, /\.circle-dialog__header \{[\s\S]*padding: 13px 196px 11px 16px !important;/);

// Build 7 mobile stability: notification cards must stay in normal document flow
// and request cards must grow to fit their optional action row instead of overlapping neighbors.
assert.match(css, /\.circle-notifications-list \{[\s\S]*display: flex !important;[\s\S]*flex-direction: column !important;[\s\S]*gap: 6px !important;/);
assert.match(css, /\.circle-notifications-list > \.circle-notification-item \{[\s\S]*flex: 0 0 auto !important;[\s\S]*align-self: stretch !important;/);
assert.match(css, /\.circle-notification-item--request \{[\s\S]*grid-template-rows: minmax\(42px, auto\) max-content !important;[\s\S]*height: max-content !important;[\s\S]*overflow: visible !important;/);
assert.match(css, /\.circle-notification-item__title \{[\s\S]*white-space: normal !important;[\s\S]*overflow-wrap: anywhere !important;/);

console.log('ARI Circle Activity inbox V2 contracts OK');
