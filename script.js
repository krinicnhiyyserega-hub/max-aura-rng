let luckLevel = 1; 
let luck = 1;      
let rolls = 0;
let playerScore = 0;
let playerCoins = 0; 
let playerEnergy = 10; 
// Стало: Проверяем, есть ли уже сохраненное имя в памяти устройства
let playerName = localStorage.getItem("rng_player_name");

// Если имени в памяти нет (игрок зашел самый первый раз) — создаем его один раз и сохраняем
if (!playerName) {
    playerName = "Игрок_" + Math.floor(Math.random() * 9000);
    localStorage.setItem("rng_player_name", playerName);
}


let playerInventory = {
    "mythic": 0,
    "epic": 0,
    "rare": 0,
    "common": 0
};

const AURAS = [
    { id: "mythic", name: "Разлом Пустоты", chance: 0.05, class: "aura-mythic", image: "images/void.png", scorePrice: 1000, sellPrice: 500 },
    { id: "epic", name: "Пламя Феникса", chance: 0.15, class: "aura-epic", image: "images/phoenix.png", scorePrice: 200, sellPrice: 100 },
    { id: "rare", name: "Вспышка Молнии", chance: 0.35, class: "aura-rare", image: "images/lightning.png", scorePrice: 50, sellPrice: 25 },
    { id: "common", name: "Аура Тумана", chance: 0.70, class: "aura-common", image: "images/fog.png", scorePrice: 10, sellPrice: 5 }
];

let livePlayers = [
    { name: "Александр_RNG", score: 4500, rolls: 1200 },
    { name: "Мария_Aura", score: 3200, rolls: 940 },
    { name: "Иван_🎰", score: 1500, rolls: 400 }
];

// 💾 СОХРАНЕНИЕ ПРОГРЕССА
function saveProgress() {
    localStorage.setItem("rng_rolls", rolls);
    localStorage.setItem("rng_score", playerScore);
    localStorage.setItem("rng_coins", playerCoins);
    localStorage.setItem("rng_luck_level", luckLevel);
    localStorage.setItem("rng_energy", playerEnergy); 
    localStorage.setItem("rng_inventory", JSON.stringify(playerInventory));

    sendScoreToServer(playerName, playerScore, rolls);
}

// 📂 ЗАГРУЗКА ПРОГРЕССА
function loadProgress() {
    const savedRolls = localStorage.getItem("rng_rolls");
    const savedScore = localStorage.getItem("rng_score");
    const savedCoins = localStorage.getItem("rng_coins");
    const savedLuckLevel = localStorage.getItem("rng_luck_level");
    const savedEnergy = localStorage.getItem("rng_energy"); 
    const savedInventory = localStorage.getItem("rng_inventory");

    if (savedRolls !== null) rolls = parseInt(savedRolls);
    if (savedScore !== null) playerScore = parseInt(savedScore);
    if (savedCoins !== null) playerCoins = parseInt(savedCoins);
    if (savedLuckLevel !== null) luckLevel = parseInt(savedLuckLevel);
    if (savedEnergy !== null) playerEnergy = parseInt(savedEnergy);
    if (savedInventory !== null) playerInventory = JSON.parse(savedInventory);

    luck = 1 + (luckLevel - 1) * 0.2;

    document.getElementById("total-rolls").innerText = rolls;
    document.getElementById("score-display").innerText = playerScore;
    document.getElementById("coins-display").innerText = playerCoins;
    document.getElementById("luck-multiplier").innerText = luck.toFixed(1);
    
    updateEnergyUI();
}

function updateEnergyUI() {
    const energyDisplay = document.getElementById("energy-display");
    energyDisplay.innerText = playerEnergy;
    energyDisplay.className = playerEnergy <= 0 ? "no-energy" : "";
}

// 🔄 ФУНКЦИИ ОКON И МОДАЛОК
function toggleInventory(show) {
    document.getElementById("inventory-modal").style.display = show ? "flex" : "none";
}

function toggleShop(show) {
    document.getElementById("shop-modal").style.display = show ? "flex" : "none";
    if (show) updateShopUI();
}

// Новая функция для открытия/закрытия окна Друзей
function toggleFriends(show) {
    document.getElementById("friends-modal").style.display = show ? "flex" : "none";
    if (show) {
        // Генерируем реальную реферальную ссылку для мессенджера Макс
        let link = "t.me/max_aura_bot?start=" + playerName;
        document.getElementById("share-link-input").value = link;
    }
}

// 📋 ФУНКЦИЯ КОПИРОВАНИЯ ССЫЛКИ С КЛИПБОРДОМ ТЕЛЕФОНА
function copyLink() {
    const linkInput = document.getElementById("share-link-input");
    linkInput.select();
    linkInput.setSelectionRange(0, 99999); // Для мобильных устройств

    // Записываем ссылку в буфер обмена телефона/компьютера
    navigator.clipboard.writeText(linkInput.value);
    alert("Ссылка успешно скопирована! Отправь её друзьям в мессенджер.");
}

// 👥 СИМУЛЯЦИЯ: ПОЛУЧЕНИЕ НАГРАДЫ ЗА ДРУГА
function simulateFriendJoin() {
    alert("🎉 Живой человек перешел по твоей ссылке! Награда: +10 Энергии 🔋");
    
    playerEnergy += 10; // Добавляем 10 энергии
    
    updateEnergyUI();   // Обновляем счетчик на главном экране
    saveProgress();     // Автосохранение
}

// ОСТАЛЬНОЙ СТАНДАРТНЫЙ КОД ИГРЫ
function updateInventoryUI() {
    const listContainer = document.getElementById("inventory-list");
    listContainer.innerHTML = "";
    let hasItems = false;
    AURAS.forEach(aura => {
        let count = playerInventory[aura.id];
        if (count > 0) { 
            hasItems = true;
            listContainer.innerHTML += `
                <div class="inventory-item">
                    <span class="${aura.class}">${aura.name}</span>
                    <div class="inventory-actions">
                        <span class="inventory-count">${count} шт.</span>
                        <button class="btn-sell" onclick="sellAura('${aura.id}')">💵 Продать (+${aura.sellPrice}💰)</button>
                    </div>
                </div>
            `;
        }
    });
    if (!hasItems) {
        listContainer.innerHTML = `<p style="color: #888; text-align: center; font-size: 14px; margin: 0;">Тут пока пусто. Испытай удачу!</p>`;
    }
}

function updateShopUI() {
    const shopContainer = document.getElementById("shop-list");
    let currentPrice = luckLevel * 50; 
    let nextLuckBonus = (1 + luckLevel * 0.2).toFixed(1);

    shopContainer.innerHTML = `
        <div class="shop-item">
            <h4>🍀 Клевер Удачи (Ур. ${luckLevel})</h4>
            <p>Увеличивает постоянную удачу до <b>${nextLuckBonus}x</b></p>
            <button class="btn-buy" id="buy-luck-btn" onclick="buyLuckUpgrade(${currentPrice})">
                Купить за ${currentPrice} 💰
            </button>
        </div>
    `;

    if (playerCoins < currentPrice) {
        document.getElementById("buy-luck-btn").disabled = true;
        document.getElementById("buy-luck-btn").innerText = `Нужно ${currentPrice} 💰`;
    }
}

function buyLuckUpgrade(price) {
    if (playerCoins >= price) {
        playerCoins -= price;      
        luckLevel += 1;            
        luck = 1 + (luckLevel - 1) * 0.2; 
        document.getElementById("coins-display").innerText = playerCoins;
        document.getElementById("luck-multiplier").innerText = luck.toFixed(1);
        updateShopUI();   
        saveProgress();   
    }
}

function sellAura(id) {
    if (playerInventory[id] > 0) {
        let auraData = AURAS.find(a => a.id === id);
        playerInventory[id] -= 1;
        playerCoins += auraData.sellPrice;
        document.getElementById("coins-display").innerText = playerCoins;
        updateInventoryUI();
        saveProgress();
    }
}

function watchAd() {
    if (typeof window.yaContextCb === 'undefined') {
        alert("Рекламный блок сейчас загружается, попробуйте еще раз через пару секунд.");
        return;
    }

    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            blockId: 'R-A-19746878-2',
            type: 'fullscreen',
            platform: 'touch',
            callbacks: {
                onOpen: () => {
                    console.log("📺 Рекламное окно открыто. Игра приостановлена.");
                },
                onRewarded: () => {
                    console.log("🎉 Игрок досмотрел рекламу! Выдаем награду.");
                    playerEnergy += 5; 
                    updateEnergyUI();  
                    saveProgress();    
                    alert("Успешно! Вам начислено +5 единиц энергии 🔋.");
                },
                onClose: () => {
                    console.log("❌ Рекламное окно закрыто пользователем.");
                },
                onError: (error) => {
                    console.error("Отказ показа рекламы Яндекса:", error);
                    alert("Не удалось загрузить рекламное видео. Попробуйте позже.");
                }
            }
        });
    });
}


function rollAura() {
    if (playerEnergy <= 0) {
        alert("У вас закончилась энергия! Посмотрите рекламу 📺 или пригласите друга 👥.");
        return;
    }

    const rollButton = document.getElementById("roll-button");
    const textDisplay = document.getElementById("current-aura");
    const imgDisplay = document.getElementById("aura-image");
    const chanceDisplay = document.getElementById("aura-chance");

    rollButton.disabled = true;
    rolls++;
    document.getElementById("total-rolls").innerText = rolls;

    playerEnergy -= 1;
    updateEnergyUI();

    imgDisplay.src = "images/fog.png"; 
    imgDisplay.style.display = "block";
    imgDisplay.classList.add("roulette-spin");
    textDisplay.innerText = "🌀 Выбор аур...";
    textDisplay.className = "aura-none";
    chanceDisplay.innerText = "";

    setTimeout(() => {
        let randomNumber = Math.random() * luck;
        let winAura = null;

        for (let aura of AURAS) {
            if (randomNumber <= aura.chance) { winAura = aura; break; }
        }

        imgDisplay.classList.remove("roulette-spin");
        rollButton.disabled = false;

        if (winAura) {
            textDisplay.innerText = winAura.name;
            textDisplay.className = winAura.class;
            imgDisplay.src = winAura.image;
            imgDisplay.className = "glow-effect"; 
            chanceDisplay.innerText = `Шанс: ${(winAura.chance * 100).toFixed(2)}%`;

            playerInventory[winAura.id] += 1;
            playerScore += winAura.scorePrice;
            document.getElementById("score-display").innerText = playerScore;
            updateInventoryUI();
        } else {
            textDisplay.innerText = "Ничего не выпало";
            textDisplay.className = "aura-none";
            imgDisplay.style.display = "none";
        }
        
        saveProgress();
    }, 1500); 
}

async function sendScoreToServer(name, score, userRolls) {
    try {
        await fetch('http://localhost:3000/api/score', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: name, score: score, rolls: userRolls })
        });
        loadLiveLeaderboard();
    } catch (error) { renderLeaderboard(); }
}

async function loadLiveLeaderboard() {
    try {
        let response = await fetch('http://localhost:3000/api/leaderboard');
        livePlayers = await response.json();
        renderLeaderboard();
    } catch (error) { renderLeaderboard(); }
}

function renderLeaderboard() {
    const boardContainer = document.getElementById("leaderboard-list");
    boardContainer.innerHTML = "";
    let playerInTop = livePlayers.some(p => p.name === playerName);
    let allPlayers = [...livePlayers];
    if (!playerInTop) { allPlayers.push({ name: "Ты (" + playerName + ")", score: playerScore, rolls: rolls, isCurrentPlayer: true }); }
    allPlayers.sort((a, b) => b.score - a.score);
    allPlayers.slice(0, 10).forEach(user => {
        // Проверяем, является ли текущая строка рейтинга строкой нашего игрока
        let isMe = user.isCurrentPlayer || user.name === "Ты (" + playerName + ")";
        let rowClass = isMe ? "leaderboard-item player-row" : "leaderboard-item";
        
        // Отрисовка строки участника в Топ-10 (исправлена ошибка кавычек)
        boardContainer.innerHTML += `
            <li class="${rowClass}">
                <span>${user.name}</span>
                <span class="leaderboard-rolls">🔄 ${user.rolls}</span>
                <span>${user.score} ⭐</span>
            </li>
        `;
    });
}

// СТАРТ ИГРЫ (Вызывается один раз автоматически при запуске)
loadProgress();         // 1. Загружаем сохранения из памяти устройства
updateInventoryUI();    // 2. Отрисовываем вещи в рюкзаке
loadLiveLeaderboard();  // 3. Подключаем живых людей и обновляем Топ-10
