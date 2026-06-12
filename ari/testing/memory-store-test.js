// ari/testing/memory-store-test.js

const memoryStoreTests = [
  "Remember that I prefer Ari to be direct but protective.",
  "I am building Ari Rebirth.",
  "I feel overwhelmed today.",
  "My goal is to make Ari wiser.",
  "I passed my PMH-BC.",
  "Remember that I prefer Ari to ask better questions before giving advice."
];

memoryStoreTests.forEach((test) => {
  console.log("INPUT:", test);
  console.log(window.Ari.memoryStore.add(test));
});

console.log("ALL MEMORIES:", window.Ari.memoryStore.getAll());
console.log("LONG TERM:", window.Ari.memoryStore.getLongTerm());
console.log("CONTEXT:", window.Ari.memoryStore.getContext());