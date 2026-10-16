const minutesInput = document.getElementById("minutes");
const display = document.getElementById("display");
const statusEl = document.getElementById("status");
const startBtn = document.getElementById("start");
const pauseBtn = document.getElementById("pause");
const resetBtn = document.getElementById("reset");
const presetButtons = document.querySelectorAll("[data-minutes]");

let endTime = null;
let remainingMs = null;
let intervalId = null;
let alarmIntervalId = null;
let audioCtx = null;

function formatTime(totalSeconds) {
  const clamped = Math.max(0, Math.ceil(totalSeconds));
  const m = Math.floor(clamped / 60);
  const s = clamped % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function updateDisplayFromMinutesInput() {
  const minutes = Number(minutesInput.value) || 0;
  display.textContent = formatTime(minutes * 60);
}

function ensureAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

function beep(frequency = 880, durationMs = 250, delayMs = 0) {
  const ctx = ensureAudioContext();
  const startAt = ctx.currentTime + delayMs / 1000;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "square";
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.4, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationMs / 1000);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationMs / 1000 + 0.05);
}

const ALARM_FREQUENCIES = [987.77, 783.99]; // B5, G5

function playAlarm() {
  let i = 0;
  beep(ALARM_FREQUENCIES[i], 180);
  alarmIntervalId = setInterval(() => {
    i = (i + 1) % ALARM_FREQUENCIES.length;
    beep(ALARM_FREQUENCIES[i], 180);
  }, 280);
}

function stopAlarm() {
  if (alarmIntervalId) {
    clearInterval(alarmIntervalId);
    alarmIntervalId = null;
  }
}

function notify() {
  if (Notification && Notification.permission === "granted") {
    new Notification("タイマー終了", { body: "設定した時間が経過しました" });
  }
}

function setControlsState(state) {
  if (state === "idle") {
    startBtn.disabled = false;
    startBtn.textContent = "開始";
    pauseBtn.disabled = true;
    pauseBtn.textContent = "一時停止";
    resetBtn.disabled = true;
    resetBtn.textContent = "リセット";
    minutesInput.disabled = false;
  } else if (state === "running") {
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    pauseBtn.textContent = "一時停止";
    resetBtn.disabled = false;
    resetBtn.textContent = "リセット";
    minutesInput.disabled = true;
  } else if (state === "paused") {
    startBtn.disabled = false;
    startBtn.textContent = "再開";
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    resetBtn.textContent = "リセット";
    minutesInput.disabled = true;
  } else if (state === "alarming") {
    startBtn.disabled = true;
    pauseBtn.disabled = true;
    resetBtn.disabled = false;
    resetBtn.textContent = "停止";
    minutesInput.disabled = true;
  }
}

function tick() {
  const remaining = (endTime - Date.now()) / 1000;
  if (remaining <= 0) {
    clearInterval(intervalId);
    intervalId = null;
    display.textContent = "00:00";
    display.classList.add("alarm");
    statusEl.textContent = "時間になりました（停止を押すまで鳴り続けます）";
    document.title = "⏰ 終了！ | 作業タイマー";
    playAlarm();
    notify();
    setControlsState("alarming");
    endTime = null;
    remainingMs = null;
    return;
  }
  display.textContent = formatTime(remaining);
  document.title = `${formatTime(remaining)} | 作業タイマー`;
}

function start() {
  ensureAudioContext();
  if (Notification && Notification.permission === "default") {
    Notification.requestPermission();
  }
  display.classList.remove("alarm");
  statusEl.textContent = "";

  if (remainingMs == null) {
    const minutes = Number(minutesInput.value);
    if (!minutes || minutes <= 0) {
      statusEl.textContent = "1分以上の値を指定してください";
      return;
    }
    remainingMs = minutes * 60 * 1000;
  }

  endTime = Date.now() + remainingMs;
  remainingMs = null;
  intervalId = setInterval(tick, 250);
  tick();
  setControlsState("running");
}

function pause() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  if (endTime) {
    remainingMs = Math.max(0, endTime - Date.now());
    endTime = null;
  }
  statusEl.textContent = "一時停止中";
  document.title = "一時停止中 | 作業タイマー";
  setControlsState("paused");
}

function reset() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
  stopAlarm();
  endTime = null;
  remainingMs = null;
  display.classList.remove("alarm");
  statusEl.textContent = "";
  document.title = "作業タイマー | Dev Tools";
  updateDisplayFromMinutesInput();
  setControlsState("idle");
}

startBtn.addEventListener("click", start);
pauseBtn.addEventListener("click", pause);
resetBtn.addEventListener("click", reset);
minutesInput.addEventListener("input", updateDisplayFromMinutesInput);
presetButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    minutesInput.value = btn.dataset.minutes;
    updateDisplayFromMinutesInput();
  });
});

updateDisplayFromMinutesInput();
setControlsState("idle");
