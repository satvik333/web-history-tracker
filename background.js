function isValidURL(givenURL){
  if(givenURL){
    if(givenURL.includes(".")){
      return true;
    }
    else{
      return false;
    }
  }
  else{
    return false;
  }
}
function secondsToString(seconds,compressed=false){
    let hours = parseInt(seconds/3600);
    seconds = seconds%3600;
    let minutes= parseInt(seconds/60);
    seconds = seconds%60;
    let timeString = "";
    if(hours){
      timeString += hours + " hrs ";
    }
    if(minutes){
      timeString += minutes + " min ";
    }
    if(seconds){
      timeString += seconds+ " sec ";
    }
    if(!compressed){
      return timeString;
    }
    else{
      if(hours){
        return(`${hours}h`);
      }
      if(minutes){
        return(`${minutes}m`);
      }
      if(seconds){
        return(`${seconds}s`);
      }
    }
  };

function getDateString(nDate){
  let nDateDate=nDate.getDate();
  let nDateMonth=nDate.getMonth()+1;
  let nDateYear=nDate.getFullYear();
  if(nDateDate<10){nDateDate="0"+nDateDate;};
  if(nDateMonth<10){nDateMonth="0"+nDateMonth;};
  let presentDate = nDateYear+"-"+nDateMonth+"-"+nDateDate;
  return presentDate;
}
function getDomain(tablink){
  if(tablink){
    let url =  tablink[0].url;
    return url.split("/")[2];
  }
  else{
    return null;
  }
};

function updateTime(){
    chrome.tabs.query({"active":true,"lastFocusedWindow": true},function(activeTab){
        let domain = getDomain(activeTab);
        if(isValidURL(domain)){
          let today = new Date();
        let presentDate = getDateString(today);
        let myObj = {};
        myObj[presentDate]={};
        myObj[presentDate][domain] = "";
        let timeSoFar = 0;
        chrome.storage.local.get(presentDate,function(storedObject){
            if(storedObject[presentDate]){
              if(storedObject[presentDate][domain]){
                timeSoFar = storedObject[presentDate][domain]+1;
                storedObject[presentDate][domain] = timeSoFar;
                chrome.storage.local.set(storedObject,function(){
                    console.log("Set "+domain+" at "+storedObject[presentDate][domain]);
                    storeDataInDB(presentDate, timeSoFar, domain);
                });
              }
              else{
                timeSoFar++;
                storedObject[presentDate][domain] = timeSoFar;
                chrome.storage.local.set(storedObject,function(){
                  console.log("Set "+domain+" at "+storedObject[presentDate][domain]);
                  storeDataInDB(presentDate, timeSoFar, domain);
                })
              }
            }
            else{
              timeSoFar++;
              storedObject[presentDate] = {};
              storedObject[presentDate][domain] = timeSoFar;
              chrome.storage.local.set(storedObject,function(){
                console.log("Set "+domain+" at "+storedObject[presentDate][domain]);
                storeDataInDB(presentDate, timeSoFar, domain);
              })
            }
        });
        }
    });
};

var intervalID;

intervalID = setInterval(updateTime,1000);
setInterval(checkFocus,500)

function checkFocus(){
  chrome.windows.getCurrent(function(window){
    if(window.focused){
      if(!intervalID){
        intervalID = setInterval(updateTime,1000);
      }
    }
    else{
      if(intervalID){
        clearInterval(intervalID);
        intervalID=null;
      }
    }
  });
}

async function getAgentData() {
  try {
    const [agentIdResult, agentNameResult] = await Promise.all([
      new Promise((resolve, reject) => {
        chrome.storage.local.get('agent_id', function(result) {
          resolve(result.agent_id);
        });
      }),
      new Promise((resolve, reject) => {
        chrome.storage.local.get('agent_name', function(result) {
          resolve(result.agent_name);
        });
      })
    ]);

    return { agentId: agentIdResult, agentName: agentNameResult };
  } catch (error) {
    console.error('Error retrieving agent data:', error);
    return { agentId: null, agentName: null };
  }
}

async function storeDataInDB(presentDate, timeSoFar, website) {
  try {
    const { agentId, agentName } = await getAgentData();

    const apiUrl = 'http://node.kapture.cx/kap-track/add-agent-history';
    const requestBody = {
      "agent_id": agentId,
      "agent_name": agentName,
      "website_url": website,
      "active_time": timeSoFar,
      "date": presentDate
    };

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
  } catch (error) {
    console.error('Error:', error);
  }
}
