const getCurrTime = () => {
  let currentDate = new Date();
  let currentHour = currentDate.getHours();
  if (currentHour >= 10 && currentHour < 19) {
    return true;
  } else {
    return false;
  }
};

const checkBoxInstance = document.getElementById("activation-checkbox");
if (getCurrTime()) {
  checkBoxInstance.disabled = true;
  checkBoxInstance.checked = true;
  document.getElementById("log-out").disabled = true;
  document.getElementById("log-out").style.backgroundColor = "lightGrey";
  localStorage.setItem("activationValue", true);
}
const value = localStorage.getItem("activationValue");
checkBoxInstance.checked = value === "true";

document
  .getElementById("activation-checkbox")
  .addEventListener("change", () => {
    const checkboxValue = document.getElementById(
      "activation-checkbox"
    ).checked;

    localStorage.setItem("activationValue", checkboxValue);
  });

// });

chrome.storage.local.get("agent_id", function (result) {
  let agentId = JSON.parse(localStorage.getItem("agentId"));
  // alert(agentId);
  if (agentId) {
    // chrome.storage.local.clear(function () {
    document.querySelector(".mainContent").style.display = "block";
    document.querySelector(".signInContainer").style.display = "none";
    document.querySelector(".details-tab").style.display = "block";
    document.querySelector("#prod-hours-container").style.display = "block";
    // });
  } else {
    // chrome.storage.local.clear(function () {
    document.querySelector(".mainContent").style.display = "none";
    document.querySelector(".signInContainer").style.display = "block";
    document.querySelector(".details-tab").style.display = "none";
    document.querySelector("#prod-hours-container").style.display = "none";
    // });
  }
});

document.getElementById("signin-btn").addEventListener("click", () => {
  chrome.storage.local.clear(function () {
    login();
  });
});

function login() {
  fetch("http://node.kapture.cx/kap-track/agent-login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      agent_id: $("#agentid").val(),
      agent_name: $("#agentname").val(),
    }),
  })
    .then((response) => {
      localStorage.setItem("agentId", $("#agentid").val());
      localStorage.setItem("agentName", $("#agentname").val());

      document.querySelector(".details-tab").style.display = "block";
      document.querySelector("#prod-hours-container").style.display = "block";
      document.querySelector(".mainContent").style.display = "block";
      document.querySelector(".signInContainer").style.display = "none";

      document.getElementById("activation-checkbox").checked = true;
      localStorage.setItem("activationValue", true);
    })
    .catch((error) => {
      console.error("There was a problem", error);
    });
}

document.getElementById("log-out").addEventListener("click", () => {
  chrome.storage.local.clear(function () {
    localStorage.removeItem("agentId");
    localStorage.removeItem("agentName");
    document.querySelector(".mainContent").style.display = "none";
    document.querySelector(".signInContainer").style.display = "block";
    document.querySelector(".details-tab").style.display = "none";
    document.querySelector("#prod-hours-container").style.display = "none";
    localStorage.setItem("activationValue", false);
    chrome.browserAction.setBadgeText({ text: "" });
  });
});

function getDateString(nDate) {
  let nDateDate = nDate.getDate();
  let nDateMonth = nDate.getMonth() + 1;
  let nDateYear = nDate.getFullYear();
  if (nDateDate < 10) {
    nDateDate = "0" + nDateDate;
  }
  if (nDateMonth < 10) {
    nDateMonth = "0" + nDateMonth;
  }
  let presentDate = "" + nDateYear + "-" + nDateMonth + "-" + nDateDate;
  return presentDate;
}
function getDomain(tablink) {
  let url = tablink[0].url;
  return url.split("/")[2];
}

// Hours calculation: 3661 / 3600 = 1 hour
// Remaining seconds after extracting hours: 3661 % 3600 =  61 seconds   // 61 seconds left after 3600 seconds become 1 hour
// Minutes calculation: 61 / 60 = 1 minute
// Remaining seconds after extracting minutes:61 % 60 =  1 second // 1 second left after 3600 seconds become 1 hour and 60 second becomes 1 minute
// Constructed time string: "1 hrs 1 min 1 sec"

function secondsToString(seconds, compressed = false) {
  let hours = parseInt(seconds / 3600); // 3661/3600 =  1 hour
  seconds = seconds % 3600; // 3661 % 3600 = 61 seconds remaining
  let minutes = parseInt(seconds / 60); // 61/60 =  1 minute
  seconds = seconds % 60; // 61 % 60 = 1 sec remaining
  let timeString = "";
  if (hours) {
    timeString += hours + " hrs ";
  }
  if (minutes) {
    timeString += minutes + " min ";
  }
  if (seconds) {
    timeString += seconds + " sec ";
  }

  if (!compressed) {
    return timeString;
  } else {
    if (hours) {
      return `${hours}h`;
    }
    if (minutes) {
      return `${minutes}m`;
    }
    if (seconds) {
      return `${seconds}s`;
    }
  }
}

// variables declaration
let allKeys,
  timeSpent,
  totalTimeSpent,
  sortedTimeList,
  topCount,
  topDataSet,
  topLabels,
  dateChart;
// variables declaration

// chart color
let color = [
  "#b91d47",
  "#00aba9",
  "#2b5797",
  "#e8c3b9",
  "#1e7145",
  "#ffa500",
  "#4169e1",
  "#ff69b4",
  "#ffd700",
  "#8a2be2",
];
// chart color

document.getElementById("signin-btn").addEventListener("click", function () {
  document.querySelector(".mainContent").style.display = "block";
  document.querySelector(".signInContainer").style.display = "none";
});

document.getElementById("detailBtn").addEventListener("click", function () {
  setTimeout(() => {
    window.scrollTo({ top: 1000, behavior: "smooth" });
  }, 200);
});

document.getElementById("detailBtn2").addEventListener("click", function () {
  setTimeout(() => {
    window.scrollTo({ top: 1000, behavior: "smooth" });
  }, 200);
});

totalTimeSpent = 0; // to get the total time
let today = getDateString(new Date());
chrome.storage.local.get(today, function (storedItems) {
  allKeys = Object.keys(storedItems[today]); // storing all domains for todays date
  timeSpent = []; // store all time unsorted
  sortedTimeList = []; // to store domain and time in array inside an array
  for (let i = 0; i < allKeys.length; i++) {
    let webURL = allKeys[i];
    timeSpent.push(storedItems[today][webURL]);
    totalTimeSpent += storedItems[today][webURL];
    sortedTimeList.push([webURL, storedItems[today][webURL]]);
  }
  sortedTimeList.sort((a, b) => b[1] - a[1]);
  console.log(sortedTimeList);

  topCount = allKeys.length > 10 ? 10 : allKeys.length;
  console.log(topCount);

  document.getElementById("totalTimeToday").innerText =
    secondsToString(totalTimeSpent);
  topDataSet = []; // to store top timings (for graph)
  topLabels = []; // to store top domains (for graph)
  for (let j = 0; j < topCount; j++) {
    topDataSet.push(sortedTimeList[j][1]);
    topLabels.push(sortedTimeList[j][0]);
  }

  //  displaying content for first table tab
  const webTable = document.getElementById("webList");
  for (let i = 0; i < allKeys.length; i++) {
    let webURL = sortedTimeList[i][0];
    let row = document.createElement("tr");
    let serialNumber = document.createElement("td");
    serialNumber.innerText = i + 1;
    let siteURL = document.createElement("td");
    siteURL.innerText = webURL;
    let siteTime = document.createElement("td");
    siteTime.innerText = secondsToString(sortedTimeList[i][1]);
    row.appendChild(serialNumber);
    row.appendChild(siteURL);
    row.appendChild(siteTime);
    webTable.appendChild(row);
    console.log(row);
  }
  //  displaying content for first table tab

  // displaying first page chart
  new Chart(document.getElementById("pie-chart"), {
    type: "pie",
    data: {
      labels: topLabels,
      datasets: [
        {
          label: "Time Spent",
          backgroundColor: color,
          data: topDataSet,
        },
      ],
    },
    options: {
      title: {
        display: true,
        text: "Top Visited Sites Today",
      },
      legend: {
        display: true,
      },
      circumference: 2 * Math.PI,
      rotation: 2 * Math.PI,
    },
  });
  // displaying first page chart
});

chrome.storage.local.get(null, function (items) {
  let datesStored = Object.keys(items); // getting all dates in key
  datesStored.sort(); // sorting based on date
  const calendar = document.getElementById("dateValue");
  let minDate = datesStored[0]; // first date
  let maxDate = datesStored[datesStored.length - 1]; // last date
  calendar.min = minDate; // provding first date to date input
  calendar.max = maxDate; // provding second date to date input
});

chrome.storage.local.get(null, function (items) {
  const today = getDateString(new Date());
  const todayData = items[today];
  let totalProductiveHours = 0;
  Object.keys(todayData).forEach((item) => {
    if (item.includes("kapturecrm")) {
      totalProductiveHours += todayData[item];
    }
  });
  // alert(JSON.stringify(todayData));
  document.getElementById("productive-hours").innerText =
    secondsToString(totalProductiveHours);
});

document.getElementById("dateSubmit").addEventListener("click", function () {
  const calendar = document.getElementById("dateValue");
  if (calendar.value === "") {
    document.getElementById("tryAgain").innerText =
      "Invalid date! Please try again.";
    document.getElementById("tryAgain").classList.remove("d-none");
  } else {
    document.getElementById("tryAgain").classList.add("d-none");
    let givenDate = calendar.value;
    chrome.storage.local.get(givenDate, function (thatDay) {
      if (thatDay[givenDate] == null) {
        document.getElementById("tryAgain").innerText =
          "No records exist for this day!";
        document.getElementById("tryAgain").classList.remove("d-none");
      } else {
        let sites = Object.keys(thatDay[givenDate]);
        let times = [];
        for (let i = 0; i < sites.length; i++) {
          times.push([sites[i], thatDay[givenDate][sites[i]]]);
        }
        times.sort(function (a, b) {
          return b[1] - a[1];
        });
        let topTen = times.length > 10 ? 10 : times.length;
        let dataSet = [];
        let thatDayTotal = 0;
        let dataSetLabels = [];
        for (let i = 0; i < topTen; i++) {
          dataSet.push(times[i][1]);
          dataSetLabels.push(times[i][0]);
          thatDayTotal += times[i][1];
        }
        let chartTitle = "Top Visited Sites on " + givenDate;
        if (dateChart) {
          dateChart.destroy();
        }

        // graph on 2nd page
        dateChart = new Chart(document.getElementById("differentDayChart"), {
          type: "doughnut",
          data: {
            labels: dataSetLabels,
            datasets: [
              {
                label: "Time Spent",
                backgroundColor: color,
                data: dataSet,
              },
            ],
          },
          options: {
            title: {
              display: true,
              text: chartTitle,
            },
            legend: {
              display: true,
            },
            circumference: Math.PI,
            rotation: Math.PI,
          },
        });
        // graph on 2nd page

        // second page table
        document.getElementById("statsRow").classList.remove("d-none");
        document.getElementById("totalTimeThatDay").innerText =
          secondsToString(thatDayTotal);
        const webList2 = document.getElementById("webList2");
        while (webList2.firstChild) {
          webList2.removeChild(webList2.lastChild);
        }
        for (let i = 0; i < times.length; i++) {
          let row = document.createElement("tr");
          let col1 = document.createElement("td");
          col1.innerText = i + 1;
          row.appendChild(col1);
          let col2 = document.createElement("td");
          col2.innerText = times[i][0];
          row.appendChild(col2);
          let col3 = document.createElement("td");
          col3.innerText = secondsToString(times[i][1]);
          row.appendChild(col3);
          webList2.appendChild(row);
        }
      }
    });
    // second page table
  }
});

function getDateTotalTime(storedObject, date) {
  let websiteLinks = Object.keys(storedObject[date]); // website link for particular date in array
  let noOfWebsites = websiteLinks.length;
  let totalTime = 0;
  for (let i = 0; i < noOfWebsites; i++) {
    totalTime += storedObject[date][websiteLinks[i]]; // summing up total seconds for all domains for a particular website
  }
  return totalTime;
}
let monthNames = [
  "",
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
document.getElementById("weekTab").addEventListener("click", function () {
  chrome.storage.local.get(null, function (storedItems) {
    let datesList = Object.keys(storedItems); // storing all dates in array ["2024-04-04","2024-04-05"]
    let noOfDays = datesList.length >= 7 ? 7 : datesList.length;
    let timeEachDay = [];
    let dateLabels = [];
    let weeksTotalTime = 0;
    datesList.sort();
    for (let i = datesList.length - noOfDays; i < datesList.length; i++) {
      let month = parseInt(datesList[i][5] + datesList[i][6]); // extracting month (0 + 4)
      let label = datesList[i][8] + datesList[i][9] + " " + monthNames[month]; // joining date (0 + 4 + apr)
      //0123-56-89
      dateLabels.push(label);
      let dayTime = getDateTotalTime(storedItems, datesList[i]);
      timeEachDay.push(dayTime);
      weeksTotalTime += dayTime;
    }

    // week avg + day average
    let weeklyAverage = parseInt(weeksTotalTime / noOfDays);
    weeklyAverage = secondsToString(weeklyAverage);
    let weeklyMax = Math.max.apply(Math, timeEachDay);
    weeklyMax = secondsToString(weeklyMax);
    document.getElementById("weekAvg").innerText = weeklyAverage;
    document.getElementById("weekMax").innerText = weeklyMax;
    // week avg + day average

    // third page graph
    const weeklyChart = document.getElementById("pastWeek");
    let weeklyChartDetails = {};
    weeklyChartDetails["type"] = "line";
    let dataObj = {};
    dataObj["labels"] = dateLabels;
    dataObj["datasets"] = [
      {
        label: "Time Spent",
        fill: true,
        backgroundColor: "rgba(75,192,192,0.4)",
        lineTension: 0.2,
        borderColor: "rgba(75,192,192,0.8)",
        pointBackgroundColor: "rgba(75,192,192,1)",
        data: timeEachDay,
      },
    ];
    weeklyChartDetails["data"] = dataObj;
    weeklyChartDetails["options"] = {
      legend: { display: false },
      title: { display: true, text: "Time Spent Online in the Recent Past" },
      scales: {
        yAxes: [
          { scaleLabel: { display: true, labelString: "Time in Seconds" } },
        ],
      },
    };
    new Chart(weeklyChart, weeklyChartDetails);
  });
  // third page graph
});