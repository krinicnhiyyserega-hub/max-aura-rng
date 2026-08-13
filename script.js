let luckLevel = 1; 
let luck = 1;      
let rolls = 0;
let playerScore = 0;
let playerCoins = 0; 
let playerEnergy = 10; 
let playerName = localStorage.getItem("rng_player_name");

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

let invitedFriends = [];

const RANDOM_NAMES = ["Никита_VK", "Алина_Смайл", "Дима_Крутилкин", "Оля_Аура", "Данил_RNG", "Катя_Космос", "Сергей_🎰", "Яна_Звезда", "Павел_Max"];

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

let adCooldownInterval;

// 💾 СОХРАНЕНИЕ ПРОГРЕССА
function saveProgress() {
    localStorage.setItem("rng_rolls", rolls);
    localStorage.setItem("rng_score", playerScore);
    localStorage.setItem("rng_coins", playerCoins);
    localStorage.setItem("rng_luck_level", luckLevel);
    localStorage.setItem("rng_energy", playerEnergy); 
    localStorage.setItem("rng_inventory", JSON.stringify(playerInventory));
    localStorage.setItem("rng_invited_friends", JSON.stringify(invitedFriends));
}

// 📂 ЗАГРУЗКА ПРОГРЕССА
function loadProgress() {
    const savedRolls = localStorage.getItem("rng_rolls");
    const savedScore = localStorage.getItem("rng_score");
    const savedCoins = localStorage.getItem("rng_coins");
    const savedLuckLevel = localStorage.getItem("rng_luck_level");
    const savedEnergy = localStorage.getItem("rng_energy"); 
    const savedInventory = localStorage.getItem("rng_inventory");
    const savedFriends = localStorage.getItem("rng_invited_friends");

    if (savedRolls !== null) rolls = parseInt(savedRolls);
    if (savedScore !== null) playerScore = parseInt(savedScore);
    if (savedCoins !== null) playerCoins = parseInt(savedCoins);
    if (savedLuckLevel !== null) luckLevel = parseInt(savedLuckLevel);
    if (savedEnergy !== null) playerEnergy = parseInt(savedEnergy);
    if (savedInventory !== null) playerInventory = JSON.parse(savedInventory);
    if (savedFriends !== null) invitedFriends = JSON.parse(savedFriends);

    luck = 1 + (luckLevel - 1) * 0.2;

    document.getElementById("total-rolls").innerText = rolls;
    document.getElementById("score-display").innerText = playerScore;
    document.getElementById("coins-display").innerText = playerCoins;
    document.getElementById("luck-multiplier").innerText = luck.toFixed(1);
    
    updateEnergyUI();
}

function updateEnergyUI() {
    const energyDisplay = document.getElementById("energy-display");
    if (energyDisplay) {
        energyDisplay.innerText = playerEnergy;
        energyDisplay.className = playerEnergy <= 0 ? "no-energy" : "";
    }
}

// 🔄 ОКНА (МОДАЛКИ)
function toggleInventory(show) {
    document.getElementById("inventory-modal").style.display = show ? "flex" : "none";
}

function toggleShop(show) {
    document.getElementById("shop-modal").style.display = show ? "flex" : "none";
    if (show) updateShopUI();
}

// РЕФЕРАЛЬНОЕ ОКНО
function toggleFriends(show) {
    const modal = document.getElementById("friends-modal");
    if (!modal) return;

    if (show) {
        modal.style.display = "flex"; 
        const baseUrl = window.location.href.split('?')[0];
        document.getElementById("share-link-input").value = `${baseUrl}?start=${playerName}`;
        updateFriendsUI(); // Обновляем список на экране при открытии
    } else {
        modal.style.display = "none"; 
    }
}

function openFriends() {
    toggleFriends(true);
}

// ОБНОВЛЕНИЕ СПИСКА ДРУЗЕЙ В МЕНЮ
function updateFriendsUI() {
    const listContainer = document.getElementById("invited-friends-list");
    if (!listContainer) return;
    
    listContainer.innerHTML = ""; 

    if (invitedFriends.length === 0) {
        listContainer.innerHTML = `<p style="color: #888; text-align: center; font-size: 12px; margin: 5px 0;">Ты пока никого не пригласил.</p>`;
        return;
    }

    invitedFriends.forEach(friend => {
        listContainer.innerHTML += `
            <div class="friend-row" style="display: flex; justify-content: space-between; background: #27272a; padding: 6px 12px; border-radius: 6px; margin-bottom: 5px; font-size: 13px; color: #e4e4e7; border: 1px solid #3f3f46;">
                <span>👤 ${friend.name}</span>
                <span class="friend-status" style="color: #22c55e; font-weight: bold; font-size: 11px;">${friend.status}</span>
            </div>
        `;
    });
}

// ДЕЙСТВИЕ ПРИ НАЖАТИИ «ПРИГЛАСИТЬ»
function inviteFriendAction() {
    const referralLink = document.getElementById("share-link-input").value;
    const inviteText = "🔮 Смотри какую крутую RNG игру с аурами я нашёл! Заходи по моей ссылке: ";
    const maxShareUrl = `https://t.me{encodeURIComponent(referralLink)}&text=${encodeURIComponent(inviteText)}`;

    try {
        if (window.Telegram && window.Telegram.WebApp) {
            window.Telegram.WebApp.openLink(maxShareUrl);
        } else {
            window.open(maxShareUrl, '_blank');
        }
    } catch (e) { console.log(e); }

    // Копирование в буфер обмена для надежности
    const linkInput = document.getElementById("share-link-input");
    if (linkInput) {
        linkInput.select();
        document.execCommand("copy");
    }

    // Добавляем случайного друга
    const randomName = RANDOM_NAMES[Math.floor(Math.random() * RANDOM_NAMES.length)];
    if (!invitedFriends.some(f => f.name === randomName)) {
        invitedFriends.push({ name: randomName, status: "Зашёл в игру ✅" });
    } else {
        invitedFriends.push({ name: randomName + "_" + Math.floor(Math.random() * 100), status: "Зашёл в игру ✅" });
    }

    // 🔥 СТРОГО НАЧИСЛЯЕМ ЭНЕРГИЮ, А НЕ МОНЕТЫ
    playerEnergy += 10; 
    updateEnergyUI();   
    
    updateFriendsUI();
    saveProgress();     

    alert("🎉 Успешно!\n\nСсылка скопирована. Тебе начислено +10 Энергии 🔋 за поддержку игры!");
}

// ИНВЕНТАРЬ
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

// ПРОДАЖА
function sellAura(id) {
    if (playerInventory[id] > 0) {
        let auraData = AURAS.find(a => a.id === id);
        playerInventory[id] -= 1;
        playerCoins += auraData.sellPrice; // Монеты даются ТОЛЬКО при продаже аур
        document.getElementById("coins-display").innerText = playerCoins;
        updateInventoryUI();
        saveProgress();
    }
}

// МАГАЗИН
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

// РЕКЛАМА
function watchAd() {
    if (typeof window.yaContextCb === 'undefined') {
        alert("Рекламный блок сейчас загружается. Начисляем бонус аварийно!");
        giveAdReward(); 
        return;
    }

    window.yaContextCb.push(() => {
        Ya.Context.AdvManager.render({
            blockId: 'R-A-19746878-2',
            type: 'fullscreen',
            platform: 'touch',
            callbacks: {
                onOpen: () => { console.log("📺 Реклама открыта."); },
                onClose: () => { giveAdReward(); },
                onError: (error) => { giveAdReward(); }
            }
        });
    });
}

function giveAdReward() {
    playerEnergy += 5; 
    updateEnergyUI();  
    saveProgress();    
    alert("🎉 Награда получена! Вам начислено +5 энергии 🔋.");
    startAdCooldown(300);
}
function startAdCooldown(seconds) {
    const adButton = document.querySelector(".btn-ads");
    if (!adButton) return;
    
    adButton.disabled = true;
    const unlockTime = Date.now() + seconds * 1000;
    localStorage.setItem("rng_ad_unlock_time", unlockTime);
    
    clearInterval(adCooldownInterval);
    adCooldownInterval = setInterval(() => {
        const timeLeft = Math.max(0, Math.ceil((unlockTime - Date.now()) / 1000));
        
        if (timeLeft <= 0) {
            clearInterval(adCooldownInterval);
            adButton.disabled = false;
            adButton.innerText = "📺 Реклама";
            localStorage.removeItem("rng_ad_unlock_time");
        } else {
            const minutes = Math.floor(timeLeft / 60);
            const remainingSeconds = timeLeft % 60;
            const formattedTime = `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
            adButton.innerText = `⏳ Реклама (${formattedTime})`;
        }
    }, 1000);
}

function checkAdCooldown() {
    const savedUnlockTime = localStorage.getItem("rng_ad_unlock_time");
    if (savedUnlockTime) {
        const timeLeft = Math.max(0, Math.ceil((parseInt(savedUnlockTime) - Date.now()) / 1000));
        if (timeLeft > 0) startAdCooldown(timeLeft);
        else localStorage.removeItem("rng_ad_unlock_time");
    }
}

// 🌀 КРУТКА РУЛЕТКИ
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
            if (randomNumber <= aura.chance) { 
                winAura = aura; 
                break; 
            }
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
            renderLeaderboard();
        } else {
            textDisplay.innerText = "Ничего не выпало";
            textDisplay.className = "aura-none";
            imgDisplay.style.display = "none";
        }
        
        saveProgress();
    }, 1500);
}

function renderLeaderboard() {
    const boardContainer = document.getElementById("leaderboard-list");
    if (!boardContainer) return;
    boardContainer.innerHTML = "";
    
    let allPlayers = [...livePlayers, { name: "Ты (" + playerName + ")", score: playerScore, rolls: rolls, isCurrentPlayer: true }];
    allPlayers.sort((a, b) => b.score - a.score);
    
    allPlayers.slice(0, 10).forEach(user => {
        let isMe = user.isCurrentPlayer || user.name === "Ты (" + playerName + ")";
        let rowClass = isMe ? "leaderboard-item player-row" : "leaderboard-item";
        
        boardContainer.innerHTML += `
            <li class="${rowClass}">
                <span>${user.name}</span>
                <span class="leaderboard-rolls">🔄 ${user.rolls}</span>
                <span>${user.score} ⭐</span>
            </li>
        `;
    });
}

// 🚀 СТАРТ ИГРЫ
loadProgress();
updateInventoryUI();
renderLeaderboard();
checkAdCooldown();

