(function(){
  const body=document.body;
  const currentModule=body.dataset.unifiedModule;
  if(!currentModule)return;
  body.classList.add('blny-unified');
  const hosted=window.parent!==window;
  if(hosted)body.classList.add('blny-hosted');

  const roles={
    platform:{name:'平台管理员',user:'林澜',org:'北粮南运通道运营中心'},
    trader:{name:'贸易商业务负责人',user:'陈禾',org:'北沃粮食贸易有限公司'},
    fleet:{name:'公路货运调度员',user:'赵驰',org:'黑龙江畅运物流'},
    railway:{name:'铁路调度员',user:'沈岳',org:'沈阳局货运中心'},
    port:{name:'港口协同员',user:'韩港',org:'营口港集团'},
    shipping:{name:'船商调度员',user:'周航',org:'北方粮运航运'}
  };
  const providerLabels={
    fleet:['公路运力','公路任务','公路执行','公路异常'],railway:['铁路运力','铁路任务','铁路执行','铁路异常'],port:['港口能力','协同任务','港口执行','港口异常'],shipping:['船期舱位','海运任务','海运执行','海运异常']
  };
  const item=(title,module,route,icon='•')=>({title,module,route,icon});
  const menus={
    platform:()=>[
      {title:'可信数据空间',items:[item('空间总览','trusted','overview','总'),item('空间成员','trusted','member-management','员'),item('连接器监控','trusted','access-management','连'),item('数据目录','trusted','product-management','数'),item('授权监管','trusted','authorization-ledger','权'),item('事件中心','trusted','event-subscribe','事'),item('使用审计','trusted','audit-compliance','审')]},
      {title:'多式联运',items:[item('业务总览','intermodal','overview','总'),item('需求订单','intermodal','orders','需'),item('执行监控','intermodal','full-monitor','监'),item('异常协同','intermodal','exception-center','异')]}
    ],
    trader:()=>[
      {title:'可信数据空间',items:[item('数据目录','trusted','product-management','数'),item('我的申请','trusted','use-applications','申'),item('我的授权','trusted','authorization-ledger','权'),item('查询订阅','trusted','data-query','查')]},
      {title:'多式联运',items:[item('运输需求','intermodal','my-demands','需'),item('联运方案','intermodal','solution-center','案'),item('运输订单','intermodal','orders','单'),item('全程跟踪','intermodal','full-monitor','踪'),item('异常协同','intermodal','exception-center','异')]}
    ],
    provider:(role)=>{const labels=providerLabels[role];return[
      {title:'可信数据空间',items:[item('我的连接器','trusted','access-management','连'),item('事件转换','trusted','data-conversion','转'),item('数据资产','trusted','resource-management','资'),item('授权审批','trusted','use-applications','审'),item('使用记录','trusted','audit-compliance','记')]},
      {title:'多式联运',items:[item(labels[0],'intermodal','resource-pool','资'),item(labels[1],'intermodal','orders','任'),item(labels[2],'intermodal','full-monitor','执'),item(labels[3],'intermodal','exception-center','异')]}
    ]}
  };
  const navViews=[['综合驾驶舱','overview'],['可信数据空间','trusted'],['多式联运','intermodal'],['一粮一链','passport'],['供应链金融','elements']];
  const bell='<svg viewBox="0 0 24 24"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></svg>';
  const gear='<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1z"/></svg>';
  const menuIcon='<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>';
  let role=localStorage.getItem('blny:role');
  if(!roles[role])role='platform';
  let currentRoute=currentModule==='trusted'?(location.hash.slice(1)||'overview'):'demo';

  const header=hosted?null:document.createElement('header');
  if(header){header.className='blny-global-header';header.innerHTML=`<button class="blny-tool-btn blny-mobile-menu" data-shell="mobile" aria-label="打开菜单">${menuIcon}</button><div class="blny-global-brand"><div class="blny-global-logo">北</div><div><b>北粮南运数字化协同平台</b><span>可信数据空间与多式联运系统</span></div></div><nav class="blny-module-nav" aria-label="系统模块">${navViews.map(x=>`<button class="blny-module-tab ${x[1]===currentModule?'active':''}" data-shell-view="${x[1]}">${x[0]}</button>`).join('')}</nav><div class="blny-global-tools"><div class="blny-context"><span>当前企业</span><b id="blnyOrg"></b></div><select class="blny-role-select" id="blnyRole" aria-label="切换当前角色">${Object.entries(roles).map(([k,v])=>`<option value="${k}">${v.name}</option>`).join('')}</select><button class="blny-tool-btn" data-shell="notice" title="消息与待办">${bell}<i class="blny-badge"></i></button><button class="blny-tool-btn" data-shell="settings" title="设置">${gear}</button><button class="blny-user" data-shell="profile"><i class="blny-avatar" id="blnyAvatar"></i><span><b id="blnyUser"></b><span id="blnyRoleCopy"></span></span></button></div>`;body.prepend(header)}
  const sidebar=document.getElementById('sidebar')||document.querySelector('.sidebar');

  function getMenu(){const all=role==='platform'?menus.platform():role==='trader'?menus.trader():menus.provider(role);const section=currentModule==='trusted'?'可信数据空间':'多式联运';return all.filter(group=>group.title===section)}
  const pagePolicy=(mode,summary,capabilities,{readOnly=false,hide=[]}={})=>({mode,summary,capabilities,readOnly,hide});
  const pagePolicies={
    trusted:{
      platform:{
        overview:pagePolicy('空间监管','查看可信空间整体运行、成员接入、服务调用和风险态势。',['运行指标','成员分布','风险告警','审计追踪'],{readOnly:true}),
        'member-management':pagePolicy('平台维护','管理加入可信空间的企业、用户状态和成员生命周期。',['新增成员','企业资料','用户配置','启停管理']),
        'access-management':pagePolicy('运行监管','监控各企业连接器的在线状态、心跳、服务和转换异常，不修改企业私域配置。',['在线监测','心跳统计','异常定位','服务统计'],{readOnly:true}),
        'product-management':pagePolicy('目录监管','查看四类提供方发布的数据产品、服务类型和上下架状态。',['目录检索','产品分类','发布主体','合规检查'],{readOnly:true}),
        'authorization-ledger':pagePolicy('授权监管','监管申请、授权范围、有效期和调用额度，不代替提供方审批。',['授权状态','范围核验','到期预警','调用审计'],{readOnly:true}),
        'event-subscribe':pagePolicy('事件监管','查看EPCIS事件接入、分发、失败和重试态势。',['事件检索','来源追踪','分发状态','异常定位'],{readOnly:true}),
        'audit-compliance':pagePolicy('合规审计','核查查询、订阅、审批、转换与业务操作日志。',['日志检索','合规核验','风险溯源','报告导出'],{readOnly:true})
      },
      trader:{
        'product-management':pagePolicy('数据发现','浏览车队、铁路、港口和船商发布的查询及事件类数据产品。',['产品检索','服务对比','申请条件','发起申请'],{hide:['新增产品','发布产品','编辑','删除','上架','下架']}),
        'use-applications':pagePolicy('申请办理','创建数据使用申请，维护草稿并跟踪四方审批进度。',['新建申请','编辑草稿','提交撤回','审批进度']),
        'authorization-ledger':pagePolicy('授权使用','查看已获得的字段、范围、有效期、查询与订阅权限。',['授权详情','剩余额度','有效期','使用入口'],{readOnly:true}),
        'data-query':pagePolicy('查询订阅','在有效授权范围内查询资源能力并订阅运输状态事件。',['资源查询','事件订阅','结果查看','调用留痕'])
      },
      provider:{
        'access-management':pagePolicy('企业维护','管理本企业连接器、数据来源、运行记录和对外服务。',['连接配置','数据来源','连接测试','启停与日志']),
        'data-conversion':pagePolicy('事件转换','维护本企业状态到EPCIS事件的识别、映射、校验和发布规则。',['规则配置','字段映射','转换测试','异常重试']),
        'resource-management':pagePolicy('资产发布','登记本企业数据资源并发布查询或事件订阅类数据产品。',['资源登记','产品配置','发布下架','敏感控制']),
        'use-applications':pagePolicy('提供方审批','仅审批申请使用本企业数据产品的请求，并配置最小必要授权范围。',['待办审批','补充材料','通过驳回','授权维护'],{hide:['新建申请','提交申请','撤回申请']}),
        'audit-compliance':pagePolicy('使用核验','查看本企业数据被查询、订阅和推送的全过程记录。',['调用记录','订阅投递','失败重试','结果摘要'],{readOnly:true})
      }
    },
    intermodal:{
      platform:{
        overview:pagePolicy('业务监管','查看北粮南运需求、订单、执行进度和通道运行态势。',['业务指标','通道态势','主体协同','风险预警'],{readOnly:true}),
        orders:pagePolicy('需求监管','监管运输需求和订单形成情况，不代替贸易商确认方案。',['需求统计','订单状态','参与主体','授权引用'],{readOnly:true}),
        'full-monitor':pagePolicy('执行监管','查看四段任务、运输事件、ETA和全链路运行状态。',['任务进度','事件时间轴','ETA监测','来源追踪'],{readOnly:true}),
        'exception-center':pagePolicy('异常监管','查看异常责任方、处理进度和关闭结果，不代替企业执行。',['异常分布','责任主体','处理时效','闭环审计'],{readOnly:true})
      },
      trader:{
        'my-demands':pagePolicy('需求办理','创建并提交运输需求，申请四方数据后进入方案生成。',['新建需求','编辑提交','申请数据','撤回需求']),
        'solution-center':pagePolicy('方案决策','使用已授权的四方能力数据生成、比较并确认联运方案。',['方案生成','方案比选','数据来源','确认方案']),
        orders:pagePolicy('订单查看','查看方案确认后生成的运输订单、参与方和四段任务。',['订单详情','分段任务','费用汇总','授权引用'],{readOnly:true}),
        'full-monitor':pagePolicy('全程跟踪','查看公路、铁路、港口和海运事件、当前位置与预计到达时间。',['联运地图','事件时间轴','ETA预测','异常提醒'],{readOnly:true}),
        'exception-center':pagePolicy('异常协同','发起运输异常、指定责任方、补充证明并确认协同结果。',['新建异常','责任分派','处理意见','关闭确认'])
      },
      provider:{
        'resource-pool':pagePolicy('能力维护','维护本企业可参与联运的资源、可用能力、服务范围和状态。',['资源新增','能力更新','锁定释放','服务范围']),
        orders:pagePolicy('任务确认','仅查看并确认分配给本企业负责运输段的任务。',['任务详情','计划时间','资源分配','确认任务'],{hide:['新建订单','创建订单','签发运单','删除订单']}),
        'full-monitor':pagePolicy('任务执行','上报本企业运输段的执行进度和状态事件，由连接器转换为EPCIS事件。',['执行进度','资源分配','事件上报','附件备注'],{hide:['订阅节点事件']}),
        'exception-center':pagePolicy('异常处理','处理本企业报告或负责的异常，提交意见并完成闭环。',['异常上报','处理意见','证明材料','关闭异常'])
      }
    }
  };
  function getPagePolicy(){const kind=['fleet','railway','port','shipping'].includes(role)?'provider':role;return pagePolicies[currentModule]?.[kind]?.[currentRoute]}
  function currentMenuTitle(){return getMenu().flatMap(group=>group.items).find(entry=>entry.route===currentRoute)?.title}
  function applyRolePagePolicy(){
    const root=document.getElementById(currentModule==='trusted'?'content':'view'),policy=getPagePolicy();if(!root||!policy)return;
    root.querySelector('.blny-page-role-strip')?.remove();
    const pageHead=root.querySelector('.page-head'),title=currentMenuTitle();if(title&&pageHead?.querySelector('h1'))pageHead.querySelector('h1').textContent=title;if(pageHead?.querySelector('p'))pageHead.querySelector('p').textContent=policy.summary;
    const strip=document.createElement('section');strip.className='blny-page-role-strip';strip.innerHTML=`<div><span>${roles[role].name}</span><b>${policy.mode}</b></div><p>${policy.summary}</p><div class="blny-page-capabilities">${policy.capabilities.map(x=>`<i>${x}</i>`).join('')}</div>`;pageHead?.after(strip);
    const writeWords=/(新增|新建|创建|接入|编辑|删除|移除|提交|确认|审批|通过|驳回|发布|下架|上架|启用|停用|重启|执行|分配|上报|处置|关闭|调整|生成|签发|锁定|释放|撤回|重新|修改|保存|启动|完成)/,safeWords=/^(查看|详情|筛选|搜索|刷新|导出|下载|定位|全线路|当前节点|查询|订阅|监控|审计)/;
    root.querySelectorAll('button').forEach(button=>{if(button.closest('#blnyBusinessPanel'))return;button.classList.remove('blny-role-hidden');const label=button.textContent.trim(),explicit=policy.hide.some(word=>label.includes(word)),blocked=policy.readOnly&&writeWords.test(label)&&!safeWords.test(label);if(explicit||blocked)button.classList.add('blny-role-hidden')})
  }
  function renderSidebar(){
    if(!sidebar)return;
    sidebar.innerHTML=`<div class="blny-sidebar-head"><div class="blny-sidebar-mark">${currentModule==='trusted'?'数':'运'}</div><div><b>${currentModule==='trusted'?'可信数据空间':'多式联运'}</b><span>${roles[role].org}</span></div></div><nav class="blny-menu" aria-label="业务菜单">${getMenu().map(g=>`<div class="blny-menu-group"><div class="blny-menu-title">${g.title}</div>${g.items.map(x=>`<button class="blny-menu-item ${x.module===currentModule&&x.route===currentRoute?'active':''}" data-shell-module="${x.module}" data-shell-route="${x.route}"><i class="blny-menu-icon">${x.icon}</i><span>${x.title}</span>${x.module!==currentModule?'<i class="blny-menu-link">›</i>':''}</button>`).join('')}</div>`).join('')}</nav><div class="blny-side-foot"><span class="blny-online"><i></i>系统运行正常</span><span>演示环境</span></div>`;
  }
  function renderContext(){
    const info=roles[role];
    const roleSelect=document.getElementById('blnyRole');if(roleSelect)roleSelect.value=role;
    const org=document.getElementById('blnyOrg');if(org)org.textContent=info.org;
    const user=document.getElementById('blnyUser');if(user)user.textContent=info.user;
    const avatar=document.getElementById('blnyAvatar');if(avatar)avatar.textContent=info.user.slice(0,1);
    const roleCopy=document.getElementById('blnyRoleCopy');if(roleCopy)roleCopy.textContent=info.name+' · 在线';
  }
  function routeModule(module,route){
    document.querySelectorAll('.blny-menu-item').forEach(x=>x.classList.toggle('active',x.dataset.shellModule===module&&x.dataset.shellRoute===route));
    if(module===currentModule&&typeof window.navigate==='function'){currentRoute=route;window.navigate(route);closeSidebar();return}
    localStorage.setItem('blny:pendingRoute',JSON.stringify({module,route}));
    openModule(module);
  }
  function ensureAllowedRoute(){const firstGroup=getMenu()[0],allowed=firstGroup?.items||[];if(allowed.length&&!allowed.some(entry=>entry.route===currentRoute))setTimeout(()=>routeModule(currentModule,allowed[0].route),0)}
  function openModule(view){
    if(window.parent!==window){window.parent.postMessage({type:'blny:navigate',view},window.location.origin);return}
    const paths={overview:'/modules/overview',trusted:'/modules/trusted',intermodal:'/modules/intermodal',passport:'/modules/passport',elements:'/modules/value-added'};
    if(paths[view])location.href=paths[view];
  }
  function closeSidebar(){sidebar?.classList.remove('show','open');document.getElementById('mask')?.classList.remove('show')}
  function toggleSidebar(){if(!sidebar)return;sidebar.classList.toggle(currentModule==='trusted'?'show':'open');document.getElementById('mask')?.classList.toggle('show')}
  function closePopover(){document.querySelector('.blny-popover')?.remove()}
  function popover(type){
    closePopover();
    const info=roles[role],pop=document.createElement('section');pop.className='blny-popover';
    const notices=`<div class="blny-popover-head"><b>消息与待办</b><button data-pop-close>关闭</button></div><div class="blny-popover-item"><i>急</i><div><b>2项跨主体异常待协同</b><span>港口作业窗口冲突、铁路到站时间调整。</span></div></div><div class="blny-popover-item"><i>审</i><div><b>4项数据授权待处理</b><span>关联玉米5,000吨绥化—广东联运需求。</span></div></div><div class="blny-popover-item"><i>到</i><div><b>3项授权将在7日内到期</b><span>请续期或按合约完成缓存清理。</span></div></div>`;
    const profile=`<div class="blny-popover-head"><b>个人中心</b><button data-pop-close>关闭</button></div><div class="blny-profile-grid">${[['用户',info.user],['当前角色',info.name],['当前企业',info.org],['账号状态','正常 · MFA已启用'],['最近登录','2026-08-04 09:26'],['数据范围','本企业与已授权范围']].map(x=>`<div class="blny-profile-cell"><span>${x[0]}</span><b>${x[1]}</b></div>`).join('')}</div>`;
    const settings=`<div class="blny-popover-head"><b>系统设置</b><button data-pop-close>关闭</button></div><div class="blny-popover-item"><i>角</i><div><b>角色与企业上下文</b><span>切换后两大业务模块同步加载对应菜单和数据权限。</span></div></div><div class="blny-popover-item"><i>安</i><div><b>安全策略已启用</b><span>高风险操作二次确认，所有业务操作全程留痕。</span></div></div>`;
    pop.innerHTML=type==='notice'?notices:type==='profile'?profile:settings;body.appendChild(pop);pop.querySelector('[data-pop-close]')?.addEventListener('click',closePopover);
  }
  header?.addEventListener('click',e=>{
    const view=e.target.closest('[data-shell-view]');if(view){openModule(view.dataset.shellView);return}
    const action=e.target.closest('[data-shell]')?.dataset.shell;if(action==='mobile')toggleSidebar();else if(action)popover(action);
  });
  function changeRole(nextRole){role=nextRole;localStorage.setItem('blny:role',role);renderContext();renderSidebar();ensureAllowedRoute();setTimeout(applyRolePagePolicy,0);closePopover();if(typeof window.toast==='function'){currentModule==='trusted'?window.toast('角色已切换',`当前以“${roles[role].name}”身份访问系统。`):window.toast(`已切换为“${roles[role].name}”视角`)}}
  header?.querySelector('#blnyRole')?.addEventListener('change',e=>changeRole(e.target.value));
  sidebar?.addEventListener('click',e=>{const target=e.target.closest('[data-shell-route]');if(target)routeModule(target.dataset.shellModule,target.dataset.shellRoute)});
  window.addEventListener('message',event=>{if(event.origin===window.location.origin&&event.data?.type==='blny:setRole'&&roles[event.data.role])changeRole(event.data.role)});
  window.addEventListener('blny:viewchange',e=>{currentRoute=e.detail;renderSidebar();setTimeout(applyRolePagePolicy,0)});
  document.addEventListener('click',e=>{if(!e.target.closest('.blny-popover,.blny-global-tools'))closePopover()});
  renderContext();renderSidebar();ensureAllowedRoute();setTimeout(applyRolePagePolicy,0);
  try{const pending=JSON.parse(localStorage.getItem('blny:pendingRoute')||'null');if(pending?.module===currentModule){localStorage.removeItem('blny:pendingRoute');setTimeout(()=>routeModule(currentModule,pending.route),0)}}catch(e){localStorage.removeItem('blny:pendingRoute')}
})();
