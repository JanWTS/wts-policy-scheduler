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
// Current periodicity filter ("All" means no filter).  We use uppercase
// values for periodicity to avoid case sensitivity issues.
let currentFilter = 'All';
// Index of the row currently being edited (null if none)
let editingRowIndex = null;

// List of completed tasks. Each record stores the task index, policy, task name,
// the due date of the occurrence, who completed it, who verified it, and the
// date it was completed.  This array is loaded from and saved to localStorage.
let completedTasks = [];

/**
 * Compute the next due date for a task based on its periodicity.
 *
 * @param {string} dateStr Current due date in YYYY-MM-DD format
 * @param {string} periodicity One of DAILY, WEEKLY, MONTHLY, QUARTERLY, SEMIANNUALLY, ANNUALLY, OTHER
 * @returns {string|null} The next due date in YYYY-MM-DD format, or null if the task does not repeat
 */
function getNextDueDate(dateStr, periodicity) {
  const d = new Date(dateStr + 'T00:00:00');
  switch (periodicity) {
    case 'DAILY':
      d.setDate(d.getDate() + 1);
      break;
    case 'WEEKLY':
      d.setDate(d.getDate() + 7);
      break;
    case 'MONTHLY':
      d.setMonth(d.getMonth() + 1);
      break;
    case 'QUARTERLY':
      d.setMonth(d.getMonth() + 3);
      break;
    case 'SEMIANNUALLY':
      d.setMonth(d.getMonth() + 6);
      break;
    case 'ANNUALLY':
      d.setFullYear(d.getFullYear() + 1);
      break;
    default:
      return null;
  }
  return d.toISOString().slice(0, 10);
}

/**
 * Generate all occurrences of a task within a given date range.  Uses the task's
 * initial_due_date as the starting point and advances based on its periodicity.
 * Tasks with periodicity OTHER generate only their initial date if it falls
 * within the range.
 *
 * @param {Object} task Task object with initial_due_date and periodicity
 * @param {Date} start Start date of the range (inclusive)
 * @param {Date} end End date of the range (inclusive)
 * @returns {Date[]} Array of Date objects representing each occurrence
 */
function generateOccurrences(task, start, end) {
  const occurrences = [];
  if (!task.initial_due_date) return occurrences;
  const first = new Date(task.initial_due_date + 'T00:00:00');
  // Handle tasks that do not repeat
  if (task.periodicity === 'OTHER' || !getNextDueDate(task.initial_due_date, task.periodicity)) {
    if (first >= start && first <= end) {
      occurrences.push(first);
    }
    return occurrences;
  }
  // Advance to the first occurrence on or after the start date
  let current = new Date(first);
  while (current < start) {
    const nextStr = getNextDueDate(current.toISOString().slice(0, 10), task.periodicity);
    if (!nextStr) return occurrences;
    current = new Date(nextStr + 'T00:00:00');
  }
  // Add occurrences within the range
  while (current <= end) {
    occurrences.push(new Date(current));
    const nextStr = getNextDueDate(current.toISOString().slice(0, 10), task.periodicity);
    if (!nextStr) break;
    current = new Date(nextStr + 'T00:00:00');
  }
  return occurrences;
}

/**
 * Determine whether a specific occurrence of a task has been completed.  Checks
 * the completedTasks array for a record matching the task index and due date.
 *
 * @param {number} index Index of the task in tasksData
 * @param {string} dueDateStr Occurrence date in YYYY-MM-DD format
 * @returns {boolean} True if the occurrence has been completed, false otherwise
 */
function isTaskCompleted(index, dueDateStr) {
  return completedTasks.some(rec => rec.index === index && rec.due_date === dueDateStr);
}

/**
 * Mark a task occurrence as completed.  Records the completion in completedTasks,
 * updates the task's next due date, persists data to localStorage, and refreshes
 * the list and calendar views.
 *
 * @param {number} idx Index of the task in tasksData
 */
function completeTask(idx) {
  const task = tasksData[idx];
  const dueDate = task.due_date;
  if (!dueDate) return;
  // Capture names from saved status if available
  const compName = saved[idx] ? saved[idx].completed_by || '' : '';
  const verName = saved[idx] ? saved[idx].verified_by || '' : '';
  const record = {
    index: idx,
    policy: task.policy,
    task: task.task,
    due_date: dueDate,
    completed_by: compName,
    verified_by: verName,
    completed_date: new Date().toISOString().slice(0, 10)
  };
  completedTasks.push(record);
  // Persist completed tasks
  try {
    localStorage.setItem('completedTasks', JSON.stringify(completedTasks));
  } catch (e) {}
  // Compute next due date based on periodicity
  const next = getNextDueDate(dueDate, task.periodicity);
  if (next) {
    tasksData[idx].due_date = next;
  } else {
    // If no next date (e.g. OTHER), clear the due_date so it no longer shows in the list
    tasksData[idx].due_date = '';
  }
  // Persist updated tasks
  try {
    localStorage.setItem('customTasks', JSON.stringify(tasksData));
  } catch (e) {}
  // Refresh UI
  buildTaskList(tasksData);
  renderCalendar(tasksData);
}

/**
 * Build or refresh the completed tasks table based on the current completedTasks
 * array and the search input.  The table displays the most recent completed
 * tasks first.
 */
function buildCompletedTable() {
  const table = document.getElementById('completed-table');
  if (!table) return;
  // Clear table
  table.innerHTML = '';
  // Build header
  const thead = document.createElement('thead');
  const hr = document.createElement('tr');
  ['Policy','Task','Due Date','Completed By','Verified By','Completed Date'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    hr.appendChild(th);
  });
  thead.appendChild(hr);
  table.appendChild(thead);
  // Fetch search filter
  const searchInput = document.getElementById('completed-search');
  const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
  // Sort completed tasks by completed_date descending
  const sorted = [...completedTasks].sort((a, b) => {
    return b.completed_date.localeCompare(a.completed_date);
  });
  // Build body
  const tbody = document.createElement('tbody');
  sorted.forEach(rec => {
    const combined = `${rec.policy} ${rec.task} ${rec.due_date} ${rec.completed_by} ${rec.verified_by} ${rec.completed_date}`.toLowerCase();
    if (query && !combined.includes(query)) return;
    const tr = document.createElement('tr');
    [rec.policy, rec.task, rec.due_date, rec.completed_by, rec.verified_by, rec.completed_date].forEach(val => {
      const td = document.createElement('td');
      td.textContent = val || '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

/**
 * Show the completed tasks view and hide other views.  Updates navigation states
 * and rebuilds the completed tasks table.
 */
function showCompletedView() {
  document.getElementById('calendar-view').classList.remove('active');
  document.getElementById('list-view').classList.remove('active');
  document.getElementById('inventory-view').classList.remove('active');
  document.getElementById('members-view').classList.remove('active');
  document.getElementById('completed-view').classList.add('active');
  // Update nav active states
  document.getElementById('nav-calendar').classList.remove('active');
  document.getElementById('nav-list').classList.remove('active');
  document.getElementById('nav-inventory').classList.remove('active');
  document.getElementById('nav-members').classList.remove('active');
  document.getElementById('nav-completed').classList.add('active');
  // Build table
  buildCompletedTable();
}

// -----------------------------------------------------------------------------
// Inventory and Members Data
//
// We embed the office inventory list and the members list directly in this
// script so that the application can run entirely offline without needing
// to fetch JSON files via the file:// protocol (which is blocked by
// browsers).  The arrays below are auto‑generated from the uploaded
// spreadsheet.  Each inventory item contains fields such as inventoryId,
// serialNumber, itemName, itemDescription, quantity, itemPrice, location,
// issuedTo, issuedDate and notes.  The members array contains objects
// with a `name` property and an `assets` array listing the assets (by
// inventoryId and itemName) assigned to that person.
const inventoryData = [{"inventoryId": "Office", "serialNumber": "LINIQ8WZ4314480", "itemName": "Vizio V-Series 50\"", "itemDescription": " 4K UHD HDR LED Smart TV", "quantity": 1.0, "itemPrice": 269.99, "location": "Common Area", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Office2", "serialNumber": "LINIQ8WZ4313635", "itemName": "Vizio V-Series 50\"", "itemDescription": "4K UHD HDR LED Smart TV", "quantity": 1.0, "itemPrice": 269.99, "location": "Office Room 3", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Office Printer", "serialNumber": "CVBRR2N4DM", "itemName": "HP ColorJet Pro MFP4301", "itemDescription": "Color Printer", "quantity": 1.0, "itemPrice": 699.99, "location": "Common Area", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 1", "serialNumber": "3CM3240BXC", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "WorkSpace04", "issuedTo": "Steve Dutter", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 2", "serialNumber": "3CM328198F", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "WorkSpace04", "issuedTo": "Steve Dutter", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 3", "serialNumber": "3CM3460JSG", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Cyber Room", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 4", "serialNumber": "3CM3460JS6", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Cyber Room", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 5", "serialNumber": "3CM3460JSH", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "WorkSpace04", "issuedTo": "Ken Stein", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 6", "serialNumber": "3CM3460JTD", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 1", "issuedTo": "Ken Stein", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 7", "serialNumber": "3CM3460JS4", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 3", "issuedTo": "Jan Miketa", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 8", "serialNumber": "3CM3460JSD", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 3", "issuedTo": "Jan Miketa", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 9", "serialNumber": "3CM3460JS7", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 3", "issuedTo": "Becky Sowell", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 10", "serialNumber": "3CM3460JSJ", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 3", "issuedTo": "Becky Sowell", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 11", "serialNumber": "3CM4200JJY", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 3", "issuedTo": "Carole Zehner", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 12", "serialNumber": "3CM4150HYY", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 3", "issuedTo": "Carole Zehner", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 13", "serialNumber": "3CM4236RRG", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 2", "issuedTo": "Jackie Chrabot", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 14", "serialNumber": "3CM4230RRW", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Office Room 2", "issuedTo": "Jackie Chrabot", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 15", "serialNumber": "3CM42913TX", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Cyber Room", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS Monitor 16", "serialNumber": "3CM42914HZ", "itemName": "HP M22f FHD Monitor", "itemDescription": "Desktop Monitors", "quantity": 1.0, "itemPrice": 144.99, "location": "Cyber Room", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS LT-0001", "serialNumber": "HS6H1Z3", "itemName": "DELL VOSTRO 15 LAPTOP", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 849.0, "location": "Jacob Gonzales", "issuedTo": "Jacob Gonzales", "issuedDate": "Nov. 2025", "notes": ""}, {"inventoryId": "WTS LT-0002", "serialNumber": "6TM61Z3", "itemName": "DELL VOSTRO 15 LAPTOP 3530", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 849.0, "location": "Office Room 3", "issuedTo": "Carole Zehner", "issuedDate": "Sep. 2025", "notes": ""}, {"inventoryId": "WTS LT-0003", "serialNumber": "3ZKH1Z3", "itemName": "DELL VOSTRO 15 LAPTOP 3530", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 849.0, "location": "Office Room 3", "issuedTo": "Becky Sowell", "issuedDate": "Sep. 2024", "notes": ""}, {"inventoryId": "WTS LT-0004", "serialNumber": "G9RH1Z3", "itemName": "DELL VOSTRO 15 LAPTOP 3530", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 849.0, "location": "Office Room 1", "issuedTo": "Ken Stein", "issuedDate": "Jan. 2024", "notes": ""}, {"inventoryId": "WTS LT-0005", "serialNumber": "5CG93373QP", "itemName": "HP ELITEBOOK 840 G5", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 674.99, "location": "Assigned to Jacqueline", "issuedTo": "Jackie Chrabot", "issuedDate": "Mar. 2025", "notes": ""}, {"inventoryId": "WTS LT-0006", "serialNumber": "TA850612", "itemName": "HP ELITEBOOK 840 G5", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 674.99, "location": "(RETIRED/BROKEN)", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS LT-0007", "serialNumber": "5CG9112HB5", "itemName": "HP ELITEBOOK 840 G6", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 674.99, "location": "Cyber Room", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS LT-0008", "serialNumber": "A131ZJUA#ABA", "itemName": "HP OMNIBOOK 14", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 1499.99, "location": "Assigned to Tom", "issuedTo": "Tom Crain", "issuedDate": "Jun. 2024", "notes": ""}, {"inventoryId": "WTS LT-0009", "serialNumber": "ST: F7RH1Z3", "itemName": "DELL VOSTRO 15 LAPTOP 3530", "itemDescription": "Laptop ", "quantity": 1.0, "itemPrice": 849.0, "location": "Office Room 3", "issuedTo": "Jan Miketa", "issuedDate": "", "notes": ""}, {"inventoryId": "OfficeDesk1 ", "serialNumber": "8QSTAD", "itemName": "HON Executive Desk  H10712L.JJ", "itemDescription": "Office desk (L-shape) Bowfront", "quantity": 1.0, "itemPrice": 499.99, "location": "WorkSpace04", "issuedTo": "Steve Dutter", "issuedDate": "", "notes": ""}, {"inventoryId": "OfficeDesk2", "serialNumber": "C7U52A( LEFTSIDE) CUU5EA (RIGHTSIDE)", "itemName": "HON Executive Desk 101064 JJ", "itemDescription": "Office desk (L-shape)", "quantity": 1.0, "itemPrice": 499.99, "location": "Unassigned", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "OfficeDesk3", "serialNumber": "86STAD", "itemName": "HON Executive Desk H10712L.JJ", "itemDescription": "Office desk (L-shape)", "quantity": 1.0, "itemPrice": 499.99, "location": "Unassigned", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "OfficeDesk4", "serialNumber": "CKU52A (LEFTSIDE) CRU5EA (RIGHTSIDE)", "itemName": "HON Executive Desk 101064 JJ", "itemDescription": "Office desk (L-shape)", "quantity": 1.0, "itemPrice": 499.99, "location": "Office Room 2", "issuedTo": "Jackie Chrabot", "issuedDate": "", "notes": ""}, {"inventoryId": "Micro01", "serialNumber": "T230730040990", "itemName": "Cuisinart Microwave Oven", "itemDescription": "Office Microwave", "quantity": 1.0, "itemPrice": 109.99, "location": "Breakroom Kitchen", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS1 Phone", "serialNumber": "FVH27040", "itemName": "Cisco IP Phone 8851", "itemDescription": "Desk Phone", "quantity": 1.0, "itemPrice": 350.0, "location": "Office Room 4", "issuedTo": "Steve Dutter", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS2 Phone", "serialNumber": "FVH27040J2P", "itemName": "Cisco IP Phone 8851", "itemDescription": "Desk Phone", "quantity": 1.0, "itemPrice": 350.0, "location": "Cyber Room", "issuedTo": "(UNASSIGNED)", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS3 Phone", "serialNumber": "FVH27040FPQ", "itemName": "Cisco IP Phone 8851", "itemDescription": "Desk Phone", "quantity": 1.0, "itemPrice": 350.0, "location": "Office Room 1", "issuedTo": "Ken Stein", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS4 Phone", "serialNumber": "FVH27040K0H", "itemName": "Cisco IP Phone 8851", "itemDescription": "Desk Phone", "quantity": 1.0, "itemPrice": 350.0, "location": "Unassigned", "issuedTo": "Retrieving data. Wait a few seconds and try to cut or copy again.", "issuedDate": "", "notes": ""}, {"inventoryId": "WTS5 Phone", "serialNumber": "FVH27040N3H", "itemName": "Cisco IP Phone 8851", "itemDescription": "Desk Phone", "quantity": 1.0, "itemPrice": 350.0, "location": "Office Room 3", "issuedTo": "Retrieving data. Wait a few seconds and try to cut or copy again.", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC01", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC02", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC03", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC04", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC05", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC06", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC07", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLKFC08", "serialNumber": "", "itemName": "Haworth Zody Multifunction Task Chair Black", "itemDescription": "BLACK Office Chair", "quantity": 1.0, "itemPrice": 229.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC01", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC02", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC03", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC04", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC05", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC06", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC07", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BLUFC08", "serialNumber": "", "itemName": "Global Granada Multi-Function Task Chair", "itemDescription": "BLUE Office chair", "quantity": 1.0, "itemPrice": 129.99, "location": "Office space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "BAC01", "serialNumber": "", "itemName": "Sit On It Guest Arm Chair Blue", "itemDescription": "Arm Chair", "quantity": 1.0, "itemPrice": 79.99, "location": "WorkSpace04", "issuedTo": "Steve Dutter", "issuedDate": "", "notes": ""}, {"inventoryId": "BAC02", "serialNumber": "", "itemName": "Sit On It Guest Arm Chair Blue", "itemDescription": "Arm Chair", "quantity": 1.0, "itemPrice": 79.99, "location": "WorkSpace04", "issuedTo": "Steve Dutter", "issuedDate": "", "notes": ""}, {"inventoryId": "RT01", "serialNumber": "", "itemName": "Office sourse 36\" Round discussion Table", "itemDescription": "lounge table (round)", "quantity": 1.0, "itemPrice": 149.99, "location": "Employee Breakroom", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 1", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "WorkSpace03", "issuedTo": "  ", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 2", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "WorkSpace03", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 3", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "WorkSpace03", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 4", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "WorkSpace03", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 5", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "Common Area", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 6", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "Common Area", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 7", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "Common Area", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 8", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "WorkSpace01", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Cube 9", "serialNumber": "", "itemName": "Cubicle ", "itemDescription": "Workstation", "quantity": 1.0, "itemPrice": 800.0, "location": "WorkSpace01", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "REFER01", "serialNumber": "", "itemName": "Whirlpool", "itemDescription": "Refridgerator", "quantity": 1.0, "itemPrice": 159.99, "location": "Employee Breakroom", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "SHREDDER01", "serialNumber": 24040100058, "itemName": "Kitnery", "itemDescription": "CUI Shredder", "quantity": 1.0, "itemPrice": 369.0, "location": "Common Area", "issuedTo": "", "issuedDate": "", "notes": "kitnery.us@outlook.com"}, {"inventoryId": "Trash Can 1", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Office Space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Trash Can 2", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Kitchen Breakroom", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Trash Can 3 ", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Office Space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Trash Can 4 ", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Office Space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Trash Can 5", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Office Space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Trash Can 6", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Office Space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Trash Can 7", "serialNumber": "", "itemName": "Highmark", "itemDescription": "Trash Can", "quantity": 1.0, "itemPrice": 14.99, "location": "Office Space", "issuedTo": "", "issuedDate": "", "notes": ""}, {"inventoryId": "Teleconference Puck", "serialNumber": "EERXK9", "itemName": "Poly Sync", "itemDescription": "Teleconference Puck", "quantity": 1.0, "itemPrice": 139.99, "location": "Assigned to Tom", "issuedTo": "Tom Crain", "issuedDate": "", "notes": ""}, {"inventoryId": "SW001", "serialNumber": "", "itemName": "MSI", "itemDescription": "Dev Laptop ", "quantity": "", "itemPrice": "", "location": "Office Room 3", "issuedTo": "Jan Miketa", "issuedDate": "", "notes": ""}];
const membersData = [{"name": "Steve Dutter", "assets": [{"inventoryId": "WTS Monitor 1", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS Monitor 2", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "OfficeDesk1 ", "itemName": "HON Executive Desk  H10712L.JJ"}, {"inventoryId": "WTS1 Phone", "itemName": "Cisco IP Phone 8851"}, {"inventoryId": "BLKFC01", "itemName": "Haworth Zody Multifunction Task Chair Black"}, {"inventoryId": "BAC01", "itemName": "Sit On It Guest Arm Chair Blue"}, {"inventoryId": "BAC02", "itemName": "Sit On It Guest Arm Chair Blue"}]}, {"name": "Ken Stein", "assets": [{"inventoryId": "WTS Monitor 5", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS Monitor 6", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS LT-0004", "itemName": "DELL VOSTRO 15 LAPTOP 3530"}, {"inventoryId": "WTS3 Phone", "itemName": "Cisco IP Phone 8851"}, {"inventoryId": "BLKFC02", "itemName": "Haworth Zody Multifunction Task Chair Black"}]}, {"name": "Jan Miketa", "assets": [{"inventoryId": "WTS Monitor 7", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS Monitor 8", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS LT-0009", "itemName": "DELL VOSTRO 15 LAPTOP 3530"}, {"inventoryId": "SW001", "itemName": "MSI"}]}, {"name": "Becky Sowell", "assets": [{"inventoryId": "WTS Monitor 9", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS Monitor 10", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS LT-0003", "itemName": "DELL VOSTRO 15 LAPTOP 3530"}]}, {"name": "Carole Zehner", "assets": [{"inventoryId": "WTS Monitor 11", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS Monitor 12", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS LT-0002", "itemName": "DELL VOSTRO 15 LAPTOP 3530"}]}, {"name": "Jackie Chrabot", "assets": [{"inventoryId": "WTS Monitor 13", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS Monitor 14", "itemName": "HP M22f FHD Monitor"}, {"inventoryId": "WTS LT-0005", "itemName": "HP ELITEBOOK 840 G5"}, {"inventoryId": "OfficeDesk4", "itemName": "HON Executive Desk 101064 JJ"}]}, {"name": "Jacob Gonzales", "assets": [{"inventoryId": "WTS LT-0001", "itemName": "DELL VOSTRO 15 LAPTOP"}]}, {"name": "Tom Crain", "assets": [{"inventoryId": "WTS LT-0008", "itemName": "HP OMNIBOOK 14"}, {"inventoryId": "Teleconference Puck", "itemName": "Poly Sync"}]}, {"name": "Retrieving data. Wait a few seconds and try to cut or copy again.", "assets": [{"inventoryId": "WTS4 Phone", "itemName": "Cisco IP Phone 8851"}, {"inventoryId": "WTS5 Phone", "itemName": "Cisco IP Phone 8851"}]}];

/**
 * Load inventory and members data from JSON files.  The data files are
 * located in the "data" folder next to this script (inventory.json and
 * members.json).  When running from a local file (file:/// protocol), fetch
 * may fail; in that case the data arrays remain empty and the corresponding
 * views will simply show no rows.
 *
 * @returns {Promise<void>} A promise that resolves once both data sets are
 *   loaded (or attempted).  The loaded data is stored in inventoryData and
 *   membersData.
 */
async function loadInventoryData() {
  try {
    const invResp = await fetch('data/inventory.json');
    if (invResp.ok) {
      inventoryData = await invResp.json();
    }
  } catch (e) {
    console.error('Failed to load inventory.json', e);
    inventoryData = [];
  }
  try {
    const memResp = await fetch('data/members.json');
    if (memResp.ok) {
      membersData = await memResp.json();
    }
  } catch (e) {
    console.error('Failed to load members.json', e);
    membersData = [];
  }
}

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
  // Restore completed tasks from localStorage
  try {
    completedTasks = JSON.parse(localStorage.getItem('completedTasks')) || [];
  } catch (e) {
    completedTasks = [];
  }
  // Ensure tasks have initial_due_date for recurrence calculations and normalize periodicity
  tasksData.forEach((task) => {
    if (!task.initial_due_date) {
      task.initial_due_date = task.due_date;
    }
    if (task.periodicity) {
      task.periodicity = task.periodicity.toString().toUpperCase();
    }
  });
  // Build the task list and store row elements for quick access
  buildTaskList(tasksData);

  // Set up periodicity filter control
  const filterSelect = document.getElementById('periodicityFilter');
  if (filterSelect) {
    filterSelect.value = currentFilter;
    filterSelect.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      applyFilter();
      // re-render calendar with current filter applied
      renderCalendar(tasksData);
    });
  }

  // No global edit button; editing is handled per-row

  // Set up add-task button
  const addBtn = document.getElementById('add-task-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addTaskRow(tasksData);
    });
  }
  // Set up navigation between calendar and list views
  const navCal = document.getElementById('nav-calendar');
  const navList = document.getElementById('nav-list');
  navCal.addEventListener('click', () => {
    showCalendarView();
  });
  navList.addEventListener('click', () => {
    showListView();
  });
  // Set up navigation for inventory and members views
  const navInventory = document.getElementById('nav-inventory');
  const navMembers = document.getElementById('nav-members');
  if (navInventory) {
    navInventory.addEventListener('click', () => {
      showInventoryView();
    });
  }
  if (navMembers) {
    navMembers.addEventListener('click', () => {
      showMembersView();
    });
  }
  // Set up navigation for completed tasks view
  const navCompleted = document.getElementById('nav-completed');
  if (navCompleted) {
    navCompleted.addEventListener('click', () => {
      showCompletedView();
    });
  }
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

  // Build inventory and members tables once the DOM is ready.
  buildInventoryList();
  buildMembersList();

  // Bind search input for completed tasks to filter the log
  const completedSearch = document.getElementById('completed-search');
  if (completedSearch) {
    completedSearch.addEventListener('input', () => {
      buildCompletedTable();
    });
  }
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
    // Skip tasks that no longer have a due date (e.g. one‑time tasks after completion)
    if (!task.due_date) {
      rowElements[idx] = null;
      return;
    }
    const row = document.createElement('tr');
    // Index column
    const idxTd = document.createElement('td');
    idxTd.textContent = idx + 1;
    row.appendChild(idxTd);
    // Determine if this row is currently being edited
    const isEditing = editingRowIndex === idx;
    // Policy
    const policyTd = document.createElement('td');
    if (isEditing) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = task.policy;
      inp.addEventListener('input', (e) => {
        tasksData[idx].policy = e.target.value;
      });
      policyTd.appendChild(inp);
    } else {
      policyTd.textContent = task.policy;
    }
    row.appendChild(policyTd);
    // Task description
    const taskTd = document.createElement('td');
    if (isEditing) {
      const inp = document.createElement('input');
      inp.type = 'text';
      inp.value = task.task;
      inp.addEventListener('input', (e) => {
        tasksData[idx].task = e.target.value;
      });
      taskTd.appendChild(inp);
    } else {
      taskTd.textContent = task.task;
    }
    row.appendChild(taskTd);
    // Periodicity
    const perTd = document.createElement('td');
    if (isEditing) {
      const sel = document.createElement('select');
      const options = ['DAILY','WEEKLY','MONTHLY','QUARTERLY','SEMIANNUALLY','ANNUALLY','OTHER'];
      options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt;
        option.textContent = opt;
        if (task.periodicity === opt) option.selected = true;
        sel.appendChild(option);
      });
      sel.addEventListener('change', (e) => {
        tasksData[idx].periodicity = e.target.value;
        // Update calendar after editing periodicity
        renderCalendar(tasksData);
      });
      perTd.appendChild(sel);
    } else {
      perTd.textContent = task.periodicity;
    }
    row.appendChild(perTd);
    // Due date
    const dueTd = document.createElement('td');
    if (isEditing) {
      const inp = document.createElement('input');
      inp.type = 'date';
      inp.value = task.due_date;
      inp.addEventListener('change', (e) => {
        tasksData[idx].due_date = e.target.value;
        renderCalendar(tasksData);
      });
      dueTd.appendChild(inp);
    } else {
      dueTd.textContent = task.due_date;
    }
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
    // Actions cell: edit or finish button
    const actionTd = document.createElement('td');
    if (isEditing) {
      const finishBtn = document.createElement('button');
      finishBtn.textContent = 'Finish';
      finishBtn.addEventListener('click', () => {
        finishEditRow(idx);
      });
      actionTd.appendChild(finishBtn);
      // Add delete button next to finish when editing
      const deleteBtn = document.createElement('button');
      deleteBtn.innerHTML = '&#128465;'; // trashcan icon
      deleteBtn.style.marginLeft = '0.3rem';
      deleteBtn.addEventListener('click', () => {
        // Show confirmation before deleting
        const confirmDelete = window.confirm('Are you sure you want to delete this entry?');
        if (confirmDelete) {
          // Remove the task from the array
          tasksData.splice(idx, 1);
          editingRowIndex = null;
          // Persist changes
          try {
            localStorage.setItem('customTasks', JSON.stringify(tasksData));
          } catch (e) {}
          // Rebuild list and update calendar
          buildTaskList(tasksData);
          renderCalendar(tasksData);
        }
      });
      actionTd.appendChild(deleteBtn);
    } else {
      const editIcon = document.createElement('span');
      editIcon.className = 'edit-icon';
      editIcon.innerHTML = '&#9998;';
      editIcon.addEventListener('click', () => {
        startEditRow(idx);
      });
      actionTd.appendChild(editIcon);
      // Complete button to mark the current occurrence as done
      const completeBtn = document.createElement('button');
      completeBtn.textContent = 'Complete';
      completeBtn.style.marginLeft = '0.3rem';
      completeBtn.addEventListener('click', () => {
        completeTask(idx);
      });
      actionTd.appendChild(completeBtn);
    }
    row.appendChild(actionTd);
    tbody.appendChild(row);
    // Store row for highlighting later
    rowElements[idx] = row;
  });
  // Apply filter to show/hide rows based on current selection
  applyFilter();
}

/**
 * Show or hide rows in the task list based on the current periodicity filter.
 * When the filter is "All" every row is shown. Otherwise rows whose
 * tasks' periodicity does not match the filter are hidden.
 */
function applyFilter() {
  // rowElements array is aligned with tasksData indices
  rowElements.forEach((row, idx) => {
    if (!row) return;
    // tasksData is a global array defined below
    const task = tasksData[idx];
    const show = (currentFilter === 'All' || (task && task.periodicity === currentFilter)) || (editingRowIndex === idx);
    row.style.display = show ? '' : 'none';
  });
}

/**
 * Toggle edit mode for the task list. In edit mode the policy, task,
 * periodicity and due date cells become editable inputs. When edit mode
 * is toggled off, changes are saved to localStorage and the list is rebuilt.
 *
 * @param {Array} tasksData Array of task objects
 */
// Not used: editing is now per-row
function toggleEditMode(tasksData) {
  // no-op
}

/**
 * Add a blank task row. If not currently in edit mode, switch to edit mode first.
 * New tasks default to empty policy/task, monthly periodicity and today's date.
 *
 * @param {Array} tasksData Array of task objects
 */
function addTaskRow(tasksData) {
  // Create a new task object with default values
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const newTask = {
    policy: '',
    task: '',
    periodicity: 'MONTHLY',
    due_date: `${yyyy}-${mm}-${dd}`,
    completed_by: '',
    verified_by: ''
  };
  tasksData.push(newTask);
  // Start editing the newly added row
  editingRowIndex = tasksData.length - 1;
  buildTaskList(tasksData);
  renderCalendar(tasksData);
  // Scroll to the newly added row so the user can see it
  setTimeout(() => {
    const newRow = rowElements[editingRowIndex];
    if (newRow) {
      newRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 0);
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
  // Show calendar, hide all other view sections
  document.getElementById('calendar-view').classList.add('active');
  document.getElementById('list-view').classList.remove('active');
  document.getElementById('inventory-view').classList.remove('active');
  document.getElementById('members-view').classList.remove('active');
  // Hide completed view if present
  const compView = document.getElementById('completed-view');
  if (compView) compView.classList.remove('active');
  // Update nav button states
  document.getElementById('nav-calendar').classList.add('active');
  document.getElementById('nav-list').classList.remove('active');
  document.getElementById('nav-inventory').classList.remove('active');
  document.getElementById('nav-members').classList.remove('active');
  const navComp = document.getElementById('nav-completed');
  if (navComp) navComp.classList.remove('active');
  // Ensure calendar is updated when switching back
  renderCalendar(tasksData);
}

/**
 * Show the task list view and hide the calendar view.  Update sidebar
 * navigation button active states.
 */
function showListView() {
  // Show list, hide other views
  document.getElementById('calendar-view').classList.remove('active');
  document.getElementById('list-view').classList.add('active');
  document.getElementById('inventory-view').classList.remove('active');
  document.getElementById('members-view').classList.remove('active');
  // Hide completed view if present
  const compView = document.getElementById('completed-view');
  if (compView) compView.classList.remove('active');
  // Update navigation
  document.getElementById('nav-calendar').classList.remove('active');
  document.getElementById('nav-list').classList.add('active');
  document.getElementById('nav-inventory').classList.remove('active');
  document.getElementById('nav-members').classList.remove('active');
  const navComp = document.getElementById('nav-completed');
  if (navComp) navComp.classList.remove('active');
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
 * Begin editing the specified row.  Sets the editingRowIndex and rebuilds
 * the list to display input fields for that row.  Any existing editing row
 * will be discarded without saving changes.
 *
 * @param {number} index Row index to edit
 */
function startEditRow(index) {
  editingRowIndex = index;
  buildTaskList(tasksData);
  // Ensure the row is visible when editing begins
  if (rowElements[index]) {
    rowElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
}

/**
 * Finish editing a row.  Clears the editingRowIndex, saves the updated
 * tasksData to localStorage, rebuilds the list, and re-renders the calendar.
 *
 * @param {number} index Row index being edited
 */
function finishEditRow(index) {
  // Clear editing state
  editingRowIndex = null;
  // Persist tasksData modifications
  try {
    localStorage.setItem('customTasks', JSON.stringify(tasksData));
  } catch (e) {
    // ignore storage errors
  }
  // Rebuild list and update filter
  buildTaskList(tasksData);
  // Re-render calendar to reflect changes
  renderCalendar(tasksData);
}

/**
 * Build the inventory table using the embedded inventoryData array.  This
 * function generates a header row and one row per inventory item with all
 * columns displayed.  It is called once during initialization and again
 * whenever the page is refreshed via GitHub Pages.
 */
function buildInventoryList() {
  const table = document.getElementById('inventory-table');
  if (!table) return;
  // Clear existing content
  table.innerHTML = '';
  // Build header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  const headers = ['Inventory ID','Serial #','Item Name','Description','Quantity','Price','Location','Issued To','Issued Date','Notes'];
  headers.forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  // Build body
  const tbody = document.createElement('tbody');
  inventoryData.forEach(item => {
    const tr = document.createElement('tr');
    [item.inventoryId, item.serialNumber, item.itemName, item.itemDescription,
     item.quantity, item.itemPrice, item.location, item.issuedTo,
     item.issuedDate, item.notes].forEach(val => {
      const td = document.createElement('td');
      td.textContent = (val !== undefined && val !== null) ? val : '';
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

/**
 * Build the members table using the embedded membersData array.  Each row
 * shows the member name and a comma‑separated list of their assigned
 * assets (inventoryId and itemName).
 */
function buildMembersList() {
  const table = document.getElementById('members-table');
  if (!table) return;
  table.innerHTML = '';
  // Header
  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['Team Member','Assets'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);
  // Body
  const tbody = document.createElement('tbody');
  membersData.forEach(member => {
    const tr = document.createElement('tr');
    const nameTd = document.createElement('td');
    nameTd.textContent = member.name;
    tr.appendChild(nameTd);
    const assetsTd = document.createElement('td');
    // Map each asset to "InventoryID (ItemName)" or just ItemName
    const assetsText = member.assets.map(a => `${a.inventoryId} (${a.itemName})`).join(', ');
    assetsTd.textContent = assetsText;
    tr.appendChild(assetsTd);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
}

/**
 * Show the inventory view and hide other views.  Updates navigation button
 * states accordingly.
 */
function showInventoryView() {
  // Hide other views
  document.getElementById('calendar-view').classList.remove('active');
  document.getElementById('list-view').classList.remove('active');
  document.getElementById('members-view').classList.remove('active');
  // Hide completed view if present
  const compView = document.getElementById('completed-view');
  if (compView) compView.classList.remove('active');
  // Show inventory
  document.getElementById('inventory-view').classList.add('active');
  // Update nav active states
  document.getElementById('nav-calendar').classList.remove('active');
  document.getElementById('nav-list').classList.remove('active');
  document.getElementById('nav-inventory').classList.add('active');
  document.getElementById('nav-members').classList.remove('active');
  const navComp = document.getElementById('nav-completed');
  if (navComp) navComp.classList.remove('active');
}

/**
 * Show the members view and hide other views.  Updates navigation button
 * states accordingly.
 */
function showMembersView() {
  document.getElementById('calendar-view').classList.remove('active');
  document.getElementById('list-view').classList.remove('active');
  document.getElementById('inventory-view').classList.remove('active');
  // Hide completed view if present
  const compView = document.getElementById('completed-view');
  if (compView) compView.classList.remove('active');
  document.getElementById('members-view').classList.add('active');
  document.getElementById('nav-calendar').classList.remove('active');
  document.getElementById('nav-list').classList.remove('active');
  document.getElementById('nav-inventory').classList.remove('active');
  document.getElementById('nav-members').classList.add('active');
  const navComp = document.getElementById('nav-completed');
  if (navComp) navComp.classList.remove('active');
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
    // Build tasksByDate map for the entire month, including recurring occurrences
    const tasksByDate = {};
    const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    tasksData.forEach((task, idx) => {
      // Apply periodicity filter
      if (currentFilter !== 'All' && task.periodicity !== currentFilter) return;
      const occs = generateOccurrences(task, startOfMonth, endOfMonth);
      occs.forEach(occ => {
        const key = formatDate(occ);
        if (!tasksByDate[key]) tasksByDate[key] = [];
        tasksByDate[key].push({ task, index: idx, date: occ });
      });
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
          const todayStrMonth = formatDate(new Date());
          tasksForDay.forEach(({ task, index, date: occDate }) => {
            const item = document.createElement('div');
            item.className = 'task-item';
            const occStr = formatDate(occDate);
            let status;
            if (isTaskCompleted(index, occStr)) {
              status = 'completed';
            } else if (occStr < todayStrMonth) {
              status = 'overdue';
            } else if (occStr === todayStrMonth) {
              status = 'due-today';
            } else {
              status = 'pending';
            }
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
    // Build tasksByDate for this week, including recurring occurrences
    const tasksByDate = {};
    tasksData.forEach((task, idx) => {
      if (currentFilter !== 'All' && task.periodicity !== currentFilter) return;
      const occs = generateOccurrences(task, startOfWeek, endOfWeek);
      occs.forEach(occ => {
        const key = formatDate(occ);
        if (!tasksByDate[key]) tasksByDate[key] = [];
        tasksByDate[key].push({ task, index: idx, date: occ });
      });
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
      const todayStrWeek = formatDate(new Date());
      tasksForDay.forEach(({ task, index, date: occDate }) => {
        const item = document.createElement('div');
        item.className = 'task-item';
        const occStr = formatDate(occDate);
        let status;
        if (isTaskCompleted(index, occStr)) {
          status = 'completed';
        } else if (occStr < todayStrWeek) {
          status = 'overdue';
        } else if (occStr === todayStrWeek) {
          status = 'due-today';
        } else {
          status = 'pending';
        }
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
    // Day view: display all occurrences of tasks scheduled for this date
    header.textContent = `${monthNames[currentDate.getMonth()]} ${currentDate.getDate()}, ${currentDate.getFullYear()}`;
    calDiv.appendChild(header);
    // Determine start and end of the current day
    const startOfDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate());
    const endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);
    const tasksForDay = [];
    tasksData.forEach((task, idx) => {
      // Apply periodicity filter
      if (currentFilter !== 'All' && task.periodicity !== currentFilter) return;
      // Generate occurrences within this day
      const occs = generateOccurrences(task, startOfDay, endOfDay);
      occs.forEach(occ => {
        tasksForDay.push({ task, index: idx, date: occ });
      });
    });
    if (tasksForDay.length === 0) {
      const p = document.createElement('p');
      p.textContent = 'No tasks scheduled for this day.';
      calDiv.appendChild(p);
    } else {
      const ul = document.createElement('ul');
      // Sort occurrences chronologically (though they all start at midnight)
      tasksForDay.sort((a, b) => a.date - b.date);
      const todayStr = formatDate(new Date());
      tasksForDay.forEach(({ task, index, date: occDate }) => {
        const li = document.createElement('li');
        const item = document.createElement('div');
        item.className = 'task-item';
        const occStr = formatDate(occDate);
        let status;
        if (isTaskCompleted(index, occStr)) {
          status = 'completed';
        } else if (occStr < todayStr) {
          status = 'overdue';
        } else if (occStr === todayStr) {
          status = 'due-today';
        } else {
          status = 'pending';
        }
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
let tasksData = JSON.parse(jsonStr);
// Normalize periodicity values to uppercase for consistency
tasksData.forEach((task) => {
  if (task.periodicity) {
    task.periodicity = task.periodicity.toString().toUpperCase();
  }
});

// Define the default monitoring tasks derived from the monitoring_tasks.xlsx file.
// We populate this list with 63 tasks, each with a policy name, task description,
// uppercase periodicity, calculated due date and empty completion/verification fields.
const defaultMonitoringTasks = [
  {
    "policy": "Monitoring",
    "task": "Correlated audit log reviews",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Vulnerability and threat scans",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Threat-hunting queries",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Log and anomaly reviews",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Mobile device exceptions",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Payment system logs",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Risk and POAM checks",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "User-account reconciliation",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Messaging patterns",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Card-data purge report",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Audit-log export",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Laptop dashboards review",
    "periodicity": "WEEKLY",
    "due_date": "2025-11-12",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Visitor-log review",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Payment-access reconciliation",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Mobile-asset reconciliation",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Patch report",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Social-media monitoring",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Unauthorized-software scans",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Card-statement reconciliation",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "License inventory check",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "General log reviews",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Security trend report",
    "periodicity": "MONTHLY",
    "due_date": "2025-12-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Privileged-account review",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Asset-inventory audit",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Resource-access audit",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Audit-log review",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Training metrics",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Configuration audits",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Device-inventory reconciliation",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Group-membership review",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "180-day log review",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "License reconciliation",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Payment-system tests",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Vulnerability scans (CUI)",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Backup-integrity check",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Key-register audit",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Threat Snapshot briefing",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Retention access review",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Manager access attestation",
    "periodicity": "QUARTERLY",
    "due_date": "2026-02-03",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "CUI access certification",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Privileged-role review",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Baseline image update",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Laptop-fleet compliance",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Messaging-policy audit",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "VPN & patch audit",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Mobile compliance audit",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Physical-records audit",
    "periodicity": "SEMIANNUALLY",
    "due_date": "2026-05-04",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Security training",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Laptop inventory audit",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "License compliance attestation",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Encryption key rotation",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Supplier risk assessment",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Retention governance",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Policy and system audits",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Threat intel & encryption review",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Cyber awareness training",
    "periodicity": "ANNUALLY",
    "due_date": "2026-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Password rotation",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "30-day new-hire audit",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Critical patching",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Telemetry & logs",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Backup schedule",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Card-data purge",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  },
  {
    "policy": "Monitoring",
    "task": "Break-glass review",
    "periodicity": "OTHER",
    "due_date": "2025-11-05",
    "completed_by": "",
    "verified_by": ""
  }
];

// Override the default policy tasks with the Monitoring tasks derived above.
// We assign tasksData to our defaultMonitoringTasks here so that the scheduler
// uses the new list instead of the encoded WTS tasks.  The subsequent
// localStorage override will replace tasksData with user-edited tasks if any.
tasksData = defaultMonitoringTasks;
// Override tasksData with any custom tasks stored in localStorage.
try {
  const stored = localStorage.getItem('customTasks');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      // Only use saved custom tasks if they match the Monitoring dataset.  If
      // the saved tasks come from a previous policy import (e.g., the WTS
      // default tasks), ignore them and fall back to the defaultMonitoringTasks.
      const allMonitoring = parsed.length > 0 && parsed.every(t => t.policy === 'Monitoring');
      if (allMonitoring) {
        tasksData = parsed;
        // Normalize periodicity on loaded custom tasks
        tasksData.forEach((task) => {
          if (task.periodicity) {
            task.periodicity = task.periodicity.toString().toUpperCase();
          }
        });
      } else {
        // Clear out incompatible saved tasks
        localStorage.removeItem('customTasks');
        // tasksData remains defaultMonitoringTasks
      }
    }
  }
} catch (e) {
  // ignore JSON parse/storage errors
}

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
