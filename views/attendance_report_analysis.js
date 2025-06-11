// Update user initial
const userInitialSpan = document.getElementById("user-initial");
const userName = "sherif amr"; // Placeholder; replace with actual user name
if (userName && userName.trim()) {
  userInitialSpan.textContent = userName.trim().charAt(0).toUpperCase();
}

// Pie Chart
const ctxPie = document.getElementById("pieChart").getContext("2d");
new Chart(ctxPie, {
  type: "pie",
  data: {
    labels: ["Attended", "Absent"],
    datasets: [
      {
        data: [70, 30],
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

// Enhanced Line Chart with gradient and dynamic highlight
let lineChart;
function createLineChart(selectedWeekIdx = 1) {
  const ctxLine = document.getElementById("lineChart").getContext("2d");
  // Create gradient
  const gradient = ctxLine.createLinearGradient(0, 0, 0, 320); // increased height for gradient
  gradient.addColorStop(0, "#bcdcff");
  gradient.addColorStop(1, "#fff");

  // Demo data
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
  const weekData = [50, 95, 100, 40, 70, 80, 60, 90, 85];

  // Highlight the selected week
  const pointBackgroundColors = weekData.map((v, i) =>
    i === selectedWeekIdx - 1 ? "#007bff" : "#7fa8d6"
  );
  const pointRadius = weekData.map((v, i) =>
    i === selectedWeekIdx - 1 ? 8 : 5
  );

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

// Initial chart render
createLineChart(1);

// Timer and unlock logic for week selection
// document.addEventListener('DOMContentLoaded', function () {
//     const weekSelect = document.getElementById('weekSelect');
//     let currentWeek = 1; // Start with Week 1 enabled

//     function unlockNextWeek() {
//         if (currentWeek < 9) { // 9 = final
//             const nextOption = weekSelect.options[currentWeek];
//             if (nextOption) nextOption.disabled = false;
//         }
//     }

//     weekSelect.addEventListener('change', function () {
//         // Only allow progressing to the next week if the previous is selected
//         if (parseInt(weekSelect.value) === currentWeek) {
//             // Simulate week ending after 5 seconds (replace with real timer logic)
//             setTimeout(() => {
//                 currentWeek++;
//                 unlockNextWeek();
//             }, 5000); // 5 seconds for demo
//         }
//     });

//     // Initially only Week 1 is enabled
//     for (let i = 2; i < weekSelect.options.length; i++) {
//         weekSelect.options[i].disabled = true;
//     }
// });

// Timer and unlock logic for week selection
document.addEventListener("DOMContentLoaded", function () {
  const weekSelect = document.getElementById("weekSelect");
  let currentWeek = 1; // Start with Week 1 enabled

  // Example: Set your real week end dates here (YYYY-MM-DD format)
  const weekEndDates = [
    null, // index 0 not used
    "2025-06-01", // Week 1 ends
    "2025-06-08", // Week 2 ends
    "2025-06-15", // Week 3 ends
    "2025-06-22", // Week 4 ends
    "2025-06-29", // Week 5 ends
    "2025-07-06", // Week 6 ends
    "2025-07-13", // Week 7 ends
    "2025-07-20", // Week 8 ends
    "2025-07-27", // Final
  ];

  function unlockWeeksByDate() {
    const today = new Date();
    for (let i = 1; i < weekSelect.options.length; i++) {
      if (!weekEndDates[i]) continue;
      const endDate = new Date(weekEndDates[i]);
      // Enable week if today is after or on the end date of the previous week
      if (i === 1 || today >= new Date(weekEndDates[i - 1])) {
        weekSelect.options[i].disabled = false;
        currentWeek = i;
      } else {
        weekSelect.options[i].disabled = true;
      }
    }
  }

  unlockWeeksByDate();

  // Optionally, re-check every day if the page stays open
  setInterval(unlockWeeksByDate, 60 * 60 * 1000); // every hour

  // Update week label on change
  const weekLabel = document.getElementById("selected-week-label");
  weekSelect.addEventListener("change", function () {
    if (weekSelect.options[weekSelect.selectedIndex].disabled) {
      alert("This week is not available yet.");
      weekSelect.selectedIndex = 0;
      return;
    }
    let weekText = weekSelect.options[weekSelect.selectedIndex].text;
    // Only update if a valid week is selected
    if (weekSelect.selectedIndex > 0) {
      weekLabel.textContent = weekText;
      // Update line chart highlight
      let idx = weekSelect.selectedIndex;
      if (weekText.toLowerCase().includes("final")) idx = 9;
      createLineChart(idx);
    }
  });
});

// Update Bonus & Warning Attendance Report header based on selected course and CRN
document.addEventListener("DOMContentLoaded", function () {
  // Course and CRN select elements
  const courseSelect = document.querySelector('select[aria-label="Course"]');
  const crnSelect = document.getElementById("crnSelect");
  const selectedCourseLabel = document.getElementById("selected-course-label");
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
