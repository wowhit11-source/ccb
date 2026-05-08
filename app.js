const storageKey = "agent-desk-skeleton:v1";

const state = loadState();
let selectedEmployeeId = null;
let editingDepartmentId = "";
let editingEmployeeId = "";

const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function createEmptyState() {
  return {
    departments: [],
    employees: [],
    workflows: [],
    projects: [],
    settings: {},
  };
}

function loadState() {
  try {
    const parsed = JSON.parse(localStorage.getItem(storageKey) || "{}");
    return {
      ...createEmptyState(),
      ...parsed,
      departments: Array.isArray(parsed.departments) ? parsed.departments : [],
      employees: Array.isArray(parsed.employees) ? parsed.employees : [],
      workflows: Array.isArray(parsed.workflows) ? parsed.workflows : [],
      projects: Array.isArray(parsed.projects) ? parsed.projects : [],
      settings: { ...createEmptyState().settings, ...(parsed.settings || {}) },
    };
  } catch {
    return createEmptyState();
  }
}

function saveState() {
  localStorage.setItem(storageKey, JSON.stringify(state, null, 2));
}

function makeId(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function showView(viewName) {
  $$(".category-tab").forEach((tab) => tab.classList.toggle("active", tab.dataset.view === viewName));
  $$(".app-view").forEach((view) => view.classList.toggle("active", view.id === `${viewName}View`));
}

function departmentById(id) {
  return state.departments.find((department) => department.id === id);
}

function renderOffice() {
  const officeGrid = $("#officeGrid");
  if (!officeGrid) return;
  if (!state.departments.length) {
    officeGrid.innerHTML = `<div class="empty-state">부서와 직원을 추가하면 여기에 사무실 뼈대가 표시됩니다.</div>`;
    return;
  }

  officeGrid.innerHTML = state.departments.map((department) => {
    const employees = state.employees.filter((employee) => employee.departmentId === department.id);
    const people = employees.length
      ? employees.map((employee) => `<button class="pixel-employee" type="button" data-select-employee="${escapeHtml(employee.id)}">${escapeHtml(employee.name)}</button>`).join("")
      : `<p class="muted-text">직원 없음</p>`;
    return `
      <article class="department-office">
        <h2>${escapeHtml(department.name)}</h2>
        <p>${escapeHtml(department.description || "설명 없음")}</p>
        <div class="office-people">${people}</div>
      </article>
    `;
  }).join("");

  $$("[data-select-employee]").forEach((button) => {
    button.addEventListener("click", () => selectEmployee(button.dataset.selectEmployee));
  });
}

function selectEmployee(id) {
  selectedEmployeeId = id;
  const employee = state.employees.find((item) => item.id === id);
  const department = employee ? departmentById(employee.departmentId) : null;
  $("#inspectorName").textContent = employee?.name || "선택된 항목 없음";
  $("#inspectorDepartment").textContent = department?.name || "-";
  $("#inspectorRole").textContent = employee?.role || "-";
  $("#inspectorOutput").textContent = employee?.output || "-";
}

function departmentOptions(selected = "") {
  if (!state.departments.length) return `<option value="">먼저 부서를 추가하세요</option>`;
  return state.departments
    .map((department) => `<option value="${escapeHtml(department.id)}" ${department.id === selected ? "selected" : ""}>${escapeHtml(department.name)}</option>`)
    .join("");
}

function renderSettings() {
  $("#departmentCountLabel").textContent = `${state.departments.length}개 부서`;
  $("#employeeCountLabel").textContent = `${state.employees.length}명 직원`;
  $("#workflowCountLabel").textContent = `${state.workflows.length}개 워크플로우`;
  $("#projectCountLabel").textContent = `${state.projects.length}개 프로젝트`;

  $("#departmentList").innerHTML = state.departments.length
    ? state.departments.map((department) => `
      <article class="entity-card">
        <div>
          <strong>${escapeHtml(department.name)}</strong>
          <span>${escapeHtml(department.description || "설명 없음")}</span>
        </div>
        <button class="mini-button" type="button" data-edit-department="${escapeHtml(department.id)}">수정</button>
      </article>
    `).join("")
    : `<p class="empty-state">등록된 부서가 없습니다.</p>`;

  $("#employeeDepartmentInput").innerHTML = departmentOptions();
  $("#employeeList").innerHTML = state.employees.length
    ? state.employees.map((employee) => {
      const department = departmentById(employee.departmentId);
      return `
        <article class="entity-card">
          <div>
            <strong>${escapeHtml(employee.name)}</strong>
            <span>${escapeHtml(department?.name || "부서 없음")} · ${escapeHtml(employee.role || "역할 없음")}</span>
          </div>
          <button class="mini-button" type="button" data-edit-employee="${escapeHtml(employee.id)}">수정</button>
        </article>
      `;
    }).join("")
    : `<p class="empty-state">등록된 직원이 없습니다.</p>`;

  $("#workflowList").innerHTML = state.workflows.length
    ? state.workflows.map((workflow) => `
      <article class="entity-card">
        <div>
          <strong>${escapeHtml(workflow.name)}</strong>
          <span>${escapeHtml(workflow.status || "draft")}</span>
        </div>
      </article>
    `).join("")
    : `<p class="empty-state">등록된 워크플로우가 없습니다.</p>`;

  $("#projectList").innerHTML = state.projects.length
    ? state.projects.map((project) => `
      <article class="entity-card">
        <div>
          <strong>${escapeHtml(project.name)}</strong>
          <span>${escapeHtml(project.status || "draft")}</span>
        </div>
      </article>
    `).join("")
    : `<p class="empty-state">등록된 프로젝트가 없습니다.</p>`;

  $$("[data-edit-department]").forEach((button) => button.addEventListener("click", () => editDepartment(button.dataset.editDepartment)));
  $$("[data-edit-employee]").forEach((button) => button.addEventListener("click", () => editEmployee(button.dataset.editEmployee)));
}

function resetDepartmentForm() {
  editingDepartmentId = "";
  $("#departmentForm").reset();
  $("#departmentEditingIdInput").value = "";
  $("#departmentFormTitle").textContent = "부서 추가";
  $("#departmentCancelEditButton").hidden = true;
}

function editDepartment(id) {
  const department = departmentById(id);
  if (!department) return;
  editingDepartmentId = id;
  $("#departmentEditingIdInput").value = id;
  $("#departmentFormTitle").textContent = "부서 수정";
  $("#departmentNameInput").value = department.name || "";
  $("#departmentDescriptionInput").value = department.description || "";
  $("#departmentPromptInput").value = department.prompt || "";
  $("#departmentCancelEditButton").hidden = false;
}

function resetEmployeeForm() {
  editingEmployeeId = "";
  $("#employeeForm").reset();
  $("#employeeEditingIdInput").value = "";
  $("#employeeFormTitle").textContent = "직원 추가";
  $("#employeeCancelEditButton").hidden = true;
  $("#employeeDepartmentInput").innerHTML = departmentOptions();
}

function editEmployee(id) {
  const employee = state.employees.find((item) => item.id === id);
  if (!employee) return;
  editingEmployeeId = id;
  $("#employeeEditingIdInput").value = id;
  $("#employeeFormTitle").textContent = "직원 수정";
  $("#employeeNameInput").value = employee.name || "";
  $("#employeeDepartmentInput").innerHTML = departmentOptions(employee.departmentId);
  $("#employeeRoleInput").value = employee.role || "";
  $("#employeeOutputInput").value = employee.output || "";
  $("#employeePromptInput").value = employee.prompt || "";
  $("#employeeCancelEditButton").hidden = false;
}

$("#departmentForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = editingDepartmentId || makeId("department");
  const department = {
    id,
    name: $("#departmentNameInput").value.trim(),
    description: $("#departmentDescriptionInput").value.trim(),
    prompt: $("#departmentPromptInput").value.trim(),
  };
  if (!department.name) return;
  const index = state.departments.findIndex((item) => item.id === id);
  if (index >= 0) state.departments[index] = department;
  else state.departments.push(department);
  saveState();
  resetDepartmentForm();
  renderOffice();
  renderSettings();
});

$("#departmentCancelEditButton").addEventListener("click", resetDepartmentForm);

$("#employeeForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const id = editingEmployeeId || makeId("employee");
  const employee = {
    id,
    name: $("#employeeNameInput").value.trim(),
    departmentId: $("#employeeDepartmentInput").value,
    role: $("#employeeRoleInput").value.trim(),
    output: $("#employeeOutputInput").value.trim(),
    prompt: $("#employeePromptInput").value.trim(),
  };
  if (!employee.name || !employee.departmentId) return;
  const index = state.employees.findIndex((item) => item.id === id);
  if (index >= 0) state.employees[index] = employee;
  else state.employees.push(employee);
  saveState();
  resetEmployeeForm();
  renderOffice();
  renderSettings();
  selectEmployee(id);
});

$("#employeeCancelEditButton").addEventListener("click", resetEmployeeForm);

$("#workflowForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const workflow = {
    id: makeId("workflow"),
    name: $("#workflowNameInput").value.trim(),
    status: $("#workflowStatusInput").value,
    prompt: $("#workflowPromptInput").value.trim(),
  };
  if (!workflow.name) return;
  state.workflows.unshift(workflow);
  saveState();
  event.currentTarget.reset();
  renderSettings();
});

$("#projectForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const project = {
    id: makeId("project"),
    name: $("#projectNameInput").value.trim(),
    content: $("#projectContentInput").value.trim(),
    status: $("#projectStatusInput").value,
  };
  if (!project.name) return;
  state.projects.unshift(project);
  saveState();
  event.currentTarget.reset();
  renderSettings();
});

$("#settingsForm").addEventListener("submit", (event) => {
  event.preventDefault();
  saveState();
});

$$(".category-tab").forEach((tab) => tab.addEventListener("click", () => showView(tab.dataset.view)));

renderOffice();
renderSettings();
