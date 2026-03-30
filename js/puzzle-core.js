// ==================== 配置参数 ====================
const CONFIG = {
    gridSize: 5,          // 网格数量 (5x5)
    pieceWidth: 80,       // 单个碎片宽度
    pieceHeight: 80,      // 单个碎片高度
    boardWidth: 400,      // 主拼图区宽度
    boardHeight: 400,     // 主拼图区高度
    trayCapacity: 3,      // 每个托盘容量
};

// ==================== 全局变量 ====================
let selectedPiece = null; // 当前选中的零件
let placedCount = 0;      // 已正确放置的数量
let trays = [];           // 托盘数组
let currentTrayIndex = 0; // 当前显示的托盘索引
let isDragging = false;   // 是否正在拖拽
let startX = 0;           // 拖拽起始X坐标
let startY = 0;           // 拖拽起始Y坐标
let isRightClick = false; // 是否是右键拖拽

// ==================== 初始化函数 ====================
function initGame() {
    createParts();
    createBoard();
    loadProgress(); // 尝试恢复上次进度
    setupDragEvents();
}

// 创建零件区和托盘
function createParts() {
    const container = document.getElementById('partsContainer');
    container.innerHTML = '';
    
    // 生成所有碎片
    const allPieces = [];
    for (let i = 0; i < CONFIG.gridSize * CONFIG.gridSize; i++) {
        const row = Math.floor(i / CONFIG.gridSize);
        const col = i % CONFIG.gridSize;
        
        const piece = document.createElement('div');
        piece.className = 'part-item';
        piece.dataset.id = i;
        piece.style.backgroundPosition = `-${col * CONFIG.pieceWidth}px -${row * CONFIG.pieceHeight}px`;
        
        // 添加编号显示
        const number = document.createElement('div');
        number.className = 'piece-number';
        number.textContent = i + 1;
        piece.appendChild(number);
        
        // 点击选择逻辑
        piece.addEventListener('click', handlePieceClick);
        
        allPieces.push(piece);
    }
    
    // 打乱碎片顺序
    shuffleArray(allPieces);
    
    // 创建托盘并分配碎片
    trays = [];
    for (let i = 0; i < allPieces.length; i += CONFIG.trayCapacity) {
        const tray = document.createElement('div');
        tray.className = 'tray';
        
        const trayPieces = allPieces.slice(i, i + CONFIG.trayCapacity);
        trayPieces.forEach(piece => {
            tray.appendChild(piece);
        });
        
        container.appendChild(tray);
        trays.push(tray);
    }
    
    // 初始显示第一个托盘
    updateTrayDisplay();
}

// 创建主拼图区网格
function createBoard() {
    const board = document.getElementById('mainBoard');
    board.innerHTML = '';
    
    for (let row = 0; row < CONFIG.gridSize; row++) {
        for (let col = 0; col < CONFIG.gridSize; col++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.row = row;
            slot.dataset.col = col;
            slot.dataset.expectedId = row * CONFIG.gridSize + col;
            slot.style.left = `${col * CONFIG.pieceWidth}px`;
            slot.style.top = `${row * CONFIG.pieceHeight}px`;
            
            // 添加槽位编号
            const slotNumber = document.createElement('div');
            slotNumber.className = 'slot-number';
            slotNumber.textContent = row * CONFIG.gridSize + col + 1;
            slot.appendChild(slotNumber);
            
            // 点击放置逻辑
            slot.addEventListener('click', handleSlotClick);
            slot.addEventListener('mouseenter', () => {
                if (selectedPiece) slot.classList.add('highlight');
            });
            slot.addEventListener('mouseleave', () => slot.classList.remove('highlight'));
            
            board.appendChild(slot);
        }
    }
}

// 随机打乱数组
function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
}

// 更新托盘显示
function updateTrayDisplay() {
    const container = document.getElementById('partsContainer');
    const containerWidth = container.offsetWidth;
    const trayWidth = trays[0].offsetWidth + 20; // 加上间隙
    
    const translateX = -currentTrayIndex * trayWidth;
    container.style.transform = `translateX(${translateX}px)`;
    container.style.transition = 'transform 0.3s ease';
}

// 设置拖拽事件
function setupDragEvents() {
    const container = document.getElementById('partsContainer');
    
    // 鼠标事件
    container.addEventListener('mousedown', (e) => {
        if (e.target === container || e.target.classList.contains('tray')) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            isRightClick = e.button === 2;
            e.preventDefault(); // 阻止右键菜单
        }
    });
    
    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // 只处理水平拖拽
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }
    });
    
    container.addEventListener('mouseup', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            
            if (Math.abs(deltaX) > 50) { // 拖拽阈值
                if (deltaX > 0) {
                    // 向右拖拽，显示前一个托盘
                    if (currentTrayIndex > 0) {
                        currentTrayIndex -= isRightClick ? Math.min(2, currentTrayIndex) : 1;
                    }
                } else {
                    // 向左拖拽，显示后一个托盘
                    if (currentTrayIndex < trays.length - 1) {
                        currentTrayIndex += isRightClick ? Math.min(2, trays.length - 1 - currentTrayIndex) : 1;
                    }
                }
                updateTrayDisplay();
            }
            
            isDragging = false;
        }
    });
    
    // 触摸事件
    container.addEventListener('touchstart', (e) => {
        if (e.target === container || e.target.classList.contains('tray')) {
            isDragging = true;
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        }
    });
    
    container.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            
            // 只处理水平拖拽
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }
    });
    
    container.addEventListener('touchend', (e) => {
        if (isDragging) {
            const deltaX = e.changedTouches[0].clientX - startX;
            
            if (Math.abs(deltaX) > 50) { // 拖拽阈值
                if (deltaX > 0) {
                    // 向右拖拽，显示前一个托盘
                    if (currentTrayIndex > 0) {
                        currentTrayIndex -= 1;
                    }
                } else {
                    // 向左拖拽，显示后一个托盘
                    if (currentTrayIndex < trays.length - 1) {
                        currentTrayIndex += 1;
                    }
                }
                updateTrayDisplay();
            }
            
            isDragging = false;
        }
    });
    
    // 阻止右键菜单
    container.addEventListener('contextmenu', (e) => {
        e.preventDefault();
    });
}

// ==================== 点击选择零件 ====================
function handlePieceClick(e) {
    // 清除之前的选择状态
    document.querySelectorAll('.part-item').forEach(p => p.classList.remove('selected'));
    
    // 设置新的选中项
    const clickedPiece = e.target.closest('.part-item');
    clickedPiece.classList.add('selected');
    selectedPiece = clickedPiece;
}

// ==================== 点击放置到槽位 ====================
function handleSlotClick(e) {
    const targetSlot = e.currentTarget;
    if (!selectedPiece || targetSlot.classList.contains('filled')) return;
    
    // 获取预期的正确位置ID
    const expectedId = parseInt(targetSlot.dataset.expectedId);
    const actualId = parseInt(selectedPiece.dataset.id);
    
    if (actualId === expectedId) {
        // 正确位置 -> 执行放置
        placePiece(selectedPiece, targetSlot);
    } else {
        // 错误位置 -> 震动提示
        targetSlot.classList.add('shake');
        setTimeout(() => targetSlot.classList.remove('shake'), 500);
    }
}

// ==================== 公共放置函数（核心）====================
function placePiece(piece, slot) {
    // 关键操作：立即从零件区移除该元素
    piece.remove();
    
    // 将零件放入拼图区
    slot.appendChild(piece);
    slot.classList.add('filled');
    placedCount++;
    saveProgress();
    
    // 清除选择状态
    piece.classList.remove('selected');
    selectedPiece = null;
    
    // 胜利检测
    if (placedCount === CONFIG.gridSize * CONFIG.gridSize) {
        showWinModal();
    }
}

// ==================== 数据持久化 ====================
function saveProgress() {
    const state = {
        placedIds: Array.from(document.querySelectorAll('.puzzle-slot.filled .part-item')).map(el => el.dataset.id),
        totalPlaced: placedCount
    };
    localStorage.setItem('puzzle_game_save', JSON.stringify(state));
}

function loadProgress() {
    const saved = localStorage.getItem('puzzle_game_save');
    if (!saved) return;
    
    const state = JSON.parse(saved);
    placedCount = state.totalPlaced || 0;
    
    // 恢复已放置的零件
    state.placedIds.forEach(id => {
        const piece = document.querySelector(`.part-item[data-id="${id}"]`);
        const targetSlot = document.querySelector(`.puzzle-slot[data-expected-id="${id}"]`);
        if (piece && targetSlot && !targetSlot.contains(piece)) {
            targetSlot.appendChild(piece);
            targetSlot.classList.add('filled');
        }
    });
}

// ==================== 重置游戏 ====================
function resetGame() {
    localStorage.removeItem('puzzle_game_save');
    placedCount = 0;
    selectedPiece = null;
    currentTrayIndex = 0;
    initGame();
}

// ==================== 胜利弹窗 ====================
function showWinModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 style="color: #4CAF50; margin-bottom: 20px;">🎉 恭喜完成拼图！</h2>
            <p>您成功还原了所有碎片！</p>
            <button class="reset-btn" onclick="this.parentElement.parentElement.remove(); resetGame();" style="margin-top: 20px;">
                再来一局
            </button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
    
    // 点击外部关闭弹窗
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });
}

// ==================== 启动游戏 ====================
window.addEventListener('DOMContentLoaded', initGame);