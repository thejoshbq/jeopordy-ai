const setupScreen = document.getElementById("setup-screen");
const startingScreen = document.getElementById("starting-screen");
const mainApp = document.getElementById("app");
const endScreen = document.getElementById("end-screen");
const problemButtons = document.querySelectorAll(".prblm-btn");
const popUp = document.getElementById("question-answer");
const qCategory = document.getElementById("q-category");
const qDifficulty = document.getElementById("q-difficulty");
const problemTxt = document.getElementById("question-answer-txt");
const playerPointsContainer = document.getElementById("player-points");
const errorMessage = document.getElementById("error-message");
const finalJeopardyBtn = document.getElementById("final-jeopardy-btn");
const gameModeRadios = document.querySelectorAll('input[name="game-mode"]');
const teamsContainer = document.getElementById("teams-container");
const playersContainer = document.getElementById("players-container");
const generateQuestionsBtn = document.getElementById("generate-questions-btn");
const addTeamBtn = document.getElementById("add-team-btn");
const addPlayerBtn = document.getElementById("add-player-btn");

let entities = [];
let currentEntityIndex = 0;
let currentEntityTurn = null;
let userCategoryChoice = "";
let userDifficultyChoice = "";
let questionsData = null;
let gameId = Date.now().toString(); // Simple client-side game ID
let gameMode = 'team';
let answeredQuestions = 0;
const totalQuestions = 20;
let isGeneratingQuestions = false;

const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";
let apiKey = "";

// Game Mode Selection
gameModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
        gameMode = radio.value;
        teamsContainer.style.display = gameMode === 'team' ? 'block' : 'none';
        playersContainer.style.display = gameMode === 'free-for-all' ? 'block' : 'none';
        addTeamBtn.style.display = gameMode === 'team' ? 'block' : 'none';
        addPlayerBtn.style.display = gameMode === 'free-for-all' ? 'block' : 'none';
        errorMessage.style.display = 'none';
        console.log(`Game mode changed to: ${gameMode}`);
    });
});

// Dynamic Team/Player Management
let teamCount = 0;
let playerCount = 0;

addTeamBtn.addEventListener("click", () => {
    teamCount++;
    console.log(`Adding team ${teamCount}`);
    const teamDiv = document.createElement("div");
    teamDiv.className = "team-entry";
    teamDiv.innerHTML = `
        <h4>Team ${teamCount}</h4>
        <input type="text" class="team-name-input" placeholder="Team Name" required>
        <button class="add-member-btn" type="button">Add Member</button>
        <button class="remove-team-btn" type="button">Remove Team</button>
        <div class="members-container"></div>
    `;
    teamsContainer.insertBefore(teamDiv, addTeamBtn);
});

addPlayerBtn.addEventListener("click", () => {
    playerCount++;
    console.log(`Adding player ${playerCount}`);
    const playerDiv = document.createElement("div");
    playerDiv.className = "player-entry";
    playerDiv.innerHTML = `
        <input type="text" class="player-name-input" placeholder="Player ${playerCount} Name" required>
        <button class="remove-player-btn" type="button">Remove Player</button>
    `;
    playersContainer.insertBefore(playerDiv, addPlayerBtn);
});

document.addEventListener("click", (e) => {
    if (e.target.classList.contains("add-member-btn")) {
        console.log("Adding team member");
        const membersContainer = e.target.parentElement.querySelector(".members-container");
        const memberInput = document.createElement("input");
        memberInput.type = "text";
        memberInput.className = "member-name-input";
        memberInput.placeholder = "Member Name";
        memberInput.required = true;
        membersContainer.appendChild(memberInput);
    } else if (e.target.classList.contains("remove-team-btn")) {
        console.log("Removing team");
        e.target.parentElement.remove();
        teamCount--;
        document.querySelectorAll("#teams-container h4").forEach((h4, i) => {
            h4.textContent = `Team ${i + 1}`;
        });
    } else if (e.target.classList.contains("remove-player-btn")) {
        console.log("Removing player");
        e.target.parentElement.remove();
        playerCount--;
        document.querySelectorAll(".player-name-input").forEach((input, i) => {
            input.placeholder = `Player ${i + 1} Name`;
        });
    }
});

// Setup Form Submission
generateQuestionsBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    if (isGeneratingQuestions) {
        console.log("Generate questions already in progress, ignoring click");
        return;
    }
    isGeneratingQuestions = true;
    errorMessage.style.display = "none";

    // Show loading state
    generateQuestionsBtn.classList.add('pressed');
    generateQuestionsBtn.disabled = true;
    generateQuestionsBtn.innerHTML = '<span class="loading-ring"></span><img src="assets/jeopardy-logo.png" class="loading-symbol" alt="Loading"> Generating...';

    const topicsInput = document.getElementById("topics").value;
    const topics = topicsInput.split(',').map(t => t.trim()).filter(t => t);
    const tonality = document.getElementById("tonality").value;
    apiKey = document.getElementById("api-key").value.trim();

    if (!apiKey) {
        errorMessage.textContent = "Please provide a Together.ai API key.";
        errorMessage.style.display = "block";
        resetButtonState();
        return;
    }

    if (topics.length < 4) {
        errorMessage.textContent = "Please provide at least 4 topics.";
        errorMessage.style.display = "block";
        resetButtonState();
        return;
    }

    if (gameMode === 'team') {
        entities = Array.from(document.querySelectorAll("#teams-container .team-entry")).map(teamDiv => {
            const teamName = teamDiv.querySelector(".team-name-input").value.trim();
            const members = Array.from(teamDiv.querySelectorAll(".member-name-input"))
                .map(input => input.value.trim())
                .filter(name => name);
            console.log(`Team: ${teamName}, Members: ${members}`);
            return { name: teamName, members, score: 0, id: `team-${Date.now()}-${Math.random()}`, type: 'team' };
        });
        if (entities.length < 2 || entities.some(entity => !entity.name || entity.members.length === 0)) {
            errorMessage.textContent = "Please add at least 2 teams with a name and at least one member each.";
            errorMessage.style.display = "block";
            resetButtonState();
            return;
        }
    } else {
        entities = Array.from(document.querySelectorAll("#players-container .player-name-input")).map(input => {
            const playerName = input.value.trim();
            console.log(`Player: ${playerName}`);
            return { name: playerName, score: 0, id: `player-${Date.now()}-${Math.random()}`, type: 'player' };
        }).filter(entity => entity.name);
        if (entities.length < 1) {
            errorMessage.textContent = "Please add at least one player.";
            errorMessage.style.display = "block";
            resetButtonState();
            return;
        }
    }

    try {
        console.log("Generating questions with topics:", topics, "tonality:", tonality, "mode:", gameMode);
        questionsData = await generateQuestions(topics, tonality, gameMode);
        localStorage.setItem('questions', JSON.stringify(questionsData));
        localStorage.setItem('gameId', gameId);
        localStorage.setItem('gameMode', gameMode);
        localStorage.setItem('entities', JSON.stringify(entities));
        console.log("Stored questions:", questionsData);

        setupScreen.style.display = "none";
        startingScreen.style.display = "block";
    } catch (error) {
        console.error("Error generating questions:", error);
        errorMessage.textContent = `Error generating questions: ${error.message}`;
        errorMessage.style.display = "block";
    } finally {
        resetButtonState();
    }
});

function resetButtonState() {
    generateQuestionsBtn.classList.remove('pressed');
    generateQuestionsBtn.disabled = false;
    generateQuestionsBtn.innerHTML = 'Generate Questions';
    isGeneratingQuestions = false;
}

// Function to find valid JSON in the response
function findValidJson(content, expectedType = 'array') {
    console.log('Searching for valid JSON in response:', content);
    // Try common code fences first
    let jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/) || content.match(/'''(?:json)?\n([\s\S]*?)\n'''/);
    if (jsonMatch) {
        try {
            const json = JSON.parse(jsonMatch[1].trim());
            if (expectedType === 'array' && Array.isArray(json) && json.length === 4) {
                console.log('Found valid JSON in code fences:', json);
                return json;
            } else if (expectedType === 'object' && !Array.isArray(json) && typeof json === 'object') {
                console.log('Found valid JSON in code fences:', json);
                return json;
            }
        } catch (e) {
            console.error('Error parsing JSON from code fences:', e);
        }
    }

    // Search for any valid JSON object or array
    const stack = [];
    let startIndex = -1;
    for (let i = 0; i < content.length; i++) {
        if (content[i] === '{' || content[i] === '[') {
            if (stack.length === 0) startIndex = i;
            stack.push(content[i]);
        } else if (content[i] === '}' && stack[stack.length - 1] === '{') {
            stack.pop();
            if (stack.length === 0) {
                const potentialJson = content.slice(startIndex, i + 1);
                try {
                    const json = JSON.parse(potentialJson);
                    if (expectedType === 'array' && Array.isArray(json) && json.length === 4) {
                        console.log('Found valid JSON array:', json);
                        return json;
                    } else if (expectedType === 'object' && !Array.isArray(json) && typeof json === 'object') {
                        console.log('Found valid JSON object:', json);
                        return json;
                    }
                } catch (e) {
                    // Continue searching
                }
            }
        } else if (content[i] === ']' && stack[stack.length - 1] === '[') {
            stack.pop();
            if (stack.length === 0) {
                const potentialJson = content.slice(startIndex, i + 1);
                try {
                    const json = JSON.parse(potentialJson);
                    if (expectedType === 'array' && Array.isArray(json) && json.length === 4) {
                        console.log('Found valid JSON array:', json);
                        return json;
                    } else if (expectedType === 'object' && !Array.isArray(json) && typeof json === 'object') {
                        console.log('Found valid JSON object:', json);
                        return json;
                    }
                } catch (e) {
                    // Continue searching
                }
            }
        }
    }

    // Try parsing the entire content as a last resort
    try {
        const json = JSON.parse(content.trim());
        if (expectedType === 'array' && Array.isArray(json) && json.length === 4) {
            console.log('Found valid JSON in entire content:', json);
            return json;
        } else if (expectedType === 'object' && !Array.isArray(json) && typeof json === 'object') {
            console.log('Found valid JSON in entire content:', json);
            return json;
        }
    } catch (e) {
        console.error('Error parsing entire content as JSON:', e);
    }

    throw new Error('No valid JSON found in response');
}

// Together.ai API Integration
async function generateQuestions(topics, tonality, mode) {
    const prompt = `
        Generate a JSON object for a Jeopardy game with exactly 4 categories. Each category should have a unique name based on one of the provided topics: ${topics.join(', ')}. Each category must contain exactly 5 questions with point values 200, 400, 600, 800, and 1000. Each question must include:
        - "value": the point value (200, 400, 600, 800, 1000)
        - "question": the question text
        - "answer": the answer text
        The questions should be written in a ${tonality} tone and suitable for a ${mode === 'team' ? 'team-based' : 'individual'} game. Ensure questions are clear, concise, and appropriate for a general audience. Return only the JSON object, nothing else.
        Example format:
        [
            {
                "name": "Category Name",
                "questions": [
                    { "value": 200, "question": "Question text", "answer": "Answer text" },
                    ...
                ]
            },
            ...
        ]
    `;

    try {
        const response = await fetch(TOGETHER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3-8b-chat-hf",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 2048,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('Raw API response:', content);

        const questions = findValidJson(content, 'array');
        return questions;
    } catch (error) {
        throw new Error(`Failed to generate questions: ${error.message}`);
    }
}

async function generateFinalJeopardy(topics) {
    const prompt = `
        Generate a JSON object for a Final Jeopardy question. The category should be one of the provided topics: ${topics.join(', ')}. The object must include:
        - "category": the category name
        - "question": the question text
        - "answer": the answer text
        The question should be challenging, suitable for a final round, and written in a ${document.getElementById("tonality").value} tone. Return only the JSON object, nothing else.
        Example format:
        {
            "category": "Category Name",
            "question": "Question text",
            "answer": "Answer text"
        }
    `;

    try {
        const response = await fetch(TOGETHER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "meta-llama/Llama-3-8b-chat-hf",
                messages: [{ role: "user", content: prompt }],
                max_tokens: 512,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('Raw Final Jeopardy response:', content);

        const finalQuestion = findValidJson(content, 'object');
        return finalQuestion;
    } catch (error) {
        throw new Error(`Failed to generate Final Jeopardy: ${error.message}`);
    }
}

// Start Game
document.getElementById("start-game-btn").addEventListener("click", () => {
    console.log("Starting game, transitioning to main app");
    startingScreen.style.display = "none";
    mainApp.style.display = "grid";
    populateCategoryHeaders();
    displayEntities();
    currentEntityTurn = entities[currentEntityIndex]?.name || "No Entity";
    document.getElementById("current-player").innerHTML = `Current ${gameMode === 'team' ? 'team' : 'player'}: <br><span>${currentEntityTurn}</span>`;
});

// Populate Headers
function populateCategoryHeaders() {
    console.log("Populating category headers");
    questionsData = JSON.parse(localStorage.getItem("questions") || "[]");
    if (!questionsData || !Array.isArray(questionsData) || questionsData.length < 4) {
        console.error("Invalid questions data in localStorage");
        errorMessage.textContent = "Error: No valid questions data found.";
        errorMessage.style.display = "block";
        return;
    }
    questionsData.forEach((category, i) => {
        const header = document.getElementById(`header-${i + 1}`);
        if (header) {
            console.log(`Setting header-${i + 1} to: ${category.name}`);
            header.textContent = category.name || "Unknown Category";
        }
    });
}

// Question Handling
problemButtons.forEach(button => {
    button.addEventListener("click", function () {
        console.log(`Clicked button: ${this.dataset.value} in category ${this.parentElement.id}`);
        this.disabled = true;
        this.style.textDecoration = "line-through";
        this.style.color = "#00000030";
        userDifficultyChoice = this.dataset.value;
        userCategoryChoice = this.parentElement.id;
        showQuestion();
        answeredQuestions++;
        if (answeredQuestions >= totalQuestions) {
            finalJeopardyBtn.disabled = false;
        }
    });
});

function showQuestion() {
    console.log("Showing question for category:", userCategoryChoice, "difficulty:", userDifficultyChoice);
    popUp.style.display = "block";
    qDifficulty.textContent = `$${userDifficultyChoice}`;
    const categoryIndex = parseInt(userCategoryChoice.split('-')[1]) - 1;
    const category = questionsData[categoryIndex];
    qCategory.textContent = category?.name || "Unknown Category";
    const question = category?.questions.find(q => q.value === parseInt(userDifficultyChoice));
    console.log("Question data:", question);
    if (question) {
        problemTxt.textContent = question.question;
    } else {
        console.error("Question not found for value:", userDifficultyChoice);
        problemTxt.textContent = "Error: Question not found.";
    }

    const pointRecipient = document.getElementById("point-recipient");
    pointRecipient.innerHTML = '<option value="">Select Recipient</option>';
    entities.forEach((entity, index) => {
        pointRecipient.innerHTML += `<option value="${index}">${entity.name}</option>`;
    });

    const nextBtn = document.getElementById("next-btn");
    nextBtn.textContent = "See Answer";
    nextBtn.onclick = () => showAnswer(question, category?.name);
    startCountdown(30);
}

function showAnswer(question, categoryName) {
    console.log("Showing answer:", question?.answer);
    problemTxt.textContent = question?.answer || "Error: Answer not found.";
    const nextBtn = document.getElementById("next-btn");
    nextBtn.textContent = "Award Points";
    nextBtn.onclick = () => awardPoints(question, categoryName);
}

function awardPoints(question, categoryName) {
    const pointRecipient = document.getElementById("point-recipient");
    const selectedIndex = pointRecipient.value;
    console.log("Awarding points for question:", question, "to index:", selectedIndex);

    if (!question || selectedIndex === "") {
        console.error("No question or recipient selected");
        errorMessage.textContent = "Please select a recipient to award points.";
        errorMessage.style.display = "block";
        return;
    }

    // Update score
    const entity = entities[selectedIndex];
    entity.score += parseInt(userDifficultyChoice);
    console.log(`Updated score for ${entity.name}: ${entity.score}`);
    displayEntities();
    saveGame();

    popUp.style.display = "none";
    nextEntity();
}

function nextEntity() {
    currentEntityIndex = (currentEntityIndex + 1) % entities.length;
    currentEntityTurn = entities[currentEntityIndex]?.name || "No Entity";
    console.log(`Next ${gameMode === 'team' ? 'team' : 'player'}: ${currentEntityTurn}`);
    document.getElementById("current-player").innerHTML = `Current ${gameMode === 'team' ? 'team' : 'player'}: <br><span>${currentEntityTurn}</span>`;
}

function displayEntities() {
    console.log("Displaying entities:", entities);
    playerPointsContainer.innerHTML = "";
    if (!entities || entities.length === 0) {
        console.error("No entities to display");
        errorMessage.textContent = `Error: No ${gameMode === 'team' ? 'teams' : 'players'} found.`;
        errorMessage.style.display = "block";
        return;
    }
    entities.forEach((entity, index) => {
        playerPointsContainer.innerHTML += `
            <div class="user-points">
                <div class="player-name-container">${entity.name}:</div>
                <span class="user-point" data-entity-index="${index}">${entity.score}</span>
            </div>`;
    });
}

// Timer
function startCountdown(countdownTime) {
    console.log("Starting countdown:", countdownTime);
    const timerBar = document.getElementById("timer-bar");
    let timeLeft = countdownTime;
    timerBar.style.width = "100%";
    const interval = setInterval(() => {
        timeLeft -= 0.005;
        timerBar.style.width = `${(timeLeft / countdownTime) * 100}%`;
        if (timeLeft < 0 || popUp.style.display === "none") {
            clearInterval(interval);
            timerBar.style.width = "100%";
        }
    }, 5);
}

// End Screen
function showEndScreen() {
    console.log("Showing end screen");
    popUp.style.display = "none";
    mainApp.style.display = "none";
    endScreen.style.display = "block";
    const winner = entities.reduce((prev, curr) => (prev.score > curr.score ? prev : curr), entities[0]);
    document.getElementById("winner-container").innerHTML = `
        <h2>Game Over!</h2>
        <p>Winner: ${winner.name} with ${winner.score} points!</p>
        <h3>Final Scores:</h3>
        ${entities.map(entity => `<p>${entity.name}: ${entity.score}</p>`).join('')}
    `;
    document.getElementById("new-game-btn").addEventListener("click", () => {
        console.log("Starting new game");
        localStorage.clear();
        window.location.reload();
    });
}

// Save Game Data
function saveGame() {
    console.log("Saving game data:", entities);
    localStorage.setItem('entities', JSON.stringify(entities));
}