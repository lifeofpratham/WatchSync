const socket = io();
const video = document.getElementById("videoPlayer");
const isHostCheckbox = document.getElementById("isHost");
const msgInput = document.getElementById("msg");
const messages = document.getElementById("messages");
const seekBar = document.getElementById("seekBar");
const currentTimeDisplay = document.getElementById("currentTime");
const remainingTimeDisplay = document.getElementById("remainingTime");
const playedBar = document.querySelector(".played-bar");
const bufferedBar = document.querySelector(".buffered-bar");
// const userName = sessionStorage.getItem("userName");

let ignoreEvents = false;
let myId = "";
let newes = "";
let isfullscreen = false;

// function register() {
//   const name = document.getElementById("popupName").value.trim();
//   if (name) {
//     userName = name;
//     document.getElementById("overlay").style.display = "none";
//     socket.emit("joined", { name: `${name}` }); // replace with actual name input

//   const duration = video.duration || 0;
//  
//   }
// }

document.addEventListener("DOMContentLoaded", () => {

  console.log("Username is:", userName);

  if (userName) {
    socket.emit("joined", { name: `${userName}` });
    video.load();
  } else {
    window.location.href = `main.html`;
  }
});


socket.on('fetchId', (req) => { myId = req; });

// document.getElementById("popupName").addEventListener("keydown", function (e) {
//   if (e.key === "Enter") {
//     register();
//   }
// });

function emitControl(type) {
  if (!isHostCheckbox.checked) return;
  socket.emit("control", {
    type,
    time: video.currentTime,
    speed: video.playbackRate,
  });
}

video.addEventListener("play", () => emitControl("play"));
video.addEventListener("pause", () => emitControl("pause"));
video.addEventListener("seeked", () => emitControl("seeked"));
video.addEventListener("seeking", () => emitControl("seeking"));
video.addEventListener("ratechange", () => emitControl("ratechange"));
video.addEventListener("progress", updateBufferBar);
video.addEventListener("ended", () => {
  const icon = document.getElementById("centerPlayPause");
  icon.classList.remove("fa-pause");
  icon.classList.add("fa-play");
});


video.addEventListener("timeupdate", () => {
  const playedPercent = (video.currentTime / video.duration) * 100;
  document.querySelector(".played-bar").style.width = `${playedPercent}%`;
  seekBar.value = playedPercent;
});
seekBar.addEventListener("input", (e) => {
  const seekTo = (e.target.value / 100) * video.duration;
  video.currentTime = seekTo;

  const playedPercent = (seekTo / video.duration) * 100;
  playedBar.style.width = `${playedPercent}%`;
});
function updateBufferBar() {
  const buffered = video.buffered;
  if (buffered.length > 0) {
    const bufferedEnd = buffered.end(buffered.length - 1);
    const bufferedPercent = (bufferedEnd / video.duration) * 100;
    bufferedBar.style.width = `${bufferedPercent}%`;
  }
}
video.addEventListener("loadedmetadata", () => {
  updateBufferBar();
  const duration = video.duration || 0;
  remainingTimeDisplay.textContent = "-" + formatTime(duration);
});


socket.on("control", ({ type, time, speed }) => {
  ignoreEvents = true;
  if (Math.abs(video.currentTime - time) > 0.5) {
    video.currentTime = time;
  }
  if (type === "pause") videopause();
  if (type === "play") videoplay();
  if (type === "ratechange") video.playbackRate = speed;

  setTimeout(() => {
    ignoreEvents = false;
  }, 200);
});

socket.on("newuserSync", ({ type, time, speed }) => {
  ignoreEvents = true;
  if (Math.abs(video.currentTime - time) > 0.5) {
    video.currentTime = time;
  }
  if (type === "pause") videopause();
  if (type === "play") videoplay();
  if (type === "ratechange") video.playbackRate = speed;

  setTimeout(() => {
    ignoreEvents = false;
  }, 200);
});

socket.on("chat", (msg) => {
  if (msg == "") {
    messages.innerHTML = "";
    return;
  }
  const li = document.createElement("li");
  li.innerHTML = msg;
  messages.appendChild(li);
  messages.scrollTop = messages.scrollHeight;
});

function send() {
  const msg = msgInput.value.trim();

  if (msg && userName) {
    if (msg == "/clear") {
      socket.emit("chat", "");
      msgInput.value = "";
      socket.emit(
        "clear",
        `<span style="color:#ccc; opacity:0.4; font-style:italic;">Chat cleared by </span> <span style="color:#ccc; opacity:0.8;"><strong>${userName}</strong></span><span class="timestamp">${new Date().toLocaleTimeString()}</span>`
      );
      return;
    }
    socket.emit("chat", msg);
    msgInput.value = "";
  }
}
msgInput.addEventListener("keydown", function (e) {
  if (e.key === "Enter") {
    send();
  }
});

isHostCheckbox.addEventListener("change", () => {
  socket.emit("host-toggle", {
    isHost: isHostCheckbox.checked,
    name: userName,
  });
  if (isHostCheckbox.checked) {
    document.getElementById("videoPlayer").controls = false;
  }
});

socket.on("host-status", ({ Name }) => {
  // Agar tu current host nahi hai toh checkbox hata de
  if (Name !== myId) {
    isHostCheckbox.checked = false;
    document.getElementById("videoPlayer").controls = false;
  }
});

setInterval(() => {
  if (isHostCheckbox.checked) {
    socket.emit("newuserSync", {
      type: !video.paused ? "play" : "pause",
      time: video.currentTime,
      speed: video.playbackRate,
    });
  }
}, 80); // every 0.08 sec



function toggleCenterPlayPause() {
  const video = document.getElementById("videoPlayer");
  const icon = document.getElementById("centerPlayPause");
  showControls();

  if (video.paused) {
    video.play();
    icon.classList.remove("fa-play");
    icon.classList.add("fa-pause");
  } else {
    video.pause();
    icon.classList.remove("fa-pause");
    icon.classList.add("fa-play");
  }
}

function videoplay() {
  const icon = document.getElementById("centerPlayPause");
  video.play();
  icon.classList.remove("fa-play");
  icon.classList.add("fa-pause");
  showControls();
}

function videopause() {
  const icon = document.getElementById("centerPlayPause");
  video.pause();
  icon.classList.remove("fa-pause");
  icon.classList.add("fa-play");
  showControls();
}

function skip(button, seconds) {
  const video = document.getElementById("videoPlayer");
  video.currentTime += seconds;
  animateSeek(seconds);
  animateOnClick(button);
  showControls();
}

function setSpeed(option) {
  video.playbackRate = parseFloat(option.dataset.speed);

  const checkedOption = document.querySelector(".options .checked");
  if (checkedOption) checkedOption.classList.remove("checked");

  option.classList.add("checked");

  console.log("Speed set to:", option.dataset.speed);
}

function animateOnClick(button) {
  button.classList.remove("click-animate"); // reset if already there
  void button.offsetWidth; // force reflow
  button.classList.add("click-animate");
}



function formatTime(t) {
  const m = Math.floor((t % 3600) / 60);
  const s = Math.floor(t % 60);
  const h = Math.floor(t / 3600);

  if (h == 0) {
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  } else {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

}

video.addEventListener("timeupdate", () => {
  const current = video.currentTime;
  const duration = video.duration || 0;
  const remaining = duration - current;

  const playedPercent = (current / duration) * 100;
  seekBar.value = playedPercent;
  playedBar.style.width = `${playedPercent}%`;

  currentTimeDisplay.textContent = formatTime(current);
  remainingTimeDisplay.textContent = "-" + formatTime(remaining);
});

video.addEventListener("progress", () => {
  if (video.buffered.length > 0) {
    const bufferedEnd = video.buffered.end(video.buffered.length - 1);
    const bufferedPercent = (bufferedEnd / video.duration) * 100;
    bufferedBar.style.width = `${bufferedPercent}%`;
  }
});

seekBar.oninput = (e) => {
  const percent = e.target.value;
  const duration = video.duration;
  video.currentTime = (percent / 100) * duration;
};

function FullScreen() {


  if (!isfullscreen) {
    // viewFullScreen.innerHTML = `<svg height="100%" viewBox="0 0 36 36" width="100%"><g class="fullscreen-button-corner-2"><path d="m 14,14 -4,0 0,2 6,0 0,-6 -2,0 0,4 0,0 z" id="ytp-id-233"></path></g><g class="fullscreen-button-corner-3"><path d="m 22,14 0,-4 -2,0 0,6 6,0 0,-2 -4,0 0,0 z" id="ytp-id-234"></path></g><g class="fullscreen-button-corner-0"><path d="m 20,26 2,0 0,-4 4,0 0,-2 -6,0 0,6 0,0 z"></path></g><g class="fullscreen-button-corner-1"><path  d="m 10,22 4,0 0,4 2,0 0,-6 -6,0 0,2 0,0 z"></path></g></svg>`;
    if (document.getElementById("playerContainer").requestFullscreen) {
      document.getElementById("playerContainer").requestFullscreen();
    } else if (document.getElementById("playerContainer").mozRequestFullScreen) {
      /* Firefox */
      document.getElementById("playerContainer").mozRequestFullScreen();
    } else if (document.getElementById("playerContainer").webkitRequestFullscreen) {
      /* Chrome, Safari and Opera */
      document.getElementById("playerContainer").webkitRequestFullscreen();
    } else if (document.getElementById("playerContainer").msRequestFullscreen) {
      /* IE/Edge */
      document.getElementById("playerContainer").msRequestFullscreen();
    }
    document.getElementById("fullscreen").innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"
     width="30" height="30" fill="#fff"
     style="transform: rotate(45deg); transform-origin: center;">
  <path d="M2 34h14l-3.981 4.012L16 42l12-11-12-11-4 4 4 4H2v6zm58 0H46l3.981 4.012L46 42 34 31l12-11 4 4-4 4h14v6z"/>
</svg>`;
    ;


    isfullscreen = true;
  } else {
    if (document.exitFullscreen) {
      // viewFullScreen.innerHTML = `<svg height="100%" version="1.1" viewBox="0 0 36 36" width="100%"><g class="fullscreen-button-corner-0"><path d="m 10,16 2,0 0,-4 4,0 0,-2 L 10,10 l 0,6 0,0 z" ></path></g><g class="fullscreen-button-corner-1"><path d="m 20,10 0,2 4,0 0,4 2,0 L 26,10 l -6,0 0,0 z" id="ytp-id-8"></path></g><g class="fullscreen-button-corner-2"></use><path d="m 24,24 -4,0 0,2 L 26,26 l 0,-6 -2,0 0,4 0,0 z"></path></g><g class="fullscreen-button-corner-3"><path d="M 12,20 10,20 10,26 l 6,0 0,-2 -4,0 0,-4 0,0 z" ></path></g></svg>`;
      document.exitFullscreen();
    } else if (document.mozCancelFullScreen) {
      /* Firefox */
      document.mozCancelFullScreen();
    } else if (document.webkitExitFullscreen) {
      /* Chrome, Safari and Opera */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE/Edge */
      document.msExitFullscreen();
    }
    document.getElementById("fullscreen").innerHTML = `<svg version="1.0" width="30" viewBox="0 0 325 284.999" preserveAspectRatio="xMidYMid meet"><g transform="matrix(.1 0 0 -.1 0 285)" fill="#fff" stroke="none"><path d="M1944.001 2436.999c-3.003 -8.002 -3.998 -48.997 -2.002 -93.002l3.003 -79.001 159.998 -3.003c87.997 -1.001 165.997 -3.998 172.998 -7 7 -2.002 -107.003 -125.002 -264.998 -284.999 -152.997 -154.999 -279 -283.998 -281.002 -288.002 -1.001 -3.998 27.001 -36.998 62.998 -72.001l65 -65 284.999 284.999c191.002 191.002 286 279 289.003 269.002 3.003 -7 7 -86.001 8.002 -173.998l3.003 -159.998h179.998l3.003 342.998 2.002 341.998h-340.002c-275.002 0 -341.998 -3.003 -346.002 -13"/><path d="M1154.998 1109.999c-153.998 -153.998 -282.997 -276.003 -287.001 -271.999s-9.002 81.998 -9.997 172.003l-3.003 165.002h-179.998l-3.003 -342.998 -2.002 -341.998 341.998 2.002 342.998 3.003v179.998l-159.998 3.003c-87.997 1.001 -165.997 3.998 -172.998 7 -7 2.002 50.999 68.998 139.002 157.001 82.999 83.999 210.002 212.998 282.002 286l131.001 132.002 -63.999 65c-35.002 35.997 -67.002 65 -69.999 65s-131.001 -126.003 -284.999 -280"/></g></svg>`;

    isfullscreen = false;
  }
};

const playerContainer = document.getElementById('playerContainer');
const controls = document.getElementById('playercontrols');
let timeoutId;

function hideControls() {
  controls.classList.remove('show');
  controls.classList.add('hidden');
  playerContainer.style.cursor = "none";
  // controls.style.display = 'none'; // Or display = 'none', visibility = 'hidden'
}

function showControls() {
  controls.classList.remove('hidden');
  controls.classList.add('show');
  // controls.style.cursor = "auto";
  controls.style.display = 'block'; // Or display = 'block', visibility = 'visible'
  clearTimeout(timeoutId);
  timeoutId = setTimeout(hideControls, 3000); // Hide after 3 seconds of inactivity

}

playerContainer.addEventListener('mousemove', showControls);
playerContainer.addEventListener('mouseleave', hideControls); // Optional: hide when mouse leaves player area

// Initial hide if no activity
timeoutId = setTimeout(hideControls, 3000);



let lastTapLeft = 0;
let lastTapRight = 0;
const tapThreshold = 300; // 300ms
let backward = 0;
let forward = 0;

document.getElementById("leftScreen").addEventListener("click", function (e) {
  const now = Date.now();

  if (now - lastTapLeft < tapThreshold) {
    skipVideo(-10); // Rewind
  }
  lastTapLeft = now;
});

document.getElementById("rightScreen").addEventListener("click", function (e) {
  const now = Date.now();

  if (now - lastTapLeft < tapThreshold) {
    skipVideo(10); // Rewind
  }
  lastTapLeft = now;
});

function skipVideo(sec) {
  video.currentTime += sec;
  animateSeek(sec);
}

function animateSeek(seconds) {

  const feedback = document.getElementById("seek-feedback");
  feedback.innerText = `${seconds > 0 ? `>> ${forward += seconds}s` : `<< ${Math.abs(backward -= seconds)}s`}`;

  // Left ya right alignment based on seconds
  feedback.style.left = seconds < 0 ? '10%' : '';
  feedback.style.right = seconds > 0 ? '10%' : '';


  feedback.classList.remove("visible");

  if (seconds < 0) {
    forward = 0;
    clearSeekTimeout('backward');

  } else {
    backward = 0;
    clearSeekTimeout('forward');
  }

}


let timeoutBack = null;
let timeoutForward = null;

function clearSeekTimeout(type) {
  const feedback = document.getElementById("seek-feedback");
  if (type === 'backward') {
    clearTimeout(timeoutBack);
    timeoutBack = setTimeout(() => {

      feedback.classList.add("visible");
      backward = 0;
    }, 1000);
  } else if (type === 'forward') {
    clearTimeout(timeoutForward);
    timeoutForward = setTimeout(() => {
      feedback.classList.add("visible");

      forward = 0;
    }, 1000);
  }
}


if ('mediaSession' in navigator) {
  navigator.mediaSession.metadata = new MediaMetadata({
    title: "WatchSync", // ya kuch bhi
    artist: "",
    album: "",
    artwork: []
  });

  // Disable all default handlers
  navigator.mediaSession.setActionHandler("play", () => { });
  navigator.mediaSession.setActionHandler("pause", () => { });
  navigator.mediaSession.setActionHandler("seekbackward", () => { });
  navigator.mediaSession.setActionHandler("seekforward", () => { });
  navigator.mediaSession.setActionHandler("previoustrack", () => { });
  navigator.mediaSession.setActionHandler("nexttrack", () => { });
}



document.addEventListener('keydown', function (e) {

  if (!video) return;

  // Ignore shortcuts when typing in input or textarea
  const tag = document.activeElement.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return;

  switch (e.key.toLowerCase()) {
    case ' ':
      e.preventDefault();
      toggleCenterPlayPause();
      break;
    case 'arrowright':
      skipVideo(10);
      break;
    case 'arrowleft':
      skipVideo(-10);
      break;
    case 'f':
      FullScreen();
      break;
    case 'm':
      video.muted = !video.muted;
      break;
    case 'escape':
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      break;
    case 'c':
      e.preventDefault();
      document.querySelector('#msg')?.focus();
      break;
    case 'h':
      document.querySelector('#hostControls')?.classList.toggle('hidden');
      break;
  }
});

