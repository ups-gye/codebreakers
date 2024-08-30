const socket = io();

function showFlash(type) {
    if (type === 'success') {
        flash.className = 'flash flash-success';
        socket.emit('flash', 'success');
    } else {
        flash.className = 'flash flash-error';
        socket.emit('flash', 'error');
    }
    flash.style.display = 'block';
    setTimeout(() => {
        flash.style.display = 'none';
    }, 100); // El flash parpadeará durante 100ms
}

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const startScreen = document.getElementById('startScreen');
const gameOverScreen = document.getElementById('gameOverScreen');
const flash = document.getElementById('flash');
const usernameInput = document.getElementById('username');
const registerButton = document.getElementById('registerButton');
const startButton = document.getElementById('startButton');
const difficultyButton = document.getElementById('difficultyButton');
const replayButton = document.getElementById('replayButton');
const backToStartButton = document.getElementById('backToStartButton');
const leaderboardTableBody = document.getElementById('leaderboard').querySelector('tbody');

let username = '';
let difficulty = 'easy';
let gameState = 'start';

// Game settings
const bird = { x: 50, y: 150, width: 30, height: 30, gravity: 0.315, lift: -6, velocity: 0 };
let pipes = [];
const pipeWidth = 100;
const gapSize = 125;
let frameCount = 0;
let score = 0;

// Load images
const birdImage = new Image();
birdImage.src = './IMA/bird-removebg-preview.png';

const topPipeImage = new Image();
topPipeImage.src = './IMA/top-removebg-preview.png';

const middlePipeImage = new Image();
middlePipeImage.src = './IMA/middle-removebg-preview.png';

const bottomPipeImage = new Image();
bottomPipeImage.src = './IMA/bottom-removebg-preview.png';

const backgroundImage = new Image();
backgroundImage.src = './IMA/juego-removebg-preview.png';

// Función para registrar un nuevo usuario
const registerUser = async (username) => {
    try {
        const response = await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Usuario registrado:', data.user);
        } else {
            console.error('Error al registrar usuario:', data.message);
            if (data.message === 'Username already exists') {
                alert('Este nombre de usuario ya existe. Por favor, elige otro.');
            }
        }
    } catch (error) {
        console.error('Error en la solicitud de registro:', error);
    }
};


// Función para actualizar la puntuación de un usuario
const updateScore = async (username, score) => {
    try {
        const response = await fetch(`http://localhost:5000/api/users/${username}/score`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ score }),
        });
        const data = await response.json();
        if (response.ok) {
            console.log('Puntuación actualizada:', data.user);
        } else {
            console.error('Error al actualizar la puntuación:', data.message);
        }
    } catch (error) {
        console.error('Error en la solicitud de actualización:', error);
    }
};

const fetchLeaderboard = async () => {
    try {
        console.log("Fetching leaderboard...");
        const response = await fetch('http://localhost:5000/api/users');
        const data = await response.json();
        
        if (response.ok) {
            leaderboardTableBody.innerHTML = '';
            data.sort((a, b) => b.score - a.score); // Ordenar por puntaje descendente
            data.forEach((user, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `<td>${index + 1}</td><td>${user.username}</td><td>${user.score}</td>`;
                leaderboardTableBody.appendChild(row);
            });
        } else {
            console.error('Error al obtener la tabla de clasificación:', data.message);
        }
    } catch (error) {
        console.error('Error en la solicitud de clasificación:', error);
    }
};



// Event listeners for buttons
registerButton.addEventListener('click', () => {
    username = usernameInput.value;
    if (username) {
        registerUser(username);
    } else {
        alert('Por favor, ingresa un nombre de usuario');
    }
});

startButton.addEventListener('click', () => {
    if (username) {
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        canvas.style.display = 'block';
        gameState = 'playing';
        requestAnimationFrame(gameLoop);
    } else {
        alert('Por favor, regístrate primero');
    }
});

replayButton.addEventListener('click', () => {
    resetGame();
    startButton.click(); // Start game after reset
});

backToStartButton.addEventListener('click', () => {
    resetGame();
    gameOverScreen.style.display = 'none';
    startScreen.style.display = 'flex';
});

difficultyButton.addEventListener('click', () => {
    if (difficulty === 'easy') {
        difficulty = 'hard';
        difficultyButton.textContent = 'Dificultad: Hard';
    } else {
        difficulty = 'easy';
        difficultyButton.textContent = 'Dificultad: Easy';
    }
});

// Bird jump
document.addEventListener('keydown', () => {
    if (gameState === 'playing') {
        bird.velocity = bird.lift;
    } else if (gameState === 'over') {
        resetGame();
    }
});

function resetGame() {
    bird.y = 150;
    bird.velocity = 0;
    pipes = [];
    score = 0;
    frameCount = 0;
    gameState = 'start';
    startScreen.style.display = 'flex';
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'none';
}

// Generate random multiplication problems based on difficulty
function generateProblem() {
    let num1, num2, correctAnswer;
    
    if (difficulty === 'easy') {
        num1 = Math.floor(Math.random() * 9) + 1;
        num2 = Math.floor(Math.random() * 9) + 1;
    } else if (difficulty === 'hard') {
        num1 = Math.floor(Math.random() * 90) + 10;
        num2 = Math.random() < 0.5 ? 2 : 3;
    }

    correctAnswer = num1 * num2;
    
    let wrongAnswer;
    do {
        if (difficulty === 'easy') {
            wrongAnswer = correctAnswer + (Math.floor(Math.random() * 3) + 1) * (Math.random() < 0.5 ? 1 : -1);
        } else {
            wrongAnswer = Math.floor(Math.random() * 1000);
        }
    } while (wrongAnswer === correctAnswer || wrongAnswer < 0);
    
    return { 
        problem: `${num1} x ${num2}`, 
        answers: [
            { value: correctAnswer, isCorrect: true }, 
            { value: wrongAnswer, isCorrect: false }
        ].sort(() => Math.random() - 0.5) 
    };
}

function drawGameOverScreen() {
    gameOverScreen.style.display = 'flex';
    canvas.style.display = 'none';
    document.getElementById('finalScore').innerText = `Score: ${score}`;
    document.getElementById('finalName').innerText = `Player: ${username}`;

    // Llamar a la función para actualizar la puntuación
    updateScore(username, score);

    // Llamar a la función para obtener la tabla de clasificación
    fetchLeaderboard();
}

// Game loop
function gameLoop() {
    if (gameState === 'playing') {
        frameCount++;

        // Draw the background image
        ctx.drawImage(backgroundImage, 0, 0, canvas.width, canvas.height);

        // Bird physics
        bird.velocity += bird.gravity;
        bird.y += bird.velocity;

        // Draw bird
        ctx.drawImage(birdImage, bird.x, bird.y, bird.width, bird.height);

        // Generate and draw pipes with math problems
        if (frameCount % 230 === 0) {
            const upperPipeHeight = Math.floor(Math.random() * (canvas.height / 3)) + 50;
            const middlePipeHeight = upperPipeHeight + gapSize + 100;
            const lowerPipeY = middlePipeHeight + gapSize + 100;
            const problem = generateProblem();
            const pipeX = canvas.width;
            pipes.push({
                x: pipeX, 
                upperHeight: upperPipeHeight,
                middleHeight: middlePipeHeight,
                lowerY: lowerPipeY,
                problem 
            });
        }

        pipes.forEach(pipe => {
            pipe.x -= 1.75;

            // Top pipe
            ctx.drawImage(topPipeImage, pipe.x, 0, pipeWidth, pipe.upperHeight);

            // Middle pipe
            ctx.drawImage(middlePipeImage, pipe.x, pipe.upperHeight + gapSize, pipeWidth, pipe.middleHeight - (pipe.upperHeight + gapSize));

            // Bottom pipe
            ctx.drawImage(bottomPipeImage, pipe.x, pipe.lowerY, pipeWidth, canvas.height - pipe.lowerY);

            // Display the math problem
            ctx.fillStyle = 'black';
            ctx.font = '30px Arial';
            ctx.fillText(pipe.problem.problem, pipe.x + 10, 50);

            // Display answers in the middle of the gaps
            const middleOfTopGap = (pipe.upperHeight + (pipe.middleHeight - pipe.upperHeight) / 2) - 10;
            const middleOfBottomGap = (pipe.middleHeight + (pipe.lowerY - pipe.middleHeight) / 2) - 10;

            // Correct answer in one of the gaps
            ctx.fillText(pipe.problem.answers[0].value, pipe.x + 10, middleOfTopGap);
            ctx.fillText(pipe.problem.answers[1].value, pipe.x + 10, middleOfBottomGap);

            // Collision detection and score increment
            if (
                bird.x < pipe.x + pipeWidth &&
                bird.x + bird.width > pipe.x
            ) {
                if (bird.y > pipe.upperHeight && bird.y < pipe.middleHeight && pipe.problem.answers[0].isCorrect) {
                    score++;
                    showFlash('success');
                } else if (bird.y > pipe.middleHeight && bird.y < pipe.lowerY && pipe.problem.answers[1].isCorrect) {
                    score++;
                    showFlash('success');
                } else {
                    showFlash('error');
                    gameState = 'over';
                }
            }
        });

        // Draw score
        ctx.fillStyle = 'black';
        ctx.font = '30px Arial';
        ctx.fillText(`Score: ${score}`, 10, 50);

        // Ground collision only
        if (bird.y + bird.height > canvas.height) {
            showFlash('error');
            gameState = 'over';
        }

        // Remove offscreen pipes
        pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

        requestAnimationFrame(gameLoop);
    } else if (gameState === 'over') {
        drawGameOverScreen();
    }
}

if (gameState === 'start') {
    startScreen.style.display = 'flex';
    canvas.style.display = 'none';
    gameOverScreen.style.display = 'none';
} else if (gameState === 'playing') {
    startScreen.style.display = 'none';
    canvas.style.display = 'block';
    gameLoop();
}
