#!/usr/bin/env node
import fs from 'node:fs/promises'; import path from 'node:path';
import { NotionBridgeClient } from './notion.mjs'; import { collect,loadConfig,resolveProject,writeMemory } from './sync.mjs';
const args=process.argv.slice(2); const cmd=args[0]||'sync';
function arg(name){const i=args.indexOf(name); return i>=0?args[i+1]:undefined;}
function requiredEnv(name, legacyName){
  const v=process.env[name] || (legacyName ? process.env[legacyName] : undefined);
  if(!v) throw new Error(`${name} is required.`);
  return v;
}
function sources(){return {
  projects:requiredEnv('NOTION_PROJECTS_DATA_SOURCE_ID','NOTION_PROJECTS_DB_ID'),
  decisions:requiredEnv('NOTION_DECISIONS_DATA_SOURCE_ID','NOTION_DECISIONS_DB_ID'),
  adrs:requiredEnv('NOTION_ADRS_DATA_SOURCE_ID','NOTION_ADRS_DB_ID'),
  requirements:requiredEnv('NOTION_REQUIREMENTS_DATA_SOURCE_ID','NOTION_REQUIREMENTS_DB_ID'),
  issues:requiredEnv('NOTION_ISSUES_DATA_SOURCE_ID','NOTION_ISSUES_DB_ID'),
  tasks:requiredEnv('NOTION_TASKS_DATA_SOURCE_ID','NOTION_TASKS_DB_ID'),
  milestones:requiredEnv('NOTION_MILESTONES_DATA_SOURCE_ID','NOTION_MILESTONES_DB_ID'),
  reviews:requiredEnv('NOTION_REVIEWS_DATA_SOURCE_ID','NOTION_REVIEWS_DB_ID'),
  handoffs:requiredEnv('NOTION_HANDOFFS_DATA_SOURCE_ID','NOTION_HANDOFFS_DB_ID')
};}
try{
  const root=path.resolve(arg('--root')||process.cwd()); const cfg=await loadConfig(root);
  if(cmd==='check'){const m=JSON.parse(await fs.readFile(path.resolve(root,cfg.outputDir,'manifest.json'),'utf8')); console.log(`Project memory present: ${m.project?.name||'unknown'}; generated ${m.generated_at}`);}
  else if(cmd==='sync'){const s=sources(); const client=new NotionBridgeClient(requiredEnv('NOTION_TOKEN')); const project=await resolveProject(client,s.projects,cfg,arg('--project-page-id')||process.env.NOTION_PROJECT_PAGE_ID,arg('--project-name')||process.env.NOTION_PROJECT_NAME); const data=await collect(client,s,cfg,project); console.log(`Generated ${await writeMemory(root,cfg,project,data)}`);}
  else throw new Error(`Unknown command: ${cmd}`);
}catch(err){console.error(err instanceof Error?err.message:String(err)); process.exitCode=1;}
