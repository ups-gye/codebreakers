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

let username = '';
let difficulty = 'easy'; // Default difficulty
let gameState = 'start'; // 'start', 'playing', 'over'

// Game settings
const bird = { x: 50, y: 150, width: 30, height: 30, gravity: 0.5, lift: -6, velocity: 0 };
let pipes = [];
const pipeWidth = 100;
const gapSize = 125;  // Tamaño del espacio para pasar entre los tubos
let frameCount = 0;
let score = 0;

// Load images
const birdImage = new Image();
birdImage.src = './IMA/bird-removebg-preview.png';

const topPipeImage = new Image();
topPipeImage.src = './IMA/top-removebg-preview.png';  // Imagen específica para el tubo superior

const middlePipeImage = new Image();
middlePipeImage.src = './IMA/middle-removebg-preview.png';  // Imagen específica para el tubo medio

const bottomPipeImage = new Image();
bottomPipeImage.src = './IMA/bottom-removebg-preview.png';  // Imagen específica para el tubo inferior

const backgroundImage = new Image();
backgroundImage.src = './IMA/juego-removebg-preview.png';  // Fondo del juego

// Event listeners for buttons
registerButton.addEventListener('click', () => {
    username = usernameInput.value;
    alert(`Registered as ${username}`);
});

startButton.addEventListener('click', () => {
    if (username) {
        startScreen.style.display = 'none';
        gameOverScreen.style.display = 'none';
        canvas.style.display = 'block';
        gameState = 'playing';
        requestAnimationFrame(gameLoop);
    } else {
        alert('Please register first');
    }
});

replayButton.addEventListener('click', () => {
    resetGame();
    startButton.click(); // Start game after reset
});

difficultyButton.addEventListener('click', () => {
    if (difficulty === 'easy') {
        difficulty = 'hard';
        difficultyButton.textContent = 'Difficulty: Hard';
    } else {
        difficulty = 'easy';
        difficultyButton.textContent = 'Difficulty: Easy';
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

function showFlash(type) {
    if (type === 'success') {
        flash.className = 'flash flash-success';
    } else {
        flash.className = 'flash flash-error';
    }
    flash.style.display = 'block';
    setTimeout(() => {
        flash.style.display = 'none';
    }, 300); // El flash parpadeará durante 300ms
}

// Generate random multiplication problems
function generateProblem() {
    const num1 = Math.floor(Math.random() * (difficulty === 'easy' ? 5 : 10)) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const correctAnswer = num1 * num2;
    let wrongAnswer;
    do {
        wrongAnswer = Math.floor(Math.random() * 81);
    } while (wrongAnswer === correctAnswer);
    
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
            pipe.x -= 2.75; // Speed of the pipes moving left

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
                // Check if bird passes through correct answer
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

        // Ground or ceiling collision
        if (bird.y + bird.height > canvas.height || bird.y < 0) {
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
