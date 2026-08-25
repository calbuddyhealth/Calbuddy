import assert from 'node:assert/strict';
import fs from 'node:fs';

const source = fs.readFileSync('js/ari-circle/connections/people-discovery.js', 'utf8');
const members = fs.readFileSync('js/ari-circle/connections/circle-members.js', 'utf8');
const requests = fs.readFileSync('js/ari-circle/connections/connection-requests.js', 'utf8');

assert.match(source, /VERSION = "1\.1\.0"/);
assert.match(source, /import ConnectionRequests from "\.\/connection-requests\.js\?v=1\.1\.0"/);
assert.match(source, /requestIdsByUserId: new Map\(\)/);
assert.match(source, /add\.textContent = "Requested ✓"/);
assert.match(source, /add\.disabled = false/);
assert.match(source, /toggleFriendRequest\(trigger\)/);
assert.match(source, /cancelFriendRequest\(targetUserId\)/);
assert.match(source, /ConnectionRequests\.cancel\(requestId\)/);
assert.match(source, /ConnectionRequests\.addOutgoingRequest\?\.\(saved\)/);
assert.match(source, /Cancel your Circle request to \$\{label\}\?/);
assert.match(source, /EVENT_NAMES\.CONNECTION_CHANGED/);

// Existing Profile and Sent surfaces must keep their cancellation paths.
assert.match(requests, /async cancel\(requestId\)/);
assert.match(members, /label:\s*"Cancel Request"/);
assert.match(members, /async cancelRequest\(/);

console.log('ARI Circle Discover request cancellation contract passed.');
