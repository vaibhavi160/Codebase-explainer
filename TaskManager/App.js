/* ══════════════════════════════════════════════
   TaskFlow — app.js
   ══════════════════════════════════════════════ */

/* ══════════════════════════════════════════════
   IN-MEMORY DATABASE
   ══════════════════════════════════════════════ */
const DB = {
  users: [
    { id: 'u1', name: 'Alex Chen',    email: 'admin@demo.com',  password: 'demo123', role: 'admin',  createdAt: '2024-01-01' },
    { id: 'u2', name: 'Jordan Kim',   email: 'member@demo.com', password: 'demo123', role: 'member', createdAt: '2024-01-05' },
    { id: 'u3', name: 'Sam Rivera',   email: 'sam@demo.com',    password: 'demo123', role: 'member', createdAt: '2024-01-10' },
    { id: 'u4', name: 'Morgan Lee',   email: 'morgan@demo.com', password: 'demo123', role: 'member', createdAt: '2024-01-15' },
  ],
  projects: [
    {
      id: 'p1', name: 'Website Redesign',
      description: 'Complete overhaul of the marketing website with new brand identity.',
      status: 'active', color: '#5b9cf6', dueDate: '2025-06-15',
      createdBy: 'u1', createdAt: '2024-02-01',
      members: [{ userId: 'u1', role: 'lead' }, { userId: 'u2', role: 'member' }, { userId: 'u3', role: 'member' }]
    },
    {
      id: 'p2', name: 'Mobile App v2',
      description: 'New features and performance improvements for the mobile app.',
      status: 'active', color: '#4caf82', dueDate: '2025-07-30',
      createdBy: 'u1', createdAt: '2024-02-15',
      members: [{ userId: 'u1', role: 'lead' }, { userId: 'u2', role: 'member' }, { userId: 'u4', role: 'member' }]
    },
    {
      id: 'p3', name: 'API Integration',
      description: 'Third-party payment and analytics integrations.',
      status: 'on-hold', color: '#f5a623', dueDate: '2025-05-01',
      createdBy: 'u1', createdAt: '2024-03-01',
      members: [{ userId: 'u1', role: 'lead' }, { userId: 'u3', role: 'member' }]
    },
  ],
  tasks: [
    { id: 't1', projectId: 'p1', name: 'Create wireframes',          description: 'Design low-fidelity wireframes for all main pages.',       status: 'done',        priority: 'high',   assignedTo: 'u2', dueDate: '2025-04-10', createdBy: 'u1', createdAt: '2024-02-02' },
    { id: 't2', projectId: 'p1', name: 'Write copy for homepage',    description: 'Marketing copy for hero section and feature highlights.',  status: 'in-progress', priority: 'medium', assignedTo: 'u3', dueDate: '2025-05-20', createdBy: 'u1', createdAt: '2024-02-05' },
    { id: 't3', projectId: 'p1', name: 'Implement design system',    description: 'Set up tokens, components, and documentation.',            status: 'todo',        priority: 'high',   assignedTo: 'u2', dueDate: '2025-06-01', createdBy: 'u1', createdAt: '2024-02-08' },
    { id: 't4', projectId: 'p1', name: 'SEO audit',                  description: 'Audit current site and plan optimizations.',               status: 'todo',        priority: 'low',    assignedTo: '',   dueDate: '2025-06-10', createdBy: 'u1', createdAt: '2024-02-10' },
    { id: 't5', projectId: 'p2', name: 'Set up push notifications',  description: 'Implement FCM for iOS and Android.',                       status: 'in-progress', priority: 'high',   assignedTo: 'u4', dueDate: '2025-05-15', createdBy: 'u1', createdAt: '2024-02-16' },
    { id: 't6', projectId: 'p2', name: 'Dark mode support',          description: 'Add system-level dark mode detection and theming.',        status: 'done',        priority: 'medium', assignedTo: 'u2', dueDate: '2025-04-30', createdBy: 'u1', createdAt: '2024-02-18' },
    { id: 't7', projectId: 'p2', name: 'Performance profiling',      description: 'Profile and fix frame drops on lower-end devices.',        status: 'todo',        priority: 'high',   assignedTo: 'u4', dueDate: '2025-07-01', createdBy: 'u1', createdAt: '2024-02-20' },
    { id: 't8', projectId: 'p3', name: 'Stripe webhook handler',     description: 'Handle payment events and update order status.',           status: 'todo',        priority: 'high',   assignedTo: 'u3', dueDate: '2025-04-01', createdBy: 'u1', createdAt: '2024-03-02' },
    { id: 't9', projectId: 'p3', name: 'Google Analytics setup',     description: 'Implement GA4 with custom events.',                       status: 'in-progress', priority: 'medium', assignedTo: 'u3', dueDate: '2025-04-15', createdBy: 'u1', createdAt: '2024-03-05' },
  ],
  _nextId: { user: 5, project: 4, task: 10 }
};

function newId(type) {
  return type[0] + DB._nextId[type]++;
}

/* ══════════════════════════════════════════════
   APP STATE
   ══════════════════════════════════════════════ */
const App = {
  currentUser:      null,
  currentView:      'dashboard',
  currentProject:   null,
  editingProjectId: null,
  editingTaskId:    null,
};

/* ══════════════════════════════════════════════
   AUTH
   ══════════════════════════════════════════════ */
function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach((t, i) => {
    t.classList.toggle('active', (i === 0 && tab === 'login') || (i === 1 && tab === 'signup'));
  });
  document.getElementById('login-form').style.display  = tab === 'login'  ? '' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? '' : 'none';
  document.getElementById('auth-error').style.display  = 'none';
}

function showAuthError(msg) {
  const el = document.getElementById('auth-error');
  el.textContent = msg;
  el.style.display = '';
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-password').value;
  const user  = DB.users.find(u => u.email === email && u.password === pass);
  if (!user) { showAuthError('Invalid email or password.'); return; }
  startSession(user);
}

function doSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-password').value;
  const role  = document.getElementById('signup-role').value;
  if (!name || !email || !pass) { showAuthError('All fields are required.'); return; }
  if (pass.length < 6)          { showAuthError('Password must be at least 6 characters.'); return; }
  if (DB.users.find(u => u.email === email)) { showAuthError('Email already in use.'); return; }
  const user = {
    id: 'u' + DB._nextId.user++,
    name, email, password: pass, role,
    createdAt: new Date().toISOString().slice(0, 10)
  };
  DB.users.push(user);
  startSession(user);
}

function startSession(user) {
  App.currentUser = user;
  document.getElementById('auth-screen').style.display = 'none';
  document.getElementById('app-screen').classList.add('visible');
  document.getElementById('sb-avatar').textContent = initials(user.name);
  document.getElementById('sb-name').textContent   = user.name;
  document.getElementById('sb-role').textContent   = user.role;

  const hour     = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('dash-greeting').textContent = greeting + ', ' + user.name.split(' ')[0] + '.';

  /* Role-based element visibility */
  const isAdmin = user.role === 'admin';
  document.getElementById('btn-new-project').style.display = isAdmin ? '' : 'none';
  document.getElementById('btn-invite').style.display      = isAdmin ? '' : 'none';

  navigate('dashboard');
}

function doLogout() {
  App.currentUser = null;
  document.getElementById('auth-screen').style.display = '';
  document.getElementById('app-screen').classList.remove('visible');
  document.getElementById('login-email').value    = '';
  document.getElementById('login-password').value = '';
  document.getElementById('auth-error').style.display = 'none';
}

/* ══════════════════════════════════════════════
   NAVIGATION
   ══════════════════════════════════════════════ */
function navigate(view, data) {
  App.currentView = view;

  /* Activate correct view panel */
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  const viewId = (view === 'project-detail') ? 'view-project-detail' : 'view-' + view;
  const el = document.getElementById(viewId);
  if (el) el.classList.add('active');

  /* Highlight correct sidebar item */
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const navItem = document.querySelector('.nav-item[data-view="' + view + '"]');
  if (navItem) navItem.classList.add('active');
  else if (view === 'project-detail') {
    document.querySelector('.nav-item[data-view="projects"]')?.classList.add('active');
  }

  /* Handle project-detail id passed as string */
  if (view === 'project-detail' && typeof data === 'string') {
    App.currentProject = data;
  }

  /* Render the appropriate view */
  if (view === 'dashboard')      renderDashboard();
  else if (view === 'projects')  renderProjects();
  else if (view === 'my-tasks')  renderMyTasks();
  else if (view === 'team')      renderTeam();
  else if (view === 'project-detail') renderProjectDetail();
}

/* ══════════════════════════════════════════════
   HELPERS
   ══════════════════════════════════════════════ */
function initials(name) {
  return name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}
function getUser(id)    { return DB.users.find(u => u.id === id); }
function getProject(id) { return DB.projects.find(p => p.id === id); }
function isOverdue(dateStr) {
  return dateStr && new Date(dateStr) < new Date();
}
function fmtDate(d) {
  if (!d) return '—';
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
function statusBadge(s) {
  const map = {
    'todo':       ['badge-gray',  'Todo'],
    'in-progress':['badge-blue',  'In Progress'],
    'done':       ['badge-green', 'Done'],
    'active':     ['badge-green', 'Active'],
    'on-hold':    ['badge-amber', 'On Hold'],
    'completed':  ['badge-gray',  'Completed']
  };
  const [cls, label] = map[s] || ['badge-gray', s];
  return `<span class="badge ${cls}">${label}</span>`;
}
function priorityBadge(p) {
  const map = { high: 'badge-red', medium: 'badge-amber', low: 'badge-gray' };
  return `<span class="badge ${map[p] || 'badge-gray'}">${p}</span>`;
}
function projectTasks(projectId) { return DB.tasks.filter(t => t.projectId === projectId); }
function userTasks(userId)       { return DB.tasks.filter(t => t.assignedTo === userId); }
function isProjectMember(project, userId) {
  return project.members.some(m => m.userId === userId)
      || DB.users.find(u => u.id === userId)?.role === 'admin';
}
function canEditTask(task) {
  const u = App.currentUser;
  if (u.role === 'admin') return true;
  return task.assignedTo === u.id || task.createdBy === u.id;
}

/* ══════════════════════════════════════════════
   RENDER — DASHBOARD
   ══════════════════════════════════════════════ */
function renderDashboard() {
  const u        = App.currentUser;
  const allTasks = u.role === 'admin' ? DB.tasks : userTasks(u.id);
  const done     = allTasks.filter(t => t.status === 'done');
  const inProg   = allTasks.filter(t => t.status === 'in-progress');
  const overdue  = allTasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate));

  document.getElementById('stat-total').textContent    = allTasks.length;
  document.getElementById('stat-done').textContent     = done.length;
  document.getElementById('stat-done-pct').textContent = allTasks.length
    ? Math.round(done.length / allTasks.length * 100) + '% done' : '0% done';
  document.getElementById('stat-inprog').textContent   = inProg.length;
  document.getElementById('stat-overdue').textContent  = overdue.length;

  /* My Tasks badge in sidebar */
  const myOpen  = userTasks(u.id).filter(t => t.status !== 'done');
  const badge   = document.getElementById('my-tasks-badge');
  if (myOpen.length > 0) { badge.textContent = myOpen.length; badge.style.display = ''; }
  else badge.style.display = 'none';

  /* Recent projects */
  const myProjects = u.role === 'admin'
    ? DB.projects
    : DB.projects.filter(p => isProjectMember(p, u.id));

  const projEl = document.getElementById('dash-projects');
  if (myProjects.length === 0) {
    projEl.innerHTML = `<div class="empty-state"><div class="empty-title">No projects yet</div></div>`;
  } else {
    projEl.innerHTML = myProjects.slice(0, 3).map(p => {
      const tasks = projectTasks(p.id);
      const pct   = tasks.length ? Math.round(tasks.filter(t => t.status === 'done').length / tasks.length * 100) : 0;
      return `<div class="task-item" onclick="navigate('project-detail','${p.id}')">
        <div style="width:4px;height:40px;background:${p.color};border-radius:2px;flex-shrink:0;"></div>
        <div class="task-body">
          <div class="task-name">${p.name}</div>
          <div class="task-meta">${statusBadge(p.status)} <span class="task-meta-dot">·</span> ${tasks.length} tasks</div>
          <div class="progress-bar" style="margin-top:6px;">
            <div class="progress-fill" style="width:${pct}%;background:${p.color}"></div>
          </div>
        </div>
        <div style="font-size:12px;color:var(--text3);font-family:var(--font-mono);font-weight:500;">${pct}%</div>
      </div>`;
    }).join('');
  }

  /* Recent tasks assigned to current user */
  const taskEl      = document.getElementById('dash-tasks');
  const recentTasks = userTasks(u.id).slice(-5).reverse();
  if (recentTasks.length === 0) {
    taskEl.innerHTML = `<div class="empty-state"><div class="empty-title">No tasks assigned</div></div>`;
  } else {
    taskEl.innerHTML = recentTasks.map(t => renderTaskItem(t, true)).join('');
  }
}

/* ══════════════════════════════════════════════
   RENDER — PROJECTS
   ══════════════════════════════════════════════ */
function renderProjects() {
  const u      = App.currentUser;
  const search = document.getElementById('proj-search')?.value.toLowerCase() || '';
  let projs    = u.role === 'admin'
    ? DB.projects
    : DB.projects.filter(p => isProjectMember(p, u.id));
  if (search) projs = projs.filter(p =>
    p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search));

  const grid = document.getElementById('projects-grid');
  if (projs.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;">
      <div class="empty-icon">◻</div>
      <div class="empty-title">No projects found</div>
      <div class="empty-sub">Create a new project to get started.</div>
    </div>`;
    return;
  }

  grid.innerHTML = projs.map(p => {
    const tasks  = projectTasks(p.id);
    const done   = tasks.filter(t => t.status === 'done').length;
    const pct    = tasks.length ? Math.round(done / tasks.length * 100) : 0;
    const overdueTasks = tasks.filter(t => t.status !== 'done' && isOverdue(t.dueDate)).length;
    const membChips    = p.members.slice(0, 4).map(m => {
      const usr = getUser(m.userId);
      return usr ? `<div class="member-chip" title="${usr.name}">${initials(usr.name)}</div>` : '';
    }).join('');
    return `<div class="project-card" onclick="navigate('project-detail','${p.id}')">
      <div class="project-card-accent" style="background:${p.color}"></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
        ${statusBadge(p.status)}
        ${overdueTasks > 0 ? `<span class="badge badge-red">${overdueTasks} overdue</span>` : ''}
      </div>
      <div class="project-card-name">${p.name}</div>
      <div class="project-card-desc">${p.description}</div>
      <div class="project-card-meta">
        <span>${tasks.length} tasks</span>
        <span class="task-meta-dot">·</span>
        <span>${p.members.length} members</span>
        ${p.dueDate ? `<span class="task-meta-dot">·</span>
          <span class="${isOverdue(p.dueDate) ? 'overdue' : ''}">Due ${fmtDate(p.dueDate)}</span>` : ''}
      </div>
      <div class="member-chips">
        ${membChips}
        ${p.members.length > 4 ? `<div class="member-chip">+${p.members.length - 4}</div>` : ''}
      </div>
      <div class="project-card-progress">
        <div class="project-card-progress-label"><span>Progress</span><span>${pct}%</span></div>
        <div class="progress-bar">
          <div class="progress-fill" style="width:${pct}%;background:${p.color}"></div>
        </div>
      </div>
    </div>`;
  }).join('');
}

/* ══════════════════════════════════════════════
   RENDER — PROJECT DETAIL
   ══════════════════════════════════════════════ */
function renderProjectDetail() {
  const projId  = App.currentProject;
  if (!projId) return;
  const project = getProject(projId);
  if (!project) return;

  const u       = App.currentUser;
  const isAdmin = u.role === 'admin';
  const isLead  = project.members.find(m => m.userId === u.id && m.role === 'lead');

  document.getElementById('pd-title').textContent    = project.name;
  document.getElementById('pd-subtitle').textContent = project.description;
  document.getElementById('btn-new-task').style.display     = (isAdmin || isLead) ? '' : 'none';
  document.getElementById('btn-edit-project').style.display = isAdmin ? '' : 'none';

  switchDetailTab('tasks');
}

function renderDetailTasks() {
  const projId = App.currentProject;
  if (!projId) return;

  const search   = document.getElementById('task-search')?.value.toLowerCase() || '';
  const statusF  = document.getElementById('task-filter-status')?.value  || '';
  const priorityF= document.getElementById('task-filter-priority')?.value || '';
  let tasks = projectTasks(projId);
  if (search)    tasks = tasks.filter(t => t.name.toLowerCase().includes(search));
  if (statusF)   tasks = tasks.filter(t => t.status === statusF);
  if (priorityF) tasks = tasks.filter(t => t.priority === priorityF);

  const el = document.getElementById('pd-tasks');
  if (tasks.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-title">No tasks found</div>
      <div class="empty-sub">Create a task to get started.</div>
    </div>`;
    return;
  }
  el.innerHTML = tasks.map(t => renderTaskItem(t, false)).join('');
}

function renderDetailMembers() {
  const project = getProject(App.currentProject);
  if (!project) return;
  const u       = App.currentUser;
  const isAdmin = u.role === 'admin';

  const el = document.getElementById('pd-members');
  const cards = project.members.map(m => {
    const usr = getUser(m.userId);
    if (!usr) return '';
    return `<div class="team-card" style="margin-bottom:10px;">
      <div class="team-avatar" style="background:var(--bg4);">${initials(usr.name)}</div>
      <div class="team-card-body">
        <div class="team-card-name">${usr.name}</div>
        <div class="team-card-email">${usr.email}</div>
        <div class="team-card-role">
          ${m.role === 'lead'
            ? `<span class="badge badge-amber">Lead</span>`
            : `<span class="badge badge-gray">Member</span>`}
        </div>
      </div>
      ${isAdmin && m.userId !== u.id
        ? `<button class="btn btn-danger btn-sm"
             onclick="removeProjectMember('${project.id}','${m.userId}')">Remove</button>` : ''}
    </div>`;
  }).join('');

  el.innerHTML = cards + (isAdmin
    ? `<div style="margin-top:12px;">
         <button class="btn btn-ghost btn-sm" onclick="openAddProjMemberModal()">+ Add Member</button>
       </div>` : '');
}

function switchDetailTab(tab) {
  document.querySelectorAll('.tab-btn').forEach((b, i) =>
    b.classList.toggle('active', (i === 0 && tab === 'tasks') || (i === 1 && tab === 'members')));
  document.getElementById('pd-tasks-tab').style.display   = tab === 'tasks'   ? '' : 'none';
  document.getElementById('pd-members-tab').style.display = tab === 'members' ? '' : 'none';
  if (tab === 'tasks')   renderDetailTasks();
  else                   renderDetailMembers();
}

/* ══════════════════════════════════════════════
   RENDER — TASK ITEM
   ══════════════════════════════════════════════ */
function renderTaskItem(t, compact) {
  const assignee = t.assignedTo ? getUser(t.assignedTo) : null;
  const proj     = getProject(t.projectId);
  const od       = t.status !== 'done' && isOverdue(t.dueDate);
  const canEdit  = canEditTask(t);
  return `<div class="task-item" onclick="${canEdit ? `openTaskModal('${t.id}')` : ''}">
    <div class="priority-dot ${t.priority}"></div>
    <div class="task-check ${t.status === 'done' ? 'done' : ''}"
         onclick="event.stopPropagation();toggleTaskDone('${t.id}')"></div>
    <div class="task-body">
      <div class="task-name ${t.status === 'done' ? 'done' : ''}">${t.name}</div>
      <div class="task-meta">
        ${statusBadge(t.status)}
        ${!compact ? '' : proj ? `<span class="task-meta-dot">·</span><span>${proj.name}</span>` : ''}
        ${assignee ? `<span class="task-meta-dot">·</span><span>${assignee.name}</span>` : ''}
        ${t.dueDate
          ? `<span class="task-meta-dot">·</span>
             <span class="${od ? 'overdue' : ''}">Due ${fmtDate(t.dueDate)}</span>` : ''}
        ${od ? `<span class="badge badge-red">Overdue</span>` : ''}
      </div>
    </div>
    ${priorityBadge(t.priority)}
  </div>`;
}

function toggleTaskDone(taskId) {
  const t = DB.tasks.find(x => x.id === taskId);
  if (!t || !canEditTask(t)) return;
  t.status = t.status === 'done' ? 'todo' : 'done';
  if (App.currentView === 'my-tasks')        renderMyTasks();
  else if (App.currentView === 'project-detail') renderDetailTasks();
  else if (App.currentView === 'dashboard')  renderDashboard();
}

/* ══════════════════════════════════════════════
   RENDER — MY TASKS
   ══════════════════════════════════════════════ */
function renderMyTasks() {
  const u       = App.currentUser;
  const search  = document.getElementById('mt-search')?.value.toLowerCase() || '';
  const statusF = document.getElementById('mt-filter-status')?.value || '';
  let tasks     = userTasks(u.id);
  if (search)  tasks = tasks.filter(t => t.name.toLowerCase().includes(search));
  if (statusF) tasks = tasks.filter(t => t.status === statusF);

  const el = document.getElementById('my-tasks-list');
  if (tasks.length === 0) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-icon">✓</div>
      <div class="empty-title">No tasks assigned to you</div>
    </div>`;
    return;
  }
  el.innerHTML = tasks.map(t => renderTaskItem(t, true)).join('');
}

/* ══════════════════════════════════════════════
   RENDER — TEAM
   ══════════════════════════════════════════════ */
function renderTeam() {
  const u            = App.currentUser;
  const grid         = document.getElementById('team-grid');
  const avatarColors = ['#5b9cf6', '#4caf82', '#9b7ff4', '#f5a623', '#e05555'];

  grid.innerHTML = DB.users.map((usr, i) => {
    const c         = avatarColors[i % avatarColors.length];
    const taskCount = userTasks(usr.id).filter(t => t.status !== 'done').length;
    return `<div class="team-card">
      <div class="team-avatar"
           style="background:${c}22;border-color:${c}44;color:${c};">${initials(usr.name)}</div>
      <div class="team-card-body">
        <div class="team-card-name">
          ${usr.name}
          ${usr.id === u.id ? ' <span class="badge badge-gray" style="font-size:10px;">You</span>' : ''}
        </div>
        <div class="team-card-email">${usr.email}</div>
        <div class="team-card-role">
          ${usr.role === 'admin'
            ? `<span class="badge badge-amber">Admin</span>`
            : `<span class="badge badge-blue">Member</span>`}
          <span class="badge badge-gray" style="margin-left:4px;">${taskCount} open tasks</span>
        </div>
      </div>
      ${u.role === 'admin' && usr.id !== u.id
        ? `<button class="btn btn-ghost btn-sm btn-icon"
                   title="Toggle role"
                   onclick="toggleRole('${usr.id}')">↕</button>` : ''}
    </div>`;
  }).join('');
}

function toggleRole(userId) {
  const usr = DB.users.find(u => u.id === userId);
  if (!usr) return;
  usr.role = usr.role === 'admin' ? 'member' : 'admin';
  renderTeam();
}

/* ══════════════════════════════════════════════
   MODALS — GENERIC
   ══════════════════════════════════════════════ */
function openModal(id)  { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }
function outsideClose(e, id) { if (e.target.id === id) closeModal(id); }

function showModalAlert(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = '';
}

/* ══════════════════════════════════════════════
   MODAL — TASK
   ══════════════════════════════════════════════ */
function openTaskModal(taskId) {
  App.editingTaskId = taskId || null;
  const project = getProject(App.currentProject);
  const isAdmin = App.currentUser.role === 'admin';

  document.getElementById('modal-task-title').textContent      = taskId ? 'Edit Task' : 'New Task';
  document.getElementById('modal-task-alert').style.display    = 'none';
  document.getElementById('btn-delete-task').style.display     = (taskId && isAdmin) ? '' : 'none';

  /* Populate assignee dropdown from project members */
  const members  = project
    ? project.members.map(m => getUser(m.userId)).filter(Boolean)
    : DB.users;
  const assignEl = document.getElementById('task-assign-in');
  assignEl.innerHTML = '<option value="">Unassigned</option>'
    + members.map(m => `<option value="${m.id}">${m.name}</option>`).join('');

  if (taskId) {
    const t = DB.tasks.find(x => x.id === taskId);
    document.getElementById('task-name-in').value     = t.name;
    document.getElementById('task-desc-in').value     = t.description;
    document.getElementById('task-status-in').value   = t.status;
    document.getElementById('task-priority-in').value = t.priority;
    document.getElementById('task-due-in').value      = t.dueDate || '';
    document.getElementById('task-assign-in').value   = t.assignedTo || '';
  } else {
    document.getElementById('task-name-in').value     = '';
    document.getElementById('task-desc-in').value     = '';
    document.getElementById('task-status-in').value   = 'todo';
    document.getElementById('task-priority-in').value = 'medium';
    document.getElementById('task-due-in').value      = '';
    document.getElementById('task-assign-in').value   = '';
  }
  openModal('modal-task');
}

function saveTask() {
  const name = document.getElementById('task-name-in').value.trim();
  if (!name) { showModalAlert('modal-task-alert', 'Task name is required.'); return; }

  const taskData = {
    projectId:  App.currentProject,
    name,
    description: document.getElementById('task-desc-in').value.trim(),
    status:      document.getElementById('task-status-in').value,
    priority:    document.getElementById('task-priority-in').value,
    dueDate:     document.getElementById('task-due-in').value || '',
    assignedTo:  document.getElementById('task-assign-in').value || '',
    createdBy:   App.currentUser.id,
  };

  if (App.editingTaskId) {
    const t = DB.tasks.find(x => x.id === App.editingTaskId);
    Object.assign(t, taskData);
  } else {
    DB.tasks.push({
      id: 't' + DB._nextId.task++,
      createdAt: new Date().toISOString().slice(0, 10),
      ...taskData
    });
  }
  closeModal('modal-task');
  renderDetailTasks();
}

function deleteTask() {
  if (!App.editingTaskId) return;
  DB.tasks = DB.tasks.filter(t => t.id !== App.editingTaskId);
  closeModal('modal-task');
  renderDetailTasks();
}

/* ══════════════════════════════════════════════
   MODAL — PROJECT
   ══════════════════════════════════════════════ */
function editCurrentProject() {
  const p = getProject(App.currentProject);
  if (!p) return;
  App.editingProjectId = p.id;
  document.getElementById('modal-proj-title').textContent = 'Edit Project';
  document.getElementById('proj-name').value   = p.name;
  document.getElementById('proj-desc').value   = p.description;
  document.getElementById('proj-status').value = p.status;
  document.getElementById('proj-due').value    = p.dueDate || '';
  document.getElementById('proj-color').value  = p.color;
  openModal('modal-project');
}

function saveProject() {
  const name = document.getElementById('proj-name').value.trim();
  if (!name) { showModalAlert('modal-project-alert', 'Project name is required.'); return; }

  const data = {
    name,
    description: document.getElementById('proj-desc').value.trim(),
    status:      document.getElementById('proj-status').value,
    dueDate:     document.getElementById('proj-due').value || '',
    color:       document.getElementById('proj-color').value,
  };

  if (App.editingProjectId) {
    Object.assign(getProject(App.editingProjectId), data);
    App.editingProjectId = null;
    closeModal('modal-project');
    if (App.currentView === 'project-detail') renderProjectDetail();
    else renderProjects();
  } else {
    const proj = {
      id: 'p' + DB._nextId.project++,
      ...data,
      createdBy: App.currentUser.id,
      createdAt: new Date().toISOString().slice(0, 10),
      members: [{ userId: App.currentUser.id, role: 'lead' }]
    };
    DB.projects.push(proj);
    closeModal('modal-project');
    navigate('project-detail', proj.id);
  }

  /* Reset form */
  document.getElementById('proj-name').value = '';
  document.getElementById('proj-desc').value = '';
}

/* ══════════════════════════════════════════════
   MODAL — INVITE / PROJECT MEMBERS
   ══════════════════════════════════════════════ */
function inviteMember() {
  const email = document.getElementById('invite-email').value.trim();
  const user  = DB.users.find(u => u.email === email);
  if (!user) { showModalAlert('invite-alert', 'No user found with that email.'); return; }
  closeModal('modal-invite');
  document.getElementById('invite-email').value = '';
  renderTeam();
}

function openAddProjMemberModal() {
  const project   = getProject(App.currentProject);
  const existing  = new Set(project.members.map(m => m.userId));
  const available = DB.users.filter(u => !existing.has(u.id));
  if (available.length === 0) {
    alert('All team members are already in this project.');
    return;
  }
  const sel = document.getElementById('add-proj-member-select');
  sel.innerHTML = available.map(u =>
    `<option value="${u.id}">${u.name} (${u.email})</option>`).join('');
  openModal('modal-add-proj-member');
}

function addProjectMember() {
  const userId  = document.getElementById('add-proj-member-select').value;
  const role    = document.getElementById('add-proj-member-role').value;
  const project = getProject(App.currentProject);
  if (!project.members.find(m => m.userId === userId)) {
    project.members.push({ userId, role });
  }
  closeModal('modal-add-proj-member');
  renderDetailMembers();
}

function removeProjectMember(projectId, userId) {
  const project = getProject(projectId);
  project.members = project.members.filter(m => m.userId !== userId);
  renderDetailMembers();
}

/* ══════════════════════════════════════════════
   KEYBOARD SHORTCUTS
   ══════════════════════════════════════════════ */
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    document.querySelectorAll('.modal-overlay.open').forEach(m => m.classList.remove('open'));
  }
  /* Enter to submit login */
  if (e.key === 'Enter'
      && document.getElementById('login-form').style.display  !== 'none'
      && document.getElementById('auth-screen').style.display !== 'none') {
    doLogin();
  }
});

/* ══════════════════════════════════════════════
   PROJECT MODAL — reset title on fresh open
   ══════════════════════════════════════════════ */
document.getElementById('modal-project').addEventListener('click', () => {
  if (!App.editingProjectId) {
    document.getElementById('modal-proj-title').textContent      = 'New Project';
    document.getElementById('modal-project-alert').style.display = 'none';
  }
});