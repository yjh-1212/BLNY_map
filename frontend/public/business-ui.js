(function(){
  const module=document.body.dataset.unifiedModule;if(!module)return;
  const host=()=>document.getElementById(module==='trusted'?'content':'view');
  const roles={platform:'平台管理员',trader:'贸易商业务负责人',fleet:'公路货运调度员',railway:'铁路调度员',port:'港口协同员',shipping:'船商调度员'};
  const routeMaps={
    trusted:{platform:{'access-management':'connectors','product-management':'dataProducts','authorization-ledger':'authorizations','event-subscribe':'events','audit-compliance':'operationLogs'},trader:{'product-management':'dataProducts','use-applications':'requests','authorization-ledger':'authorizations','data-query':'usageLogs'},provider:{'access-management':'connectors','data-conversion':'conversionRules','resource-management':'dataResources','use-applications':'requests','audit-compliance':'usageLogs'}},
    intermodal:{platform:{overview:'orders',orders:'orders','full-monitor':'tasks','exception-center':'exceptions'},trader:{'my-demands':'demands','solution-center':'schemes',orders:'orders','full-monitor':'events','exception-center':'exceptions'},provider:{'resource-pool':'capacities',orders:'tasks','full-monitor':'events','exception-center':'exceptions'}}
  };
  const labels={id:'ID',org_id:'企业ID',trader_org_id:'贸易商ID',applicant_org_id:'申请方ID',provider_org_id:'提供方ID',consumer_org_id:'使用方ID',responsible_org_id:'责任企业ID',reporter_org_id:'报告企业ID',connector_id:'连接器ID',resource_id:'资源ID',source_id:'数据源ID',product_id:'产品ID',demand_id:'需求ID',scheme_id:'方案ID',order_id:'订单ID',task_id:'任务ID',created_at:'创建时间',updated_at:'更新时间',status:'状态'};
  const descriptions={organizations:'管理平台成员企业、组织类型与启停状态。',users:'管理用户账号及所属企业。',roles:'维护系统角色与职责边界。',connectors:'管理本企业原系统与可信数据空间的连接关系、在线状态和服务能力。',dataSources:'维护连接器的数据来源、同步方式和事件转换范围。',dataResources:'登记连接器可对外提供的数据资源。',dataProducts:'发布可申请的查询类或EPCIS事件类数据产品。',requests:'申请或审批数据使用权限，审批通过后自动形成授权。',authorizations:'查看生效授权、有效期、调用余量和使用权限。',conversionRules:'把企业业务状态映射为统一EPCIS事件。',usageLogs:'查看授权数据的查询、订阅和使用留痕。',demands:'创建并提交北粮南运运输需求。',capacities:'维护本企业可参与联运的资源能力。',schemes:'基于已授权的联运能力数据生成、比选并确认联运方案。',orders:'查看方案确认后生成的运输订单。',tasks:'确认并执行本企业负责的运输分段任务。',events:'查看连接器转换发布的EPCIS运输事件。',exceptions:'发起、协同处理并关闭运输或数据异常。',operationLogs:'监管所有角色的查询、审批、转换和业务操作日志。'};
  const resourceTabs={organizations:[['organizations','企业'],['users','用户'],['roles','角色']],connectors:[['connectors','连接器'],['dataSources','数据来源']],dataResources:[['dataResources','数据资源'],['dataProducts','数据产品']],conversionRules:[['conversionRules','转换规则'],['conversionRecords','转换记录'],['conversionErrors','转换异常']],requests:[['requests','申请与审批'],['authorizations','授权记录']],tasks:[['tasks','分段任务'],['events','事件记录']]};
  let state={route:'',resource:'',page:1,limit:10,search:'',status:'',meta:null,items:[],total:0,workflow:null,loading:false,error:''};
  let loadVersion=0;
  const role=()=>localStorage.getItem('blny:role')||'platform';
  const api=async(path,options={})=>{const response=await fetch(`/api/v1${path}`,{...options,headers:{'Content-Type':'application/json','x-role':role(),...(options.headers||{})}});const data=response.status===204?null:await response.json();if(!response.ok)throw new Error(data?.message||`请求失败 ${response.status}`);return data};
  function mapping(route){const r=role(),kind=['fleet','railway','port','shipping'].includes(r)?'provider':r;return routeMaps[module]?.[kind]?.[route]||null}
  function esc(v){return String(v??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]))}
  function tone(v){return ['已完成','已通过','生效中','在线','正常','可用','已上架','成功','已发布'].some(x=>String(v).includes(x))?'green':['待审批','待确认','待执行','草稿','方案生成中'].some(x=>String(v).includes(x))?'amber':['异常','失败','已驳回','停用','已取消'].some(x=>String(v).includes(x))?'red':'blue'}
  function pretty(k){return labels[k]||k.replaceAll('_',' ')}
  function columns(){if(!state.items.length)return state.meta?.fields?.map(x=>x.name)||[];const preferred=['id',...(state.meta?.fields||[]).map(x=>x.name),'status','created_at'];const keys=Object.keys(state.items[0]);return [...new Set(preferred)].filter(x=>keys.includes(x)).slice(0,9)}
  async function load(deferInitialRender=false){const version=++loadVersion,resource=state.resource;state.loading=true;state.error='';if(!deferInitialRender)render();try{const offset=(state.page-1)*state.limit;const [meta,list,workflow]=await Promise.all([api(`/business/${resource}/meta`),api(`/business/${resource}?limit=${state.limit}&offset=${offset}&search=${encodeURIComponent(state.search)}`),api('/workflow/status')]);if(version!==loadVersion||resource!==state.resource)return;state.meta=meta.item;state.items=list.items;state.total=list.total;state.workflow=workflow.item}catch(e){if(version!==loadVersion)return;state.error=e.message;state.items=[]}finally{if(version===loadVersion){state.loading=false;render()}}}
  function flowHtml(){const w=state.workflow;if(!w)return'';const approved=(w.requests||[]).find(x=>x.status==='已通过')?.count||0;const done=(w.tasks||[]).filter(x=>x.status==='已完成').length;const steps=[['运输需求',w.demand?.status||'未创建',!!w.demand],['数据授权',`${approved}/4 已授权`,approved===4],['联运方案',w.scheme?.status||'未生成',!!w.scheme],['运输订单',w.order?.status||'未生成',!!w.order],['分段任务',`${done}/${w.tasks?.length||4} 已完成`,done===4],['审计闭环',w.order?.status==='已完成'?'已形成':'进行中',w.order?.status==='已完成']];let active=steps.findIndex(x=>!x[2]);if(active<0)active=steps.length-1;return `<section class="biz-flow"><div class="biz-flow-head"><b>玉米5,000吨 · 绥化粮库—广东目的港业务闭环</b><span>所有状态均来自SQLite实时数据</span></div><div class="biz-flow-steps">${steps.map((x,i)=>`<div class="biz-flow-step ${x[2]?'done':i===active?'active':''}"><small>0${i+1}</small><b>${esc(x[0])}</b><small>${esc(x[1])}</small></div>`).join('')}</div></section>`}
  function actionButtons(row){
    const r=role(),provider=!['platform','trader'].includes(r),out=[`<button class="biz-btn small" data-biz="view" data-id="${row.id}">查看</button>`];
    const traderDraft=['草稿','已撤回','已取消','待补充材料'].includes(row.status);
    const editable=state.meta.canUpdate&&state.resource!=='exceptions'&&!(state.resource==='demands'&&r==='trader'&&!traderDraft)&&!(state.resource==='requests'&&r==='trader'&&!traderDraft);
    if(editable)out.push(`<button class="biz-btn small" data-biz="edit" data-id="${row.id}">编辑</button>`);
    if(state.resource==='requests'&&r==='trader'){
      if(traderDraft)out.push(`<button class="biz-btn small primary" data-biz="submit-request" data-id="${row.id}">提交申请</button>`);
      if(row.status==='待审批')out.push(`<button class="biz-btn small danger" data-biz="withdraw-request" data-id="${row.id}">撤回</button>`)
    }
    if(state.resource==='requests'&&provider&&row.status==='待审批')out.push(`<button class="biz-btn small primary" data-biz="approve" data-id="${row.id}">通过</button>`,`<button class="biz-btn small" data-biz="supplement" data-id="${row.id}">补充材料</button>`,`<button class="biz-btn small danger" data-biz="reject" data-id="${row.id}">驳回</button>`);
    if(state.resource==='demands'&&r==='trader'){
      if(traderDraft)out.push(`<button class="biz-btn small primary" data-biz="submit-demand" data-id="${row.id}">提交需求</button>`);
      if(row.status==='已提交')out.push(`<button class="biz-btn small primary" data-biz="apply-data" data-id="${row.id}">申请联运数据</button>`);
      if(['已提交','方案生成中'].includes(row.status))out.push(`<button class="biz-btn small danger" data-biz="withdraw-demand" data-id="${row.id}">撤回需求</button>`);
      if(row.status==='方案生成中')out.push(`<button class="biz-btn small primary" data-biz="generate-scheme" data-id="${row.id}">生成方案</button>`)
    }
    if(state.resource==='schemes'&&r==='trader'&&row.status==='待确认')out.push(`<button class="biz-btn small primary" data-biz="confirm-scheme" data-id="${row.id}">确认方案</button>`);
    if(state.resource==='tasks'&&provider){
      if(row.status==='待确认')out.push(`<button class="biz-btn small primary" data-biz="confirm-task" data-id="${row.id}">确认任务</button>`);
      if(['待执行','执行中'].includes(row.status))out.push(`<button class="biz-btn small primary" data-biz="execute-task" data-id="${row.id}">上报运输事件</button>`)
    }
    if(state.resource==='authorizations'&&provider&&row.status==='生效中')out.push(`<button class="biz-btn small" data-biz="extend-authorization" data-id="${row.id}">延长有效期</button>`,`<button class="biz-btn small danger" data-biz="revoke-authorization" data-id="${row.id}">撤销授权</button>`);
    if(state.resource==='connectors'&&provider)out.push(`<button class="biz-btn small" data-biz="set-status" data-id="${row.id}" data-value="${row.status==='停用'?'在线':'停用'}">${row.status==='停用'?'启用':'停用'}</button>`,`<button class="biz-btn small" data-biz="set-status" data-id="${row.id}" data-value="在线">连接测试</button>`);
    if(state.resource==='conversionRules'&&provider)out.push(`<button class="biz-btn small" data-biz="set-status" data-id="${row.id}" data-value="${row.status==='启用'?'停用':'启用'}">${row.status==='启用'?'停用规则':'启用规则'}</button>`);
    if(state.resource==='dataProducts'&&provider)out.push(`<button class="biz-btn small" data-biz="set-status" data-id="${row.id}" data-value="${row.status==='已上架'?'已下架':'已上架'}">${row.status==='已上架'?'下架':'发布'}</button>`);
    if(state.resource==='capacities'&&provider)out.push(`<button class="biz-btn small" data-biz="set-status" data-id="${row.id}" data-value="${row.status==='已锁定'?'可用':'已锁定'}">${row.status==='已锁定'?'释放':'锁定'}</button>`);
    if(state.resource==='exceptions'&&r!=='platform'&&row.status!=='已关闭')out.push(`<button class="biz-btn small" data-biz="edit" data-id="${row.id}">处理意见</button>`,`<button class="biz-btn small primary" data-biz="close-exception" data-id="${row.id}">关闭异常</button>`);
    const deletable=state.meta.canDelete&&!(state.resource==='demands'&&!traderDraft)&&!(state.resource==='requests'&&!traderDraft)&&!(state.resource==='dataProducts'&&row.status==='已上架')&&!(state.resource==='conversionRules'&&row.status==='启用');
    if(deletable)out.push(`<button class="biz-btn small danger" data-biz="delete" data-id="${row.id}">删除</button>`);
    return `<div class="biz-actions">${out.join('')}</div>`
  }
  function render(){
    const root=host();if(!root||!state.resource)return;
    root.classList.remove('biz-host');
    let el=root.querySelector('#blnyBusinessPanel');
    if(!el){el=document.createElement('section');el.id='blnyBusinessPanel';el.className='biz-panel';root.appendChild(el)}
    const cols=columns(),pages=Math.max(1,Math.ceil(state.total/state.limit)),tabs=Object.values(resourceTabs).find(group=>group.some(x=>x[0]===state.resource));
    el.innerHTML=`<div class="biz-live"><div class="biz-data-head"><div><span class="biz-eyebrow">实时数据库</span><h2>${esc(state.meta?.title||'业务数据')}台账</h2><p>${esc(descriptions[state.resource]||'所有新增、编辑、删除和业务状态变更均实时写入本地数据库。')}</p></div><span class="biz-role-scope">${esc(roles[role()])} · ${module==='trusted'?'可信空间':'多式联运'}权限</span></div>${state.error?`<div class="biz-error">${esc(state.error)}</div>`:''}<section class="biz-card">${tabs?`<div class="biz-tabs">${tabs.map(x=>`<button class="biz-tab ${x[0]===state.resource?'active':''}" data-biz="switch-resource" data-resource="${x[0]}">${x[1]}</button>`).join('')}</div>`:''}<div class="biz-toolbar"><input id="bizSearch" placeholder="搜索名称、编号、状态…" value="${esc(state.search)}"><button class="biz-btn" data-biz="search">搜索</button><button class="biz-btn" data-biz="refresh">刷新</button><span class="biz-spacer"></span>${state.meta?.canCreate?'<button class="biz-btn primary" data-biz="create">新增记录</button>':''}</div>${state.loading?'<div class="biz-empty">正在加载真实业务数据…</div>':state.items.length?`<div class="biz-table-wrap"><table class="biz-table"><thead><tr>${cols.map(x=>`<th>${esc(pretty(x))}</th>`).join('')}<th>操作</th></tr></thead><tbody>${state.items.map(row=>`<tr>${cols.map(c=>`<td>${c==='status'?`<span class="biz-status ${tone(row[c])}">${esc(row[c])}</span>`:esc(row[c])}</td>`).join('')}<td>${actionButtons(row)}</td></tr>`).join('')}</tbody></table></div>`:'<div class="biz-empty">暂无符合当前角色和企业范围的数据，可通过“新增记录”开始。</div>'}<div class="biz-pagination"><span>共 ${state.total} 条 · 第 ${state.page}/${pages} 页</span><div><button class="biz-btn small" data-biz="prev" ${state.page<=1?'disabled':''}>上一页</button><button class="biz-btn small" data-biz="next" ${state.page>=pages?'disabled':''}>下一页</button></div></div></section></div>`
  }
  function fieldHtml(f,value=''){const full=f.type==='textarea'?' full':'';if(f.type==='textarea')return `<div class="biz-field${full}"><label>${esc(f.label)}</label><textarea name="${f.name}" ${f.required?'required':''}>${esc(value)}</textarea></div>`;if(f.type==='select')return `<div class="biz-field"><label>${esc(f.label)}</label><select name="${f.name}" ${f.required?'required':''}>${f.options.map(o=>`<option ${String(value)===String(o)?'selected':''}>${esc(o)}</option>`).join('')}</select></div>`;if(f.type==='boolean')return `<div class="biz-field"><label>${esc(f.label)}</label><select name="${f.name}"><option value="1" ${value?'selected':''}>是</option><option value="0" ${!value?'selected':''}>否</option></select></div>`;return `<div class="biz-field"><label>${esc(f.label)}</label><input name="${f.name}" type="${f.type||'text'}" value="${esc(value)}" ${f.required?'required':''}></div>`}
  function modal(title,body,submit){document.querySelector('.biz-modal-mask')?.remove();const mask=document.createElement('div');mask.className='biz-modal-mask';mask.innerHTML=`<div class="biz-modal"><div class="biz-modal-head"><h2>${esc(title)}</h2><button data-modal-close>×</button></div>${body}${submit?`<div class="biz-modal-foot"><button class="biz-btn" data-modal-close>取消</button><button class="biz-btn primary" id="bizModalSubmit">确认提交</button></div>`:''}</div>`;document.body.appendChild(mask);mask.addEventListener('click',e=>{if(e.target===mask||e.target.closest('[data-modal-close]'))mask.remove()});if(submit)mask.querySelector('#bizModalSubmit').addEventListener('click',()=>submit(mask));return mask}
  function openForm(row){const editing=!!row;modal(editing?`编辑${state.meta.title}`:`新增${state.meta.title}`,`<form class="biz-form" id="bizForm">${state.meta.fields.map(f=>fieldHtml(f,row?.[f.name]??'')).join('')}</form>`,async mask=>{const form=mask.querySelector('#bizForm');if(!form.reportValidity())return;const data=Object.fromEntries(new FormData(form));for(const f of state.meta.fields.filter(x=>x.type==='boolean'))data[f.name]=data[f.name]==='1';try{await api(`/business/${state.resource}${editing?`/${row.id}`:''}`,{method:editing?'PATCH':'POST',body:JSON.stringify(data)});mask.remove();await load()}catch(e){showError(mask,e.message)}})}
  function showError(mask,msg){let e=mask.querySelector('.biz-error');if(!e){e=document.createElement('div');e.className='biz-error';mask.querySelector('.biz-form,.biz-detail')?.before(e)}e.textContent=msg}
  function viewRow(row){modal(`${state.meta.title}详情`,`<div class="biz-detail">${Object.entries(row).map(([k,v])=>`<div><span>${esc(pretty(k))}</span><b>${esc(v)}</b></div>`).join('')}</div>`,null)}
  async function workflow(action,id){const bodies={'submit-request':{requestId:id},'withdraw-request':{requestId:id},'submit-demand':{demandId:id},'withdraw-demand':{demandId:id},'apply-data':{demandId:id},'generate-scheme':{demandId:id},'confirm-scheme':{schemeId:id},'confirm-task':{taskId:id},'execute-task':{taskId:id,progress:100},'close-exception':{exceptionId:id}};await api(`/workflow/${action}`,{method:'POST',body:JSON.stringify(bodies[action])});await load()}
  async function handle(action,id,element){
    const row=state.items.find(x=>String(x.id)===String(id));
    try{
      if(action==='switch-resource'){state.resource=element.dataset.resource;state.page=1;state.search='';return load()}
      if(action==='create')return openForm();
      if(action==='edit')return openForm(row);
      if(action==='view')return viewRow(row);
      if(action==='delete'){if(!confirm('确认删除该记录？此操作会写入审计日志。'))return;await api(`/business/${state.resource}/${id}`,{method:'DELETE'});return load()}
      if(['approve','reject','supplement'].includes(action)){const decision=action==='reject'?'reject':action==='supplement'?'supplement':'approve',comment=decision==='reject'?'业务用途或范围不符合要求':decision==='supplement'?'请补充关联需求、字段范围和使用目的说明':'同意按最小必要范围授权';await api('/workflow/approve-request',{method:'POST',body:JSON.stringify({requestId:Number(id),decision,comment})});return load()}
      if(action==='set-status'){await api(`/business/${state.resource}/${id}`,{method:'PATCH',body:JSON.stringify({status:element.dataset.value})});return load()}
      if(action==='extend-authorization'||action==='revoke-authorization'){const operation=action.startsWith('extend')?'extend':'revoke';if(operation==='revoke'&&!confirm('确认撤销该授权？撤销后使用方将不能继续调用。'))return;await api('/workflow/authorization-action',{method:'POST',body:JSON.stringify({authorizationId:Number(id),action:operation})});return load()}
      if(['submit-request','withdraw-request','submit-demand','withdraw-demand','apply-data','generate-scheme','confirm-scheme','confirm-task','execute-task','close-exception'].includes(action))return workflow(action,Number(id));
      if(action==='search'){state.search=document.getElementById('bizSearch')?.value.trim()||'';state.page=1;return load()}
      if(action==='refresh')return load();
      if(action==='prev'){state.page--;return load()}
      if(action==='next'){state.page++;return load()}
    }catch(e){state.error=e.message;render()}
  }
  document.addEventListener('click',e=>{const b=e.target.closest('[data-biz]');if(b)handle(b.dataset.biz,b.dataset.id,b)});
  document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.id==='bizSearch'){e.preventDefault();handle('search')}});
  async function route(route){const resource=mapping(route);if(!resource){host()?.querySelector('#blnyBusinessPanel')?.remove();return}state={...state,route,resource,page:1,search:'',meta:null,items:[],total:0,error:''};await load(true)}
  window.blnyBusinessUI={enhancesRoute:route=>!!mapping(route)};
  window.addEventListener('blny:viewchange',e=>route(e.detail));
  window.addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.type==='blny:setRole')setTimeout(()=>route(state.route),0)});
  setTimeout(()=>{const active=document.querySelector('.blny-menu-item.active')||document.querySelector('.blny-menu-item');if(active?.dataset.shellRoute)route(active.dataset.shellRoute)},0);
})();
