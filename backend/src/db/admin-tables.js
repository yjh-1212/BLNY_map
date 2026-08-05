const domainTables = {
  sys_org: ["组织机构", ["org_code", "org_name", "org_type", "status"]],
  sys_user: ["系统用户", ["username", "display_name", "status"]],
  sys_role: ["系统角色", ["role_code", "role_name", "description"]],
  sys_user_role: ["用户角色关系", ["user_id", "role_id"], true],
  sys_permission: ["系统权限", ["permission_code", "permission_name", "module", "action"]],
  sys_role_permission: ["角色权限关系", ["role_id", "permission_id"], true],
  sys_login_log: ["登录日志", ["user_id", "client_address", "result"], true],
  sys_operation_log: ["操作日志", ["role_code", "user_name", "module", "action", "detail"], true],
  tds_space: ["可信空间", ["space_code", "space_name", "status"]],
  tds_space_member: ["空间成员", ["space_id", "org_id", "member_type", "status"]],
  tds_connector: ["连接器", ["connector_no", "connector_name", "system_name", "status"]],
  tds_data_source: ["数据来源", ["source_name", "source_type", "source_system", "status"]],
  tds_data_resource: ["数据资源", ["resource_no", "resource_name", "service_type", "status"]],
  tds_data_product: ["数据产品", ["product_no", "product_name", "product_type", "status"]],
  tds_access_request: ["数据使用申请", ["request_no", "purpose", "status", "review_comment"]],
  tds_authorization: ["数据授权", ["authorization_no", "status", "valid_to"]],
  tds_authorization_item: ["授权字段明细", ["field_name", "field_rule", "data_scope"]],
  tds_data_usage_log: ["数据使用记录", ["user_name", "use_purpose", "call_method", "call_status"], true],
  tds_conversion_rule: ["EPCIS转换规则", ["rule_no", "rule_name", "target_event_type", "status"]],
  tds_mapping_field: ["转换字段映射", ["source_field", "target_field", "transform_expression"]],
  tds_conversion_task: ["转换任务", ["task_no", "source_record_no", "status"]],
  tds_conversion_record: ["转换记录", ["record_no", "source_record_no", "event_type", "publish_status"], true],
  tds_conversion_error: ["转换异常", ["error_no", "error_type", "error_message", "status"]],
  tds_epcis_event: ["EPCIS事件", ["event_no", "event_type", "biz_step", "publish_status"], true],
  tds_event_subscription: ["事件订阅", ["subscription_no", "event_types", "callback_type", "status"]],
  tds_event_delivery_log: ["事件投递日志", ["delivery_result", "retry_count"], true],
  mm_transport_demand: ["运输需求", ["demand_no", "cargo_name", "origin", "destination", "status"]],
  mm_capacity_resource: ["运力资源", ["resource_no", "resource_type", "resource_name", "status"]],
  mm_transport_scheme: ["联运方案", ["scheme_no", "scheme_name", "route_summary", "status"]],
  mm_scheme_segment: ["方案分段", ["segment_type", "origin", "destination", "status"]],
  mm_transport_order: ["联运订单", ["order_no", "cargo_name", "origin", "destination", "status"]],
  mm_order_party: ["订单参与方", ["order_id", "org_id", "party_role"]],
  mm_task: ["分段任务", ["task_no", "task_type", "origin", "destination", "status"]],
  mm_transport_event: ["运输事件", ["event_no", "event_type", "location_name", "description"], true],
  mm_exception: ["异常协同", ["exception_no", "exception_type", "description", "status"]],
  mm_data_reference: ["方案数据引用", ["scheme_id", "authorization_id", "influence"], true],
};

export const adminTables = Object.freeze({
  platform_modules: {
    label: "平台模块",
    readOnly: true,
    searchableColumns: ["id", "title", "short_title", "description", "route"],
  },
  organizations: {
    label: "参与机构",
    readOnly: false,
    searchableColumns: ["name", "organization_type", "unified_social_credit_code", "contact_name"],
  },
  grain_batches: {
    label: "粮食批次",
    readOnly: false,
    searchableColumns: ["batch_no", "variety", "origin", "quality_grade", "status"],
  },
  transport_orders: {
    label: "运输订单",
    readOnly: false,
    searchableColumns: ["order_no", "origin", "destination", "transport_mode", "status"],
  },
  ...Object.fromEntries(Object.entries(domainTables).map(([name,[label,searchableColumns,readOnly=false]])=>[name,{label,searchableColumns,readOnly}])),
});

export function quoteIdentifier(identifier) {
  return `"${identifier.replaceAll('"', '""')}"`;
}

export function getAdminTable(tableName) {
  return adminTables[tableName] || null;
}
