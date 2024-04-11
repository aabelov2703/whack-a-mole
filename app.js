const base = document.querySelector('.base-container');
const holes = document.querySelectorAll('.hole');
const moles = document.querySelectorAll('.mole');
const mole = document.querySelector('.mole');
const gotcha = document.querySelector('.catch');
const playerName = document.getElementById('player-name');
let score = document.querySelector('.score');
let countDown = document.querySelector('#cd');
let level =  document.querySelector('#lvl');
let attemptsInfo = document.querySelector('#attms');
let total = document.querySelector('#ttl');

const gamePeriod = 30;
const attemptsPerLvl = 16;  // +1 techical
const addExtra = 3;
let scoreVal = 0;
let lastScore;              // do not save less result
let levelVal;
let totalShots = 0;
let attemptsVal = 0;
let timeCounter = 0;
let lastHole = 0;           // last active hole
let idx = 0;                // current active hole
let timerId;
let timeOutId;
let isGame = false;

const getName = () => {
  if (timeCounter != 0) return;
  document.querySelector("#player").classList.add('active');
}

const createHTML = (tagType) => document.createElement(tagType);

const removeHTML = (element) => element.remove();

const getRecords = () => {
  if (timeCounter != 0) return;
  document.querySelector('#records').classList.add('active');
  const parent = document.querySelector('#player-records');
  parent.querySelectorAll('p').forEach(item => removeHTML(item)); // cleaning the list formed last time
  const recs = [];
  let obj;
  let htmlObj;
  for (let key in localStorage ) {
    if (localStorage.getItem(key) === null || localStorage.getItem(key).indexOf("points") != 2) continue;
    obj = JSON.parse(localStorage.getItem(key));
    recs.push([key, obj.points, obj.level]);
  };
  recs.sort((y, x) => {
    if (x[1] > y[1]) return 1;
    if (x[1] === y[1]) {
      if (x[0] >= y[0]) return 1
      else return 0
    }
    return -1;
  });
  for (let i = 0; i < 5; i++) {
    htmlObj = createHTML('p');
    htmlObj.textContent = i > recs.length - 1 ? cont = '. . .' : `${recs[i][1]} points got ${recs[i][0]} on level ${recs[i][2]}`;
    parent.appendChild(htmlObj);
  }
}

const saveRecord = () => {
  let obj = JSON.parse(localStorage.getItem(playerName.value));
  if (obj != null && obj.points > scoreVal) return;
  let objRecord = {points: scoreVal, level: levelVal};
  localStorage.setItem(playerName.value, JSON.stringify(objRecord));
}

const getRules = () => document.querySelector('#rules').classList.add('active')

const closeModal = () => document.querySelectorAll('.overlay').forEach(item => item.classList.remove('active'));

const controlTimer = (addExtra = 0) => {
  timeCounter = attemptsVal === 0 ? 0 : (timeCounter + addExtra > gamePeriod ? gamePeriod : timeCounter + addExtra);
  clearInterval(timerId);
  clearTimeout(timeOutId);
  timerId = setInterval(() => {
    if (timeCounter === 0 || attemptsVal === 0) stopGame();
    countDown.textContent = `${timeCounter === 0 ? gamePeriod : timeCounter--}`;
  }, 1000);
  timeOutId = setTimeout(() => clearInterval(timerId), (timeCounter + 1) * 1000);
}

const startGame = () => {
  closeModal();
  timeCounter = gamePeriod - 1;
  scoreVal = 0;
  score.textContent = scoreVal;
  attemptsVal = attemptsPerLvl;
  levelVal = 1;
  isGame = true;
  renewStat();
  totalShots = 0;
  holes.forEach((item, idx) => {
    item.classList.remove('up');
    idx >= 3 ? item.classList.add('hide') : null; 
  });
  controlTimer();
  peep();
}

const stopGame = () => {
  playAudio("end");
  isGame = false;
  holes.forEach(item => {
    item.classList.add('up');
    item.classList.remove('hide');
  });
  saveRecord();
}

const randomHole = holes => {
  const maxNumber = levelVal === 1 ? 3 : (levelVal < 4 ? 6 : 9);
  while (idx === lastHole) idx = Math.floor(Math.random() * maxNumber);
  const hole = holes[idx];
  playAudio("up");
  lastHole = idx;
  return hole;
}

const peep = () => {
  const reduction = 1 / (1 + .1 * levelVal);
  if (timeCounter === 0) return;
  const time = Math.floor(Math.random() * 1000 * reduction + 200 * reduction);
  const hole = randomHole(holes);
  hole.classList.add('up');
  setTimeout(() => {
    hole.classList.remove('up');
    peep();
  }, time)
}

const levelUp = () => {
  levelVal++;
  attemptsVal = attemptsPerLvl + 1;
  renewStat(1);
  holes.forEach((item, idx) => {
    levelVal === 2 && idx < 6 || levelVal === 4 ? item.classList.remove('hide') : null
  })
};

const cursorUpd = (event) => {
  gotcha.style = `left:${event.x-50}px;top:${event.y-50}px;display:block;`;
  setTimeout(() => gotcha.style = 'diplay:none;', 100);
}

const attemptsUpd = () => {
  attemptsVal = attemptsVal > 0 ? --attemptsVal : 0;
  attemptsInfo.textContent = `${attemptsVal}`;

  if (levelVal === 1 && attemptsVal >= 15 /* start */) total.textContent = `${0}`
  else total.textContent = `${++totalShots}`;
};

const renewStat = (mode = 0) => {
  if (!isGame) return;
  if (mode != 0 /* comes not from levelUp*/) playAudio("miss");
  if (attemptsVal <= 1) {
    attemptsUpd();
    controlTimer();
    return;
  }
  level.textContent = `${levelVal}`;
  attemptsUpd();
}

const playAudio = (key) => {
  if (!isGame) return;
  const audio = document.querySelector(`audio[data-key="${key}"]`)
  audio.currentTime = 0;
  audio.play();
};

const keyDown = (event) => {
  event.key === 'Enter' ? startGame() : null;
  event.key === 'Escape' ? closeModal() : null;
}

function bonk (event) {
  if (!event.isTrusted || timeCounter === 0) return;
  playAudio("hit");
  cursorUpd(event);
  controlTimer(addExtra);
  scoreVal++;
  scoreVal % 5 === 0 ? levelUp() : null;
  this.parentNode.classList.remove('up');
  score.textContent = scoreVal;
  level.textContent = `${levelVal}`;
}

moles.forEach(mole => mole.addEventListener('click', bonk));
base.addEventListener('click', renewStat);
document.addEventListener('keydown', keyDown);
window.onload = () => {setTimeout(() => document.querySelector("#preload").style.display = "none", 400)};

console.log('Hi there');
console.log('Self assesment 30/30');
console.log('DOM and localStorage skills getting. LocalStorage used for players records');
console.log('Game rules based on the levels, extra time points. Each level limited by a number of attemts');
console.log('Added sounds on mouse-click events during the game');
console.log('Added saving of player results. Five highest record you can see in the Records page');
