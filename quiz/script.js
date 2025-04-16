let animes = [];
let remainingAnimes = [];
let score = 0;

async function startQuiz() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert("Informe um usuário do MyAnimeList.");
        return;
    }

    document.getElementById('loading').style.display = 'block';
    document.getElementById('quiz').style.display = 'none';
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('showMenuBtn').style.display = 'block';
    document.getElementById('endScreen').style.display = 'none';

    try {
        const res = await fetch(`http://localhost:3000/quiz-data?username=${username}`);
        const data = await res.json();

        if (data.error) {
            alert(data.error);
            document.getElementById('loading').style.display = 'none';
            return;
        }

        animes = data.filter(a => a.main_picture && a.title);
        if (animes.length < 4) {
            alert("Erro: é necessário ter pelo menos 4 animes no JSON para o quiz funcionar.");
            document.getElementById('loading').style.display = 'none';
            return;
        }

        remainingAnimes = [...animes];
        score = 0;

        document.getElementById('score').textContent = `Score: ${score}`;
        document.getElementById('remaining').textContent = `Restantes: ${remainingAnimes.length}`;
        document.getElementById('loading').style.display = 'none';
        document.getElementById('quiz').style.display = 'block';
        nextQuestion();
    } catch (error) {
        alert("Erro ao carregar dados do backend.");
        console.error(error);
        document.getElementById('loading').style.display = 'none';
    }
}

async function handleRecapture() {
    const username = document.getElementById('username').value.trim();
    if (!username) {
        alert("Informe um usuário do MyAnimeList.");
        return;
    }

    const confirmar = confirm(`Tem certeza que deseja recapturar os dados de "${username}"?\nIsso apagará o cache local e puxará novamente da API.`);

    if (!confirmar) return;

    // Mostrar loading
    document.getElementById('loading').style.display = 'block';
    document.getElementById('quiz').style.display = 'none';

    try {
        const res = await fetch(`http://localhost:3000/recapture?username=${username}`);
        const data = await res.json();

        document.getElementById('loading').style.display = 'none';

        if (data.error) {
            alert(data.error);
        } else {
            alert("✅ Dados recapturados com sucesso! Agora clique em 'Começar' para jogar.");
        }
    } catch (err) {
        console.error("Erro ao recapturar dados:", err);
        alert("Erro ao recapturar dados.");
        document.getElementById('loading').style.display = 'none';
    }
}


async function recaptureUserData(username) {
    try {
        const res = await fetch(`http://localhost:3000/recapture?username=${username}`);
        const data = await res.json();

        if (data.error) {
            alert(data.error);
        } else {
            alert("Dados recapturados com sucesso!");
        }
    } catch (err) {
        console.error("Erro ao recapturar dados:", err);
        alert("Erro ao recapturar dados.");
    }
}



function nextQuestion() {
    if (remainingAnimes.length === 0) {
        endGame();
        return;
    }

    const index = Math.floor(Math.random() * remainingAnimes.length);
    const current = remainingAnimes.splice(index, 1)[0];

    const image = document.getElementById('anime-image');
    const optionsContainer = document.getElementById('options');
    image.src = current.main_picture.large;

    const correct = current.title;
    const choices = new Set([correct]);

    while (choices.size < 4) {
        const random = animes[Math.floor(Math.random() * animes.length)].title;
        choices.add(random);
    }

    const shuffled = Array.from(choices).sort(() => Math.random() - 0.5);
    optionsContainer.innerHTML = '';

    shuffled.forEach(title => {
        const btn = document.createElement('button');
        btn.textContent = title;
        btn.onclick = () => {
            document.querySelectorAll("#options button").forEach(b => b.disabled = true);

            if (title === correct) {
                score++;
                showFeedback("✅ Acertou!", true);
            } else {
                showFeedback(`❌ Errou! A resposta era: ${correct}`, false);
                endGame()
            }

            document.getElementById('score').textContent = `Score: ${score}`;
            document.getElementById('remaining').textContent = `Restantes: ${remainingAnimes.length}`;
            setTimeout(nextQuestion, 2000);
        };
        optionsContainer.appendChild(btn);
    });

    document.getElementById('remaining').textContent = `Restantes: ${remainingAnimes.length}`;
}

function showFeedback(message, correct) {
    const feedback = document.createElement('div');
    feedback.className = 'feedback';
    feedback.textContent = message;
    document.body.appendChild(feedback);
    setTimeout(() => feedback.remove(), 1500);
}

function endGame() {

    let restante = animes.length - score;
    document.getElementById('quiz').style.display = 'none';

    document.getElementById('finalScore').innerHTML = `
        <p>Você fez <strong>${score}</strong> ponto${score === 1 ? '' : 's'}.</p>
        <p>Total de animes restantes: ${restante}</p>
    `;
    document.getElementById('endScreen').style.display = 'flex';
}

function restartQuiz() {
    document.getElementById('endScreen').style.display = 'none';
    startQuiz();
}

function toggleMenu() {
    const menu = document.getElementById('menu');
    const showBtn = document.getElementById('showMenuBtn');
    menu.classList.toggle('hidden');
    showBtn.style.display = menu.classList.contains('hidden') ? 'block' : 'none';
}

let isMusicPlaying = true;
function toggleMusic() {
    if (!player) return;

    if (isMusicPlaying) {
        player.pauseVideo();
        document.getElementById('musicToggle').textContent = '🔇 Música';
    } else {
        player.playVideo();
        document.getElementById('musicToggle').textContent = '🔊 Música';
    }

    isMusicPlaying = !isMusicPlaying;
}

function shareScore() {
    const text = `Acabei de fazer ${score} ponto${score === 1 ? '' : 's'} no Anime Quiz! 🎌🔥\nTenta bater meu recorde!`;
    const shareUrl = window.location.href;

    if (navigator.share) {
        navigator.share({ title: 'Anime Quiz', text, url: shareUrl }).catch(console.error);
    } else {
        navigator.clipboard.writeText(`${text}\n${shareUrl}`);
        alert("Link copiado para a área de transferência!");
    }
}



