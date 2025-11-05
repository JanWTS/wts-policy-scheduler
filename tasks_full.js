/*
 * Policy Scheduler – task and calendar logic
 *
 * This script defines a global `tasksData` array containing the periodic tasks
 * extracted from the WTS Information Security Policy. It also builds a
 * calendar using FullCalendar to visualize when each task is due, and
 * constructs an editable table where users can record who completed and
 * verified each task. Entries are stored locally in the browser via
 * localStorage.
 */

// Parsed task definitions (policy, task description, periodicity, due date).
// Do not edit manually unless you are updating the source policy; this
// array is generated automatically from the policy document.
const tasksData = [{"policy": "Access Control Policy", "task": "Role assignments are revalidated quarterly.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "Visitor logs are reviewed monthly by the CISO and retained per the", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "Quarterly review of all privileged accounts", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "Semi-annual review of user access to CUI repositories", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "Annual review of all access groups and administrative roles", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "and collaboration resources necessary for daily work. Standard users", "periodicity": "daily", "due_date": "2025-11-06", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "twice annually to confirm compliance with the principle of least", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Access Control Policy", "task": "Spreadsheet and discussed in quarterly risk meetings.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Asset Management Policy", "task": "Inventory is reviewed quarterly by the IT Asset and Configuration", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Asset Management Policy", "task": "offboarding, and quarterly audits.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "2. Policy", "task": "quarterly and after significant changes or security incidents. The", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "2. Policy", "task": "weekly) and upon high-severity alerts; record findings and actions", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "access and on an ongoing basis thereafter (e.g., at least annually and", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "onboarding windows, upon role changes, and at least annually thereafter.", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "NKO) as the baseline annual awareness module for all personnel with DoD", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "Annual refresher: Complete assigned modules every 12 months (including", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "and will report results at least quarterly to leadership.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "Training content shall be reviewed at least annually and after major", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Awareness & Training Policy", "task": "checklists; annual refresher scheduling; phishing simulation cadence and", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Configuration Management Policy", "task": "Quarterly configuration audits will be conducted by the IT Asset and", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Configuration Management Policy", "task": "Scheduled cadence (quarterly).", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Reconcile inventory quarterly via network discovery scans and", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Review and update baseline images at least semiannually through the", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Perform vulnerability scans weekly; generate remediation tickets", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Schedule quick scans at every login and full scans weekly.", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Use your standard user account for daily work. Never borrow someone", "periodicity": "daily", "due_date": "2025-11-06", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Review all local and domain group memberships quarterly; disable", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Run daily correlation rules and weekly threat hunting queries;", "periodicity": "daily", "due_date": "2025-11-06", "completed_by": "", "verified_by": ""}, {"policy": "Desktop Computer Security Policy", "task": "Document all approved exceptions and review them quarterly.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Email Usage Policy", "task": "these policies during onboarding and as part of the annual", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Email Usage Policy", "task": "Security team will review logs weekly and investigate anomalies", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Incident Response Policy", "task": "Physical tamper seal broken on desktop / server   Quarterly inspection reveals broken seal, missing screw, tool marks   SEV3       Hardware quarantined within 4 hours                        Inspect for hardware implants; capture photographs for chain of custody.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Internet Usage Policy", "task": "Logs are retained for 180 days and reviewed quarterly for anomalies.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Internet Usage Policy", "task": "Compliance Officer      Audit adherence, coordinate with contracts/legal, update policy annually.", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Laptop Security Policy", "task": "3.  Annual Audit – Each October, Line Managers confirm physical", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Laptop Security Policy", "task": "Medium/Low          30 days    Monthly patch report", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "Laptop Security Policy", "task": "Standard accounts for daily work.", "periodicity": "daily", "due_date": "2025-11-06", "completed_by": "", "verified_by": ""}, {"policy": "Laptop Security Policy", "task": "Compliance audits 15 % of laptop fleet semiannually.", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "Laptop Security Policy", "task": "Managers                            Ensure team laptops are secured and audited annually.", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Licensing Compliance Policy", "task": "exceed licensed entitlements; quarterly reviews correct", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Licensing Compliance Policy", "task": "Quarterly Reconciliation – The IT Asset and Configuration Manager", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Licensing Compliance Policy", "task": "Periodic Compliance Review – Quarterly (or more often if risk", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Licensing Compliance Policy", "task": "2.  Third party hosted applications that process WTS data require annual", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Licensing Compliance Policy", "task": "Director of Operations    Maintain LI, perform quarterly reconciliations, manage renewals. Procure licenses, negotiate contracts, track spend. Approve software requests, validate continued need, and budget renewals.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "retire). Reconcile records monthly against carrier invoices and", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Perform quarterly spot checks; devices not physically verified", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Retain mobile logs for at least 180 days. WTS ISSO reviews weekly and generates a retention audit report weekly.", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "generate a retention audit report weekly.", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Review of payment systems weekly and file findings.", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Weekly reconciliation between the HR roster and AD disables orphaned accounts.", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Weekly reconciliation between the HR roster and AD disables orphaned accounts.", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Weekly by the security/IT team", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "Monitor logs monthly for anomalies; Marketing reconciles monthly.", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "Mobile Device Policy", "task": "IT Security reviews logs monthly for anomalies; Marketing reconciles monthly.", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "Physical Security Policy", "task": "Quarterly Reconciliation – The IT Asset and Configuration Manager performs quarterly reconciliations of assets.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Record Retention Policy", "task": "Annual third-party audit or report reviewed by Compliance.", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Record Retention Policy", "task": "distinct backup tiers so we can restore daily work quickly, recover from", "periodicity": "daily", "due_date": "2025-11-06", "completed_by": "", "verified_by": ""}, {"policy": "Record Retention Policy", "task": "3.  Access reviews are performed quarterly by the Compliance Officer;", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Record Retention Policy", "task": "1.  Internal Audit – Annual sampling of 10 % of record series for", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Record Retention Policy", "task": "3.  Policy Review – Compliance Officer chairs annual review; amendments", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "1.  Policy", "task": "Weekly by the security/IT team", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "1.  Policy", "task": "Monthly in compliance review sessions", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "1.  Policy", "task": "Annually during full policy and system audits", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "1.  Policy", "task": "The POAM is reviewed weekly to ensure accuracy, timeliness, and", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Social Media Policy", "task": "IT Security reviews logs monthly for anomalies; Marketing reconciles", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "Social Media Policy", "task": "Compliance Officer       Conducts quarterly audits; confirms NIST/CMMC alignment; coordinates external assessments.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Software and Copyright Policy", "task": "1.  Monthly Intune Scans detect unknown executables, browser extensions,", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "System and Information Security Policy", "task": "Accounts must be reviewed quarterly, and inactive accounts must be", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "System and Information Security Policy", "task": "Log reviews must occur monthly to detect anomalies or policy", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "System and Information Security Policy", "task": "annually, or upon significant changes to the threat landscape or", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "System and Information Security Policy", "task": "WTS will review encryption configurations at least annually to ensure", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "System and Information Security Policy", "task": "annually thereafter.", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "System and Information Security Policy", "task": "Restore procedures must be tested at least annually to verify system", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "• Weekly reconciliation between the HR roster and AD disables orphaned", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "on a quarterly basis.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "• The Security Team performs daily anomaly detection and submits monthly", "periodicity": "daily", "due_date": "2025-11-06", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "• Semi Annual Certification: System Administrator will revalidate every", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "End User                                     Observe security policies, safeguard credentials, and report incidents promptly   Participate in quarterly access attestations", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "Manager                                      Initiate and approve ARF/CAR submissions; ensure access removal at departure      Review team access quarterly", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "System Owner                                 Validate necessity of requested rights and maintain rolepermission mappings       Lead semiannual certifications", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "Network & System Administrator               Create, modify, and disable accounts; enforce MFA, vault, and password policies   Reconcile HR roster with AD weekly", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "Information System Security Officer (ISSO)   Monitor logs, manage session recordings, and investigate anomalies                Produce weekly anomaly reports", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Systems Access and Security Policy", "task": "Chief Information Security Officer (CISO)    Own this policy, approve exceptions, and chair break glass reviews                Review policy effectiveness quarterly", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Text Message (SMS) Usage Policy", "task": "subject to quarterly key management audits.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "Text Message (SMS) Usage Policy", "task": "IT Security reviews usage patterns weekly for anomalies such as", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "Text Message (SMS) Usage Policy", "task": "Compliance Officer   Perform semiannual audits; update policy; coordinate with legal on retention requirements.", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "quarterly.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "Quarterly Reviews – Managers certify group memberships; Compliance", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "Managers           Approve initial access on the Access Request Form, validate least-privilege assignments during quarterly reviews, and request removal of access when duties change.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "The CISO and ISSO conduct quarterly access reviews of:", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "This plan will be reviewed annually by the CISO or executive leadership", "periodicity": "annually", "due_date": "2026-11-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "These secondary backups are updated monthly by the IT Asset and", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "Backup jobs are checked weekly to ensure successful", "periodicity": "weekly", "due_date": "2025-11-12", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "monthly to verify critical files are properly synced.", "periodicity": "monthly", "due_date": "2025-12-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "The IT Asset and Configuration Manager performs a quarterly test", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "and rotated quarterly.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "Tabletop exercises will be conducted semi-annually to simulate", "periodicity": "semiannually", "due_date": "2026-05-05", "completed_by": "", "verified_by": ""}, {"policy": "User Identification, Authentication and Privacy Policy", "task": "Backup restore tests are logged and reviewed quarterly.", "periodicity": "quarterly", "due_date": "2026-02-05", "completed_by": "", "verified_by": ""}];

// When the DOM has loaded, build the calendar and the task table
document.addEventListener('DOMContentLoaded', function() {
  // Restore any saved status from previous sessions
  let saved = {};
  try {
    saved = JSON.parse(localStorage.getItem('taskStatus')) || {};
  } catch (e) {
    saved = {};
  }

  // Build events for the calendar
  const events = tasksData.map((task, idx) => {
    // Determine event color based on completion
    const isCompleted = saved[idx] && saved[idx].completed_by && saved[idx].completed_by.trim() !== '';
    return {
      id: String(idx),
      title: task.policy + ': ' + (task.task.length > 50 ? task.task.substring(0, 47) + '...' : task.task),
      start: task.due_date,
      backgroundColor: isCompleted ? '#4caf50' : '#3788d8',
      borderColor: isCompleted ? '#4caf50' : '#3788d8',
      extendedProps: {
        description: task.task,
        policy: task.policy,
        periodicity: task.periodicity,
        index: idx
      }
    };
  });

  // Initialize FullCalendar
  const calendarEl = document.getElementById('calendar');
  const calendar = new FullCalendar.Calendar(calendarEl, {
    initialView: 'dayGridMonth',
    height: 650,
    headerToolbar: {
      left: 'prev,next today',
      center: 'title',
      right: ''
    },
    events: events,
    eventDidMount: function(info) {
      // Create simple tooltip
      let tooltip = document.createElement('div');
      tooltip.className = 'fc-tooltip';
      tooltip.style.position = 'absolute';
      tooltip.style.zIndex = '10001';
      tooltip.style.background = 'rgba(0, 0, 0, 0.75)';
      tooltip.style.color = '#fff';
      tooltip.style.padding = '6px 10px';
      tooltip.style.borderRadius = '4px';
      tooltip.style.fontSize = '12px';
      tooltip.style.display = 'none';
      tooltip.innerHTML = '<strong>' + info.event.extendedProps.policy + '</strong><br>' + info.event.extendedProps.description;
      document.body.appendChild(tooltip);
      info.el.addEventListener('mouseenter', () => {
        tooltip.style.display = 'block';
      });
      info.el.addEventListener('mouseleave', () => {
        tooltip.style.display = 'none';
      });
      info.el.addEventListener('mousemove', (e) => {
        tooltip.style.left = e.pageX + 12 + 'px';
        tooltip.style.top = e.pageY + 12 + 'px';
      });
    }
  });
  calendar.render();

  // Build the tasks table
  const tbody = document.querySelector('#task-table tbody');
  tasksData.forEach((task, idx) => {
    const row = document.createElement('tr');
    // Index cell
    const c0 = document.createElement('td');
    c0.textContent = idx + 1;
    row.appendChild(c0);
    // Policy cell
    const c1 = document.createElement('td');
    c1.textContent = task.policy;
    row.appendChild(c1);
    // Task description
    const c2 = document.createElement('td');
    c2.textContent = task.task;
    row.appendChild(c2);
    // Periodicity
    const c3 = document.createElement('td');
    c3.textContent = task.periodicity;
    row.appendChild(c3);
    // Due date
    const c4 = document.createElement('td');
    c4.textContent = task.due_date;
    row.appendChild(c4);
    // Completed by
    const c5 = document.createElement('td');
    const inputComp = document.createElement('input');
    inputComp.type = 'text';
    inputComp.value = saved[idx] ? saved[idx].completed_by || '' : '';
    inputComp.placeholder = 'Name';
    inputComp.addEventListener('input', (e) => {
      // Save status and update event color
      const verifiedVal = saved[idx] ? saved[idx].verified_by || '' : '';
      saveStatus(idx, e.target.value, verifiedVal);
      const event = calendar.getEventById(String(idx));
      if (event) {
        const isNowComplete = e.target.value && e.target.value.trim() !== '';
        const newColor = isNowComplete ? '#4caf50' : '#3788d8';
        event.setProp('backgroundColor', newColor);
        event.setProp('borderColor', newColor);
      }
    });
    c5.appendChild(inputComp);
    row.appendChild(c5);
    // Verified by
    const c6 = document.createElement('td');
    const inputVer = document.createElement('input');
    inputVer.type = 'text';
    inputVer.value = saved[idx] ? saved[idx].verified_by || '' : '';
    inputVer.placeholder = 'Verifier';
    inputVer.addEventListener('input', (e) => {
      const completedVal = saved[idx] ? saved[idx].completed_by || '' : '';
      saveStatus(idx, completedVal, e.target.value);
    });
    c6.appendChild(inputVer);
    row.appendChild(c6);
    tbody.appendChild(row);
  });

  /**
   * Persist completion/verification data to localStorage
   *
   * @param {number} index The task index
   * @param {string} completedBy Name of person who performed the task
   * @param {string} verifiedBy Name of person verifying the task
   */
  function saveStatus(index, completedBy, verifiedBy) {
    saved[index] = { completed_by: completedBy, verified_by: verifiedBy };
    try {
      localStorage.setItem('taskStatus', JSON.stringify(saved));
    } catch (e) {
      console.error('Could not save status', e);
    }
  }
});