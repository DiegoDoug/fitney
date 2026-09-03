import fs from 'node:fs/promises';
import path from 'node:path';
import { plainText, prop, relationContains } from './notion.mjs';
import { filenameFor, field, renderIndex, renderRecord, withFrontMatter } from './render.mjs';

const DEFAULT_CONFIG={outputDir:'.project-memory',projectTitleProperty:'Project Name',projectRelationProperty:'Project',includeImplementationTasks:true,includeReviews:true,writeManifest:true,cleanGeneratedFiles:true};
export async function loadConfig(root=process.cwd()){
  try{return {...DEFAULT_CONFIG,...JSON.parse(await fs.readFile(path.join(root,'project-memory.bridge.json'),'utf8'))};}catch{return DEFAULT_CONFIG;}
}
export async function resolveProject(client,projectsSource,cfg,pageId,projectName){
  if(pageId) return client.retrievePage(pageId);
  if(!projectName) throw new Error('Provide --project-page-id, --project-name, NOTION_PROJECT_PAGE_ID, or NOTION_PROJECT_NAME.');
  const pages=await client.querySource(projectsSource);
  const found=pages.find(p=>plainText(prop(p,cfg.projectTitleProperty)).trim().toLowerCase()===projectName.trim().toLowerCase());
  if(!found) throw new Error(`Project not found in Projects Knowledge: ${projectName}`);
  return found;
}
async function related(client,sourceId,relationProperty,projectId){ const rows=await client.querySource(sourceId); return rows.filter(r=>relationContains(prop(r,relationProperty),projectId)); }
export async function collect(client,s,cfg,project){
  const vals=await Promise.all([related(client,s.decisions,cfg.projectRelationProperty,project.id),related(client,s.adrs,cfg.projectRelationProperty,project.id),related(client,s.requirements,cfg.projectRelationProperty,project.id),related(client,s.issues,cfg.projectRelationProperty,project.id),related(client,s.tasks,cfg.projectRelationProperty,project.id),related(client,s.milestones,cfg.projectRelationProperty,project.id),related(client,s.reviews,cfg.projectRelationProperty,project.id),related(client,s.handoffs,cfg.projectRelationProperty,project.id)]);
  return Object.fromEntries(['decisions','adrs','requirements','issues','tasks','milestones','reviews','handoffs'].map((k,i)=>[k,vals[i]]));
}
function projectFront(p){return {notion_page_id:p.id,notion_url:p.url||null,last_edited:p.last_edited_time||null};}
function projectName(p,cfg){return plainText(prop(p,cfg.projectTitleProperty))||'Project';}
function open(items){return items.filter(p=>!['done','resolved','approved','released','pass','verified','accepted'].includes(field(p,'Status').toLowerCase()));}
export async function writeMemory(root,cfg,project,data){
  const out=path.resolve(root,cfg.outputDir); const dirs=[['decision','decisions',data.decisions],['adr','adrs',data.adrs],['requirement','requirements',data.requirements],['issue','issues',data.issues],['milestone','milestones',data.milestones],['handoff','handoffs',data.handoffs]];
  if(cfg.includeImplementationTasks) dirs.push(['task','tasks',data.tasks]); if(cfg.includeReviews) dirs.push(['review','reviews',data.reviews]);
  if(cfg.cleanGeneratedFiles) await fs.rm(out,{recursive:true,force:true}); await fs.mkdir(out,{recursive:true}); for(const [,d] of dirs) await fs.mkdir(path.join(out,d),{recursive:true});
  for(const [kind,dir,pages] of dirs) for(const page of pages) await fs.writeFile(path.join(out,dir,filenameFor(page,kind)),renderRecord(page,kind));
  const name=projectName(project,cfg),summary=field(project,'Summary'),focus=field(project,'Current Focus'),status=field(project,'Status'),stage=field(project,'Stage'),github=field(project,'Github');
  const readme=withFrontMatter(`# ${name} — Project Memory\n\nGenerated from the canonical Notion Shared Project Memory workspace. **Do not edit generated files by hand.**\n\n## Snapshot\n\n- **Status:** ${status||'—'}\n- **Stage:** ${stage||'—'}\n- **Current focus:** ${focus||'—'}\n- **GitHub:** ${github||'—'}\n\n${renderIndex('Decisions',data.decisions,'decision','decisions')}\n${renderIndex('Architecture Decisions',data.adrs,'adr','adrs')}\n${renderIndex('Requirements',data.requirements,'requirement','requirements')}\n${renderIndex('Open Issues',open(data.issues),'issue','issues')}\n${renderIndex('Roadmap',data.milestones,'milestone','milestones')}\n${renderIndex('Recent Handoffs',data.handoffs,'handoff','handoffs')}`,{...projectFront(project),generated_at:new Date().toISOString(),generator:'notion-project-memory-bridge@0.1.0'});
  await fs.writeFile(path.join(out,'README.md'),readme);
  await fs.writeFile(path.join(out,'PROJECT.md'),withFrontMatter(`# ${name}\n${summary?`\n${summary}\n`:''}\n## Status\n\n${status||'—'}\n\n## Stage\n\n${stage||'—'}\n\n## Current Focus\n\n${focus||'—'}\n\n## Repository\n\n${github||'—'}\n`,projectFront(project)));
  await fs.writeFile(path.join(out,'CURRENT_STATE.md'),withFrontMatter(`# Current State\n\n## Focus\n\n${focus||'—'}\n\n## Unresolved Issues\n\n${open(data.issues).map(i=>`- ${field(i,'Issue')} — ${field(i,'Status')}`).join('\n')||'_None._'}\n\n## Active Implementation\n\n${open(data.tasks).map(t=>`- ${field(t,'Task')} — ${field(t,'Status')} — ${field(t,'Executor')}`).join('\n')||'_None._'}\n\n## Reviews Requiring Attention\n\n${open(data.reviews).map(r=>`- ${field(r,'Review')} — ${field(r,'Status')}`).join('\n')||'_None._'}\n`,{...projectFront(project),generated_at:new Date().toISOString()}));
  const approved=data.requirements.filter(r=>['approved','in build','verified'].includes(field(r,'Status').toLowerCase()));
  const productReqs=approved.filter(r=>['product','functional'].includes(field(r,'Type').toLowerCase())); const uxReqs=approved.filter(r=>field(r,'Type').toLowerCase()==='ux');
  await fs.writeFile(path.join(out,'PRODUCT.md'),`# Product\n\n${productReqs.map(r=>`## ${field(r,'Requirement')}\n\n${field(r,'Description')}\n\n**Acceptance criteria:** ${field(r,'Acceptance Criteria')||'—'}\n`).join('\n')||'_No approved product requirements._\n'}`);
  await fs.writeFile(path.join(out,'UX.md'),`# UX\n\n${uxReqs.map(r=>`## ${field(r,'Requirement')}\n\n${field(r,'Description')}\n\n**Acceptance criteria:** ${field(r,'Acceptance Criteria')||'—'}\n`).join('\n')||'_No approved UX requirements._\n'}`);
  await fs.writeFile(path.join(out,'ARCHITECTURE.md'),`# Architecture\n\n${data.adrs.filter(a=>field(a,'Status').toLowerCase()==='accepted').map(a=>`- **${field(a,'ADR')}** — ${field(a,'Decision')}`).join('\n')||'_No accepted ADRs._'}\n`);
  await fs.writeFile(path.join(out,'ROADMAP.md'),`# Roadmap\n\n${data.milestones.map(m=>`- **${field(m,'Milestone')}** — ${field(m,'Type')} — ${field(m,'Status')} — ${field(m,'Start')||'?'} → ${field(m,'Target')||'?'}`).join('\n')||'_No milestones._'}\n`);
  if(cfg.writeManifest){const manifest={schema_version:1,generated_at:new Date().toISOString(),project:{id:project.id,name,notion_url:project.url||null},counts:Object.fromEntries(Object.entries(data).map(([k,v])=>[k,v.length])),generated_by:'notion-project-memory-bridge@0.1.0'}; await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');}
  return out;
}
