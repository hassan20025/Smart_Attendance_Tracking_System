// Update user initial
const userInitialSpan = document.getElementById("user-initial");
const userName = "sherif amr"; // Placeholder; replace with actual user name
if (userName && userName.trim()) {
  userInitialSpan.textContent = userName.trim().charAt(0).toUpperCase();
}

// --- Dynamic Chart Data Section ---

// Update attendanceData to 10 weeks if needed (for brevity, only week 1-6 shown, extend as needed)
const attendanceData = {
  63490: {
    1: { attended: 80, absent: 20, percent: 80 }, // Changed to match week 2
    2: { attended: 80, absent: 20, percent: 80 },
    3: { attended: 90, absent: 10, percent: 90 },
    4: { attended: 60, absent: 40, percent: 60 },
    5: { attended: 75, absent: 25, percent: 75 },
    6: { attended: 85, absent: 15, percent: 85 },
    7: { attended: 95, absent: 5, percent: 95 },
    8: { attended: 88, absent: 12, percent: 88 },
    9: { attended: 92, absent: 8, percent: 92 },
    10: { attended: 90, absent: 10, percent: 90 },
  },
  50710: {
    1: { attended: 65, absent: 35, percent: 65 }, // Changed to match week 2
    2: { attended: 65, absent: 35, percent: 65 },
    3: { attended: 70, absent: 30, percent: 70 },
    4: { attended: 75, absent: 25, percent: 75 },
    5: { attended: 80, absent: 20, percent: 80 },
    6: { attended: 85, absent: 15, percent: 85 },
    7: { attended: 90, absent: 10, percent: 90 },
    8: { attended: 95, absent: 5, percent: 95 },
    9: { attended: 98, absent: 2, percent: 98 },
    10: { attended: 99, absent: 1, percent: 99 },
  },
  69013: {
    1: { attended: 55, absent: 45, percent: 55 }, // Changed to match week 2
    2: { attended: 55, absent: 45, percent: 55 },
    3: { attended: 60, absent: 40, percent: 60 },
    4: { attended: 65, absent: 35, percent: 65 },
    5: { attended: 70, absent: 30, percent: 70 },
    6: { attended: 75, absent: 25, percent: 75 },
    7: { attended: 80, absent: 20, percent: 80 },
    8: { attended: 85, absent: 15, percent: 85 },
    9: { attended: 90, absent: 10, percent: 90 },
    10: { attended: 95, absent: 5, percent: 95 },
  },
};

// Helper: week durations (start and end dates)
const weekDurations = [
  null, // index 0 not used
  { start: "2025-04-01", end: "2025-04-07" }, // Week 1
  { start: "2025-04-08", end: "2025-04-14" }, // Week 2
  { start: "2025-04-15", end: "2025-04-21" }, // Week 3
  { start: "2025-04-22", end: "2025-04-28" }, // Week 4
  { start: "2025-04-29", end: "2025-05-05" }, // Week 5
  { start: "2025-05-06", end: "2025-05-12" }, // Week 6
  { start: "2025-05-13", end: "2025-05-19" }, // Week 7
  { start: "2025-05-20", end: "2025-05-26" }, // Week 8
  { start: "2025-05-27", end: "2025-06-02" }, // Week 9
  { start: "2025-06-03", end: "2025-06-09" }, // Week 10
];

// Helper to get week duration
function getWeekDuration(weekIdx) {
  if (weekDurations[weekIdx]) {
    return weekDurations[weekIdx];
  }
  return null;
}

function getSelectedCrnAndWeek() {
  const crnSelect = document.getElementById("crnSelect");
  const weekSelect = document.getElementById("weekSelect");
  let crn =
    crnSelect && crnSelect.value && crnSelect.value !== "Select CRN"
      ? crnSelect.value
      : "63490";
  let weekIdx =
    weekSelect && weekSelect.selectedIndex > 0 ? weekSelect.selectedIndex : 1;
  // Handle "final" and "Week 10"
  if (weekSelect && weekSelect.value === "final") weekIdx = 10;
  return { crn, weekIdx };
}

let pieChart;
function updatePieChart() {
  const ctxPie = document.getElementById("pieChart").getContext("2d");
  const { crn, weekIdx } = getSelectedCrnAndWeek();
  const data = (attendanceData[crn] && attendanceData[crn][weekIdx]) || {
    attended: 0,
    absent: 0,
  };
  const pieData = [data.attended, data.absent];

  if (pieChart) pieChart.destroy();
  pieChart = new Chart(ctxPie, {
    type: "pie",
    data: {
      labels: ["Attended", "Absent"],
      datasets: [
        {
          data: pieData,
          backgroundColor: ["#bcdcff", "#7fa8d6"],
        },
      ],
    },
    options: {
      plugins: {
        legend: { display: false },
      },
    },
  });
}

let lineChart;
function updateLineChart() {
  const ctxLine = document.getElementById("lineChart").getContext("2d");
  const { crn, weekIdx } = getSelectedCrnAndWeek();
  const weekLabels = [
    "Week 1",
    "Week 2",
    "Week 3",
    "Week 4",
    "Week 5",
    "Week 6",
    "Week 7",
    "Week 8",
    "Final",
  ];
  const weekData = [];
  for (let i = 1; i <= 9; i++) {
    weekData.push(
      attendanceData[crn] && attendanceData[crn][i]
        ? attendanceData[crn][i].percent
        : 0
    );
  }
  const gradient = ctxLine.createLinearGradient(0, 0, 0, 320);
  gradient.addColorStop(0, "#bcdcff");
  gradient.addColorStop(1, "#fff");

  const pointBackgroundColors = weekData.map((v, i) =>
    i === weekIdx - 1 ? "#007bff" : "#7fa8d6"
  );
  const pointRadius = weekData.map((v, i) => (i === weekIdx - 1 ? 8 : 5));

  if (lineChart) lineChart.destroy();
  lineChart = new Chart(ctxLine, {
    type: "line",
    data: {
      labels: weekLabels,
      datasets: [
        {
          label: "Attendance (%)",
          data: weekData,
          borderColor: "#007bff",
          backgroundColor: gradient,
          tension: 0.4,
          fill: true,
          pointBackgroundColor: pointBackgroundColors,
          pointBorderColor: "#fff",
          pointRadius: pointRadius,
          pointHoverRadius: 10,
          pointHoverBackgroundColor: "#28a745",
          borderWidth: 3,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: true,
          callbacks: {
            label: function (context) {
              return ` ${context.parsed.y}%`;
            },
          },
        },
      },
      scales: {
        x: {
          title: {
            display: true,
            text: "Weeks",
            color: "#888",
            font: { weight: 500 },
          },
          grid: { color: "#f0f4fa" },
          ticks: {
            color: "#555",
            font: { size: 12 },
          },
        },
        y: {
          beginAtZero: true,
          max: 100,
          ticks: {
            callback: function (value) {
              return value + "%";
            },
            color: "#555",
            font: { size: 12 },
          },
          grid: { color: "#f0f4fa" },
        },
      },
    },
  });
}

// --- Update charts and week label on selection change ---
document.addEventListener("DOMContentLoaded", function () {
  // Timer and unlock logic for week selection
  document.addEventListener("DOMContentLoaded", function () {
    const weekSelect = document.getElementById("weekSelect");
    let currentWeek = 6; // Simulate we are in week 6

    function updateWeekSelectOptions() {
      if (!weekSelect) return;
      for (let i = 1; i < weekSelect.options.length; i++) {
        const opt = weekSelect.options[i];
        if (opt.value === "final") {
          // Only enable "final" if currentWeek is 10
          opt.disabled = currentWeek < 10;
        } else {
          // Enable weeks up to and including currentWeek
          opt.disabled = i > currentWeek;
        }
      }
    }

    updateWeekSelectOptions();

    weekSelect.addEventListener("change", function () {
      let selectedIdx = weekSelect.selectedIndex;
      let isFinal = weekSelect.value === "final";
      if (
        (!isFinal && selectedIdx > currentWeek) ||
        (isFinal && currentWeek < 10)
      ) {
        alert("You cannot select this week before ending the previous week.");
        weekSelect.selectedIndex = currentWeek;
        return;
      }
      // Update week label on change
      const weekLabel = document.getElementById("selected-week-label");
      let weekText = weekSelect.options[weekSelect.selectedIndex].text;
      // Only update if a valid week is selected
      if (weekSelect.selectedIndex > 0) {
        weekLabel.textContent = weekText;
        // Update line chart highlight
        let idx = weekSelect.selectedIndex;
        if (weekText.toLowerCase().includes("final")) idx = 9;
        createLineChart(idx);
      }
      updatePieChart();
      updateLineChart();
    });
  });

  // Update Bonus & Warning Attendance Report header based on selected course and CRN
  document.addEventListener("DOMContentLoaded", function () {
    // Course and CRN select elements
    const courseSelect = document.querySelector('select[aria-label="Course"]');
    const crnSelect = document.getElementById("crnSelect");
    const selectedCourseLabel = document.getElementById(
      "selected-course-label"
    );
    const selectedCrnLabel = document.getElementById("selected-crn-label");

    // Map course value to course name (adjust as needed)
    const courseMap = {
      1: "CSE599",
      2: "CSE598",
    };

    // Set initial values
    function updateBonusWarningHeader() {
      if (selectedCourseLabel && courseSelect) {
        const courseValue = courseSelect.value;
        selectedCourseLabel.textContent = courseMap[courseValue] || "Course";
      }
      if (selectedCrnLabel && crnSelect) {
        selectedCrnLabel.textContent = crnSelect.value || "CRN";
      }
    }

    // Update on course select change
    if (courseSelect) {
      courseSelect.addEventListener("change", function () {
        updateBonusWarningHeader();
      });
    }
    // Update on CRN select change
    if (crnSelect) {
      crnSelect.addEventListener("change", function () {
        updateBonusWarningHeader();
      });
    }

    // Set initial values on load
    updateBonusWarningHeader();
  });

  // Set initial week selection to placeholder ("Week")
  const weekSelect = document.getElementById("weekSelect");
  const weekLabel = document.getElementById("selected-week-label");
  if (weekSelect) {
    weekSelect.selectedIndex = 0; // Set to "Week" placeholder
    if (weekLabel) weekLabel.textContent = "Week";
  }

  // --- Clear charts if no week is selected ---
  function clearCharts() {
    if (typeof pieChart !== "undefined" && pieChart) {
      pieChart.destroy();
      pieChart = null;
    }
    if (typeof lineChart !== "undefined" && lineChart) {
      lineChart.destroy();
      lineChart = null;
    }
  }

  // --- Update charts and week label when week or CRN changes ---
  const crnSelect = document.getElementById("crnSelect");
  function updateChartsAndLabel() {
    if (weekLabel && weekSelect) {
      // Only update charts if both a week and a CRN are selected (not placeholder)
      if (
        weekSelect.selectedIndex > 0 &&
        crnSelect &&
        crnSelect.value &&
        crnSelect.value !== "Select CRN"
      ) {
        let weekText = weekSelect.options[weekSelect.selectedIndex].text;
        weekLabel.textContent = weekText;
        updatePieChart();
        updateLineChart();
      } else {
        weekLabel.textContent = "Week";
        clearCharts();
      }
    }
  }
  if (weekSelect) {
    weekSelect.addEventListener("change", updateChartsAndLabel);
  }
  if (crnSelect) {
    crnSelect.addEventListener("change", updateChartsAndLabel);
  }
}); // <-- Add this closing brace to end the main DOMContentLoaded listener
