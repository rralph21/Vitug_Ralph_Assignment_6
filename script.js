/**
 * Initializes the Trivia Game when the DOM is fully loaded.
 */
document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("trivia-form");
    const questionContainer = document.getElementById("question-container");
    const newPlayerButton = document.getElementById("new-player");
    const usernameInput = document.getElementById("username");


    // Initialize the game
    checkUserSession();
    checkUsername();
    fetchQuestions();
    displayScores();

    /**
     * Sets a cookie with a given name, value and expiration in days.
     *
     * @param {string} name - The name of the cookie.
     * @param {string} value - The value to store.
     * @param {number} days - Days until the cookie expires.
     */

    function setCookie(name, value, days){
        const date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        const expires = "expires=" + date.toUTCString();
        document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(
            value)};${expires};path=/`;
    }

    function getCookie(name) {
        const decodedCookie = decodeURIComponent(document.cookie);
        const cookies = decodedCookie.split(";");
        const target = name + "=";

        for (let cookie of cookies) {
            cookie = cookie.trim();
            if (cookie.indexOf(target) === 0) {
                return cookie.substring(target.length);
        }
        }
        return null;
    }

     /**
     * Clears a cookie by setting its expiry date in the past.
     *
     * @param {string} name - The name of the cookie to clear.
     */

    function clearCookie(name) {
        document.cookie = `${encodeURIComponent(
            name
        )}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
    }

    function checkUsername() {
        const savedUsername = getCookie("triviaUsername");
        usernameInput.value = savedUsername;
    }

    /**
     * Checks if a user session exists based on the username cookie.
     * Updates the UI depending on whether a username is saved.
     */
    function checkUserSession() {
        const savedUsername = getCookie("triviaUsername");
        const usernameInput = document.getElementById("username");
        const newPlayerButton = document.getElementById("new-player");

        if (savedUsername) {
            // A user cookie exists → restore the session
            usernameInput.value = savedUsername;

            // Show previous session UI
            newPlayerButton.classList.remove("hidden");

            console.log("Session found for:", savedUsername);
        } else {
            // No cookie → user is starting fresh
            usernameInput.value = "";

            // Hide old-session UI
            newPlayerButton.classList.add("hidden");

            console.log("No existing session.");
        }
    }


    /**
     * Fetches trivia questions from the API and displays them.
     */
    function fetchQuestions() {
        showLoading(true); // Show loading state

        fetch("https://opentdb.com/api.php?amount=10&type=multiple")
            .then((response) => response.json())
            .then((data) => {
                displayQuestions(data.results);
                showLoading(false); // Hide loading state
            })
            .catch((error) => {
                console.error("Error fetching questions:", error);
                showLoading(false); // Hide loading state on error
            });
    }

    /**
     * Toggles the display of the loading state and question container.
     *
     * @param {boolean} isLoading - Indicates whether the loading state should be shown.
     */
    function showLoading(isLoading) {
        document.getElementById("loading-container").classList = isLoading
            ? ""
            : "hidden";
        document.getElementById("question-container").classList = isLoading
            ? "hidden"
            : "";
    }

    /**
     * Displays fetched trivia questions.
     * @param {Object[]} questions - Array of trivia questions.
     */
    function displayQuestions(questions) {
        questionContainer.innerHTML = ""; // Clear existing questions
        questions.forEach((question, index) => {
            const questionDiv = document.createElement("div");
            questionDiv.innerHTML = `
                <p>${question.question}</p>
                ${createAnswerOptions(
                    question.correct_answer,
                    question.incorrect_answers,
                    index
                )}
            `;
            questionContainer.appendChild(questionDiv);
        });
    }

    /**
     * Creates HTML for answer options.
     * @param {string} correctAnswer - The correct answer for the question.
     * @param {string[]} incorrectAnswers - Array of incorrect answers.
     * @param {number} questionIndex - The index of the current question.
     * @returns {string} HTML string of answer options.
     */
    function createAnswerOptions(
        correctAnswer,
        incorrectAnswers,
        questionIndex
    ) {
        const allAnswers = [correctAnswer, ...incorrectAnswers].sort(
            () => Math.random() - 0.5
        );
        return allAnswers
            .map(
                (answer) => `
            <label>
                <input type="radio" name="answer${questionIndex}" value="${answer}" ${
                    answer === correctAnswer ? 'data-correct="true"' : ""
                }>
                ${answer}
            </label>
        `
            )
            .join("");
    }

    // Event listeners for form submission and new player button
    form.addEventListener("submit", handleFormSubmit);
    newPlayerButton.addEventListener("click", newPlayer);

    /**
     * Handles the trivia form submission.
     * @param {Event} event - The submit event.
     */
    function handleFormSubmit(event) {
        event.preventDefault();
        
        const username = usernameInput.value.trim();
        if (!username) {
            alert("Please enter your name before ending the game");
            return;
        }

        const existingUsername = getCookie("triviaUsername");

        // sets cookie only if name is changed or does not exists
        if (!existingUsername || existingUsername !== username) {
            setCookie("triviaUsername", username, 7); // stores for 7 days
        }

        // calculate score
        const score = calculateScore();

        // saves score
        saveScore(username, score);

        // score table
        updateScoreTable(username, score);

        // alert user game is finished
        alert(`Game finished! Your score is ${score}.`);

        // unhides "New Player"
        newPlayerButton.classList.remove("hidden");

        // updates UI
        checkUserSession();
    }

    /**
     * Score calculation
     * @returns {number} The player's score.
     */

    function calculateScore() {
        let score = 0;

        const selectedAnswers = document.querySelectorAll(
            '#question-container input[type="radio"]:checked'
        );

        selectedAnswers.forEach((answer) => {
            if (answer.dataset.correct === "true") {
                score ++;
            }
        });

        return score;
    }

      /**
     * Add one row to the score table with the player's name and score.
     * @param {string} username - player's name.
     * @param {number} score - current score.
     */
    function updateScoreTable(username, score) {
        const tableBody = document
            .getElementById("score-table")
            .querySelector("tbody");

        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${username}</td>
            <td>${score}</td>
        `;
        tableBody.appendChild(row);
    }

    function saveScore(username, score) {
        // Get already-saved scores
        const storedScores = localStorage.getItem("triviaScores");
        let scoresArray = storedScores ? JSON.parse(storedScores) : [];

        // Add a new score entry
        scoresArray.push({ username, score });

        // Save back to localStorage
        localStorage.setItem("triviaScores", JSON.stringify(scoresArray));
    }

     /*
     * Resets the session for a new player:
     */
    function newPlayer() {

        clearCookie("triviaUsername");

        // clears the input and form
        usernameInput.value = "";
        form.reset();

        // removes old questions
        questionContainer.innerHTML = "";

        // new questions
        fetchQuestions();

        // hides "New Player"
        newPlayerButton.classList.add("hidden");

    }
});