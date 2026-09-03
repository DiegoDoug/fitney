import { plainText, prop } from './notion.mjs';

const TITLE_PROP = { decision:'Decision', adr:'ADR', requirement:'Requirement', issue:'Issue', task:'Task', milestone:'Milestone', review:'Review', handoff:'Run / Handoff' };
const ID_PROP = { decision:'Decision ID', adr:'ADR ID', requirement:'Requirement ID', issue:'Issue ID', task:'Task ID', milestone:'Milestone ID', review:'Review ID', handoff:'Run ID' };
export function field(page,key){ return plainText(prop(page,key)); }
export function titleOf(page,kind){ return field(page,TITLE_PROP[kind]) || 'Untitled'; }
export function idOf(page,kind){ return field(page,ID_PROP[kind]) || page.id.slice(0,8); }
function slug(s){ return s.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,70); }
export function filenameFor(page,kind){ return `${idOf(page,kind).toLowerCase()}-${slug(titleOf(page,kind)) || 'untitled'}.md`; }
function yamlScalar(v){ if(v==null) return 'null'; return JSON.stringify(String(v)); }
function frontMatter(obj){ return `---\n${Object.entries(obj).map(([k,v])=>`${k}: ${yamlScalar(v)}`).join('\n')}\n---\n\n`; }
function section(name,text){ return text ? `\n## ${name}\n\n${text}\n` : ''; }
export function renderRecord(page,kind){
  const front={id:idOf(page,kind),kind,title:titleOf(page,kind),notion_page_id:page.id,notion_url:page.url||null,created:page.created_time||null,last_edited:page.last_edited_time||null,status:field(page,'Status')||null};
  const fields={
    decision:[['Summary','Summary'],['Area','Area'],['Rationale','Rationale'],['Alternatives','Alternatives'],['Consequences','Consequences'],['Decided By','Decided By'],['Decision Date','Decision Date'],['Implemented','Implemented'],['GitHub Ref','GitHub Ref']],
    adr:[['Context','Context'],['Decision','Decision'],['Consequences','Consequences'],['Date','Date'],['Implemented','Implemented'],['Supersedes','Supersedes'],['GitHub Ref','GitHub Ref']],
    requirement:[['Description','Description'],['Type','Type'],['Priority','Priority'],['Acceptance Criteria','Acceptance Criteria'],['Source','Source'],['Verified','Verified'],['GitHub Ref','GitHub Ref']],
    issue:[['Summary','Summary'],['Type','Type'],['Priority','Priority'],['Evidence','Evidence'],['Proposed Resolution','Proposed Resolution'],['Owner','Owner'],['GitHub Ref','GitHub Ref']],
    task:[['Scope','Scope'],['Priority','Priority'],['Executor','Executor'],['Definition of Done','Definition of Done'],['Due Date','Due Date'],['Verification','Verification'],['Commit / PR','Commit / PR']],
    milestone:[['Objective','Objective'],['Type','Type'],['Start','Start'],['Target','Target'],['Exit Criteria','Exit Criteria'],['GitHub Ref','GitHub Ref']],
    review:[['Scope','Scope'],['Type','Type'],['Reviewer','Reviewer'],['Review Date','Review Date'],['Findings','Findings'],['Conditions','Conditions'],['GitHub Ref','GitHub Ref']],
    handoff:[['Agent','Agent'],['Type','Type'],['Started','Started'],['Completed','Completed'],['Input / Scope','Input / Scope'],['Output Summary','Output Summary'],['Decisions Needed','Decisions Needed'],['GitHub Ref','GitHub Ref']]
  };
  let body=`# ${titleOf(page,kind)}\n`;
  for(const [heading,key] of fields[kind]) body+=section(heading,field(page,key));
  return frontMatter(front)+body.trimEnd()+'\n';
}
export function renderIndex(title,pages,kind,dir){
  const rows=pages.map(p=>`- [${idOf(p,kind)} — ${titleOf(p,kind)}](./${dir}/${filenameFor(p,kind)})${field(p,'Status')?` — **${field(p,'Status')}**`:''}`);
  return `## ${title}\n\n${rows.length?rows.join('\n'):'_None._'}\n`;
}
export function withFrontMatter(body,obj){ return frontMatter(obj)+body; }
