// Ari Rebirth Pipeline
//
// Purpose:
// Coordinate Ari's canonical runtime by executing each runtime layer
// exactly once in the correct order and returning one authoritative
// Delivery Result.
//
// Responsibilities:
// • Normalize runtime requests.
// • Coordinate runtime lifecycle.
// • Execute runtime layers.
// • Stop execution on fatal failures.
// • Return the authoritative delivery result.
//
// Non-Responsibilities:
// • Does not reason.
// • Does not interpret semantics.
// • Does not route.
// • Does not compose responses.
// • Does not deliver language.
// • Does not access memory directly.
