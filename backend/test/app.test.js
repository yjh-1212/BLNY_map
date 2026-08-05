import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { createApp } from "../src/app.js";

let server;
let baseUrl;
let app;

before(async () => {
  app = createApp({ databaseAdminEnabled: true });
  server = app.listen(0, "127.0.0.1");
  await new Promise((resolve) => server.once("listening", resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  app.locals.database.close();
});

test("GET /api/health exposes service health", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.status, "ok");
  assert.equal(body.service, "beiliang-nanyun-api");
  assert.match(body.timestamp, /^\d{4}-\d{2}-\d{2}T/);
});

test("GET /api/v1/modules returns every migrated module", async () => {
  const response = await fetch(`${baseUrl}/api/v1/modules`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.total, 5);
  assert.equal(body.items[0].id, "overview");
  assert.ok(body.items.every((item) => item.route.startsWith("/modules/")));
});

test("database admin lists initialized SQLite tables", async () => {
  const response = await fetch(`${baseUrl}/api/v1/admin/database/tables`);
  const body = await response.json();
  assert.equal(response.status, 200);
  assert.equal(body.total, 40);
  assert.deepEqual(body.items.slice(0, 4).map((item) => item.name), ["platform_modules", "organizations", "grain_batches", "transport_orders"]);
  assert.ok(body.items.some((item) => item.name === "tds_connector"));
  assert.ok(body.items.some((item) => item.name === "tds_epcis_event"));
  assert.ok(body.items.some((item) => item.name === "mm_transport_demand"));
  assert.ok(body.items.some((item) => item.name === "mm_task"));
  assert.equal(body.items[0].readOnly, true);
  assert.ok(body.items.find((item) => item.name === "organizations").total >= 3);
});

test("database admin can create, search, update and delete a local record", async () => {
  const uniqueCode = `TEST-${Date.now()}`;
  const createdResponse = await fetch(`${baseUrl}/api/v1/admin/database/tables/organizations`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "接口测试机构",
      organization_type: "测试机构",
      unified_social_credit_code: uniqueCode,
      status: "正常",
    }),
  });
  const createdBody = await createdResponse.json();
  assert.equal(createdResponse.status, 201);
  assert.equal(createdBody.item.name, "接口测试机构");

  const id = createdBody.item.id;
  const updatedResponse = await fetch(
    `${baseUrl}/api/v1/admin/database/tables/organizations/${id}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "停用" }),
    },
  );
  const updatedBody = await updatedResponse.json();
  assert.equal(updatedResponse.status, 200);
  assert.equal(updatedBody.item.status, "停用");

  const searchResponse = await fetch(
    `${baseUrl}/api/v1/admin/database/tables/organizations?search=${uniqueCode}`,
  );
  const searchBody = await searchResponse.json();
  assert.equal(searchBody.total, 1);
  assert.equal(searchBody.items[0].id, id);

  const deletedResponse = await fetch(
    `${baseUrl}/api/v1/admin/database/tables/organizations/${id}`,
    { method: "DELETE" },
  );
  assert.equal(deletedResponse.status, 204);
});

async function business(role, path, { method = "GET", body } = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: { "Content-Type": "application/json", "x-role": role },
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = response.status === 204 ? null : await response.json();
  return { response, payload };
}

test("role-scoped business CRUD prevents cross-role writes", async () => {
  const denied = await business("trader", "/api/v1/business/connectors", {
    method: "POST",
    body: { connector_no: "NO-AUTH", connector_name: "越权连接器", system_name: "TMS", connection_type: "API", status: "在线" },
  });
  assert.equal(denied.response.status, 403);

  const created = await business("fleet", "/api/v1/business/connectors", {
    method: "POST",
    body: { connector_no: `TEST-CON-${Date.now()}`, connector_name: "测试车队连接器", system_name: "测试TMS", connection_type: "API", status: "在线" },
  });
  assert.equal(created.response.status, 201);
  const id = created.payload.item.id;

  const updated = await business("fleet", `/api/v1/business/connectors/${id}`, { method: "PATCH", body: { status: "停用" } });
  assert.equal(updated.response.status, 200);
  assert.equal(updated.payload.item.status, "停用");

  const hidden = await business("railway", `/api/v1/business/connectors/${id}`);
  assert.equal(hidden.response.status, 404);

  const publicCapacities = await business("railway", "/api/v1/business/capacities");
  const fleetCapacity = publicCapacities.payload.items.find((item) => item.resource_no === "CAP-FLEET-001");
  assert.ok(fleetCapacity, "provider can query authorized public capacity catalog");
  const forbiddenCapacityUpdate = await business("railway", `/api/v1/business/capacities/${fleetCapacity.id}`, { method: "PATCH", body: { status: "停用" } });
  assert.equal(forbiddenCapacityUpdate.response.status, 404);

  const deleted = await business("fleet", `/api/v1/business/connectors/${id}`, { method: "DELETE" });
  assert.equal(deleted.response.status, 204);
});

test("role-specific request and exception actions enforce lifecycle permissions", async () => {
  const products = await business("trader", "/api/v1/business/dataProducts");
  const product = products.payload.items[0];
  const demands = await business("trader", "/api/v1/business/demands");
  const demand = demands.payload.items.find((item) => item.status === "草稿");
  assert.ok(product && demand);

  const created = await business("trader", "/api/v1/business/requests", {
    method: "POST",
    body: { request_no: `REQ-TEST-${Date.now()}`, provider_org_id: product.org_id, product_id: product.id, demand_id: demand.id, purpose: "角色权限测试" },
  });
  assert.equal(created.response.status, 201);
  const requestId = created.payload.item.id;

  let result = await business("trader", "/api/v1/workflow/submit-request", { method: "POST", body: { requestId } });
  assert.equal(result.response.status, 200);
  result = await business("trader", `/api/v1/business/requests/${requestId}`, { method: "PATCH", body: { purpose: "不应越过生命周期直接修改" } });
  assert.equal(result.response.status, 409);
  result = await business("trader", "/api/v1/workflow/withdraw-request", { method: "POST", body: { requestId } });
  assert.equal(result.response.status, 200);
  result = await business("trader", `/api/v1/business/requests/${requestId}`, { method: "DELETE" });
  assert.equal(result.response.status, 204);

  const exception = await business("trader", "/api/v1/business/exceptions", {
    method: "POST",
    body: { exception_no: `EXC-TEST-${Date.now()}`, exception_type: "道路拥堵", responsible_org_id: product.org_id, description: "角色关闭权限测试", status: "待处理" },
  });
  assert.equal(exception.response.status, 201, JSON.stringify(exception.payload));
  result = await business("platform", "/api/v1/workflow/close-exception", { method: "POST", body: { exceptionId: exception.payload.item.id } });
  assert.equal(result.response.status, 403);
  result = await business("trader", "/api/v1/workflow/close-exception", { method: "POST", body: { exceptionId: exception.payload.item.id } });
  assert.equal(result.response.status, 200);
});

test("complete trusted-data and intermodal workflow persists every transition", async () => {
  const demandList = await business("trader", "/api/v1/business/demands");
  const demand = demandList.payload.items.find((item) => item.demand_no === "DEM-2026-0001");
  assert.ok(demand);

  let result = await business("trader", "/api/v1/workflow/submit-demand", { method: "POST", body: { demandId: demand.id } });
  assert.equal(result.response.status, 200);
  result = await business("trader", "/api/v1/workflow/apply-data", { method: "POST", body: { demandId: demand.id } });
  assert.equal(result.response.status, 201);

  for (const role of ["fleet", "railway", "port", "shipping"]) {
    const requests = await business(role, "/api/v1/business/requests");
    const pending = requests.payload.items.find((item) => item.demand_id === demand.id && item.status === "待审批");
    assert.ok(pending, `${role} should receive one request`);
    const approval = await business(role, "/api/v1/workflow/approve-request", { method: "POST", body: { requestId: pending.id } });
    assert.equal(approval.response.status, 200);
  }

  result = await business("trader", "/api/v1/workflow/generate-scheme", { method: "POST", body: { demandId: demand.id } });
  assert.equal(result.response.status, 201);
  const scheme = result.payload.item;
  result = await business("trader", "/api/v1/workflow/confirm-scheme", { method: "POST", body: { schemeId: scheme.id } });
  assert.equal(result.response.status, 201);

  for (const role of ["fleet", "railway", "port", "shipping"]) {
    const tasks = await business(role, "/api/v1/business/tasks");
    assert.equal(tasks.payload.items.length, 1);
    const task = tasks.payload.items[0];
    const confirmation = await business(role, "/api/v1/workflow/confirm-task", { method: "POST", body: { taskId: task.id } });
    assert.equal(confirmation.response.status, 200);
    const execution = await business(role, "/api/v1/workflow/execute-task", { method: "POST", body: { taskId: task.id, progress: 100 } });
    assert.equal(execution.response.status, 200);
  }

  const status = await business("trader", "/api/v1/workflow/status");
  assert.equal(status.payload.item.order.status, "已完成");
  assert.ok(status.payload.item.tasks.every((task) => task.status === "已完成"));
  const events = await business("trader", "/api/v1/business/events");
  assert.equal(events.payload.total, 4);
  const authorizations = await business("trader", "/api/v1/business/authorizations");
  assert.equal(authorizations.payload.total, 4);
});

test("only the data provider can extend or revoke its authorization", async () => {
  const authorizations = await business("fleet", "/api/v1/business/authorizations");
  const authorization = authorizations.payload.items.find((item) => item.status === "生效中");
  assert.ok(authorization);
  let result = await business("trader", "/api/v1/workflow/authorization-action", { method: "POST", body: { authorizationId: authorization.id, action: "extend" } });
  assert.equal(result.response.status, 403);
  result = await business("fleet", "/api/v1/workflow/authorization-action", { method: "POST", body: { authorizationId: authorization.id, action: "extend" } });
  assert.equal(result.response.status, 200);
  result = await business("fleet", "/api/v1/workflow/authorization-action", { method: "POST", body: { authorizationId: authorization.id, action: "revoke" } });
  assert.equal(result.response.status, 200);
});

test("unknown API routes return JSON 404", async () => {
  const response = await fetch(`${baseUrl}/api/missing`);
  const body = await response.json();
  assert.equal(response.status, 404);
  assert.equal(body.error, "Not Found");
});
