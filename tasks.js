// tasks.js
/*
 * Auto-generated script using FullCalendar to display policy tasks in a monthly grid.
 */
// (No instrumentation is needed here; the application initializes once the script is loaded.)

// Global state variables for the scheduler application
let saved = {};
let rowElements = [];
let currentDate;
let currentView;

/**
 * Initialize the application.  Builds the task list, sets up event handlers
 * for navigation and view switching, restores saved completion/verification
 * statuses from localStorage, and renders the initial calendar.
 *
 * @param {Array} tasksData Array of task objects loaded from JSON
 */
function initializeApp(tasksData) {
  // Restore saved completion/verification status
  try {
    saved = JSON.parse(localStorage.getItem('taskStatus')) || {};
  } catch (e) {
    saved = {};
  }
  // Build the task list and store row elements for quick access
  buildTaskList(tasksData);
  // Set up navigation between calendar and list views
  const navCal = document.getElementById('nav-calendar');
  const navList = document.getElementById('nav-list');
  navCal.addEventListener('click', () => {
    showCalendarView();
  });
  navList.addEventListener('click', () => {
    showListView();
  });
  // Set up calendar view controls
  document.getElementById('month-view-btn').addEventListener('click', () => {
    currentView = 'month';
    updateViewButtons();
    renderCalendar(tasksData);
  });
  document.getElementById('week-view-btn').addEventListener('click', () => {
    currentView = 'week';
    updateViewButtons();
    renderCalendar(tasksData);
  });
  document.getElementById('day-view-btn').addEventListener('click', () => {
    currentView = 'day';
    updateViewButtons();
    renderCalendar(tasksData);
  });
  document.getElementById('prev-btn').addEventListener('click', () => {
    adjustDate(-1);
    renderCalendar(tasksData);
  });
  document.getElementById('next-btn').addEventListener('click', () => {
    adjustDate(1);
    renderCalendar(tasksData);
  });
  document.getElementById('today-btn').addEventListener('click', () => {
    currentDate = new Date();
    renderCalendar(tasksData);
  });
  // Initialize date and view
  currentDate = new Date();
  currentView = 'month';
  updateViewButtons();
  showCalendarView();
  renderCalendar(tasksData);
}

/**
 * Build the task list table.  Each task row contains fields for the
 * description, periodicity, due date, and input boxes for tracking who
 * completed the task and who verified it.  Row elements are stored in a
 * global array to allow highlighting from the calendar.
 *
 * @param {Array} tasksData Array of task objects loaded from JSON
 */
function buildTaskList(tasksData) {
  const tbody = document.querySelector('#task-table tbody');
  tbody.innerHTML = '';
  rowElements = [];
  tasksData.forEach((task, idx) => {
    const row = document.createElement('tr');
    // Index column
    const idxTd = document.createElement('td');
    idxTd.textContent = idx + 1;
    row.appendChild(idxTd);
    // Policy
    const policyTd = document.createElement('td');
    policyTd.textContent = task.policy;
    row.appendChild(policyTd);
    // Task description
    const taskTd = document.createElement('td');
    taskTd.textContent = task.task;
    row.appendChild(taskTd);
    // Periodicity
    const perTd = document.createElement('td');
    perTd.textContent = task.periodicity;
    row.appendChild(perTd);
    // Due date
    const dueTd = document.createElement('td');
    dueTd.textContent = task.due_date;
    row.appendChild(dueTd);
    // Completed By input
    const compTd = document.createElement('td');
    const compInput = document.createElement('input');
    compInput.type = 'text';
    compInput.placeholder = 'Name';
    compInput.value = saved[idx] ? saved[idx].completed_by || '' : '';
    compInput.addEventListener('input', (e) => {
      const ver = saved[idx] ? saved[idx].verified_by || '' : '';
      saveStatus(idx, e.target.value, ver);
    });
    compTd.appendChild(compInput);
    row.appendChild(compTd);
    // Verified By input
    const verTd = document.createElement('td');
    const verInput = document.createElement('input');
    verInput.type = 'text';
    verInput.placeholder = 'Verifier';
    verInput.value = saved[idx] ? saved[idx].verified_by || '' : '';
    verInput.addEventListener('input', (e) => {
      const compVal = saved[idx] ? saved[idx].completed_by || '' : '';
      saveStatus(idx, compVal, e.target.value);
    });
    verTd.appendChild(verInput);
    row.appendChild(verTd);
    tbody.appendChild(row);
    // Store row for highlighting later
    rowElements[idx] = row;
  });
}

/**
 * Persist completion and verification status for a task and trigger calendar
 * re-render to update colors.  Stores status in localStorage.
 *
 * @param {number} index Task index in tasksData
 * @param {string} compBy Name of person completing the task
 * @param {string} verBy Name of person verifying the task
 */
function saveStatus(index, compBy, verBy) {
  saved[index] = { completed_by: compBy, verified_by: verBy };
  localStorage.setItem('taskStatus', JSON.stringify(saved));
  renderCalendar(tasksData);
}

/**
 * Adjust the current date forward or backward depending on the current view.
 * For month view, increments/decrements by one month; for week view by
 * seven days; for day view by a single day.
 *
 * @param {number} direction +1 for next, -1 for previous
 */
function adjustDate(direction) {
  const d = new Date(currentDate);
  if (currentView === 'month') {
    d.setMonth(d.getMonth() + direction);
  } else if (currentView === 'week') {
    d.setDate(d.getDate() + 7 * direction);
  } else {
    // day view
    d.setDate(d.getDate() + direction);
  }
  currentDate = d;
}

/**
 * Update the active state on view toggle buttons to reflect the current view.
 */
function updateViewButtons() {
  ['month', 'week', 'day'].forEach(view => {
    const btn = document.getElementById(view + '-view-btn');
    if (btn) {
      if (view === currentView) btn.classList.add('active');
      else btn.classList.remove('active');
    }
  });
}

/**
 * Show the calendar view and hide the list view.  Also update sidebar
 * navigation button active states.
 */
function showCalendarView() {
  document.getElementById('calendar-view').classList.add('active');
  document.getElementById('list-view').classList.remove('active');
  document.getElementById('nav-calendar').classList.add('active');
  document.getElementById('nav-list').classList.remove('active');
  // Ensure calendar is updated when switching back
  renderCalendar(tasksData);
}

/**
 * Show the task list view and hide the calendar view.  Update sidebar
 * navigation button active states.
 */
function showListView() {
  document.getElementById('calendar-view').classList.remove('active');
  document.getElementById('list-view').classList.add('active');
  document.getElementById('nav-calendar').classList.remove('active');
  document.getElementById('nav-list').classList.add('active');
}

/**
 * Highlight the table row corresponding to the given task index and
 * scroll it into view.  Switches to the list view automatically.
 *
 * @param {number} index Task index
 */
function highlightRow(index) {
  showListView();
  rowElements.forEach(row => {
    row.classList.remove('highlight');
  });
  const row = rowElements[index];
  if (row) {
    row.classList.add('highlight');
    row.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Render the calendar according to the current view (month/week/day) and
 * current date.  Tasks are color‑coded based on completion status, and
 * clicking a task navigates to its row in the list.
 *
 * @param {Array} tasksData Array of task objects
 */
function renderCalendar(tasksData) {
  const calDiv = document.getElementById('calendar');
  if (!calDiv) return;
  // Clear existing content
  calDiv.innerHTML = '';
  const header = document.createElement('h2');
  const monthNames = [
    'January','February','March','April','May','June','July','August','September','October','November','December'
  ];
  // Helper to format date as YYYY-MM-DD
  function formatDate(dateObj) {
    const y = dateObj.getFullYear();
    const m = String(dateObj.getMonth() + 1).padStart(2, '0');
    const d = String(dateObj.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }
  if (currentView === 'month') {
    // Month heading
    header.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    calDiv.appendChild(header);
    // Build tasksByDate map for this month
    const tasksByDate = {};
    tasksData.forEach((task, idx) => {
      if (!task.due_date) return;
      const d = new Date(task.due_date + 'T00:00:00');
      if (d.getFullYear() === currentDate.getFullYear() && d.getMonth() === currentDate.getMonth()) {
        const key = formatDate(d);
        if (!tasksByDate[key]) tasksByDate[key] = [];
        tasksByDate[key].push({ task, index: idx });
      }
    });
    // Determine layout parameters
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
    const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
    const table = document.createElement('table');
    table.className = 'calendar-grid';
    // Header row with day names
    const hr = document.createElement('tr');
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(dayName => {
      const th = document.createElement('th');
      th.textContent = dayName;
      hr.appendChild(th);
    });
    table.appendChild(hr);
    let dateCounter = 1 - firstDay;
    for (let r = 0; r < 6; r++) {
      const tr = document.createElement('tr');
      for (let c = 0; c < 7; c++) {
        const td = document.createElement('td');
        if (dateCounter > 0 && dateCounter <= daysInMonth) {
          const currentDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), dateCounter);
          const dateStr = formatDate(currentDay);
          const dayDiv = document.createElement('div');
          dayDiv.className = 'date-number';
          dayDiv.textContent = dateCounter;
          td.appendChild(dayDiv);
          const tasksForDay = tasksByDate[dateStr] || [];
          tasksForDay.forEach(({ task, index }) => {
            const item = document.createElement('div');
            item.className = 'task-item';
            const status = saved[index] && saved[index].completed_by ? 'completed' : 'pending';
            item.classList.add(status);
            let text = `${task.policy}: ${task.task}`;
            if (text.length > 60) text = text.slice(0, 57) + '...';
            item.textContent = text;
            item.title = `${task.policy}: ${task.task}`;
            item.dataset.index = index;
            item.addEventListener('click', (e) => {
              const idx = parseInt(e.currentTarget.dataset.index, 10);
              highlightRow(idx);
            });
            td.appendChild(item);
          });
        }
        tr.appendChild(td);
        dateCounter++;
      }
      table.appendChild(tr);
    }
    calDiv.appendChild(table);
  } else if (currentView === 'week') {
    // Determine the start (Sunday) of the week containing currentDate
    const dayOfWeek = currentDate.getDay();
    const startOfWeek = new Date(currentDate);
    startOfWeek.setDate(currentDate.getDate() - dayOfWeek);
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    const startStr = `${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()}, ${startOfWeek.getFullYear()}`;
    const endStr = `${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
    header.textContent = `Week of ${startStr} - ${endStr}`;
    calDiv.appendChild(header);
    // Build tasksByDate for this week
    const tasksByDate = {};
    tasksData.forEach((task, idx) => {
      if (!task.due_date) return;
      const d = new Date(task.due_date + 'T00:00:00');
      if (d >= startOfWeek && d <= endOfWeek) {
        const key = formatDate(d);
        if (!tasksByDate[key]) tasksByDate[key] = [];
        tasksByDate[key].push({ task, index: idx });
      }
    });
    // Build week table: header row with day names and date numbers
    const table = document.createElement('table');
    table.className = 'calendar-grid';
    const hr = document.createElement('tr');
    ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach((dayName, i) => {
      const th = document.createElement('th');
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      th.textContent = `${dayName} ${dateObj.getMonth() + 1}/${dateObj.getDate()}`;
      hr.appendChild(th);
    });
    table.appendChild(hr);
    const trWeek = document.createElement('tr');
    for (let i = 0; i < 7; i++) {
      const td = document.createElement('td');
      const dateObj = new Date(startOfWeek);
      dateObj.setDate(startOfWeek.getDate() + i);
      const key = formatDate(dateObj);
      const tasksForDay = tasksByDate[key] || [];
      tasksForDay.forEach(({ task, index }) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        const status = saved[index] && saved[index].completed_by ? 'completed' : 'pending';
        item.classList.add(status);
        let text = `${task.policy}: ${task.task}`;
        if (text.length > 60) text = text.slice(0, 57) + '...';
        item.textContent = text;
        item.title = `${task.policy}: ${task.task}`;
        item.dataset.index = index;
        item.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index, 10);
          highlightRow(idx);
        });
        td.appendChild(item);
      });
      trWeek.appendChild(td);
    }
    table.appendChild(trWeek);
    calDiv.appendChild(table);
  } else {
    // Day view
    header.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    calDiv.appendChild(header);
    // Find tasks for this day
    const tasksForDay = [];
    tasksData.forEach((task, idx) => {
      const d = new Date(task.due_date + 'T00:00:00');
      if (
        d.getFullYear() === currentDate.getFullYear() &&
        d.getMonth() === currentDate.getMonth() &&
        d.getDate() === currentDate.getDate()
      ) {
        tasksForDay.push({ task, index: idx });
      }
    });
    if (tasksForDay.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No tasks scheduled for this day.';
      calDiv.appendChild(p);
    } else {
      const ul = document.createElement('ul');
      tasksForDay.forEach(({ task, index }) => {
        const li = document.createElement('li');
        const item = document.createElement('div');
        item.className = 'task-item';
        const status = saved[index] && saved[index].completed_by ? 'completed' : 'pending';
        item.classList.add(status);
        item.textContent = `${task.policy}: ${task.task}`;
        item.title = `${task.policy}: ${task.task}`;
        item.dataset.index = index;
        item.addEventListener('click', (e) => {
          const idx = parseInt(e.currentTarget.dataset.index, 10);
          highlightRow(idx);
        });
        li.appendChild(item);
        ul.appendChild(li);
      });
      ul.style.listStyle = 'none';
      ul.style.padding = '0';
      calDiv.appendChild(ul);
    }
  }
}

/**
 * Render a simple monthly calendar into the #calendar element.  The calendar
 * shows the current month and lists tasks due on each day.  Tasks are
 * color‑coded: green for completed (a "Completed By" name is entered) and red
 * for pending.  This function is called whenever the table is built or
 * updated so that the calendar reflects the latest completion status.
 *
 * @param {Array} tasksData Array of task objects loaded from JSON
 * @param {Object} saved Map of task indices to completion/verification status
 */
function createCalendar(tasksData, saved) {
  const calendarDiv = document.getElementById('calendar');
  if (!calendarDiv) return;
  // Clear existing content
  while (calendarDiv.firstChild) calendarDiv.removeChild(calendarDiv.firstChild);
  // Determine current month and year from today's date
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth(); // 0-based (0=Jan)
  // Map tasks by due date within this month
  const tasksByDate = {};
  tasksData.forEach((task, idx) => {
    if (!task.due_date) return;
    // Normalize due_date to YYYY-MM-DD
    const parts = task.due_date.split('-');
    if (parts.length !== 3) return;
    const dYear = parseInt(parts[0], 10);
    const dMonth = parseInt(parts[1], 10) - 1; // month from 0
    const dDay = parseInt(parts[2], 10);
    if (dYear === year && dMonth === month) {
      const key = `${year}-${String(month + 1).padStart(2, '0')}-${String(dDay).padStart(2, '0')}`;
      if (!tasksByDate[key]) tasksByDate[key] = [];
      tasksByDate[key].push({ task, index: idx });
    }
  });
  // Build calendar table
  const table = document.createElement('table');
  table.className = 'calendar-grid';
  // Header with weekday names
  const headerRow = document.createElement('tr');
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  dayNames.forEach(day => {
    const th = document.createElement('th');
    th.textContent = day;
    headerRow.appendChild(th);
  });
  table.appendChild(headerRow);
  // Determine first day of month and number of days
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  let dateCounter = 1 - firstDay;
  // Up to 6 rows to accommodate months starting late in week
  for (let r = 0; r < 6; r++) {
    const tr = document.createElement('tr');
    for (let c = 0; c < 7; c++) {
      const td = document.createElement('td');
      if (dateCounter > 0 && dateCounter <= daysInMonth) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateCounter).padStart(2, '0')}`;
        const dateDiv = document.createElement('div');
        dateDiv.className = 'date-number';
        dateDiv.textContent = dateCounter;
        td.appendChild(dateDiv);
        const tasksForDay = tasksByDate[dateStr] || [];
        tasksForDay.forEach(({ task, index }) => {
          const item = document.createElement('div');
          item.className = 'task-item';
          // Determine status
          const status = saved && saved[index] && saved[index].completed_by ? 'completed' : 'pending';
          item.classList.add(status);
          // Show abbreviated policy name and task description
          let displayText = `${task.policy}: ${task.task}`;
          // Truncate long text for readability
          if (displayText.length > 60) {
            displayText = displayText.slice(0, 57) + '...';
          }
          item.textContent = displayText;
          // Tooltip: full text on hover
          item.title = `${task.policy}: ${task.task}`;
          td.appendChild(item);
        });
      }
      tr.appendChild(td);
      dateCounter++;
    }
    table.appendChild(tr);
  }
  // Add month/year heading above calendar
  const header = document.createElement('h2');
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  header.textContent = `${monthNames[month]} ${year}`;
  calendarDiv.appendChild(header);
  calendarDiv.appendChild(table);
}

// Base64 encoded tasks JSON
const base64Tasks = `
WwogIHsKICAgICJwb2xpY3kiOiAiQWNjZXNzIENvbnRyb2wgUG9saWN5IiwKICAgICJ0YXNrIjogIlJvbGUgYXNzaWdubWVudHMgYXJlIHJldmFsaWRhdGVk
IHF1YXJ0ZXJseS4iLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVk
X2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBY2Nlc3MgQ29udHJvbCBQb2xpY3kiLAogICAgInRhc2si
OiAiVmlzaXRvciBsb2dzIGFyZSByZXZpZXdlZCBtb250aGx5IGJ5IHRoZSBDSVNPIGFuZCByZXRhaW5lZCBwZXIgdGhlIiwKICAgICJwZXJpb2RpY2l0eSI6
ICJtb250aGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTEyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAg
fSwKICB7CiAgICAicG9saWN5IjogIkFjY2VzcyBDb250cm9sIFBvbGljeSIsCiAgICAidGFzayI6ICJRdWFydGVybHkgcmV2aWV3IG9mIGFsbCBwcml2aWxl
Z2VkIGFjY291bnRzIiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRl
ZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiQWNjZXNzIENvbnRyb2wgUG9saWN5IiwKICAgICJ0YXNr
IjogIlNlbWktYW5udWFsIHJldmlldyBvZiB1c2VyIGFjY2VzcyB0byBDVUkgcmVwb3NpdG9yaWVzIiwKICAgICJwZXJpb2RpY2l0eSI6ICJzZW1pYW5udWFs
bHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDUtMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsK
ICAgICJwb2xpY3kiOiAiQWNjZXNzIENvbnRyb2wgUG9saWN5IiwKICAgICJ0YXNrIjogIkFubnVhbCByZXZpZXcgb2YgYWxsIGFjY2VzcyBncm91cHMgYW5k
IGFkbWluaXN0cmF0aXZlIHJvbGVzIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAi
Y29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBY2Nlc3MgQ29udHJvbCBQb2xpY3kiLAog
ICAgInRhc2siOiAiYW5kIGNvbGxhYm9yYXRpb24gcmVzb3VyY2VzIG5lY2Vzc2FyeSBmb3IgZGFpbHkgd29yay4gU3RhbmRhcmQgdXNlcnMiLAogICAgInBl
cmlvZGljaXR5IjogImRhaWx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTA2IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9i
eSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkFjY2VzcyBDb250cm9sIFBvbGljeSIsCiAgICAidGFzayI6ICJ0d2ljZSBhbm51YWxseSB0byBjb25m
aXJtIGNvbXBsaWFuY2Ugd2l0aCB0aGUgcHJpbmNpcGxlIG9mIGxlYXN0IiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUi
OiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBY2Nl
c3MgQ29udHJvbCBQb2xpY3kiLAogICAgInRhc2siOiAiU3ByZWFkc2hlZXQgYW5kIGRpc2N1c3NlZCBpbiBxdWFydGVybHkgcmlzayBtZWV0aW5ncy4iLAog
ICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAi
dmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBc3NldCBNYW5hZ2VtZW50IFBvbGljeSIsCiAgICAidGFzayI6ICJJbnZlbnRvcnkg
aXMgcmV2aWV3ZWQgcXVhcnRlcmx5IGJ5IHRoZSBJVCBBc3NldCBhbmQgQ29uZmlndXJhdGlvbiIsCiAgICAicGVyaW9kaWNpdHkiOiAicXVhcnRlcmx5IiwK
ICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAi
cG9saWN5IjogIkFzc2V0IE1hbmFnZW1lbnQgUG9saWN5IiwKICAgICJ0YXNrIjogIm9mZmJvYXJkaW5nLCBhbmQgcXVhcnRlcmx5IGF1ZGl0cy4iLAogICAg
InBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVy
aWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICIyLiBQb2xpY3kiLAogICAgInRhc2siOiAicXVhcnRlcmx5IGFuZCBhZnRlciBzaWduaWZp
Y2FudCBjaGFuZ2VzIG9yIHNlY3VyaXR5IGluY2lkZW50cy4gVGhlIiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjog
IjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiMi4gUG9s
aWN5IiwKICAgICJ0YXNrIjogIndlZWtseSkgYW5kIHVwb24gaGlnaC1zZXZlcml0eSBhbGVydHM7IHJlY29yZCBmaW5kaW5ncyBhbmQgYWN0aW9ucyIsCiAg
ICAicGVyaW9kaWNpdHkiOiAid2Vla2x5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJp
ZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkF3YXJlbmVzcyAmIFRyYWluaW5nIFBvbGljeSIsCiAgICAidGFzayI6ICJhY2Nlc3MgYW5k
IG9uIGFuIG9uZ29pbmcgYmFzaXMgdGhlcmVhZnRlciAoZS5nLiwgYXQgbGVhc3QgYW5udWFsbHkgYW5kIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxs
eSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewog
ICAgInBvbGljeSI6ICJBd2FyZW5lc3MgJiBUcmFpbmluZyBQb2xpY3kiLAogICAgInRhc2siOiAib25ib2FyZGluZyB3aW5kb3dzLCB1cG9uIHJvbGUgY2hh
bmdlcywgYW5kIGF0IGxlYXN0IGFubnVhbGx5IHRoZXJlYWZ0ZXIuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAi
MjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBd2FyZW5l
c3MgJiBUcmFpbmluZyBQb2xpY3kiLAogICAgInRhc2siOiAiTktPKSBhcyB0aGUgYmFzZWxpbmUgYW5udWFsIGF3YXJlbmVzcyBtb2R1bGUgZm9yIGFsbCBw
ZXJzb25uZWwgd2l0aCBEb0QiLAogICAgInBlcmlvZGljaXR5IjogImFubnVhbGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTExLTA1IiwKICAgICJjb21w
bGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkF3YXJlbmVzcyAmIFRyYWluaW5nIFBvbGljeSIs
CiAgICAidGFzayI6ICJBbm51YWwgcmVmcmVzaGVyOiBDb21wbGV0ZSBhc3NpZ25lZCBtb2R1bGVzIGV2ZXJ5IDEyIG1vbnRocyAoaW5jbHVkaW5nIiwKICAg
ICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVy
aWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBd2FyZW5lc3MgJiBUcmFpbmluZyBQb2xpY3kiLAogICAgInRhc2siOiAiYW5kIHdpbGwg
cmVwb3J0IHJlc3VsdHMgYXQgbGVhc3QgcXVhcnRlcmx5IHRvIGxlYWRlcnNoaXAuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1
ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3ki
OiAiQXdhcmVuZXNzICYgVHJhaW5pbmcgUG9saWN5IiwKICAgICJ0YXNrIjogIlRyYWluaW5nIGNvbnRlbnQgc2hhbGwgYmUgcmV2aWV3ZWQgYXQgbGVhc3Qg
YW5udWFsbHkgYW5kIGFmdGVyIG1ham9yIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAg
ICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJBd2FyZW5lc3MgJiBUcmFpbmluZyBQ
b2xpY3kiLAogICAgInRhc2siOiAiY2hlY2tsaXN0czsgYW5udWFsIHJlZnJlc2hlciBzY2hlZHVsaW5nOyBwaGlzaGluZyBzaW11bGF0aW9uIGNhZGVuY2Ug
YW5kIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIs
CiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJDb25maWd1cmF0aW9uIE1hbmFnZW1lbnQgUG9saWN5IiwKICAgICJ0YXNr
IjogIlF1YXJ0ZXJseSBjb25maWd1cmF0aW9uIGF1ZGl0cyB3aWxsIGJlIGNvbmR1Y3RlZCBieSB0aGUgSVQgQXNzZXQgYW5kIiwKICAgICJwZXJpb2RpY2l0
eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5Ijog
IiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiQ29uZmlndXJhdGlvbiBNYW5hZ2VtZW50IFBvbGljeSIsCiAgICAidGFzayI6ICJTY2hlZHVsZWQgY2FkZW5j
ZSAocXVhcnRlcmx5KS4iLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxl
dGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJEZXNrdG9wIENvbXB1dGVyIFNlY3VyaXR5IFBvbGlj
eSIsCiAgICAidGFzayI6ICJSZWNvbmNpbGUgaW52ZW50b3J5IHF1YXJ0ZXJseSB2aWEgbmV0d29yayBkaXNjb3Zlcnkgc2NhbnMgYW5kIiwKICAgICJwZXJp
b2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVk
X2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiRGVza3RvcCBDb21wdXRlciBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiUmV2aWV3IGFu
ZCB1cGRhdGUgYmFzZWxpbmUgaW1hZ2VzIGF0IGxlYXN0IHNlbWlhbm51YWxseSB0aHJvdWdoIHRoZSIsCiAgICAicGVyaW9kaWNpdHkiOiAic2VtaWFubnVh
bGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTA1LTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7
CiAgICAicG9saWN5IjogIkRlc2t0b3AgQ29tcHV0ZXIgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIlBlcmZvcm0gdnVsbmVyYWJpbGl0eSBzY2Fu
cyB3ZWVrbHk7IGdlbmVyYXRlIHJlbWVkaWF0aW9uIHRpY2tldHMiLAogICAgInBlcmlvZGljaXR5IjogIndlZWtseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAy
NS0xMS0xMiIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJEZXNrdG9wIENv
bXB1dGVyIFNlY3VyaXR5IFBvbGljeSIsCiAgICAidGFzayI6ICJTY2hlZHVsZSBxdWljayBzY2FucyBhdCBldmVyeSBsb2dpbiBhbmQgZnVsbCBzY2FucyB3
ZWVrbHkuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJ3ZWVrbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTEtMTIiLAogICAgImNvbXBsZXRlZF9ieSI6ICIi
LAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiRGVza3RvcCBDb21wdXRlciBTZWN1cml0eSBQb2xpY3kiLAogICAgInRh
c2siOiAiVXNlIHlvdXIgc3RhbmRhcmQgdXNlciBhY2NvdW50IGZvciBkYWlseSB3b3JrLiBOZXZlciBib3Jyb3cgc29tZW9uZSIsCiAgICAicGVyaW9kaWNp
dHkiOiAiZGFpbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTEtMDYiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIK
ICB9LAogIHsKICAgICJwb2xpY3kiOiAiRGVza3RvcCBDb21wdXRlciBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiUmV2aWV3IGFsbCBsb2NhbCBh
bmQgZG9tYWluIGdyb3VwIG1lbWJlcnNoaXBzIHF1YXJ0ZXJseTsgZGlzYWJsZSIsCiAgICAicGVyaW9kaWNpdHkiOiAicXVhcnRlcmx5IiwKICAgICJkdWVf
ZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5Ijog
IkRlc2t0b3AgQ29tcHV0ZXIgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIlJ1biBkYWlseSBjb3JyZWxhdGlvbiBydWxlcyBhbmQgd2Vla2x5IHRo
cmVhdCBodW50aW5nIHF1ZXJpZXM7IiwKICAgICJwZXJpb2RpY2l0eSI6ICJkYWlseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0wNiIsCiAgICAiY29t
cGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJEZXNrdG9wIENvbXB1dGVyIFNlY3VyaXR5IFBv
bGljeSIsCiAgICAidGFzayI6ICJEb2N1bWVudCBhbGwgYXBwcm92ZWQgZXhjZXB0aW9ucyBhbmQgcmV2aWV3IHRoZW0gcXVhcnRlcmx5LiIsCiAgICAicGVy
aW9kaWNpdHkiOiAicXVhcnRlcmx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmll
ZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkVtYWlsIFVzYWdlIFBvbGljeSIsCiAgICAidGFzayI6ICJ0aGVzZSBwb2xpY2llcyBkdXJpbmcg
b25ib2FyZGluZyBhbmQgYXMgcGFydCBvZiB0aGUgYW5udWFsIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAy
Ni0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJFbWFpbCBVc2Fn
ZSBQb2xpY3kiLAogICAgInRhc2siOiAiU2VjdXJpdHkgdGVhbSB3aWxsIHJldmlldyBsb2dzIHdlZWtseSBhbmQgaW52ZXN0aWdhdGUgYW5vbWFsaWVzIiwK
ICAgICJwZXJpb2RpY2l0eSI6ICJ3ZWVrbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTEtMTIiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZl
cmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiSW5jaWRlbnQgUmVzcG9uc2UgUG9saWN5IiwKICAgICJ0YXNrIjogIlBoeXNpY2FsIHRh
bXBlciBzZWFsIGJyb2tlbiBvbiBkZXNrdG9wIC8gc2VydmVyICAgUXVhcnRlcmx5IGluc3BlY3Rpb24gcmV2ZWFscyBicm9rZW4gc2VhbCwgbWlzc2luZyBz
Y3JldywgdG9vbCBtYXJrcyAgIFNFVjMgICAgICAgSGFyZHdhcmUgcXVhcmFudGluZWQgd2l0aGluIDRcdTAwYTBob3VycyAgICAgICAgICAgICAgICAgICAg
ICAgIEluc3BlY3QgZm9yIGhhcmR3YXJlIGltcGxhbnRzOyBjYXB0dXJlIHBob3RvZ3JhcGhzIGZvciBjaGFpbiBvZiBjdXN0b2R5LiIsCiAgICAicGVyaW9k
aWNpdHkiOiAicXVhcnRlcmx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9i
eSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkludGVybmV0XHUwMGEwVXNhZ2VcdTAwYTBQb2xpY3kiLAogICAgInRhc2siOiAiTG9ncyBhcmUgcmV0
YWluZWQgZm9yIDE4MFx1MDBhMGRheXMgYW5kIHJldmlld2VkIHF1YXJ0ZXJseSBmb3IgYW5vbWFsaWVzLiIsCiAgICAicGVyaW9kaWNpdHkiOiAicXVhcnRl
cmx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7
CiAgICAicG9saWN5IjogIkludGVybmV0XHUwMGEwVXNhZ2VcdTAwYTBQb2xpY3kiLAogICAgInRhc2siOiAiQ29tcGxpYW5jZVx1MDBhME9mZmljZXIgICAg
ICBBdWRpdCBhZGhlcmVuY2UsIGNvb3JkaW5hdGUgd2l0aCBjb250cmFjdHMvbGVnYWwsIHVwZGF0ZSBwb2xpY3kgYW5udWFsbHkuIiwKICAgICJwZXJpb2Rp
Y2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnki
OiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJMYXB0b3AgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIjMuICBBbm51YWwgQXVkaXQgXHUyMDEz
IEVhY2ggT2N0b2JlciwgTGluZSBNYW5hZ2VycyBjb25maXJtIHBoeXNpY2FsIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2Rh
dGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJM
YXB0b3AgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIk1lZGl1bS9Mb3cgICAgICAgICAgMzBcdTAwYTBkYXlzICAgIE1vbnRobHkgcGF0Y2ggcmVw
b3J0IiwKICAgICJwZXJpb2RpY2l0eSI6ICJtb250aGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTEyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwK
ICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkxhcHRvcCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiU3RhbmRh
cmQgYWNjb3VudHMgZm9yIGRhaWx5IHdvcmsuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJkYWlseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0wNiIsCiAg
ICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJMYXB0b3AgU2VjdXJpdHkgUG9saWN5
IiwKICAgICJ0YXNrIjogIkNvbXBsaWFuY2UgYXVkaXRzIDE1XHUwMGEwJSBvZiBsYXB0b3AgZmxlZXQgc2VtaWFubnVhbGx5LiIsCiAgICAicGVyaW9kaWNp
dHkiOiAic2VtaWFubnVhbGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTA1LTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9i
eSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIkxhcHRvcCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiTWFuYWdlcnMgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgRW5zdXJlIHRlYW0gbGFwdG9wcyBhcmUgc2VjdXJlZCBhbmQgYXVkaXRlZCBhbm51YWxseS4iLAogICAgInBlcmlvZGljaXR5Ijog
ImFubnVhbGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTExLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAg
fSwKICB7CiAgICAicG9saWN5IjogIkxpY2Vuc2luZyBDb21wbGlhbmNlIFBvbGljeSIsCiAgICAidGFzayI6ICJleGNlZWQgbGljZW5zZWQgZW50aXRsZW1l
bnRzOyBxdWFydGVybHkgcmV2aWV3cyBjb3JyZWN0IiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDIt
MDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiTGljZW5zaW5nIENvbXBs
aWFuY2UgUG9saWN5IiwKICAgICJ0YXNrIjogIlF1YXJ0ZXJseSBSZWNvbmNpbGlhdGlvbiBcdTIwMTMgVGhlIElUIEFzc2V0IGFuZCBDb25maWd1cmF0aW9u
IE1hbmFnZXIiLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5
IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJMaWNlbnNpbmcgQ29tcGxpYW5jZSBQb2xpY3kiLAogICAgInRh
c2siOiAiUGVyaW9kaWMgQ29tcGxpYW5jZSBSZXZpZXcgXHUyMDEzIFF1YXJ0ZXJseSAob3IgbW9yZSBvZnRlbiBpZiByaXNrIiwKICAgICJwZXJpb2RpY2l0
eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5Ijog
IiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiTGljZW5zaW5nIENvbXBsaWFuY2UgUG9saWN5IiwKICAgICJ0YXNrIjogIjIuICBUaGlyZCBwYXJ0eSBob3N0
ZWQgYXBwbGljYXRpb25zIHRoYXQgcHJvY2VzcyBXVFMgZGF0YSByZXF1aXJlIGFubnVhbCIsCiAgICAicGVyaW9kaWNpdHkiOiAiYW5udWFsbHkiLAogICAg
ImR1ZV9kYXRlIjogIjIwMjYtMTEtMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xp
Y3kiOiAiTGljZW5zaW5nIENvbXBsaWFuY2UgUG9saWN5IiwKICAgICJ0YXNrIjogIkRpcmVjdG9yIG9mIE9wZXJhdGlvbnMgICAgTWFpbnRhaW4gTEksIHBl
cmZvcm0gcXVhcnRlcmx5IHJlY29uY2lsaWF0aW9ucywgbWFuYWdlIHJlbmV3YWxzLiBQcm9jdXJlIGxpY2Vuc2VzLCBuZWdvdGlhdGUgY29udHJhY3RzLCB0
cmFjayBzcGVuZC4gQXBwcm92ZSBzb2Z0d2FyZSByZXF1ZXN0cywgdmFsaWRhdGUgY29udGludWVkIG5lZWQsIGFuZCBidWRnZXQgcmVuZXdhbHMuIiwKICAg
ICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZl
cmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiTW9iaWxlIERldmljZSBQb2xpY3kiLAogICAgInRhc2siOiAicmV0aXJlKS4gUmVjb25j
aWxlIHJlY29yZHMgbW9udGhseSBhZ2FpbnN0IGNhcnJpZXIgaW52b2ljZXMgYW5kIiwKICAgICJwZXJpb2RpY2l0eSI6ICJtb250aGx5IiwKICAgICJkdWVf
ZGF0ZSI6ICIyMDI1LTEyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5Ijog
Ik1vYmlsZSBEZXZpY2UgUG9saWN5IiwKICAgICJ0YXNrIjogIlBlcmZvcm0gcXVhcnRlcmx5IHNwb3QgY2hlY2tzOyBkZXZpY2VzIG5vdCBwaHlzaWNhbGx5
IHZlcmlmaWVkIiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9i
eSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiTW9iaWxlIERldmljZSBQb2xpY3kiLAogICAgInRhc2siOiAi
UmV0YWluIG1vYmlsZSBsb2dzIGZvciBhdCBsZWFzdCAxODAgZGF5cy4gV1RTIElTU08gcmV2aWV3cyB3ZWVrbHkiLAogICAgInBlcmlvZGljaXR5IjogIndl
ZWtseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0xMiIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAg
ewogICAgInBvbGljeSI6ICJNb2JpbGUgRGV2aWNlIFBvbGljeSIsCiAgICAidGFzayI6ICJBZnRlciBlYWNoIGFubnVhbCByZWZyZXNoZXIgb3IgbWF0ZXJp
YWwgcG9saWN5IHJldmlzaW9uLCB1c2VycyBtdXN0IiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0w
NSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJNb2JpbGUgRGV2aWNlIFBv
bGljeSIsCiAgICAidGFzayI6ICJTeXN0ZW0gQWRtaW5pc3RyYXRvciAgIEVucm9sbCBhbmQgcmV0aXJlIGRldmljZXM7IHB1c2ggcHJvZmlsZXMsIGFwcHMs
IGNlcnRpZmljYXRlcywgYW5kIHBhdGNoZXM7IG1haW50YWluIGludmVudG9yeTsgZ2VuZXJhdGUgY29tcGxpYW5jZSBkYXNoYm9hcmRzLiBNb25pdG9yIElu
dHVuZSB0ZWxlbWV0cnkgaW4gQXp1cmUsIGludmVzdGlnYXRlIGFsZXJ0cywgY29vcmRpbmF0ZSBpbmNpZGVudCBjb250YWlubWVudCwgYW5kIHByb3ZpZGUg
ZGFpbHkgbWV0cmljcyB0byBsZWFkZXJzaGlwIiwKICAgICJwZXJpb2RpY2l0eSI6ICJkYWlseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0wNiIsCiAg
ICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJNb2JpbGUgRGV2aWNlIFBvbGljeSIs
CiAgICAidGFzayI6ICJDb21wbGlhbmNlIE9mZmljZXIgICAgIENvbmR1Y3QgYmktYW5udWFsIGF1ZGl0cyBvZiBJbnR1bmUgY29tcGxpYW5jZSBkYXRhLCBy
ZXZpZXcgZXhjZXB0aW9uIHByb2Nlc3NlcywgdXBkYXRlIHBvbGljeSB0byByZWZsZWN0IHJlZ3VsYXRvcnkgY2hhbmdlcywgYW5kIGJyaWVmIHNlbmlvciBt
YW5hZ2VtZW50LiIsCiAgICAicGVyaW9kaWNpdHkiOiAiYW5udWFsbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMTEtMDUiLAogICAgImNvbXBsZXRlZF9i
eSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiUGF5bWVudCBDYXJkIFNlY3VyaXR5IFBvbGljeSIsCiAgICAi
dGFzayI6ICJnZW5lcmF0ZSBhIHJldGVudGlvbiBhdWRpdCByZXBvcnQgd2Vla2x5LiIsCiAgICAicGVyaW9kaWNpdHkiOiAid2Vla2x5IiwKICAgICJkdWVf
ZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5Ijog
IlBheW1lbnQgQ2FyZCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiUmV2aWV3IGFuZCByZWNvbmNpbGUgYWNjZXNzIGxpc3RzIG1vbnRobHkgYWdh
aW5zdCBIUiByZWNvcmRzOyIsCiAgICAicGVyaW9kaWNpdHkiOiAibW9udGhseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMi0wNSIsCiAgICAiY29tcGxl
dGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJQYXltZW50IENhcmQgU2VjdXJpdHkgUG9saWN5IiwK
ICAgICJ0YXNrIjogImEgSGFyZHdhcmUgU2VjdXJpdHkgTW9kdWxlIChIU00pLiBSb3RhdGUgZW5jcnlwdGlvbiBrZXlzIGFubnVhbGx5IG9yIiwKICAgICJw
ZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZp
ZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJQYXltZW50IENhcmQgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIlBlcmZvcm0gcXVh
cnRlcmx5IG5ldHdvcmsgc2VnbWVudGF0aW9uIHBlbmV0cmF0aW9uIHRlc3RzIHRvIHZlcmlmeSIsCiAgICAicGVyaW9kaWNpdHkiOiAicXVhcnRlcmx5IiwK
ICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAi
cG9saWN5IjogIlBheW1lbnQgQ2FyZCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiUmV2aWV3IGRhaWx5IGF1dG9tYXRlZCBhbGVydHMgZm9yIGFu
b21hbGllczsgcGVyZm9ybSBtYW51YWwgbG9nIiwKICAgICJwZXJpb2RpY2l0eSI6ICJkYWlseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0wNiIsCiAg
ICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJQYXltZW50IENhcmQgU2VjdXJpdHkg
UG9saWN5IiwKICAgICJ0YXNrIjogInJldmlldyBvZiBwYXltZW50IHN5c3RlbXMgd2Vla2x5IGFuZCBmaWxlIGZpbmRpbmdzLiIsCiAgICAicGVyaW9kaWNp
dHkiOiAid2Vla2x5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIi
CiAgfSwKICB7CiAgICAicG9saWN5IjogIlBheW1lbnQgQ2FyZCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiUGVyZm9ybSBhbm51YWwgcmlzayBh
c3Nlc3NtZW50cyBhbmQgU09DXHUwMGEwMiAvIFBDSSBldmlkZW5jZSByZXZpZXdzIG9mIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAi
ZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGlj
eSI6ICIyLjEwLiBDb21wYW55IENyZWRpdCBDYXJkIFVzYWdlIFBvbGljeSIsCiAgICAidGFzayI6ICJtdWx0aXBsZSBjYXJkc1x1MjAxNHRvIGJ5cGFzcyBw
ZXIgdHJhbnNhY3Rpb24gb3IgbW9udGhseSBsaW1pdHMuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJtb250aGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTEy
LTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIjIuMTAuIENvbXBhbnkg
Q3JlZGl0IENhcmQgVXNhZ2UgUG9saWN5IiwKICAgICJ0YXNrIjogIlNldCBjYXJkIGxpbWl0cyAoZGVmYXVsdCAkNTAwXHUwMGEwc2luZ2xlIC8gJDEsMDAw
XHUwMGEwbW9udGhseSkgYW5kIGVuYWJsZSIsCiAgICAicGVyaW9kaWNpdHkiOiAibW9udGhseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMi0wNSIsCiAg
ICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICIyLjEwLiBDb21wYW55IENyZWRpdCBD
YXJkIFVzYWdlIFBvbGljeSIsCiAgICAidGFzayI6ICJSZWNvbmNpbGUgc3RhdGVtZW50cyBtb250aGx5OyBmbGFnIG91dCBvZiBwb2xpY3kgY2hhcmdlcywg
YW5kIiwKICAgICJwZXJpb2RpY2l0eSI6ICJtb250aGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTEyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwK
ICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIjIuMTAuIENvbXBhbnkgQ3JlZGl0IENhcmQgVXNhZ2UgUG9saWN5IiwKICAg
ICJ0YXNrIjogIkNvbmR1Y3QgcXVhcnRlcmx5IGF1ZGl0cyBvZiAxMFx1MDBhMCUgb2YgY2FyZGhvbGRlcnMgZm9yIHJlY2VpcHRzLiIsCiAgICAicGVyaW9k
aWNpdHkiOiAicXVhcnRlcmx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9i
eSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIjIuMTAuIENvbXBhbnkgQ3JlZGl0IENhcmQgVXNhZ2UgUG9saWN5IiwKICAgICJ0YXNrIjogIkNvbXBs
aWFuY2UgT2ZmaWNlciAgICAgICAgQ29uZHVjdCBxdWFydGVybHkgc2VsZiBhc3Nlc3NtZW50LCBtYW5hZ2UgdmVuZG9yIGF0dGVzdGF0aW9ucywgYXVkaXQg
cG9saWN5IGFkaGVyZW5jZS4iLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29t
cGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICIxLiBQb2xpY3kiLAogICAgInRhc2siOiAiTWFp
biBFbnRyYW5jZS9FeGl0IERvb3I6IFVzZWQgZm9yIGFsbCBkYWlseSBlbXBsb3llZSBhY2Nlc3MgYW5kIiwKICAgICJwZXJpb2RpY2l0eSI6ICJkYWlseSIs
CiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0wNiIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAg
InBvbGljeSI6ICIxLiBQb2xpY3kiLAogICAgInRhc2siOiAiVmlzaXRvciBsb2dzIHdpbGwgYmUgcmV2aWV3ZWQgbW9udGhseSBieSB0aGUgQ0lTTyBmb3Ig
YW5vbWFsaWVzIGFuZCIsCiAgICAicGVyaW9kaWNpdHkiOiAibW9udGhseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMi0wNSIsCiAgICAiY29tcGxldGVk
X2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJSZWNvcmQgUmV0ZW50aW9uIFBvbGljeSIsCiAgICAidGFz
ayI6ICJ8ICAgICAgICAgICAgIHwgdG8gICAgICAgICAgfCAgICAgICAgICAgICB8IFx1MjAyMlx1MDBhMFF1YXJ0ZXJseSB8ICAgICAgICAgICAgIHwiLAog
ICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAi
dmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJSZWNvcmQgUmV0ZW50aW9uIFBvbGljeSIsCiAgICAidGFzayI6ICJ8ICAgICAgICAg
ICAgIHwgICAgICAgICAgICAgfCAgICAgICAgICAgICB8IFx1MjAyMlx1MDBhMERhaWx5ICAgICB8ICAgICAgICAgICAgIHwiLAogICAgInBlcmlvZGljaXR5
IjogImRhaWx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTA2IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAg
fSwKICB7CiAgICAicG9saWN5IjogIlJlY29yZCBSZXRlbnRpb24gUG9saWN5IiwKICAgICJ0YXNrIjogInwgICAgICAgICAgICAgfCAgICAgICAgICAgICB8
ICAgICAgICAgICAgIHwgXHUyMDIyXHUwMGEwUXVhcnRlcmx5IHwgICAgICAgICAgICAgfCIsCiAgICAicGVyaW9kaWNpdHkiOiAicXVhcnRlcmx5IiwKICAg
ICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9s
aWN5IjogIlJlY29yZCBSZXRlbnRpb24gUG9saWN5IiwKICAgICJ0YXNrIjogInwgICAgICAgICAgICAgfCAgICAgICAgICAgICB8ICAgICAgICAgICAgIHwg
YW5udWFsICAgICAgfCAgICAgICAgICAgICB8IiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIs
CiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJSZWNvcmQgUmV0ZW50aW9uIFBv
bGljeSIsCiAgICAidGFzayI6ICJJbnRlZ3JpdHkgQ2hlY2tzICAgICAgICAgICAgICAgICAgIEEgcXVhcnRlcmx5IHNjcmlwdCBjYWxjdWxhdGVzIFNIQTI1
NiBjaGVja3N1bXMgZm9yIGVhY2ggYXJjaGl2ZSBzZXQgKD5cdTAwYTAxXHUwMGEwVEIpLiBBbnkgbWlzbWF0Y2ggdHJpZ2dlcnMgYW4gYWxlcnQgZm9yIGlu
dmVzdGlnYXRpb24uICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBJVCBPcGVyYXRpb25zIiwKICAg
ICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZl
cmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiUmVjb3JkIFJldGVudGlvbiBQb2xpY3kiLAogICAgInRhc2siOiAiRGlzYXN0ZXIgUmVj
b3ZlcnkgICAgICAgICAgICAgTWFpbnRhaW4gYSBmYWxsYmFjayBzZXQgb2YgY3JpdGljYWwgZG9jdW1lbnRzLiAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIER1cGxpY2F0ZSBvcmlnaW5hbHMgb2YgZ292ZXJuYW5j
ZSBkb2N1bWVudHMgYXJlIGtlcHQgaW4gYSBnZW9ncmFwaGljYWxseSBkaXN0YW50IHZhdWx0OyBhbiBhbm51YWwgdGVzdCBjb25maXJtcyByZXRyaWV2YWwg
d2l0aGluIDQ4XHUwMGEwaG91cnMuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAi
Y29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJSZWNvcmQgUmV0ZW50aW9uIFBvbGljeSIs
CiAgICAidGFzayI6ICJBbm51YWwgdGhpcmQtcGFydHkgYXVkaXQgb3IgcmVwb3J0IHJldmlld2VkIGJ5IENvbXBsaWFuY2UuIiwKICAgICJwZXJpb2RpY2l0
eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAi
IgogIH0sCiAgewogICAgInBvbGljeSI6ICJSZWNvcmQgUmV0ZW50aW9uIFBvbGljeSIsCiAgICAidGFzayI6ICJkaXN0aW5jdCBiYWNrdXAgdGllcnMgc28g
d2UgY2FuIHJlc3RvcmUgZGFpbHkgd29yayBxdWlja2x5LCByZWNvdmVyIGZyb20iLAogICAgInBlcmlvZGljaXR5IjogImRhaWx5IiwKICAgICJkdWVfZGF0
ZSI6ICIyMDI1LTExLTA2IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlJl
Y29yZCBSZXRlbnRpb24gUG9saWN5IiwKICAgICJ0YXNrIjogIjMuICBBY2Nlc3MgcmV2aWV3cyBhcmUgcGVyZm9ybWVkIHF1YXJ0ZXJseSBieSB0aGUgQ29t
cGxpYW5jZSBPZmZpY2VyOyIsCiAgICAicGVyaW9kaWNpdHkiOiAicXVhcnRlcmx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21w
bGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlJlY29yZCBSZXRlbnRpb24gUG9saWN5IiwKICAg
ICJ0YXNrIjogIjEuICBJbnRlcm5hbCBBdWRpdCBcdTIwMTMgQW5udWFsIHNhbXBsaW5nIG9mIDEwXHUwMGEwJSBvZiByZWNvcmQgc2VyaWVzIGZvciIsCiAg
ICAicGVyaW9kaWNpdHkiOiAiYW5udWFsbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMTEtMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZl
cmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiUmVjb3JkIFJldGVudGlvbiBQb2xpY3kiLAogICAgInRhc2siOiAiMy4gIFBvbGljeSBS
ZXZpZXcgXHUyMDEzIENvbXBsaWFuY2UgT2ZmaWNlciBjaGFpcnMgYW5udWFsIHJldmlldzsgYW1lbmRtZW50cyIsCiAgICAicGVyaW9kaWNpdHkiOiAiYW5u
dWFsbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMTEtMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAog
IHsKICAgICJwb2xpY3kiOiAiMS4gIFBvbGljeSIsCiAgICAidGFzayI6ICJXZWVrbHkgYnkgdGhlIHNlY3VyaXR5L0lUIHRlYW0iLAogICAgInBlcmlvZGlj
aXR5IjogIndlZWtseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMS0xMiIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAi
IgogIH0sCiAgewogICAgInBvbGljeSI6ICIxLiAgUG9saWN5IiwKICAgICJ0YXNrIjogIk1vbnRobHkgaW4gY29tcGxpYW5jZSByZXZpZXcgc2Vzc2lvbnMi
LAogICAgInBlcmlvZGljaXR5IjogIm1vbnRobHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAg
InZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiMS4gIFBvbGljeSIsCiAgICAidGFzayI6ICJBbm51YWxseSBkdXJpbmcgZnVsbCBw
b2xpY3kgYW5kIHN5c3RlbSBhdWRpdHMiLAogICAgInBlcmlvZGljaXR5IjogImFubnVhbGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTExLTA1IiwKICAg
ICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIjEuICBQb2xpY3kiLAogICAgInRhc2si
OiAiVGhlIFBPQU0gaXMgcmV2aWV3ZWQgd2Vla2x5IHRvIGVuc3VyZSBhY2N1cmFjeSwgdGltZWxpbmVzcywgYW5kIiwKICAgICJwZXJpb2RpY2l0eSI6ICJ3
ZWVrbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTEtMTIiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAog
IHsKICAgICJwb2xpY3kiOiAiU29jaWFsIE1lZGlhIFBvbGljeSIsCiAgICAidGFzayI6ICJJVCBTZWN1cml0eSByZXZpZXdzIGxvZ3MgbW9udGhseSBmb3Ig
YW5vbWFsaWVzOyBNYXJrZXRpbmcgcmVjb25jaWxlcyIsCiAgICAicGVyaW9kaWNpdHkiOiAibW9udGhseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNS0xMi0w
NSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJTb2NpYWwgTWVkaWEgUG9s
aWN5IiwKICAgICJ0YXNrIjogIkNvbXBsaWFuY2UgT2ZmaWNlciAgICAgICBDb25kdWN0cyBxdWFydGVybHkgYXVkaXRzOyBjb25maXJtcyBOSVNUL0NNTUMg
YWxpZ25tZW50OyBjb29yZGluYXRlcyBleHRlcm5hbCBhc3Nlc3NtZW50cy4iLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2Rh
dGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJT
b2Z0d2FyZSBhbmQgQ29weXJpZ2h0IFBvbGljeSIsCiAgICAidGFzayI6ICIxLiAgTW9udGhseSBJbnR1bmUgU2NhbnMgZGV0ZWN0IHVua25vd24gZXhlY3V0
YWJsZXMsIGJyb3dzZXIgZXh0ZW5zaW9ucywiLAogICAgInBlcmlvZGljaXR5IjogIm1vbnRobHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTItMDUiLAog
ICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiU3lzdGVtIGFuZCBJbmZvcm1hdGlv
biBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiQWNjb3VudHMgbXVzdCBiZSByZXZpZXdlZCBxdWFydGVybHksIGFuZCBpbmFjdGl2ZSBhY2NvdW50
cyBtdXN0IGJlIiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9i
eSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiU3lzdGVtIGFuZCBJbmZvcm1hdGlvbiBTZWN1cml0eSBQb2xp
Y3kiLAogICAgInRhc2siOiAiTG9nIHJldmlld3MgbXVzdCBvY2N1ciBtb250aGx5IHRvIGRldGVjdCBhbm9tYWxpZXMgb3IgcG9saWN5IiwKICAgICJwZXJp
b2RpY2l0eSI6ICJtb250aGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTEyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9i
eSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlN5c3RlbSBhbmQgSW5mb3JtYXRpb24gU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogImFubnVh
bGx5LCBvciB1cG9uIHNpZ25pZmljYW50IGNoYW5nZXMgdG8gdGhlIHRocmVhdCBsYW5kc2NhcGUgb3IiLAogICAgInBlcmlvZGljaXR5IjogImFubnVhbGx5
IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTExLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAg
ICAicG9saWN5IjogIlN5c3RlbSBhbmQgSW5mb3JtYXRpb24gU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIldUUyB3aWxsIHJldmlldyBlbmNyeXB0
aW9uIGNvbmZpZ3VyYXRpb25zIGF0IGxlYXN0IGFubnVhbGx5IHRvIGVuc3VyZSIsCiAgICAicGVyaW9kaWNpdHkiOiAiYW5udWFsbHkiLAogICAgImR1ZV9k
YXRlIjogIjIwMjYtMTEtMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAi
U3lzdGVtIGFuZCBJbmZvcm1hdGlvbiBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiYW5udWFsbHkgdGhlcmVhZnRlci4iLAogICAgInBlcmlvZGlj
aXR5IjogImFubnVhbGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTExLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6
ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlN5c3RlbSBhbmQgSW5mb3JtYXRpb24gU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIlJlc3RvcmUg
cHJvY2VkdXJlcyBtdXN0IGJlIHRlc3RlZCBhdCBsZWFzdCBhbm51YWxseSB0byB2ZXJpZnkgc3lzdGVtIiwKICAgICJwZXJpb2RpY2l0eSI6ICJhbm51YWxs
eSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewog
ICAgInBvbGljeSI6ICJTeXN0ZW1zIEFjY2VzcyBhbmQgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIlx1MjAyMiBXZWVrbHkgcmVjb25jaWxpYXRp
b24gYmV0d2VlbiB0aGUgSFIgcm9zdGVyIGFuZCBBRCBkaXNhYmxlcyBvcnBoYW5lZCIsCiAgICAicGVyaW9kaWNpdHkiOiAid2Vla2x5IiwKICAgICJkdWVf
ZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5Ijog
IlN5c3RlbXMgQWNjZXNzIGFuZCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAib24gYSBxdWFydGVybHkgYmFzaXMuIiwKICAgICJwZXJpb2RpY2l0
eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5Ijog
IiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiU3lzdGVtcyBBY2Nlc3MgYW5kIFNlY3VyaXR5IFBvbGljeSIsCiAgICAidGFzayI6ICJcdTIwMjIgVGhlIFNl
Y3VyaXR5IFRlYW0gcGVyZm9ybXMgZGFpbHkgYW5vbWFseSBkZXRlY3Rpb24gYW5kIHN1Ym1pdHMgbW9udGhseSIsCiAgICAicGVyaW9kaWNpdHkiOiAiZGFp
bHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjUtMTEtMDYiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsK
ICAgICJwb2xpY3kiOiAiU3lzdGVtcyBBY2Nlc3MgYW5kIFNlY3VyaXR5IFBvbGljeSIsCiAgICAidGFzayI6ICJcdTIwMjIgU2VtaSBBbm51YWwgQ2VydGlm
aWNhdGlvbjogU3lzdGVtIEFkbWluaXN0cmF0b3Igd2lsbCByZXZhbGlkYXRlIGV2ZXJ5IiwKICAgICJwZXJpb2RpY2l0eSI6ICJzZW1pYW5udWFsbHkiLAog
ICAgImR1ZV9kYXRlIjogIjIwMjYtMDUtMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJw
b2xpY3kiOiAiU3lzdGVtcyBBY2Nlc3MgYW5kIFNlY3VyaXR5IFBvbGljeSIsCiAgICAidGFzayI6ICJFbmQgVXNlciAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgICAgICBPYnNlcnZlIHNlY3VyaXR5IHBvbGljaWVzLCBzYWZlZ3VhcmQgY3JlZGVudGlhbHMsIGFuZCByZXBvcnQgaW5jaWRlbnRzIHByb21w
dGx5ICAgUGFydGljaXBhdGUgaW4gcXVhcnRlcmx5IGFjY2VzcyBhdHRlc3RhdGlvbnMiLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAi
ZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGlj
eSI6ICJTeXN0ZW1zIEFjY2VzcyBhbmQgU2VjdXJpdHkgUG9saWN5IiwKICAgICJ0YXNrIjogIk1hbmFnZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAg
ICAgICAgICAgIEluaXRpYXRlIGFuZCBhcHByb3ZlIEFSRi9DQVIgc3VibWlzc2lvbnM7IGVuc3VyZSBhY2Nlc3MgcmVtb3ZhbCBhdCBkZXBhcnR1cmUgICAg
ICBSZXZpZXcgdGVhbSBhY2Nlc3MgcXVhcnRlcmx5IiwKICAgICJwZXJpb2RpY2l0eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDIt
MDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiU3lzdGVtcyBBY2Nlc3Mg
YW5kIFNlY3VyaXR5IFBvbGljeSIsCiAgICAidGFzayI6ICJTeXN0ZW0gT3duZXIgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBWYWxpZGF0ZSBu
ZWNlc3NpdHkgb2YgcmVxdWVzdGVkIHJpZ2h0cyBhbmQgbWFpbnRhaW4gcm9sZXBlcm1pc3Npb24gbWFwcGluZ3MgICAgICAgTGVhZCBzZW1pYW5udWFsIGNl
cnRpZmljYXRpb25zIiwKICAgICJwZXJpb2RpY2l0eSI6ICJzZW1pYW5udWFsbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDUtMDUiLAogICAgImNvbXBs
ZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiU3lzdGVtcyBBY2Nlc3MgYW5kIFNlY3VyaXR5IFBv
bGljeSIsCiAgICAidGFzayI6ICJOZXR3b3JrICYgU3lzdGVtIEFkbWluaXN0cmF0b3IgICAgICAgICAgICAgICBDcmVhdGUsIG1vZGlmeSwgYW5kIGRpc2Fi
bGUgYWNjb3VudHM7IGVuZm9yY2UgTUZBLCB2YXVsdCwgYW5kIHBhc3N3b3JkIHBvbGljaWVzICAgUmVjb25jaWxlIEhSIHJvc3RlciB3aXRoIEFEIHdlZWts
eSIsCiAgICAicGVyaW9kaWNpdHkiOiAid2Vla2x5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAg
ICJ2ZXJpZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlN5c3RlbXMgQWNjZXNzIGFuZCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2si
OiAiSW5mb3JtYXRpb24gU3lzdGVtIFNlY3VyaXR5IE9mZmljZXIgKElTU08pICAgTW9uaXRvciBsb2dzLCBtYW5hZ2Ugc2Vzc2lvbiByZWNvcmRpbmdzLCBh
bmQgaW52ZXN0aWdhdGUgYW5vbWFsaWVzICAgICAgICAgICAgICAgIFByb2R1Y2Ugd2Vla2x5IGFub21hbHkgcmVwb3J0cyIsCiAgICAicGVyaW9kaWNpdHki
OiAid2Vla2x5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAg
fSwKICB7CiAgICAicG9saWN5IjogIlN5c3RlbXMgQWNjZXNzIGFuZCBTZWN1cml0eSBQb2xpY3kiLAogICAgInRhc2siOiAiQ2hpZWYgSW5mb3JtYXRpb24g
U2VjdXJpdHkgT2ZmaWNlciAoQ0lTTykgICAgT3duIHRoaXMgcG9saWN5LCBhcHByb3ZlIGV4Y2VwdGlvbnMsIGFuZCBjaGFpciBicmVhayBnbGFzcyByZXZp
ZXdzICAgICAgICAgICAgICAgIFJldmlldyBwb2xpY3kgZWZmZWN0aXZlbmVzcyBxdWFydGVybHkiLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIs
CiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAg
InBvbGljeSI6ICJUZXh0IE1lc3NhZ2UgKFNNUykgVXNhZ2UgUG9saWN5IiwKICAgICJ0YXNrIjogInN1YmplY3QgdG8gcXVhcnRlcmx5IGtleSBtYW5hZ2Vt
ZW50IGF1ZGl0cy4iLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVk
X2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJUZXh0IE1lc3NhZ2UgKFNNUykgVXNhZ2UgUG9saWN5IiwK
ICAgICJ0YXNrIjogIklUIFNlY3VyaXR5IHJldmlld3MgdXNhZ2UgcGF0dGVybnMgd2Vla2x5IGZvciBhbm9tYWxpZXMgc3VjaCBhcyIsCiAgICAicGVyaW9k
aWNpdHkiOiAid2Vla2x5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTExLTEyIiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6
ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlRleHQgTWVzc2FnZSAoU01TKSBVc2FnZSBQb2xpY3kiLAogICAgInRhc2siOiAiQ29tcGxpYW5jZSBPZmZp
Y2VyICAgUGVyZm9ybSBzZW1pYW5udWFsIGF1ZGl0czsgdXBkYXRlIHBvbGljeTsgY29vcmRpbmF0ZSB3aXRoIGxlZ2FsIG9uIHJldGVudGlvbiByZXF1aXJl
bWVudHMuIiwKICAgICJwZXJpb2RpY2l0eSI6ICJzZW1pYW5udWFsbHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDUtMDUiLAogICAgImNvbXBsZXRlZF9i
eSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiVXNlciBJZGVudGlmaWNhdGlvbiwgQXV0aGVudGljYXRpb24g
YW5kIFByaXZhY3kgUG9saWN5IiwKICAgICJ0YXNrIjogInF1YXJ0ZXJseS4iLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2Rh
dGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJV
c2VyIElkZW50aWZpY2F0aW9uLCBBdXRoZW50aWNhdGlvbiBhbmQgUHJpdmFjeSBQb2xpY3kiLAogICAgInRhc2siOiAiUXVhcnRlcmx5IFJldmlld3MgXHUy
MDEzIE1hbmFnZXJzIGNlcnRpZnkgZ3JvdXAgbWVtYmVyc2hpcHM7IENvbXBsaWFuY2UiLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAi
ZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGlj
eSI6ICJVc2VyIElkZW50aWZpY2F0aW9uLCBBdXRoZW50aWNhdGlvbiBhbmQgUHJpdmFjeSBQb2xpY3kiLAogICAgInRhc2siOiAiTWFuYWdlcnMgICAgICAg
ICAgIEFwcHJvdmUgaW5pdGlhbCBhY2Nlc3Mgb24gdGhlIEFjY2VzcyBSZXF1ZXN0IEZvcm0sIHZhbGlkYXRlIGxlYXN0LXByaXZpbGVnZSBhc3NpZ25tZW50
cyBkdXJpbmcgcXVhcnRlcmx5IHJldmlld3MsIGFuZCByZXF1ZXN0IHJlbW92YWwgb2YgYWNjZXNzIHdoZW4gZHV0aWVzIGNoYW5nZS4iLAogICAgInBlcmlv
ZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRf
YnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJVc2VyIElkZW50aWZpY2F0aW9uLCBBdXRoZW50aWNhdGlvbiBhbmQgUHJpdmFjeSBQb2xpY3kiLAog
ICAgInRhc2siOiAiVGhlIENJU08gYW5kIElTU08gY29uZHVjdCBxdWFydGVybHkgYWNjZXNzIHJldmlld3Mgb2Y6IiwKICAgICJwZXJpb2RpY2l0eSI6ICJx
dWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9
LAogIHsKICAgICJwb2xpY3kiOiAiVXNlciBJZGVudGlmaWNhdGlvbiwgQXV0aGVudGljYXRpb24gYW5kIFByaXZhY3kgUG9saWN5IiwKICAgICJ0YXNrIjog
IlRoaXMgcGxhbiB3aWxsIGJlIHJldmlld2VkIGFubnVhbGx5IGJ5IHRoZSBDSVNPIG9yIGV4ZWN1dGl2ZSBsZWFkZXJzaGlwIiwKICAgICJwZXJpb2RpY2l0
eSI6ICJhbm51YWxseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAyNi0xMS0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAi
IgogIH0sCiAgewogICAgInBvbGljeSI6ICJVc2VyIElkZW50aWZpY2F0aW9uLCBBdXRoZW50aWNhdGlvbiBhbmQgUHJpdmFjeSBQb2xpY3kiLAogICAgInRh
c2siOiAiVGhlc2Ugc2Vjb25kYXJ5IGJhY2t1cHMgYXJlIHVwZGF0ZWQgbW9udGhseSBieSB0aGUgSVQgQXNzZXQgYW5kIiwKICAgICJwZXJpb2RpY2l0eSI6
ICJtb250aGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI1LTEyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJpZmllZF9ieSI6ICIiCiAg
fSwKICB7CiAgICAicG9saWN5IjogIlVzZXIgSWRlbnRpZmljYXRpb24sIEF1dGhlbnRpY2F0aW9uIGFuZCBQcml2YWN5IFBvbGljeSIsCiAgICAidGFzayI6
ICJCYWNrdXAgam9icyBhcmUgY2hlY2tlZCB3ZWVrbHkgdG8gZW5zdXJlIHN1Y2Nlc3NmdWwiLAogICAgInBlcmlvZGljaXR5IjogIndlZWtseSIsCiAgICAi
ZHVlX2RhdGUiOiAiMjAyNS0xMS0xMiIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGlj
eSI6ICJVc2VyIElkZW50aWZpY2F0aW9uLCBBdXRoZW50aWNhdGlvbiBhbmQgUHJpdmFjeSBQb2xpY3kiLAogICAgInRhc2siOiAibW9udGhseSB0byB2ZXJp
ZnkgY3JpdGljYWwgZmlsZXMgYXJlIHByb3Blcmx5IHN5bmNlZC4iLAogICAgInBlcmlvZGljaXR5IjogIm1vbnRobHkiLAogICAgImR1ZV9kYXRlIjogIjIw
MjUtMTItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5IjogIiIKICB9LAogIHsKICAgICJwb2xpY3kiOiAiVXNlciBJZGVu
dGlmaWNhdGlvbiwgQXV0aGVudGljYXRpb24gYW5kIFByaXZhY3kgUG9saWN5IiwKICAgICJ0YXNrIjogIlRoZSBJVCBBc3NldCBhbmQgQ29uZmlndXJhdGlv
biBNYW5hZ2VyIHBlcmZvcm1zIGEgcXVhcnRlcmx5IHRlc3QiLAogICAgInBlcmlvZGljaXR5IjogInF1YXJ0ZXJseSIsCiAgICAiZHVlX2RhdGUiOiAiMjAy
Ni0wMi0wNSIsCiAgICAiY29tcGxldGVkX2J5IjogIiIsCiAgICAidmVyaWZpZWRfYnkiOiAiIgogIH0sCiAgewogICAgInBvbGljeSI6ICJVc2VyIElkZW50
aWZpY2F0aW9uLCBBdXRoZW50aWNhdGlvbiBhbmQgUHJpdmFjeSBQb2xpY3kiLAogICAgInRhc2siOiAiYW5kIHJvdGF0ZWQgcXVhcnRlcmx5LiIsCiAgICAi
cGVyaW9kaWNpdHkiOiAicXVhcnRlcmx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTAyLTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJp
ZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlVzZXIgSWRlbnRpZmljYXRpb24sIEF1dGhlbnRpY2F0aW9uIGFuZCBQcml2YWN5IFBvbGlj
eSIsCiAgICAidGFzayI6ICJUYWJsZXRvcCBleGVyY2lzZXMgd2lsbCBiZSBjb25kdWN0ZWQgc2VtaS1hbm51YWxseSB0byBzaW11bGF0ZSIsCiAgICAicGVy
aW9kaWNpdHkiOiAic2VtaWFubnVhbGx5IiwKICAgICJkdWVfZGF0ZSI6ICIyMDI2LTA1LTA1IiwKICAgICJjb21wbGV0ZWRfYnkiOiAiIiwKICAgICJ2ZXJp
ZmllZF9ieSI6ICIiCiAgfSwKICB7CiAgICAicG9saWN5IjogIlVzZXIgSWRlbnRpZmljYXRpb24sIEF1dGhlbnRpY2F0aW9uIGFuZCBQcml2YWN5IFBvbGlj
eSIsCiAgICAidGFzayI6ICJCYWNrdXAgcmVzdG9yZSB0ZXN0cyBhcmUgbG9nZ2VkIGFuZCByZXZpZXdlZCBxdWFydGVybHkuIiwKICAgICJwZXJpb2RpY2l0
eSI6ICJxdWFydGVybHkiLAogICAgImR1ZV9kYXRlIjogIjIwMjYtMDItMDUiLAogICAgImNvbXBsZXRlZF9ieSI6ICIiLAogICAgInZlcmlmaWVkX2J5Ijog
IiIKICB9Cl0=
`;
const jsonStr = atob(base64Tasks.replace(/\s+/g, ''));
const tasksData = JSON.parse(jsonStr);

// Initialize the application when the DOM is ready.  If the DOM has already
// loaded by the time this script runs, initialize immediately; otherwise
// wait for the DOMContentLoaded event.  This avoids missing the event
// when scripts are loaded late in the document.
function runApp() {
  initializeApp(tasksData);
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runApp);
} else {
  runApp();
}
