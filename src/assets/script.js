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
let gameId = Date.now().toString();
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
    } else if (e.target.id === "toggle-api-key") {
        console.log("Toggling API key visibility");
        const apiKeyInput = document.getElementById("api-key");
        const toggleButton = e.target;
        if (apiKeyInput.type === "password") {
            apiKeyInput.type = "text";
            toggleButton.textContent = "Hide";
        } else {
            apiKeyInput.type = "password";
            toggleButton.textContent = "Show";
        }
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

// findValidJson function
function findValidJson(content, expectedType = 'array') {
    console.log('Searching for valid JSON in response:', content);

    // Helper function to attempt JSON parsing safely
    const tryParseJson = (str) => {
        try {
            const json = JSON.parse(str.trim());
            if (expectedType === 'array' && Array.isArray(json) && json.length === 4) {
                console.log('Found valid JSON array:', json);
                return json;
            } else if (expectedType === 'object' && !Array.isArray(json) && typeof json === 'object') {
                console.log('Found valid JSON object:', json);
                return json;
            }
        } catch (e) {
            console.error('JSON parse error:', e.message);
            return null;
        }
        return null;
    };

    // Try common code fences
    const codeFenceRegexes = [
        /```(?:json)?\n([\s\S]*?)\n```/,
        /'''(?:json)?\n([\s\S]*?)\n'''/,
        /```\n([\s\S]*?)\n```/, // Fallback for plain code fences
    ];
    for (const regex of codeFenceRegexes) {
        const match = content.match(regex);
        if (match) {
            const json = tryParseJson(match[1]);
            if (json) return json;
        }
    }

    // Clean up common issues (e.g., trailing commas, unclosed brackets)
    let cleanedContent = content
        .replace(/,\s*([\]}])/g, '$1') // Remove trailing commas
        .replace(/[\n\r]+/g, '') // Remove newlines
        .trim();

    // Search for valid JSON object or array
    const stack = [];
    let startIndex = -1;
    for (let i = 0; i < cleanedContent.length; i++) {
        if (cleanedContent[i] === '{' || cleanedContent[i] === '[') {
            if (stack.length === 0) startIndex = i;
            stack.push(cleanedContent[i]);
        } else if (cleanedContent[i] === '}' && stack[stack.length - 1] === '{') {
            stack.pop();
            if (stack.length === 0) {
                const potentialJson = cleanedContent.slice(startIndex, i + 1);
                const json = tryParseJson(potentialJson);
                if (json) return json;
            }
        } else if (cleanedContent[i] === ']' && stack[stack.length - 1] === '[') {
            stack.pop();
            if (stack.length === 0) {
                const potentialJson = cleanedContent.slice(startIndex, i + 1);
                const json = tryParseJson(potentialJson);
                if (json) return json;
            }
        }
    }

    // Try parsing the entire cleaned content as a last resort
    const json = tryParseJson(cleanedContent);
    if (json) return json;

    throw new Error('No valid JSON found in response');
}

// generateQuestions function
async function generateQuestions(topics, tonality, mode) {
    const prompt = `
        You are a JSON generator for a Jeopardy game. Return *only* a valid JSON array containing exactly 4 categories. Each category must be an object with:
        - "name": a unique category name based on one of these topics: ${topics.join(', ')}
        - "questions": an array of exactly 5 questions, each with:
          - "value": a point value (200, 400, 600, 800, 1000)
          - "question": the question text (clear, concise, in a ${tonality} tone)
          - "answer": the answer text
        The questions must be suitable for a ${mode === 'team' ? 'team-based' : 'individual'} game and appropriate for a general audience. Do not include any text, markdown, or code fences outside the JSON array. Ensure the JSON is complete and valid.
        Example:
        [
            {
                "name": "History",
                "questions": [
                    { "value": 200, "question": "This war lasted from 1939 to 1945.", "answer": "World War II" },
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
                max_tokens: 4096,
                temperature: 0.5
            })
        });

        if (!response.ok) {
            throw new Error(`HTTP error ${response.status}: ${await response.text()}`);
        }

        const data = await response.json();
        const content = data.choices[0].message.content;
        console.log('Raw API response:', content);

        const questions = findValidJson(content, 'array');
        if (!questions.every(cat => cat.name && Array.isArray(cat.questions) && cat.questions.length === 5)) {
            throw new Error('Invalid question structure: Each category must have a name and 5 questions.');
        }
        return questions;
    } catch (error) {
        console.error('Generate questions error:', error);
        throw new Error(`Failed to generate questions: ${error.message}`);
    }
}

// generateFinalJeopardy function
async function generateFinalJeopardy(topics) {
    const prompt = `
        You are a JSON generator for a Jeopardy game. Return *only* a valid JSON object for a Final Jeopardy question. The object must include:
        - "category": a category name based on one of these topics: ${topics.join(', ')}
        - "question": the question text (challenging, in a ${document.getElementById("tonality").value} tone)
        - "answer": the answer text
        The question must be suitable for a final round and a general audience. Do not include any text, markdown, or code fences outside the JSON object. Ensure the JSON is complete and valid.
        Example:
        {
            "category": "History",
            "question": "This leader was assassinated in 1963.",
            "answer": "John F. Kennedy"
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
                temperature: 0.5
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

// Final Jeopardy Handling with Wagering
finalJeopardyBtn.addEventListener("click", async () => {
    console.log("Final Jeopardy button clicked");
    finalJeopardyBtn.disabled = true; // Prevent multiple clicks
    mainApp.style.display = "none"; // Hide main game board
    popUp.style.display = "block"; // Show question popup

    try {
        // Step 1: Collect wagers
        qCategory.textContent = "Final Jeopardy";
        qDifficulty.textContent = "Wagering";
        problemTxt.innerHTML = `
            <h3>Enter Wagers</h3>
            ${entities.map((entity, index) => `
                <div>
                    <label>${entity.name} (Score: ${entity.score}): </label>
                    <input type="number" class="wager-input" data-entity-index="${index}" min="0" max="${entity.score}" value="0" required>
                </div>
            `).join('')}
        `;
        const pointRecipient = document.getElementById("point-recipient");
        pointRecipient.style.display = "none"; // Hide recipient dropdown
        const nextBtn = document.getElementById("next-btn");
        nextBtn.textContent = "Submit Wagers";
        nextBtn.onclick = async () => {
            // Validate and store wagers
            const wagerInputs = document.querySelectorAll(".wager-input");
            const wagers = {};
            let valid = true;
            wagerInputs.forEach(input => {
                const index = input.dataset.entityIndex;
                const wager = parseInt(input.value);
                const entity = entities[index];
                if (isNaN(wager) || wager < 0 || wager > entity.score) {
                    errorMessage.textContent = `Invalid wager for ${entity.name}. Must be between 0 and ${entity.score}.`;
                    errorMessage.style.display = "block";
                    valid = false;
                } else {
                    wagers[index] = wager;
                }
            });
            if (!valid) return;

            // Step 2: Fetch and display Final Jeopardy question
            const topics = JSON.parse(localStorage.getItem("questions") || "[]").map(cat => cat.name);
            const finalQuestion = await generateFinalJeopardy(topics);
            console.log("Final Jeopardy question:", finalQuestion);

            qCategory.textContent = finalQuestion.category || "Final Jeopardy";
            qDifficulty.textContent = "Final Jeopardy";
            problemTxt.textContent = finalQuestion.question || "Error: Question not found.";
            pointRecipient.style.display = "none";
            nextBtn.textContent = "See Answer";
            nextBtn.onclick = () => {
                // Step 3: Show answer and collect answer correctness
                problemTxt.textContent = finalQuestion.answer || "Error: Answer not found.";
                problemTxt.innerHTML += `
                    <h3>Did each ${gameMode === 'team' ? 'team' : 'player'} answer correctly?</h3>
                    ${entities.map((entity, index) => `
                        <div>
                            <label>${entity.name} (Wager: ${wagers[index]}): </label>
                            <input type="checkbox" class="correct-answer" data-entity-index="${index}">
                            <label>Correct</label>
                        </div>
                    `).join('')}
                `;
                nextBtn.textContent = "Award Points";
                nextBtn.onclick = () => {
                    // Step 4: Award points based on wagers and correctness
                    const correctAnswers = document.querySelectorAll(".correct-answer");
                    correctAnswers.forEach(checkbox => {
                        const index = checkbox.dataset.entityIndex;
                        const entity = entities[index];
                        const wager = wagers[index];
                        if (checkbox.checked) {
                            entity.score += wager; // Add wager for correct answer
                            console.log(`Awarded ${wager} points to ${entity.name}. New score: ${entity.score}`);
                        } else {
                            entity.score -= wager; // Subtract wager for incorrect answer
                            console.log(`Deducted ${wager} points from ${entity.name}. New score: ${entity.score}`);
                        }
                    });

                    // Update display and save game
                    displayEntities();
                    saveGame();

                    // Step 5: End the game
                    popUp.style.display = "none";
                    showEndScreen();
                };
            };
            startCountdown(60); // Start timer for answering
        };
        startCountdown(30); // Timer for wagering
    } catch (error) {
        console.error("Error in Final Jeopardy:", error);
        errorMessage.textContent = `Error: ${error.message}`;
        errorMessage.style.display = "block";
        popUp.style.display = "none";
        mainApp.style.display = "grid";
        finalJeopardyBtn.disabled = false; // Re-enable button on error
    }
});

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