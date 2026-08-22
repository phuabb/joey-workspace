"use strict";

const STATE_KEY="joey-workspace-v6";
const LEGACY_KEY="joey-workspace-v2";
const DAY=86400000;
const $=selector=>document.querySelector(selector);
const $$=selector=>[...document.querySelectorAll(selector)];
const uid=()=>globalThis.crypto?.randomUUID?.()||`${Date.now().toString(36)}-${Math.random().toString(36).slice(2,9)}`;
const iso=value=>new Date(value).toISOString().slice(0,10);
const plusDays=count=>iso(Date.now()+count*DAY);
const today=()=>iso(Date.now());
const esc=value=>String(value??"").replace(/[&<>'"]/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;","'":"&#39;",'"':"&quot;"})[char]);
const fmtDate=value=>value?new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric"}).format(new Date(`${value}T12:00:00`)):"未设置";
const daysUntil=value=>value?Math.ceil((new Date(`${value}T23:59:59`)-Date.now())/DAY):9999;
const statusText={todo:"待办",doing:"进行中",waiting:"等待回复",done:"已完成"};

const templates={
  campaign:["确认 Campaign 目标与核心信息","完成创意概念与传播框架","确认主视觉与渠道物料清单","推进设计制作与审核","完成上线检查与数据复盘"],
  collab:["确认合作目标、权益与双方负责人","推进合同及关键时间节点","确认产品、物料和交付清单","完成联合传播与上线准备","核对履约结果并完成复盘"],
  event:["确认活动目标、时间与场地","完成方案、预算和供应商确认","准备现场物料与人员分工","执行现场检查与应急预案","整理数据、照片与活动复盘"],
  blank:[""]
};

function seedState(){return{version:6,projects:[
  {id:"dubbing",name:"第二届配音挑战赛",objective:"完成赛事概念、小程序漏斗、全国物料与上线推进",stage:"创意与物料推进",deadline:plusDays(18),impact:3,leadership:3,riskNote:"部分物料节点存在延期风险",archived:false,createdAt:Date.now()-10*DAY,tasks:[
    {id:uid(),title:"确认主视觉最后一轮修改",status:"doing",due:today(),urgent:3,today:true,notes:"确认修改是否符合最终发布比例",createdAt:Date.now()-DAY},
    {id:uid(),title:"补齐 RR 物料清单与负责人",status:"todo",due:plusDays(1),urgent:2,today:false,notes:"",createdAt:Date.now()-DAY},
    {id:uid(),title:"跟进小程序漏斗页面反馈",status:"waiting",due:plusDays(2),urgent:2,today:false,waitingSince:plusDays(-3),notes:"等待产品团队反馈",createdAt:Date.now()-DAY}
  ],milestones:[{id:uid(),text:"赛事方案确认",date:plusDays(-7),status:"done"},{id:uid(),text:"主视觉与物料定稿",date:plusDays(5),status:"doing"},{id:uid(),text:"小程序联调",date:plusDays(11),status:"todo"},{id:uid(),text:"全国上线",date:plusDays(18),status:"todo"}],partners:["设计：等待最后一轮修改稿","产品：等待小程序漏斗反馈"],notes:["周报需同步开放决策、风险与下一步。"],links:[]},
  {id:"rituals",name:"EF × Rituals 联名",objective:"完成产品履约、积分商城上新与跨地区派发",stage:"履约与上线",deadline:plusDays(9),impact:3,leadership:3,riskNote:"兑换券适用地区与派发城市需要复核",archived:false,createdAt:Date.now()-8*DAY,tasks:[
    {id:uid(),title:"复核产品到仓与物流单号",status:"todo",due:today(),urgent:3,today:true,notes:"",createdAt:Date.now()-DAY},
    {id:uid(),title:"确认兑换券调拨与身体乳分配",status:"doing",due:today(),urgent:3,today:true,notes:"",createdAt:Date.now()-DAY},
    {id:uid(),title:"向合作方催要缺失物料",status:"waiting",due:plusDays(1),urgent:3,today:false,waitingSince:plusDays(-2),notes:"",createdAt:Date.now()-DAY}
  ],milestones:[{id:uid(),text:"联名 KV",date:plusDays(-4),status:"done"},{id:uid(),text:"产品到仓",date:plusDays(2),status:"doing"},{id:uid(),text:"地区分配确认",date:plusDays(3),status:"doing"},{id:uid(),text:"积分商城上线",date:plusDays(9),status:"todo"}],partners:["合作方：待补物流单号","仓库：待确认完整到货"],notes:["对外同步前再次核对兑换券可用城市。"],links:[]}
],inbox:[{id:uid(),text:"下次项目周报增加‘需要领导决策’一栏",createdAt:Date.now()-3600000}]}}

function normalizeProject(project){return{
  id:String(project.id||uid()),name:project.name||"未命名项目",objective:project.objective||"",stage:project.stage||project.phase||"准备启动",deadline:project.deadline||project.due||plusDays(30),impact:+project.impact||2,leadership:+project.leadership||2,riskNote:project.riskNote||project.risk||"",archived:Boolean(project.archived),createdAt:project.createdAt||Date.now(),
  tasks:(project.tasks||[]).map(task=>({id:String(task.id||uid()),title:task.title||"未命名待办",status:task.status||(task.done?"done":"todo"),due:task.due&&/^\d{4}-\d{2}-\d{2}$/.test(task.due)?task.due:"",urgent:+task.urgent||({critical:3,high:2,normal:1}[task.level]||2),today:Boolean(task.today),notes:task.notes||"",waitingSince:task.waitingSince||task.waiting||undefined,createdAt:task.createdAt||Date.now()})),
  milestones:(project.milestones||[]).map(item=>Array.isArray(item)?{id:uid(),text:item[0],date:item[1],status:item[2]}:{id:item.id||uid(),text:item.text||"里程碑",date:item.date||plusDays(7),status:item.status||"todo"}),
  partners:[...(project.partners||[])],notes:[...(project.notes||[])],links:[...(project.links||[])].map(link=>typeof link==="string"?{id:uid(),name:link,url:link}:{id:link.id||uid(),name:link.name||link.url,url:link.url})
}}

function loadState(){
  try{const saved=JSON.parse(localStorage.getItem(STATE_KEY));if(saved?.projects)return{version:6,projects:saved.projects.map(normalizeProject),inbox:Array.isArray(saved.inbox)?saved.inbox:[]}}catch{}
  try{const legacy=JSON.parse(localStorage.getItem(LEGACY_KEY));if(legacy?.projects){const projects=legacy.projects.map(project=>normalizeProject(project));return{version:6,projects,inbox:[]}}}catch{}
  return seedState();
}

let state=loadState();
let currentView="today";
let currentProjectId=null;
let activeProjectTab="overview";
let projectFilter="active";
let projectQuery="";
let taskLayout="list";
let currentFileProjectId=null;
let saveTimer;

function persist(){
  localStorage.setItem(STATE_KEY,JSON.stringify(state));
  $("#saveStatus").textContent="正在保存…";
  clearTimeout(saveTimer);
  saveTimer=setTimeout(()=>{$("#saveStatus").textContent="本机已保存"},280);
}

function commit({detail=true}={}){persist();renderShell();renderToday();renderProjects();renderInbox();if(detail&&currentProjectId&&currentView==="project-detail")renderProjectDetail(currentProjectId,true)}
function projectById(id){return state.projects.find(project=>project.id===id)}
function allTasks(){return state.projects.flatMap(project=>project.tasks.map(task=>({...task,projectId:project.id,projectName:project.name,project}))) }
function isOpen(task){return task.status!=="done"}
function taskPriority(task,project){let score=0,reasons=[],days=daysUntil(task.due);if(days<0){score+=50;reasons.push("已逾期")}else if(days===0){score+=42;reasons.push("今天截止")}else if(days<=2){score+=26;reasons.push(`剩${days}天`)}else if(days<=7){score+=12;reasons.push("本周截止")}if(task.today){score+=20;reasons.push("已加入今天")}if(task.urgent===3){score+=18;reasons.push("紧急")}else if(task.urgent===2)score+=8;if(project.impact===3){score+=12;reasons.push("项目影响高")}if(project.leadership===3){score+=12;reasons.push("领导关注高")}if(task.status==="waiting"){score+=10;reasons.push("等待回复")}return{score,reasons}}
function projectProgress(project){if(!project.tasks.length)return 0;return Math.round(project.tasks.filter(task=>task.status==="done").length/project.tasks.length*100)}
function riskInfo(project){const open=project.tasks.filter(isOpen),overdue=open.filter(task=>daysUntil(task.due)<0),dueSoon=open.filter(task=>daysUntil(task.due)>=0&&daysUntil(task.due)<=2),waiting=open.filter(task=>task.status==="waiting"&&daysUntil(task.waitingSince||today())<=-2);let reasons=[];if(overdue.length)reasons.push(`${overdue.length} 项逾期`);if(dueSoon.length)reasons.push(`${dueSoon.length} 项临近截止`);if(waiting.length)reasons.push(`${waiting.length} 项等待过久`);if(project.riskNote)reasons.push(project.riskNote);return{risky:reasons.length>0,reasons,overdue:overdue.length,dueSoon:dueSoon.length,waiting:waiting.length}}
function taskDatePill(task){const days=daysUntil(task.due);if(!task.due)return'<span class="pill">无日期</span>';if(days<0)return'<span class="pill red">已逾期</span>';if(days===0)return'<span class="pill red">今天截止</span>';if(days<=2)return`<span class="pill amber">剩 ${days} 天</span>`;return`<span class="pill">${esc(fmtDate(task.due))}</span>`}

function renderTaskRow(task,project,showProject=true){const priority=taskPriority(task,project);return`<div class="task-row"><button class="task-check ${task.status==="done"?"done":""}" data-action="toggle-task" data-project="${project.id}" data-task="${task.id}" aria-label="切换完成状态">${task.status==="done"?"✓":""}</button><button class="task-main" data-action="edit-task" data-project="${project.id}" data-task="${task.id}"><div class="task-title ${task.status==="done"?"done":""}">${esc(task.title)}</div><div class="meta">${showProject?`<span class="pill">${esc(project.name)}</span>`:""}${taskDatePill(task)}${task.status==="waiting"?'<span class="pill amber">等待回复</span>':""}${priority.reasons.slice(0,1).map(reason=>`<span class="pill">${esc(reason)}</span>`).join("")}</div></button><span class="priority-score">P${priority.score}</span></div>`}

function renderShell(){
  const activeProjects=state.projects.filter(project=>!project.archived);
  const todayCount=allTasks().filter(task=>isOpen(task)&&(task.today||daysUntil(task.due)<=0)).length;
  $("#drawerTodayCount").textContent=todayCount;
  $("#drawerInboxCount").textContent=state.inbox.length;
  $("#drawerProjects").innerHTML=activeProjects.map(project=>`<button data-action="open-project" data-project="${project.id}"><span>${esc(project.name.slice(0,1))}</span>${esc(project.name)}</button>`).join("")||'<div class="empty">暂无项目</div>';
  const projectOptions=activeProjects.map(project=>`<option value="${project.id}">${esc(project.name)}</option>`).join("");
  $("#taskProjectSelect").innerHTML=projectOptions;
  $("#convertProjectSelect").innerHTML=projectOptions;
}

function renderToday(){
  const open=allTasks().filter(isOpen),must=open.filter(task=>task.today||daysUntil(task.due)<=0).sort((a,b)=>taskPriority(b,b.project).score-taskPriority(a,a.project).score),waiting=open.filter(task=>task.status==="waiting"),risky=state.projects.filter(project=>!project.archived&&riskInfo(project).risky);
  $("#todayDate").textContent=new Intl.DateTimeFormat("zh-CN",{month:"long",day:"numeric",weekday:"long"}).format(new Date());
  $("#todayStats").innerHTML=`<div class="stat-card"><span>今日必须完成</span><strong>${must.length}</strong></div><div class="stat-card danger"><span>已经逾期</span><strong>${open.filter(task=>daysUntil(task.due)<0).length}</strong></div><div class="stat-card"><span>风险项目</span><strong>${risky.length}</strong></div><div class="stat-card"><span>等待回复</span><strong>${waiting.length}</strong></div>`;
  $("#todayTasks").innerHTML=must.length?must.map(task=>renderTaskRow(task,task.project,true)).join(""):'<div class="empty">今天没有必须完成的任务。可从项目中加入“今天”。</div>';
  const alerts=[];risky.forEach(project=>{const info=riskInfo(project);alerts.push(`<div class="alert-row"><strong>${esc(project.name)}</strong><p>${info.reasons.map(esc).join(" · ")}</p></div>`)});waiting.filter(task=>daysUntil(task.waitingSince||today())<=-2).forEach(task=>alerts.push(`<div class="alert-row"><strong>该催办了 · ${esc(task.title)}</strong><p>${esc(task.projectName)} · 已等待 ${Math.max(2,-daysUntil(task.waitingSince))} 天</p></div>`));
  $("#todayAlerts").innerHTML=alerts.slice(0,5).join("")||'<div class="empty">目前没有明显风险</div>';
  $("#todayProjects").innerHTML=state.projects.filter(project=>!project.archived).slice(0,4).map(project=>`<div class="mini-project" data-action="open-project" data-project="${project.id}"><div><strong>${esc(project.name)}</strong><small>${esc(project.stage)} · ${project.tasks.filter(isOpen).length} 项待办</small></div><div class="mini-progress" style="--progress:${projectProgress(project)*3.6}deg"><b>${projectProgress(project)}%</b></div></div>`).join("")||'<div class="empty">暂无项目</div>';
}

function projectMatches(project){const text=`${project.name} ${project.objective} ${project.stage} ${project.tasks.map(task=>task.title).join(" ")}`.toLowerCase();if(projectQuery&&!text.includes(projectQuery.toLowerCase()))return false;const info=riskInfo(project);if(projectFilter==="archived")return project.archived;if(project.archived)return false;if(projectFilter==="risk")return info.risky;if(projectFilter==="week")return daysUntil(project.deadline)>=0&&daysUntil(project.deadline)<=7;if(projectFilter==="waiting")return project.tasks.some(task=>task.status==="waiting"&&isOpen(task));return true}
function renderProjects(){
  const projects=state.projects.filter(projectMatches);
  $("#projectGrid").innerHTML=projects.map(project=>{const info=riskInfo(project),progress=projectProgress(project);return`<button class="project-card" data-action="open-project" data-project="${project.id}"><div class="project-card-head"><span class="project-symbol">${esc(project.name.slice(0,1))}</span><span class="pill">${project.archived?"已归档":esc(project.stage)}</span></div><h2>${esc(project.name)}</h2><p>${esc(project.objective||"尚未填写项目目标")}</p><div class="progress-bar"><i style="width:${progress}%"></i></div><div class="project-card-meta"><span>${progress}%</span><span>${project.tasks.filter(isOpen).length} 项待办 · ${fmtDate(project.deadline)}</span></div><span class="risk-badge ${info.risky?"risk":""}">${info.risky?esc(info.reasons[0]):"进度正常"}</span></button>`}).join("")+(!projectQuery&&projectFilter==="active"?'<button class="project-card new-project-card" data-action="new-project"><b>＋</b><strong>新建项目</strong><small>项目名称＋多行待办</small></button>':"");
}

function renderInbox(){
  $("#inboxList").innerHTML=state.inbox.length?state.inbox.sort((a,b)=>b.createdAt-a.createdAt).map(item=>`<div class="inbox-row"><span class="inbox-dot"></span><div class="inbox-copy"><button data-action="edit-inbox" data-inbox="${item.id}">${esc(item.text)}</button><small>${new Intl.DateTimeFormat("zh-CN",{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}).format(new Date(item.createdAt))}</small></div><div class="inbox-actions"><button data-action="convert-inbox" data-inbox="${item.id}">转为待办</button></div></div>`).join(""):'<div class="empty">收集箱是空的。临时事项可以先放在这里。</div>';
}

function renderAll(){renderShell();renderToday();renderProjects();renderInbox()}

function activateProjectTab(tab){activeProjectTab=tab;$$('#projectDetail [data-project-tab]').forEach(button=>button.classList.toggle("active",button.dataset.projectTab===tab));$$('#projectDetail [data-tab-panel]').forEach(panel=>panel.classList.toggle("active",panel.dataset.tabPanel===tab))}
function renderEditableRows(project,type,items,label){return`${items.map((item,index)=>`<button class="editable-row" data-action="edit-item" data-project="${project.id}" data-type="${type}" data-index="${index}"><span><strong>${esc(typeof item==="string"?item:item.text)}</strong><small>${type==="milestones"?`${fmtDate(item.date)} · ${statusText[item.status]}`:label}</small></span><span class="row-edit">编辑 ›</span></button>`).join("")}<button class="section-add" data-action="add-item" data-project="${project.id}" data-type="${type}">＋ 添加${label}</button>`}
function renderProjectDetail(id,keepTab=false){
  const project=projectById(id);if(!project)return showView("projects");
  if(!keepTab||currentProjectId!==id)activeProjectTab="overview";currentProjectId=id;
  const info=riskInfo(project),progress=projectProgress(project),open=project.tasks.filter(isOpen).sort((a,b)=>taskPriority(b,project).score-taskPriority(a,project).score);
  const boardStatuses=[["todo","待办"],["doing","进行中"],["waiting","等待回复"],["done","已完成"]];
  const board=boardStatuses.map(([status,label])=>`<div class="board-column"><h3>${label} · ${project.tasks.filter(task=>task.status===status).length}</h3>${project.tasks.filter(task=>task.status===status).map(task=>`<button class="board-task" data-action="edit-task" data-project="${project.id}" data-task="${task.id}"><strong>${esc(task.title)}</strong><div class="meta">${taskDatePill(task)}</div></button>`).join("")||'<div class="empty">暂无</div>'}</div>`).join("");
  $("#projectDetail").innerHTML=`
    <div class="detail-actions"><button class="back-button" data-view="projects">← 返回所有项目</button><div><button class="secondary" data-action="archive-project" data-project="${project.id}">${project.archived?"恢复":"归档"}</button><button class="secondary" data-action="duplicate-project" data-project="${project.id}">复制</button><button class="primary" data-action="edit-project" data-project="${project.id}">编辑项目</button></div></div>
    <div class="project-hero"><div><p class="eyebrow">${esc(project.stage)}</p><h1>${esc(project.name)}</h1><p>${esc(project.objective||"尚未填写项目目标，点击“编辑项目”补充。")}</p></div><div class="project-percent">${progress}%</div></div>
    <div class="progress-bar"><i style="width:${progress}%"></i></div>
    <div class="risk-panel"><strong>${info.risky?"当前风险":"项目状态正常"}</strong><p>${info.risky?info.reasons.map(esc).join(" · "):"没有逾期、临近截止或等待过久的事项。"}</p></div>
    <div class="tabs"><button data-project-tab="overview">总览</button><button data-project-tab="tasks">任务</button><button data-project-tab="timeline">时间</button><button data-project-tab="files">文件</button><button data-project-tab="info">资料与复盘</button></div>
    <section class="tab-panel" data-tab-panel="overview"><div class="overview-grid"><div class="panel"><div class="panel-head"><div><p class="eyebrow">NEXT ACTIONS</p><h2>下一步任务</h2></div><button class="text-button" data-action="new-task" data-project="${project.id}">＋ 添加</button></div>${open.length?open.slice(0,6).map(task=>renderTaskRow(task,project,false)).join(""):'<div class="empty">暂无未完成任务</div>'}</div><div class="panel"><div class="panel-head"><div><p class="eyebrow">HEALTH</p><h2>项目健康度</h2></div></div><div class="health-list"><div class="health-item"><span>自动进度</span><strong>${progress}%</strong></div><div class="health-item"><span>项目截止</span><strong>${fmtDate(project.deadline)}</strong></div><div class="health-item"><span>未完成任务</span><strong>${open.length} 项</strong></div><div class="health-item"><span>风险项</span><strong>${info.reasons.length} 项</strong></div></div></div></div></section>
    <section class="tab-panel" data-tab-panel="tasks"><div class="board-toolbar"><div class="segmented"><button class="${taskLayout==="list"?"active":""}" data-action="task-layout" data-layout="list">列表</button><button class="${taskLayout==="board"?"active":""}" data-action="task-layout" data-layout="board">看板</button></div><button class="primary" data-action="new-task" data-project="${project.id}">＋ 添加任务</button></div>${taskLayout==="list"?`<div class="panel">${project.tasks.length?project.tasks.map(task=>renderTaskRow(task,project,false)).join(""):'<div class="empty">暂无任务</div>'}</div>`:`<div class="board">${board}</div>`}</section>
    <section class="tab-panel" data-tab-panel="timeline"><div class="panel"><div class="panel-head"><div><p class="eyebrow">MILESTONES</p><h2>里程碑与截止</h2></div></div>${renderEditableRows(project,"milestones",project.milestones,"里程碑")}</div></section>
    <section class="tab-panel" data-tab-panel="files"><div class="panel"><div class="file-summary"><div><p class="eyebrow">PROJECT FILES</p><h2>项目文件</h2><p>文件保存在当前设备，可离线打开；在线链接需要联网。</p></div><button class="primary" data-action="add-file" data-project="${project.id}">＋ 添加文件</button></div><div id="projectFiles"><div class="empty">正在读取本机文件…</div></div><div id="projectLinks">${renderProjectLinks(project)}</div></div></section>
    <section class="tab-panel" data-tab-panel="info"><div class="info-grid"><div class="panel"><div class="panel-head"><div><p class="eyebrow">PARTNERS</p><h2>合作方与待回复</h2></div></div>${renderEditableRows(project,"partners",project.partners,"待回复事项")}</div><div class="panel"><div class="panel-head"><div><p class="eyebrow">REVIEW</p><h2>会议记录与复盘</h2></div></div>${renderEditableRows(project,"notes",project.notes,"记录 / 复盘")}</div><div class="panel"><div class="panel-head"><div><p class="eyebrow">PROJECT GOAL</p><h2>目标与说明</h2></div><button class="text-button" data-action="edit-project" data-project="${project.id}">编辑</button></div><p style="color:var(--muted);font-size:12px;line-height:1.7">${esc(project.objective||"尚未填写项目目标")}</p></div></div></section>`;
  activateProjectTab(activeProjectTab);
  loadAndRenderProjectFiles(project.id);
}

function renderProjectLinks(project){return project.links.length?`<div style="margin-top:16px"><div class="panel-head"><div><p class="eyebrow">ONLINE LINKS</p><h2>在线链接</h2></div><button class="text-button" data-action="add-link" data-project="${project.id}">＋ 添加</button></div>${project.links.map((link,index)=>`<div class="link-row"><div><strong>${esc(link.name)}</strong><small>${esc(link.url)}</small></div><div><button data-action="open-link" data-project="${project.id}" data-index="${index}">打开</button><button data-action="edit-link" data-project="${project.id}" data-index="${index}">编辑</button></div></div>`).join("")}</div>`:`<button class="section-add" data-action="add-link" data-project="${project.id}">＋ 添加在线文件链接</button>`}

function showView(view){
  currentView=view;$$('.view').forEach(section=>section.classList.toggle("active",section.id===`view-${view}`));$$('[data-view]').forEach(button=>button.classList.toggle("active",button.dataset.view===view||(view==="project-detail"&&button.dataset.view==="projects")));
  closeDrawer();closeModals();
  const fab=$("#fab");fab.classList.toggle("hidden",view==="tools"||view==="project-detail");
  if(view==="projects"){fab.textContent="＋ 项目";fab.dataset.action="new-project"}else if(view==="inbox"){fab.textContent="＋ 收集";fab.dataset.action="new-inbox"}else{fab.textContent="＋";fab.dataset.action="open-create-menu"}
  if(view==="today")renderToday();if(view==="projects")renderProjects();if(view==="inbox")renderInbox();scrollTo(0,0)
}
function openProject(id){renderProjectDetail(id);showView("project-detail");$("#fab").classList.remove("hidden");$("#fab").textContent="＋ 待办";$("#fab").dataset.action="new-task";$("#fab").dataset.project=id}
function openModal(id){closeModals();$("#"+id)?.classList.add("open");document.body.style.overflow="hidden"}
function closeModals(){$$('.modal-wrap').forEach(modal=>modal.classList.remove("open"));document.body.style.overflow=""}
function openDrawer(){$("#drawer").classList.add("open");$("#drawerBackdrop").classList.add("open");$("#drawer").setAttribute("aria-hidden","false");document.body.style.overflow="hidden"}
function closeDrawer(){$("#drawer").classList.remove("open");$("#drawerBackdrop").classList.remove("open");$("#drawer").setAttribute("aria-hidden","true");document.body.style.overflow=""}
function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),1900)}

function projectTaskRow(value="",taskId=""){
  const row=document.createElement("div");row.className="task-input-row";row.dataset.taskId=taskId;row.innerHTML=`<i></i><input type="text" value="${esc(value)}" placeholder="输入一条待办"><button type="button" aria-label="删除这一行">×</button>`;
  const input=row.querySelector("input"),remove=row.querySelector("button");
  input.addEventListener("keydown",event=>{if(event.key==="Enter"){event.preventDefault();const rows=$$('#projectTaskRows .task-input-row'),index=rows.indexOf(row);if(index===rows.length-1)addProjectTaskRow();setTimeout(()=>$$('#projectTaskRows input')[index+1]?.focus())}});
  input.addEventListener("input",()=>{const rows=$$('#projectTaskRows .task-input-row');if(row===rows.at(-1)&&input.value.trim())addProjectTaskRow()});
  input.addEventListener("paste",event=>{const lines=event.clipboardData.getData("text").split(/\r?\n/).map(line=>line.trim()).filter(Boolean);if(lines.length>1){event.preventDefault();input.value=lines[0];lines.slice(1).forEach(line=>addProjectTaskRow(line));addProjectTaskRow()}});
  remove.onclick=()=>{const rows=$$('#projectTaskRows .task-input-row');if(rows.length===1){input.value="";row.dataset.taskId=""}else row.remove();numberProjectTaskRows()};
  return row;
}
function numberProjectTaskRows(){$$('#projectTaskRows .task-input-row').forEach((row,index)=>row.querySelector("i").textContent=String(index+1).padStart(2,"0"))}
function addProjectTaskRow(value="",taskId=""){$("#projectTaskRows").append(projectTaskRow(value,taskId));numberProjectTaskRows()}
function setProjectTaskRows(tasks){$("#projectTaskRows").innerHTML="";(tasks.length?tasks:[{title:"",id:""}]).forEach(task=>addProjectTaskRow(task.title||"",task.id||""));if(tasks.length)addProjectTaskRow()}

function openProjectModal(project=null){
  const form=$("#projectForm");form.reset();form.elements.id.value=project?.id||"";form.elements.name.value=project?.name||"";form.elements.deadline.value=project?.deadline||plusDays(30);form.elements.stage.value=project?.stage||"准备启动";form.elements.impact.value=project?.impact||2;form.elements.leadership.value=project?.leadership||2;form.elements.objective.value=project?.objective||"";form.elements.riskNote.value=project?.riskNote||"";setProjectTaskRows(project?.tasks||[]);$("#projectModalTitle").textContent=project?"编辑项目":"新建项目";$("#projectSubmit").textContent=project?"保存修改":"创建项目";$("#deleteProject").classList.toggle("hidden",!project);openModal("projectModal");setTimeout(()=>form.elements.name.focus(),250)
}
function openTaskModal(projectId,currentTask=null){
  if(!state.projects.some(project=>!project.archived)){toast("请先创建一个项目");return openProjectModal()}
  const form=$("#taskForm");form.reset();form.elements.id.value=currentTask?.id||"";form.elements.originalProject.value=projectId||"";form.elements.project.value=projectId||state.projects.find(project=>!project.archived)?.id||"";form.elements.title.value=currentTask?.title||"";form.elements.due.value=currentTask?.due||today();form.elements.status.value=currentTask?.status||"todo";form.elements.urgent.value=currentTask?.urgent||2;form.elements.today.checked=Boolean(currentTask?.today);form.elements.notes.value=currentTask?.notes||"";$("#taskModalTitle").textContent=currentTask?"编辑待办":"新建待办";$("#deleteTask").classList.toggle("hidden",!currentTask);openModal("taskModal");setTimeout(()=>form.elements.title.focus(),250)
}
function openInboxModal(item=null){const form=$("#inboxForm");form.reset();form.elements.id.value=item?.id||"";form.elements.text.value=item?.text||"";$("#inboxModalTitle").textContent=item?"编辑记录":"快速记录";$("#deleteInbox").classList.toggle("hidden",!item);openModal("inboxModal")}
function openItemModal(projectId,type,index=""){
  const project=projectById(projectId),form=$("#itemForm"),item=index===""?null:project?.[type]?.[+index],labels={milestones:"里程碑",partners:"待回复事项",notes:"会议记录 / 复盘"};form.reset();form.elements.project.value=projectId;form.elements.type.value=type;form.elements.index.value=index;form.elements.text.value=typeof item==="string"?item:item?.text||"";const milestone=type==="milestones";$(".milestone-only").classList.toggle("hidden",!milestone);form.elements.date.required=milestone;if(milestone){form.elements.date.value=item?.date||plusDays(7);form.elements.status.value=item?.status||"todo"}$("#itemModalTitle").textContent=`${index===""?"添加":"编辑"}${labels[type]}`;$("#itemTextLabel").textContent=labels[type];$("#deleteItem").classList.toggle("hidden",index==="");openModal("itemModal")
}

$("#projectForm").addEventListener("submit",event=>{
  event.preventDefault();const form=event.currentTarget,id=form.elements.id.value.trim(),existing=id?projectById(id):null,name=form.elements.name.value.trim();if(!name)return;
  const rows=$$('#projectTaskRows .task-input-row').map(row=>({id:row.dataset.taskId,title:row.querySelector("input").value.trim()})).filter(row=>row.title);
  const oldTasks=existing?.tasks||[],tasks=rows.map(row=>{const old=oldTasks.find(task=>task.id===row.id);return old?{...old,title:row.title}:{id:uid(),title:row.title,status:"todo",due:"",urgent:2,today:false,notes:"",createdAt:Date.now()}});
  if(existing){Object.assign(existing,{name,deadline:form.elements.deadline.value||existing.deadline,stage:form.elements.stage.value.trim()||"准备启动",impact:+form.elements.impact.value,leadership:+form.elements.leadership.value,objective:form.elements.objective.value.trim(),riskNote:form.elements.riskNote.value.trim(),tasks});currentProjectId=existing.id}
  else{const project={id:uid(),name,deadline:form.elements.deadline.value||plusDays(30),stage:form.elements.stage.value.trim()||"准备启动",impact:+form.elements.impact.value,leadership:+form.elements.leadership.value,objective:form.elements.objective.value.trim(),riskNote:form.elements.riskNote.value.trim(),archived:false,createdAt:Date.now(),tasks,milestones:[],partners:[],notes:[],links:[]};state.projects.unshift(project);currentProjectId=project.id}
  commit({detail:false});closeModals();openProject(currentProjectId);toast(existing?"项目已更新":"项目已创建")
});

$("#taskForm").addEventListener("submit",event=>{
  event.preventDefault();const form=event.currentTarget,id=form.elements.id.value,originalId=form.elements.originalProject.value,targetId=form.elements.project.value,target=projectById(targetId);if(!target)return toast("请选择项目");let oldTask=id?projectById(originalId)?.tasks.find(task=>task.id===id):null;const status=form.elements.status.value,task={id:id||uid(),title:form.elements.title.value.trim(),due:form.elements.due.value,urgent:+form.elements.urgent.value,status,today:form.elements.today.checked,notes:form.elements.notes.value.trim(),waitingSince:status==="waiting"?(oldTask?.waitingSince||today()):undefined,createdAt:oldTask?.createdAt||Date.now()};if(!task.title)return;if(id){const original=projectById(originalId);original.tasks=original.tasks.filter(item=>item.id!==id)}target.tasks.push(task);commit();closeModals();if(currentView==="project-detail"&&currentProjectId)renderProjectDetail(currentProjectId,true);toast(id?"待办已更新":"待办已添加")
});

$("#inboxForm").addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget,id=form.elements.id.value,text=form.elements.text.value.trim();if(!text)return;if(id){const item=state.inbox.find(entry=>entry.id===id);item.text=text}else state.inbox.unshift({id:uid(),text,createdAt:Date.now()});commit({detail:false});closeModals();showView("inbox");toast("已保存到收集箱")});

$("#itemForm").addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget,project=projectById(form.elements.project.value),type=form.elements.type.value,index=form.elements.index.value,text=form.elements.text.value.trim();if(!project||!text)return;const value=type==="milestones"?{id:index===""?uid():project[type][+index].id,text,date:form.elements.date.value,status:form.elements.status.value}:text;if(index==="")project[type].push(value);else project[type][+index]=value;commit();closeModals();activeProjectTab=type==="milestones"?"timeline":"info";renderProjectDetail(project.id,true);toast("内容已保存")});

$("#convertForm").addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget,item=state.inbox.find(entry=>entry.id===form.elements.inbox.value),project=projectById(form.elements.project.value);if(!item||!project)return;project.tasks.push({id:uid(),title:form.elements.title.value.trim(),due:form.elements.due.value,status:"todo",urgent:2,today:false,notes:"来自收集箱",createdAt:Date.now()});state.inbox=state.inbox.filter(entry=>entry.id!==item.id);commit({detail:false});closeModals();showView("inbox");toast("已转为项目待办")});

$("#linkForm").addEventListener("submit",event=>{event.preventDefault();const form=event.currentTarget,project=projectById(form.elements.project.value),index=form.elements.index?.value??"",name=form.elements.name.value.trim(),raw=form.elements.url.value.trim();if(!project)return;let parsed;try{parsed=new URL(raw);if(!["http:","https:"].includes(parsed.protocol))throw new Error()}catch{return toast("请输入有效的 http/https 链接")};const link={id:index===""?uid():project.links[+index].id,name,url:parsed.href};if(index==="")project.links.push(link);else project.links[+index]=link;commit();closeModals();activeProjectTab="files";renderProjectDetail(project.id,true);toast("链接已保存")});

$("#deleteProject").onclick=()=>{const id=$("#projectForm").elements.id.value,project=projectById(id);if(project&&confirm(`确认删除“${project.name}”及其中全部任务？项目文件也会被删除。`)){state.projects=state.projects.filter(item=>item.id!==id);deleteFilesForProject(id);currentProjectId=null;commit({detail:false});closeModals();showView("projects");toast("项目已删除")}};
$("#deleteTask").onclick=()=>{const form=$("#taskForm"),id=form.elements.id.value,project=projectById(form.elements.originalProject.value);if(project&&id&&confirm("确认删除这条待办？")){project.tasks=project.tasks.filter(task=>task.id!==id);commit();closeModals();if(currentProjectId)renderProjectDetail(currentProjectId,true);toast("待办已删除")}};
$("#deleteInbox").onclick=()=>{const id=$("#inboxForm").elements.id.value;if(id&&confirm("确认删除这条收集箱记录？")){state.inbox=state.inbox.filter(item=>item.id!==id);commit({detail:false});closeModals();showView("inbox");toast("记录已删除")}};
$("#deleteItem").onclick=()=>{const form=$("#itemForm"),project=projectById(form.elements.project.value),type=form.elements.type.value,index=form.elements.index.value;if(project&&index!==""&&confirm("确认删除这条内容？")){project[type].splice(+index,1);commit();closeModals();renderProjectDetail(project.id,true);toast("内容已删除")}};

$("#addProjectTaskRow").onclick=()=>{addProjectTaskRow();$$('#projectTaskRows input').at(-1)?.focus()};
$("#templatePicks").addEventListener("click",event=>{const button=event.target.closest("[data-template]");if(!button)return;$$('#templatePicks button').forEach(item=>item.classList.toggle("active",item===button));const current=$$('#projectTaskRows input').some(input=>input.value.trim());if(current&&!confirm("使用模板会替换当前待办，是否继续？"))return;setProjectTaskRows(templates[button.dataset.template].map(title=>({title,id:""})));$$('#projectTaskRows input').find(input=>!input.value)?.focus()});

const FILE_DB="joey-workspace-files-v1",FILE_STORE="files";
let fileDbPromise;
function openFileDb(){if(!fileDbPromise)fileDbPromise=new Promise((resolve,reject)=>{const request=indexedDB.open(FILE_DB,1);request.onupgradeneeded=()=>{const db=request.result,store=db.createObjectStore(FILE_STORE,{keyPath:"id"});store.createIndex("projectId","projectId")};request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)});return fileDbPromise}
async function fileStore(mode="readonly"){const db=await openFileDb();return db.transaction(FILE_STORE,mode).objectStore(FILE_STORE)}
async function putFile(record){const store=await fileStore("readwrite");return new Promise((resolve,reject)=>{const request=store.put(record);request.onsuccess=()=>resolve(record);request.onerror=()=>reject(request.error)})}
async function getFile(id){const store=await fileStore();return new Promise((resolve,reject)=>{const request=store.get(id);request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error)})}
async function getAllFiles(){const store=await fileStore();return new Promise((resolve,reject)=>{const request=store.getAll();request.onsuccess=()=>resolve(request.result||[]);request.onerror=()=>reject(request.error)})}
async function getProjectFiles(projectId){const store=await fileStore();return new Promise((resolve,reject)=>{const request=store.index("projectId").getAll(projectId);request.onsuccess=()=>resolve((request.result||[]).sort((a,b)=>b.createdAt-a.createdAt));request.onerror=()=>reject(request.error)})}
async function removeFile(id){const store=await fileStore("readwrite");return new Promise((resolve,reject)=>{const request=store.delete(id);request.onsuccess=resolve;request.onerror=()=>reject(request.error)})}
async function clearFiles(){const store=await fileStore("readwrite");return new Promise((resolve,reject)=>{const request=store.clear();request.onsuccess=resolve;request.onerror=()=>reject(request.error)})}
async function deleteFilesForProject(projectId){try{const files=await getProjectFiles(projectId);await Promise.all(files.map(file=>removeFile(file.id)))}catch{}}
function inferCategory(file){const name=file.name.toLowerCase();if(name.includes("contract")||name.includes("合同"))return"合同";if(/\.(png|jpg|jpeg|gif|webp|psd|ai)$/i.test(name))return"设计稿";if(/\.(xls|xlsx|csv)$/i.test(name))return"数据";if(name.includes("brief"))return"Brief";return"其他"}
function fileTypeLabel(file){const ext=file.name.split(".").pop()?.slice(0,4).toUpperCase();return ext||"FILE"}
function prettyBytes(bytes){if(bytes<1024)return`${bytes} B`;if(bytes<1048576)return`${(bytes/1024).toFixed(1)} KB`;return`${(bytes/1048576).toFixed(1)} MB`}

async function importProjectFiles(fileList,projectId){
  const files=[...fileList];if(!files.length)return;toast(`正在导入 ${files.length} 个文件…`);
  try{for(const file of files){await putFile({id:uid(),projectId,name:file.name,type:file.type||"application/octet-stream",size:file.size,lastModified:file.lastModified,createdAt:Date.now(),category:inferCategory(file),description:"",blob:file})}closeModals();activeProjectTab="files";renderProjectDetail(projectId,true);toast(`已导入 ${files.length} 个文件`)}catch(error){console.error(error);toast("文件导入失败，请检查本机存储空间")}
}
async function loadAndRenderProjectFiles(projectId){
  const container=$("#projectFiles");if(!container)return;
  try{const files=await getProjectFiles(projectId);if(!$("#projectFiles")||currentProjectId!==projectId)return;container.innerHTML=files.length?files.map(file=>`<div class="file-row"><span class="file-icon">${esc(fileTypeLabel(file))}</span><div><strong>${esc(file.name)}</strong><small>${esc(file.category)} · ${prettyBytes(file.size)} · ${fmtDate(iso(file.createdAt))}</small></div><button data-action="edit-file" data-file="${file.id}">•••</button></div>`).join(""):'<div class="empty">还没有文件。可从“文件”、相册、相机或在线链接添加。</div>'}catch{container.innerHTML='<div class="empty">当前浏览器无法读取本机文件库</div>'}
}
async function updateStorageNote(){if(!navigator.storage?.estimate)return;try{const {usage=0,quota=0}=await navigator.storage.estimate();$("#storageNote").textContent=`本机文件已使用 ${prettyBytes(usage)}${quota?` / 可用约 ${prettyBytes(quota)}`:""}。文件不会公开上传。`}catch{}}
async function openFileRecord(id){const record=await getFile(id);if(!record)return toast("没有找到这个文件");const url=URL.createObjectURL(record.blob);const opened=window.open(url,"_blank");if(!opened){const anchor=document.createElement("a");anchor.href=url;anchor.download=record.name;anchor.click()}setTimeout(()=>URL.revokeObjectURL(url),60000)}
async function openFileEditor(id){const record=await getFile(id);if(!record)return;const form=$("#fileEditForm");form.elements.id.value=record.id;form.elements.project.value=record.projectId;form.elements.name.value=record.name;form.elements.category.value=record.category||"其他";form.elements.description.value=record.description||"";openModal("fileEditModal")}

$("#documentInput").onchange=event=>importProjectFiles(event.target.files,currentFileProjectId).finally(()=>event.target.value="");
$("#photoInput").onchange=event=>importProjectFiles(event.target.files,currentFileProjectId).finally(()=>event.target.value="");
$("#cameraInput").onchange=event=>importProjectFiles(event.target.files,currentFileProjectId).finally(()=>event.target.value="");
$("#fileEditForm").addEventListener("submit",async event=>{event.preventDefault();const form=event.currentTarget,record=await getFile(form.elements.id.value);if(!record)return;record.name=form.elements.name.value.trim();record.category=form.elements.category.value;record.description=form.elements.description.value.trim();await putFile(record);closeModals();activeProjectTab="files";renderProjectDetail(record.projectId,true);toast("文件信息已更新")});
$("#deleteFile").onclick=async()=>{const form=$("#fileEditForm"),id=form.elements.id.value,projectId=form.elements.project.value;if(confirm("确认从本机删除这个文件？")){await removeFile(id);closeModals();activeProjectTab="files";renderProjectDetail(projectId,true);toast("文件已删除")}};
$("#openFile").onclick=()=>openFileRecord($("#fileEditForm").elements.id.value);

function blobToDataUrl(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob)})}
async function dataUrlToBlob(dataUrl){return fetch(dataUrl).then(response=>response.blob())}
function downloadJson(data,filename){const url=URL.createObjectURL(new Blob([JSON.stringify(data)],{type:"application/json"})),anchor=document.createElement("a");anchor.href=url;anchor.download=filename;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
async function exportFullBackup(){
  toast("正在整理完整备份…");try{const files=await getAllFiles(),encoded=[];for(const file of files){encoded.push({...file,blob:undefined,dataUrl:await blobToDataUrl(file.blob)})}downloadJson({format:"joey-workspace-backup",version:6,exportedAt:new Date().toISOString(),state,files:encoded},`Joey工作台完整备份-${today()}.json`);toast(`备份完成 · ${files.length} 个文件`)}catch(error){console.error(error);toast("备份失败，请检查存储空间")}
}
async function restoreBackup(file){
  let backup;try{backup=JSON.parse(await file.text());if(backup.format!=="joey-workspace-backup"||!backup.state?.projects)throw new Error("invalid")}catch{return toast("这不是有效的 Joey 工作台备份")}
  if(!confirm(`将恢复 ${backup.state.projects.length} 个项目和 ${(backup.files||[]).length} 个文件，当前数据会被覆盖。是否继续？`))return;
  toast("正在恢复备份…");try{const next={version:6,projects:backup.state.projects.map(normalizeProject),inbox:backup.state.inbox||[]};await clearFiles();for(const record of backup.files||[]){const blob=await dataUrlToBlob(record.dataUrl);await putFile({...record,dataUrl:undefined,blob})}state=next;currentProjectId=null;persist();renderAll();showView("today");toast("备份已恢复")}catch(error){console.error(error);toast("恢复失败，原备份文件可能不完整")}
}
$("#exportBackup").onclick=exportFullBackup;$("#exportBackup2").onclick=exportFullBackup;
$("#importBackup").onclick=()=>$("#backupInput").click();$("#importBackup2").onclick=()=>$("#backupInput").click();
$("#backupInput").onchange=event=>{const file=event.target.files[0];if(file)restoreBackup(file);event.target.value=""};

function generateOutput(kind){
  const open=allTasks().filter(isOpen).sort((a,b)=>taskPriority(b,b.project).score-taskPriority(a,a.project).score);let title="",text="";
  if(kind==="day"){title="今日工作安排";text=`今天建议按以下顺序推进：\n\n${open.slice(0,7).map((task,index)=>{const priority=taskPriority(task,task.project);return`${index+1}. ${task.title}\n   ${task.projectName}｜${priority.reasons.slice(0,3).join("＋")||"按计划推进"}`}).join("\n\n")||"今天暂无未完成任务。"}\n\n下班前：更新任务状态，记录仍在等待的回复，并确认明天第一优先。`}
  if(kind==="weekly"){title="项目周报 / 领导简报";text=`本周项目简报\n\n${state.projects.filter(project=>!project.archived).map(project=>{const info=riskInfo(project),doing=project.tasks.find(task=>task.status==="doing"),next=project.tasks.filter(isOpen).sort((a,b)=>taskPriority(b,project).score-taskPriority(a,project).score)[0];return`【${project.name}】\n进度：${projectProgress(project)}%｜${project.stage}\n本周重点：${doing?.title||"按计划推进"}\n当前风险：${info.reasons.join("；")||"暂无明显风险"}\n下一步：${next?.title||"等待进入下一阶段"}`}).join("\n\n")||"暂无进行中项目。"}\n\n需要决策：请补充需要领导确认的选项与最晚决策时间。`}
  if(kind==="chase"){title="催办文案";const task=open.find(item=>item.status==="waiting")||open[0];text=task?`事项：${task.title}\n项目：${task.projectName}\n\n友善版：\nHi，想跟进一下「${task.title}」目前的进展。为了不影响后续节点，方便今天同步一下预计完成时间吗？谢谢。\n\n强势版：\nHi，再次跟进「${task.title}」。该事项已经影响后续排期，请于今天下班前明确回复当前进度、剩余问题及最终交付时间。如存在风险，请一并说明解决方案。`:`目前没有可用于催办的待办。`}
  if(kind==="check"){title="项目查漏清单";text=`执行前查漏\n\n□ 项目目标、交付标准和最终负责人\n□ 截止时间、审核时间和备用时间\n□ 文案、尺寸、格式、版权与品牌规范\n□ 数量、地址、联系人、物流单号与到货确认\n□ 合作方承诺是否有书面记录\n□ 各地区是否具备使用或兑换条件\n□ 对外同步口径是否与实际进度一致\n□ 延误情况下的替代方案与升级机制\n□ 最终文件、链接与会议结论是否已经归档`}
  $("#outputTitle").textContent=title;$("#outputText").textContent=text;openModal("outputModal")
}

function openLinkModal(projectId,index=""){
  const project=projectById(projectId),link=index===""?null:project?.links[+index],form=$("#linkForm");if(!project)return;form.reset();form.elements.project.value=projectId;form.elements.index.value=index;form.elements.name.value=link?.name||"";form.elements.url.value=link?.url||"";$("#linkModalTitle").textContent=link?"编辑在线链接":"添加在线链接";$("#deleteLink").classList.toggle("hidden",!link);openModal("linkModal")
}

function duplicateProject(id){const source=projectById(id);if(!source)return;const copy=normalizeProject(JSON.parse(JSON.stringify(source)));copy.id=uid();copy.name=`${source.name}（副本）`;copy.archived=false;copy.createdAt=Date.now();copy.tasks=copy.tasks.map(task=>({...task,id:uid(),status:"todo",today:false,waitingSince:undefined,createdAt:Date.now()}));copy.milestones=copy.milestones.map(item=>({...item,id:uid(),status:"todo"}));copy.links=copy.links.map(link=>({...link,id:uid()}));state.projects.unshift(copy);commit({detail:false});openProject(copy.id);toast("项目已复制，文件未重复复制")}
function toggleArchive(id){const project=projectById(id);if(!project)return;project.archived=!project.archived;commit({detail:false});showView("projects");toast(project.archived?"项目已归档":"项目已恢复")}

document.addEventListener("click",event=>{
  const target=event.target.closest("button,[data-action],[data-view],[data-special]");if(!target)return;
  if(target.dataset.view){showView(target.dataset.view);return}
  if(target.classList.contains("close-modal")){closeModals();return}
  const action=target.dataset.action;
  if(action==="open-create-menu")openModal("createMenuModal");
  if(action==="new-project")openProjectModal();
  if(action==="new-task")openTaskModal(target.dataset.project||currentProjectId||state.projects.find(project=>!project.archived)?.id);
  if(action==="new-inbox")openInboxModal();
  if(action==="open-project")openProject(target.dataset.project);
  if(action==="edit-project")openProjectModal(projectById(target.dataset.project));
  if(action==="duplicate-project")duplicateProject(target.dataset.project);
  if(action==="archive-project")toggleArchive(target.dataset.project);
  if(action==="toggle-task"){const project=projectById(target.dataset.project),task=project?.tasks.find(item=>item.id===target.dataset.task);if(task){task.status=task.status==="done"?"todo":"done";task.today=task.status!=="done"&&task.today;commit();toast(task.status==="done"?"已完成":"已恢复待办")}}
  if(action==="edit-task"){const project=projectById(target.dataset.project),task=project?.tasks.find(item=>item.id===target.dataset.task);if(task)openTaskModal(project.id,task)}
  if(action==="task-layout"){taskLayout=target.dataset.layout;renderProjectDetail(currentProjectId,true)}
  if(target.dataset.projectTab)activateProjectTab(target.dataset.projectTab);
  if(action==="add-item")openItemModal(target.dataset.project,target.dataset.type);
  if(action==="edit-item")openItemModal(target.dataset.project,target.dataset.type,target.dataset.index);
  if(action==="add-file"){currentFileProjectId=target.dataset.project;openModal("fileAddModal");updateStorageNote()}
  if(action==="edit-file")openFileEditor(target.dataset.file);
  if(action==="add-link")openLinkModal(target.dataset.project||currentFileProjectId);
  if(action==="edit-link")openLinkModal(target.dataset.project,target.dataset.index);
  if(action==="open-link"){const link=projectById(target.dataset.project)?.links[+target.dataset.index];if(link){try{const url=new URL(link.url);if(["http:","https:"].includes(url.protocol))window.open(url.href,"_blank","noopener");else toast("这个链接不安全，无法打开")}catch{toast("链接格式不正确")}}}
  if(action==="wechat-guide"){$("#outputTitle").textContent="从微信导入文件";$("#outputText").textContent="1. 在微信中打开文件。\n2. 点击右上角“…”或分享按钮。\n3. 选择“用其他应用打开”或“存储到文件”。\n4. 保存到“我的 iPhone”或 iCloud Drive。\n5. 回到 Joey 工作台，在项目文件中选择“从‘文件’导入”。\n\n由于 iOS 和微信的权限限制，网页应用无法在后台直接读取微信文件；以上路径最稳定。";openModal("outputModal")}
  if(action==="edit-inbox")openInboxModal(state.inbox.find(item=>item.id===target.dataset.inbox));
  if(action==="convert-inbox"){const item=state.inbox.find(entry=>entry.id===target.dataset.inbox),form=$("#convertForm");if(!state.projects.some(project=>!project.archived))return openProjectModal();form.reset();form.elements.inbox.value=item.id;form.elements.title.value=item.text;form.elements.project.value=state.projects.find(project=>!project.archived).id;form.elements.due.value=today();openModal("convertModal")}
  if(target.dataset.special==="templates"){openProjectModal();setTimeout(()=>$('details.advanced').open=true,120)}
  if(target.dataset.special==="archived"){projectFilter="archived";$$('#projectFilters button').forEach(button=>button.classList.toggle("active",button.dataset.filter==="archived"));renderProjects();showView("projects")}
});

$("#projectFilters").addEventListener("click",event=>{const button=event.target.closest("[data-filter]");if(!button)return;projectFilter=button.dataset.filter;$$('#projectFilters button').forEach(item=>item.classList.toggle("active",item===button));renderProjects()});
$("#projectSearch").addEventListener("input",event=>{projectQuery=event.target.value.trim();renderProjects()});
$("#globalSearch").addEventListener("input",event=>{projectQuery=event.target.value.trim();$("#projectSearch").value=projectQuery;if(projectQuery){projectFilter="active";renderProjects();showView("projects");openDrawer()}});
$$('[data-generate]').forEach(button=>button.addEventListener("click",()=>generateOutput(button.dataset.generate)));
$("#copyOutput").onclick=async()=>{try{await navigator.clipboard.writeText($("#outputText").textContent);toast("已复制")}catch{toast("复制失败，请长按选择文字")}};
$("#deleteLink").onclick=()=>{const form=$("#linkForm"),project=projectById(form.elements.project.value),index=form.elements.index.value;if(project&&index!==""&&confirm("确认删除这个链接？")){project.links.splice(+index,1);commit();closeModals();activeProjectTab="files";renderProjectDetail(project.id,true);toast("链接已删除")}};

$("#drawerOpen").onclick=openDrawer;$("#drawerClose").onclick=closeDrawer;$("#drawerBackdrop").onclick=closeDrawer;$("#moreOpen").onclick=()=>openModal("settingsModal");$("#drawerSettings").onclick=()=>openModal("settingsModal");
$("#installGuide").onclick=()=>{$("#outputTitle").textContent="添加到手机桌面";$("#outputText").textContent="iPhone：使用 Safari 打开网站，点击底部“分享”，选择“添加到主屏幕”。首次联网打开一次后，核心页面和已经导入的本机文件可以离线使用。";openModal("outputModal")};
$("#resetWorkspace").onclick=async()=>{if(confirm("确认恢复示例数据？当前项目、待办和本机文件都会被清除。")){state=seedState();await clearFiles();currentProjectId=null;persist();renderAll();closeModals();showView("today");toast("已恢复示例数据")}};
$$('.modal-wrap').forEach(modal=>modal.addEventListener("click",event=>{if(event.target===modal)closeModals()}));
let drawerTouchStart=0;$("#drawer").addEventListener("touchstart",event=>drawerTouchStart=event.touches[0].clientX,{passive:true});$("#drawer").addEventListener("touchend",event=>{if(event.changedTouches[0].clientX-drawerTouchStart<-70)closeDrawer()},{passive:true});

state.projects=state.projects.map(normalizeProject);persist();renderAll();showView("today");
if("serviceWorker"in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>undefined));
