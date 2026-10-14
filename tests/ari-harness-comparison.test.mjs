import test from 'node:test';
import assert from 'node:assert/strict';
import { comparisonBody, runComparisonPair } from '../api/_lib/ari-vnext/harness-comparison.js';
const prepared={instructions:'Full current harness',baselineInstructions:'Basic assistant',input:[{role:'user',content:'Identical facts'}],tier:'direct'};
test('only instructions differ; no hidden history, tools or fallback',()=>{
 const on=comparisonBody({prepared,variant:'with_harness',model:'gpt-6.1-sol'});
 const off=comparisonBody({prepared,variant:'without_harness',model:'gpt-6.1-sol'});
 assert.notEqual(on.instructions,off.instructions);delete on.instructions;delete off.instructions;
 assert.deepEqual(on,off);assert.equal(on.store,false);assert.equal(on.tools,undefined);assert.equal(on.previous_response_id,undefined);
 assert.throws(()=>comparisonBody({prepared,variant:'with_harness',model:'gpt-6-astra'}));
});
test('calls both variants once, records actual usage and output',async()=>{
 const bodies=[];const fetchImpl=async(url,opts)=>{const b=JSON.parse(opts.body);bodies.push(b);return {ok:true,status:200,json:async()=>({status:'completed',model:b.model,id:'response',usage:{input_tokens:30,output_tokens:20},output:[{type:'message',content:[{type:'output_text',text:'Answer'}]}]})}};
 const r=await runComparisonPair({prepared,model:'gpt-6.1-sol',apiKey:'test-only',fetchImpl,firstVariant:'without_harness'});
 assert.equal(r.valid,true);assert.equal(bodies.length,2);assert.ok(bodies[0].instructions.startsWith(prepared.baselineInstructions));
 assert.deepEqual(bodies[0].input,bodies[1].input);assert.equal(r.candidates[0].usage.input_tokens,30);
 assert.deepEqual(new Set(r.candidates.map(c=>c.variant)),new Set(['with_harness','without_harness']));
});
test('incomplete outputs and model mismatch invalidate the pair; never retry',async()=>{
 let calls=0;const fetchImpl=async()=>({ok:true,status:200,json:async()=>({status:++calls===1?'incomplete':'completed',model:'other-model',output:[{type:'message',content:[{type:'output_text',text:'Partial'}]}]})});
 const r=await runComparisonPair({prepared,model:'gpt-6.1-sol',apiKey:'test-only',fetchImpl});assert.equal(r.valid,false);assert.equal(calls,2);
});
test('transport failure remains visible and the independent arm still runs',async()=>{
 let calls=0;const fetchImpl=async()=>{calls++;throw Error('connection')};
 const r=await runComparisonPair({prepared,model:'gpt-6.1-sol',apiKey:'test-only',fetchImpl});assert.equal(calls,2);assert.equal(r.valid,false);assert.ok(r.candidates.every(c=>!c.valid));
});

test('current Ari prepares all fixture prompts without external calls or persistence',async()=>{
 const {runAriVNext}=await import('../api/_lib/ari-vnext/orchestrator.js');
 const {COMPARISON_CASES}=await import('../api/_lib/ari-vnext/harness-comparison.js');
 const oldFetch=globalThis.fetch;let externalCalls=0;
 globalThis.fetch=async()=>{externalCalls++;throw Error('Unexpected external call')};
 try {
  for(const task of COMPARISON_CASES){
   const turn={userId:'fixture-owner',message:task.prompt,history:[],memory:'',preferences:{},context:{intelligenceEntitlement:{ownerEligible:true,advancedEnabled:true,accessClass:'owner',cognitiveLoopEnabled:true}},createdAt:'2026-10-14T12:00:00.000Z'};
   const p=await runAriVNext(turn,{prepareComparison:true});
   assert.ok(p.instructions.includes('ARI DELIBERATION HARNESS'));assert.ok(p.input.length);
   assert.equal(p.baselineInstructions.includes('ARI DELIBERATION HARNESS'),false);
  }
  await assert.rejects(runAriVNext({message:'test',context:{}},{prepareComparison:true}),/Owner comparison/);
  assert.equal(externalCalls,0);
 } finally {globalThis.fetch=oldFetch;}
});

test('HTTP endpoint denies absent and non-owner identity before storage or model calls',async()=>{
 const {default:handler}=await import('../api/ari-harness-comparison.js');
 const oldFetch=globalThis.fetch,oldOwner=process.env.ARI_OWNER_USER_ID;process.env.ARI_OWNER_USER_ID='fixture-owner';
 let calls=0;globalThis.fetch=async()=>{calls++;return {ok:true,json:async()=>({id:'not-the-owner'})}};
 const response=()=>({code:null,setHeader(){},status(n){this.code=n;return this},json(v){this.body=v;return this}});
 try{let res=response();await handler({method:'POST',headers:{},body:{}},res);assert.equal(res.code,403);assert.equal(calls,0);
 res=response();await handler({method:'GET',headers:{authorization:'Bearer fixture'}},res);assert.equal(res.code,403);assert.equal(calls,1);
 }finally{globalThis.fetch=oldFetch;if(oldOwner===undefined)delete process.env.ARI_OWNER_USER_ID;else process.env.ARI_OWNER_USER_ID=oldOwner;}
});
