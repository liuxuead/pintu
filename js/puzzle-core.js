// ==================== 配置参数 ====================
const CONFIG = {
    gridSize: 3,          // 网格数量 (3x3)
    pieceWidth: 100,      // 单个碎片宽度
    pieceHeight: 100,     // 单个碎片高度
    boardWidth: 300,      // 主拼图区宽度
    boardHeight: 300,     // 主拼图区高度
    trayCapacity: 3,      // 每个托盘容量
    currentPuzzle: 'sgj', // 当前拼图名称
    currentPuzzleWidth: 3, // 当前拼图水平块数
    currentPuzzleHeight: 4, // 当前拼图垂直块数
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
    loadPuzzles(); // 加载拼图列表
    setupFullImageSwipe(); // 设置全屏图片滑动事件
}

// 显示拼图选择器
function showPuzzleSelector() {
    console.log('显示拼图选择器');
    const selectorMenu = document.getElementById('selectorMenu');
    console.log('选择菜单元素:', selectorMenu);
    if (selectorMenu) {
        selectorMenu.classList.add('active');
        console.log('选择菜单类名:', selectorMenu.className);
    }
}

// 隐藏拼图选择器
function hidePuzzleSelector() {
    console.log('隐藏拼图选择器');
    const selectorMenu = document.getElementById('selectorMenu');
    console.log('选择菜单元素:', selectorMenu);
    if (selectorMenu) {
        selectorMenu.classList.remove('active');
        console.log('选择菜单类名:', selectorMenu.className);
    }
}

// 显示全屏图片
function showFullImage() {
    console.log('显示全屏图片');
    const modal = document.getElementById('fullImageModal');
    const fullImage = document.getElementById('fullImage');
    const previewImg = document.getElementById('previewImg');
    
    if (modal && fullImage && previewImg) {
        fullImage.src = previewImg.src;
        modal.classList.add('active');
        console.log('全屏图片显示成功');
    }
}

// 隐藏全屏图片
function hideFullImage() {
    console.log('隐藏全屏图片');
    const modal = document.getElementById('fullImageModal');
    const fullImage = document.getElementById('fullImage');
    
    if (modal && fullImage) {
        modal.classList.remove('active');
        fullImage.style.transform = '';
        console.log('全屏图片隐藏成功');
    }
}

// 设置全屏图片滑动事件
function setupFullImageSwipe() {
    const fullImage = document.getElementById('fullImage');
    if (!fullImage) return;
    
    let startX = 0;
    let startY = 0;
    let currentX = 0;
    let currentY = 0;
    let isSwiping = false;
    
    // 触摸开始
    fullImage.addEventListener('touchstart', (e) => {
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        isSwiping = true;
        fullImage.classList.add('swiping');
        console.log('触摸开始:', startX, startY);
    });
    
    // 触摸移动
    fullImage.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        
        // 移动图片
        fullImage.style.transform = `translate(${currentX}px, ${currentY}px)`;
        console.log('触摸移动:', currentX, currentY);
    });
    
    // 触摸结束
    fullImage.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        fullImage.classList.remove('swiping');
        
        // 计算移动距离
        const distance = Math.sqrt(currentX * currentX + currentY * currentY);
        console.log('触摸结束，移动距离:', distance);
        
        // 如果移动距离超过100像素，关闭全屏图片
        if (distance > 100) {
            console.log('滑动距离超过100像素，关闭全屏图片');
            hideFullImage();
        } else {
            // 否则恢复原位
            fullImage.style.transform = '';
        }
        
        currentX = 0;
        currentY = 0;
    });
    
    // 鼠标事件（用于PC端测试）
    let isMouseDown = false;
    
    fullImage.addEventListener('mousedown', (e) => {
        startX = e.clientX;
        startY = e.clientY;
        isMouseDown = true;
        fullImage.classList.add('swiping');
        console.log('鼠标按下:', startX, startY);
    });
    
    fullImage.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        
        fullImage.style.transform = `translate(${currentX}px, ${currentY}px)`;
        console.log('鼠标移动:', currentX, currentY);
    });
    
    fullImage.addEventListener('mouseup', (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
        fullImage.classList.remove('swiping');
        
        const distance = Math.sqrt(currentX * currentX + currentY * currentY);
        console.log('鼠标释放，移动距离:', distance);
        
        if (distance > 100) {
            console.log('滑动距离超过100像素，关闭全屏图片');
            hideFullImage();
        } else {
            fullImage.style.transform = '';
        }
        
        currentX = 0;
        currentY = 0;
    });
    
    fullImage.addEventListener('mouseleave', () => {
        if (isMouseDown) {
            isMouseDown = false;
            fullImage.classList.remove('swiping');
            fullImage.style.transform = '';
            currentX = 0;
            currentY = 0;
        }
    });
}

// 加载拼图列表
function loadPuzzles() {
    console.log('加载拼图列表');
    const puzzleList = document.getElementById('puzzleList');
    console.log('菜单内容元素:', puzzleList);
    if (!puzzleList) return;
    
    console.log('清空菜单内容');
    puzzleList.innerHTML = '';
    
    // 尝试通过Fetch API获取assets目录下的文件夹
    console.log('尝试获取assets目录内容');
    
    // 本地运行时使用的默认拼图列表
    const localPuzzles = [
        { name: 'sgj', width: 3, height: 4, displayName: '三国杀拼图' },
        { name: 'test', width: 3, height: 3, displayName: '测试拼图' }
    ];
    
    // 渲染拼图列表的辅助函数
    function renderPuzzles(puzzles) {
        console.log('渲染拼图列表:', puzzles);
        puzzles.forEach(puzzle => {
            console.log('添加拼图:', puzzle);
            const puzzleItem = document.createElement('div');
            puzzleItem.className = 'puzzle-item';
            puzzleItem.onclick = () => selectPuzzle(puzzle.name, puzzle.width, puzzle.height);
            
            puzzleItem.innerHTML = `
                <h4>${puzzle.displayName}</h4>
                <p>${puzzle.width} × ${puzzle.height}</p>
            `;
            
            puzzleList.appendChild(puzzleItem);
            console.log('拼图选项添加成功');
        });
        console.log('拼图列表加载完成');
    }
    
    // 尝试从GitHub Pages获取目录列表
    fetch('assets/')
        .then(response => {
            if (!response.ok) {
                throw new Error('无法获取目录内容');
            }
            return response.text();
        })
        .then(html => {
            console.log('获取到目录内容，开始解析');
            // 解析HTML响应，提取文件夹名称
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const links = doc.querySelectorAll('a');
            
            const puzzles = [];
            
            links.forEach(link => {
                let folderName = link.textContent.trim();
                // 获取href属性中的文件名
                const href = link.getAttribute('href');
                if (href) {
                    // 从href中提取文件名
                    const urlParts = href.split('/');
                    const lastPart = urlParts[urlParts.length - 1];
                    if (lastPart && lastPart !== '') {
                        folderName = lastPart.replace(/\/$/, '');
                    }
                }
                
                // 过滤掉当前目录、上级目录和pieces文件夹
                if (folderName === '..' || folderName === '.' || folderName === 'pieces' || folderName === '') {
                    return;
                }
                
                // 解析文件夹名称，格式为 name_width_height
                const match = folderName.match(/^([a-zA-Z0-9_]+)_(\d+)_(\d+)$/);
                if (match) {
                    const name = match[1];
                    const width = parseInt(match[2]);
                    const height = parseInt(match[3]);
                    const displayName = name.charAt(0).toUpperCase() + name.slice(1);
                    
                    puzzles.push({ name, width, height, displayName });
                    console.log('解析到拼图:', { name, width, height, displayName });
                }
            });
            
            // 如果找到了拼图，渲染它们；否则使用本地默认拼图
            if (puzzles.length > 0) {
                console.log('从GitHub Pages加载到拼图');
                renderPuzzles(puzzles);
            } else {
                console.log('未从GitHub Pages加载到拼图，使用本地默认拼图');
                renderPuzzles(localPuzzles);
            }
        })
        .catch(error => {
            console.error('获取目录内容失败:', error);
            console.log('使用本地默认拼图列表');
            // 如果获取失败，使用本地默认拼图
            renderPuzzles(localPuzzles);
        });
}

// 选择拼图
function selectPuzzle(name, width, height) {
    CONFIG.currentPuzzle = name;
    CONFIG.currentPuzzleWidth = width;
    CONFIG.currentPuzzleHeight = height;
    
    // 重新初始化游戏
    initGame();
    hidePuzzleSelector();
}

// 创建零件区和托盘
function createParts() {
    const container = document.getElementById('partsContainer');
    container.innerHTML = '';
    
    // 生成所有碎片
    const allPieces = [];
    const totalPieces = CONFIG.currentPuzzleWidth * CONFIG.currentPuzzleHeight;
    for (let i = 0; i < totalPieces; i++) {
        const row = Math.floor(i / CONFIG.currentPuzzleWidth);
        const col = i % CONFIG.currentPuzzleWidth;
        
        const piece = document.createElement('div');
        piece.className = 'part-item';
        piece.dataset.id = i;
        // 使用 assets/{puzzleName}_{width}_{height}/pieces 目录下的图片文件
        piece.style.backgroundImage = `url('assets/${CONFIG.currentPuzzle}_${CONFIG.currentPuzzleWidth}_${CONFIG.currentPuzzleHeight}/pieces/${CONFIG.currentPuzzle}_${row}_${col}.png')`;
        piece.style.backgroundSize = 'cover';
        
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
        
        // 添加托盘编号
        const trayNumber = document.createElement('div');
        trayNumber.className = 'tray-number';
        trayNumber.textContent = Math.floor(i / CONFIG.trayCapacity) + 1;
        tray.appendChild(trayNumber);
        
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
    
    // 更新主图预览
    const previewImg = document.getElementById('previewImg');
    if (previewImg) {
        previewImg.src = `assets/${CONFIG.currentPuzzle}_${CONFIG.currentPuzzleWidth}_${CONFIG.currentPuzzleHeight}/${CONFIG.currentPuzzle}.png`;
    }
    
    // 计算每个槽位的百分比位置
    const slotWidthPercent = 100 / CONFIG.currentPuzzleWidth;
    const slotHeightPercent = 100 / CONFIG.currentPuzzleHeight;
    
    for (let row = 0; row < CONFIG.currentPuzzleHeight; row++) {
        for (let col = 0; col < CONFIG.currentPuzzleWidth; col++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.row = row;
            slot.dataset.col = col;
            slot.dataset.expectedId = row * CONFIG.currentPuzzleWidth + col;
            slot.style.left = `${col * slotWidthPercent}%`;
            slot.style.top = `${row * slotHeightPercent}%`;
            slot.style.width = `${slotWidthPercent}%`;
            slot.style.height = `${slotHeightPercent}%`;
            
            // 添加槽位编号
            const slotNumber = document.createElement('div');
            slotNumber.className = 'slot-number';
            slotNumber.textContent = row * CONFIG.currentPuzzleWidth + col + 1;
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
    if (!container || !trays || trays.length === 0) {
        console.error('Container or trays not found');
        return;
    }
    
    // 直接获取托盘的实际宽度，包括所有内边距和边框
    const trayWidth = trays[0].getBoundingClientRect().width + 20; // 加上间隙
    
    const translateX = -currentTrayIndex * trayWidth;
    console.log('Update tray display:', { trayWidth, currentTrayIndex, translateX });
    
    // 强制重排，确保样式能够正确应用
    container.offsetHeight;
    container.style.transform = `translateX(${translateX}px)`;
    container.style.transition = 'transform 0.3s ease';
    
    // 验证样式是否被正确应用
    setTimeout(() => {
        console.log('Container transform:', container.style.transform);
    }, 100);
}

// 设置拖拽事件
function setupDragEvents() {
    const container = document.getElementById('partsContainer');
    
    // 鼠标事件
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        isRightClick = e.button === 2;
        console.log('Mouse down:', { startX, startY, isRightClick });
        e.preventDefault(); // 阻止右键菜单
    });
    
    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            console.log('Mouse move:', { deltaX, deltaY });
            
            // 只处理水平拖拽
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault();
            }
        }
    });
    
    container.addEventListener('mouseup', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            console.log('Mouse up:', { deltaX, currentTrayIndex, traysLength: trays.length });
            
            if (Math.abs(deltaX) > 30) { // 降低拖拽阈值
                if (deltaX > 0) {
                    // 向右拖拽，显示前一个托盘
                    if (currentTrayIndex > 0) {
                        currentTrayIndex -= isRightClick ? Math.min(2, currentTrayIndex) : 1;
                        console.log('After right drag:', { currentTrayIndex });
                    }
                } else {
                    // 向左拖拽，显示后一个托盘
                    if (currentTrayIndex < trays.length - 1) {
                        currentTrayIndex += isRightClick ? Math.min(2, trays.length - 1 - currentTrayIndex) : 1;
                        console.log('After left drag:', { currentTrayIndex });
                    }
                }
                updateTrayDisplay();
                console.log('Tray display updated');
            } else {
                // 拖拽距离很小，认为是点击事件
                console.log('Click detected, not drag');
                // 检查是否点击了碎片
                const clickedPiece = e.target.closest('.part-item');
                if (clickedPiece) {
                    console.log('Piece clicked:', clickedPiece.dataset.id);
                    // 手动触发点击事件
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    clickedPiece.dispatchEvent(clickEvent);
                }
            }
            
            isDragging = false;
        }
    });
    
    // 触摸事件
    container.addEventListener('touchstart', (e) => {
        isDragging = true;
        startX = e.touches[0].clientX;
        startY = e.touches[0].clientY;
        console.log('Touch start:', { startX, startY });
        e.preventDefault(); // 阻止默认行为，防止页面滚动
    });
    
    container.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            console.log('Touch move:', { deltaX, deltaY });
            
            // 只处理水平拖拽
            if (Math.abs(deltaX) > Math.abs(deltaY)) {
                e.preventDefault(); // 阻止默认行为，确保流畅的拖拽
            }
        }
    });
    
    container.addEventListener('touchend', (e) => {
        if (isDragging) {
            const deltaX = e.changedTouches[0].clientX - startX;
            console.log('Touch end:', { deltaX, currentTrayIndex, traysLength: trays.length });
            
            if (Math.abs(deltaX) > 20) { // 进一步降低拖拽阈值，提高灵敏度
                if (deltaX > 0) {
                    // 向右拖拽，显示前一个托盘
                    if (currentTrayIndex > 0) {
                        currentTrayIndex -= 1;
                        console.log('After right touch drag:', { currentTrayIndex });
                    }
                } else {
                    // 向左拖拽，显示后一个托盘
                    if (currentTrayIndex < trays.length - 1) {
                        currentTrayIndex += 1;
                        console.log('After left touch drag:', { currentTrayIndex });
                    }
                }
                updateTrayDisplay();
                console.log('Tray display updated');
            } else {
                // 触摸距离很小，认为是点击事件
                console.log('Touch click detected, not drag');
                // 检查是否点击了碎片
                const touch = e.changedTouches[0];
                const clickedElement = document.elementFromPoint(touch.clientX, touch.clientY);
                const clickedPiece = clickedElement.closest('.part-item');
                if (clickedPiece) {
                    console.log('Piece touched:', clickedPiece.dataset.id);
                    // 手动触发点击事件
                    const clickEvent = new MouseEvent('click', {
                        bubbles: true,
                        cancelable: true,
                        view: window
                    });
                    clickedPiece.dispatchEvent(clickEvent);
                }
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
    
    // 调整碎块大小以适应槽位
    const slotRect = slot.getBoundingClientRect();
    piece.style.width = `${slotRect.width}px`;
    piece.style.height = `${slotRect.height}px`;
    piece.style.minWidth = 'unset';
    piece.style.maxWidth = 'unset';
    piece.style.aspectRatio = 'unset';
    piece.style.paddingBottom = '0';
    piece.style.backgroundSize = '100% 100%';
    
    placedCount++;
    saveProgress();
    
    // 清除选择状态
    piece.classList.remove('selected');
    selectedPiece = null;
    
    // 胜利检测
    const totalPieces = CONFIG.currentPuzzleWidth * CONFIG.currentPuzzleHeight;
    if (placedCount === totalPieces) {
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