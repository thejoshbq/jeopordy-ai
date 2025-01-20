let cl = console.log;

// === DOM Elements ===
const startingSreen = document.getElementById("starting-screen");
let mainApp = document.getElementById("app");
let problemButton = document.querySelectorAll(".prblm-btn");
let popUp = document.getElementById("question-answer");
let qCategory = document.getElementById("q-category");
let qDifficulty = document.getElementById("q-difficulty");
let problemTxt = document.getElementById("question-answer-txt");
let popUpNextBtn = document.getElementById("next-btn");

let playerPointsContainer = document.getElementById("player-points");

// === Variables ===
let players = ["Team 1", "Team 2", "Team 3", "Team 4", "Team 5", "Team 6"];
let currentPlayerIndex = 0;
let currentPlayerTurn = players[currentPlayerIndex];

let userCategoryChoice = "";
let userDifficultyChoice = "";

let winnerScore = "";
let winner = "";
let winners = [];
// === function to start game btn ===
document
  .getElementById("start-game-btn")
  .addEventListener("click", function () {
    startingSreen.style.display = "none";
    mainApp.style.display = "grid";

    populateCategoryHeaders();
  });

// function to populate category headers with category names
function populateCategoryHeaders() {
  let categoryNames = [];

  fetch("../questions/other-questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      for (let i = 0; i < 6; i++) {
        categoryNames.push(data["category-names"][`category-${i + 1}`]);
      }
      for (let i = 0; i < categoryNames.length; i++) {
        document.getElementById(
          `header-${i + 1}`
        ).innerHTML = `${categoryNames[i]}`;
      }
    })
    .catch((error) => {
      console.error("Error fetching the JSON file:", error);
    });
}

// === function for each problem button ===

problemButton.forEach((button) => {
  button.addEventListener("click", function () {
    this.style.textDecoration = "line-through";
    this.style.color = "#00000030";
    this.style.textShadow = "none";
    this.disabled = true;
    userDifficultyChoice = this.innerHTML;
    userCategoryChoice = this.parentElement.id;
    showQuestion();
  });
});

function showQuestion() {
  popUp.style.display = "block";
  qDifficulty.innerHTML = `$${userDifficultyChoice}`;

  fetch("../questions/other-questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      qCategory.innerHTML = data["category-names"][`${userCategoryChoice}`];
      problemTxt.innerHTML =
        data[userCategoryChoice][`$${userDifficultyChoice}`].question;
    })
    .catch((error) => {
      console.error("Error fetching the JSON file:", error);
    });

  popUpNextBtn.innerHTML = "See Answer";
  popUpNextBtn.replaceWith(popUpNextBtn.cloneNode(true));
  popUpNextBtn = document.getElementById("next-btn");
  popUpNextBtn.addEventListener("click", showAnswer);

  startCountdown(30);
}
function showAnswer() {
  fetch("../questions/other-questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      problemTxt.innerHTML =
        data[userCategoryChoice][`$${userDifficultyChoice}`].answer;
    })
    .catch((error) => {
      console.error("Error fetching the JSON file:", error);
    });

  popUpNextBtn.innerHTML = "Back to Game Board";
  popUpNextBtn.replaceWith(popUpNextBtn.cloneNode(true));
  popUpNextBtn = document.getElementById("next-btn");
  popUpNextBtn.addEventListener("click", function () {
    popUp.style.display = "none";
    nextPlayer();
  });
}

// ===== update next player =====

// document.getElementById(
//   "current-player"
// ).innerHTML = `Current player is: <br> <span>${currentPlayerTurn}</span>`;

// function nextPlayer() {
//   currentPlayerIndex = (currentPlayerIndex + 1) % players.length;
//   currentPlayerTurn = players[currentPlayerIndex];
//   document.getElementById(
//     "current-player"
//   ).innerHTML = `Current player is: <br> <span>${currentPlayerTurn}</span>`;
// }

function displayPlayers() {
  playerPointsContainer.innerHTML = "";

  for (let i = 0; i < players.length; i++) {
    playerPointsContainer.innerHTML += `<div class="user-points"> 
                  <div class="player-name-container">
                      <input class="player-name-input" type="text" placeholder="${players[i]}:">
                      <div class="player-name-display"></div>
                  </div>
                  <span class="user-point">0</span>
                  <button class="delete-player">×</button>
              </div>`;
  }
}
displayPlayers();

let deletePlayerBtns = document.querySelectorAll(".delete-player");

deletePlayerBtns.forEach((btn) => {
  btn.addEventListener("click", function () {
    players.pop();
    btn.parentElement.remove();
  });
});

// ===== player name =====

let playerNameInput = document.querySelectorAll(".player-name-input");
let playerNameDisplay = document.querySelectorAll(".player-name-display");

let playersArray = Array.from(playerPointsContainer.children);

playerNameInput.forEach((input) => {
  input.addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      input.nextElementSibling.innerHTML = input.value + ":";
      input.placeholder = "";

      let i = playersArray.indexOf(input.parentElement.parentElement);
      players[i] = input.value;

      document.getElementById(
        "current-player"
      ).innerHTML = `Current player is: <br> <span>${players[0]}</span>`;
      input.value = "";
    }
  });
});

// ===== update player score =====

let userPoints = document.querySelectorAll(".user-point");
function updateScore() {
  let currentPoint = Number(this.dataset.userPoint);
  currentPoint += Number(userDifficultyChoice);
  this.dataset.userPoint = currentPoint;
  this.innerHTML = currentPoint;

  let highestScore = 0;
  userPoints.forEach((p) => {
    highestScore = Math.max(highestScore, Number(p.dataset.userPoint));
  });

  userPoints.forEach((p) => {
    if (Number(p.dataset.userPoint) === highestScore) {
      p.style.color = "rgb(34, 255, 0)";
    } else {
      p.style.color = "";
    }
  });
}
userPoints.forEach((point) => {
  point.dataset.userPoint = 0;
  point.addEventListener("click", updateScore);
});

// ===== TIMER =====

function startCountdown(countdownTime) {
  // const timerElement = document.getElementById("timer");
  const timerBar = document.getElementById("timer-bar");

  const interval = setInterval(() => {
    // timerElement.classList.add("scaled");
    // setTimeout(() => {
    //   timerElement.classList.remove("scaled");
    // }, 200);

    // const minutes = Math.floor(countdownTime / 60);
    // const seconds = countdownTime % 60;

    // const formattedTime = `${String(minutes).padStart(2, "0")}:${String(
    //   seconds
    // ).padStart(2, "0")}`;
    // timerElement.textContent = formattedTime;
    timerBar.style.width = `${(countdownTime / 30) * 100}%`;

    countdownTime--;

    if (countdownTime < 0 || popUp.style.display === "none") {
      clearInterval(interval);
      // timerElement.textContent = "00:30";
      timerBar.style.width = `100%`;
    }
  }, 1000);
}

// ===== FINAL JEOPARDY =====
document
  .getElementById("final-jeopardy-btn")
  .addEventListener("click", finalJeopardy);

function finalJeopardy() {
  popUp.style.display = "block";
  qCategory.innerHTML = "FINAL JEOPARDY";
  qDifficulty.innerHTML = "";
  fetch("../questions/other-questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      problemTxt.innerHTML = data["final-jeopardy"].question;
    })
    .catch((error) => {
      console.error("Error fetching the JSON file:", error);
    });
  popUpNextBtn.innerHTML = "See Answer";
  popUpNextBtn.replaceWith(popUpNextBtn.cloneNode(true));
  popUpNextBtn = document.getElementById("next-btn");
  popUpNextBtn.addEventListener("click", showFinalAnswer);
  document.getElementById("timer").innerText = "01:00";
  startCountdown(60);

  finalUserScore();
}

function showFinalAnswer() {
  fetch("../questions/other-questions.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      problemTxt.innerHTML = data["final-jeopardy"].answer;
    })
    .catch((error) => {
      console.error("Error fetching the JSON file:", error);
    });
  popUpNextBtn.innerHTML = "Return to Game Board";
  popUpNextBtn.replaceWith(popUpNextBtn.cloneNode(true));
  popUpNextBtn = document.getElementById("next-btn");
  popUpNextBtn.addEventListener("click", function () {
    popUp.style.display = "none";

    nextPlayer();
  });
}

function finalUserScore() {
  userPoints.forEach((point) => {
    point.removeEventListener("click", updateScore);
  });

  let playerPoints = document.querySelectorAll(".user-points");
  playerPoints.forEach((container) => {
    container.innerHTML += `<div class="final-answer-status">
                                <button class="answer-right">Right</button>
                                <button class="answer-wrong">Wrong</button>
                              </div>`;
  });

  document.querySelectorAll(".user-point").forEach((point) => {
    point.addEventListener("mouseover", function () {
      this.nextElementSibling.nextElementSibling.style.opacity = "1";
    });
  });
  let rightAnswer = document.querySelectorAll(".answer-right");
  let wrongAnswer = document.querySelectorAll(".answer-wrong");

  rightAnswer.forEach((btn) => {
    btn.addEventListener("click", function () {
      playerScore =
        this.parentElement.parentElement.children[1].dataset.userPoint;
      let currentScore = playerScore;
      this.parentElement.parentElement.children[1].innerHTML = currentScore * 2;
      this.parentElement.parentElement.children[1].style.color =
        "rgb(34, 255, 0)";
      this.parentElement.parentElement.children[1].style.fontWeight = "900";
      btn.parentElement.style.display = "none";
    });
  });

  wrongAnswer.forEach((btn) => {
    btn.addEventListener("click", function () {
      this.parentElement.parentElement.children[1].innerHTML = 0;
      this.parentElement.parentElement.children[1].style.color = "red";
      this.parentElement.parentElement.children[1].style.fontWeight = "900";
      btn.parentElement.style.display = "none";
    });
  });

  let lastScore = playerPointsContainer.lastElementChild.children[3];
  lastScore.children[0].addEventListener("click", () => {
    calculateWinner();
  });
  lastScore.children[1].addEventListener("click", () => {
    calculateWinner();
  });
}

function calculateWinner() {
  let playerFinalScore = document.querySelectorAll(".user-point");
  let winnerScore = 0;
  playerFinalScore.forEach((score) => {
    let scoreNum = score.innerHTML;
    winnerScore = Math.max(winnerScore, Number(scoreNum));
  });

  playerFinalScore.forEach((score) => {
    if (Number(score.innerHTML) === winnerScore) {
      winner = score.previousElementSibling.children[1].innerHTML;
      winner = Array.from(winner);
      winner.pop();
      winner = winner.join("");

      winners.push(winner);
    }
  });

  setTimeout(showEndPage, 500);
  showEndPage();
}

function showEndPage() {
  document.getElementById("app").style.display = "none";
  document.getElementById("end-screen").style.display = "flex";
  if (winners.length > 1) {
    winners = winners.join(" and ");
    document.getElementById(
      "winner-container"
    ).innerHTML = `<h2>The Winners are:<br><span>${winners}</span></h2>`;
  } else {
    document.getElementById(
      "winner-container"
    ).innerHTML = `<h2>The Winner is:<br><span>${winner}</span></h2>`;
  }
}
