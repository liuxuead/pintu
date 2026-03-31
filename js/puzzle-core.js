// ==================== 配置参数 ====================
let CONFIG = {
    gridSize: 3,          // 网格数量 (3x3)
    pieceWidth: 100,      // 单个碎片宽度
    pieceHeight: 100,     // 单个碎片高度
    boardWidth: 300,      // 主拼图区宽度
    boardHeight: 300,     // 主拼图区高度
    trayCapacity: 3,      // 每个托盘容量
    currentPuzzle: 'sgj', // 当前拼图名称
    currentPuzzleWidth: 6, // 当前拼图水平块数（6）
    currentPuzzleHeight: 10, // 当前拼图垂直块数（10）
    currentImagePath: 'assets/sgj.png' // 当前选中的图片路径
};

// 当前选中的图片
let selectedImagePath = 'assets/fd.png';

// 页面加载时恢复上次选择的图片
window.addEventListener('DOMContentLoaded', () => {
    const savedImage = localStorage.getItem('puzzle_game_last_image');
    if (savedImage) {
        selectedImagePath = savedImage;
        
        // 更新选中状态
        document.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('selected');
            if (item.dataset.image === savedImage) {
                item.classList.add('selected');
            }
        });
    }
    
    // 页面加载时不自动初始化游戏，等待用户点击开始按钮
});

// 图片选择函数
function selectImage(element) {
    // 移除所有选中状态
    document.querySelectorAll('.image-item').forEach(item => {
        item.classList.remove('selected');
    });
    
    // 添加选中状态
    element.classList.add('selected');
    
    // 更新选中的图片路径
    selectedImagePath = element.dataset.image;
    
    // 保存到localStorage
    localStorage.setItem('puzzle_game_last_image', selectedImagePath);
}

// 处理图片上传
function handleImageUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
        showAlertModal('请选择图片文件！');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageUrl = e.target.result;
        
        // 创建新的图片项
        const imageList = document.querySelector('.image-list');
        const newImageItem = document.createElement('div');
        newImageItem.className = 'image-item selected';
        newImageItem.dataset.image = imageUrl;
        newImageItem.onclick = function() { selectImage(this); };
        
        newImageItem.innerHTML = `
            <img src="${imageUrl}" alt="上传图片">
            <div class="image-label">我的图片</div>
        `;
        
        // 移除所有选中状态
        document.querySelectorAll('.image-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        // 添加到图片列表
        imageList.appendChild(newImageItem);
        
        // 更新选中的图片
        selectedImagePath = imageUrl;
        localStorage.setItem('puzzle_game_last_image', selectedImagePath);
        
        // 滚动到底部显示新上传的图片
        imageList.scrollTop = imageList.scrollHeight;
    };
    
    reader.readAsDataURL(file);
    
    // 清空input，允许再次上传相同文件
    input.value = '';
}

// 切换计时时间输入框显示
function toggleTimerInput() {
    const checkbox = document.getElementById('timerCheckbox');
    const container = document.getElementById('timerTimeContainer');
    
    if (checkbox.checked) {
        container.style.display = 'flex';
    } else {
        container.style.display = 'none';
    }
}

// 格式化时间显示 HH:MM:SS
function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

// 更新游戏计时器显示
function updateGameTimerDisplay() {
    const timerElement = document.getElementById('gameTimer');
    if (timerElement) {
        timerElement.textContent = formatTime(remainingTime);
    }
}

// 开始游戏计时器
function startGameTimer() {
    if (!isTimerEnabled) return;
    
    // 清除之前的计时器
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
    
    // 更新显示
    updateGameTimerDisplay();
    
    // 启动新计时器
    gameTimer = setInterval(() => {
        remainingTime--;
        updateGameTimerDisplay();
        
        // 时间到！
        if (remainingTime <= 0) {
            clearInterval(gameTimer);
            gameTimer = null;
            showFailModal();
        }
    }, 1000);
}

// 停止游戏计时器
function stopGameTimer() {
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }
}

// 显示挑战失败弹窗
function showFailModal() {
    // 检查是否已存在弹窗
    if (document.getElementById('failModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'failModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 style="color: #e74c3c; margin-bottom: 20px;">挑战失败</h2>
            <p>很遗憾，时间到了！</p>
            <p>再接再厉，下次一定能成功！</p>
            <button class="modal-button" onclick="handleFailConfirm()">返回主界面</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// 处理失败确认
function handleFailConfirm() {
    const modal = document.getElementById('failModal');
    if (modal) {
        modal.remove();
    }
    backToStartScreen();
}

// ==================== 分区规则配置 ====================
const PARTITION_RULES = {
    // X横向分法（最大4）
    x: {
        5: [3, 2],
        6: [3, 3],
        7: [4, 3],
        8: [4, 4],
        9: [3, 3, 3],
        10: [4, 3, 3],
        11: [4, 4, 3],
        12: [4, 4, 4],
        13: [4, 3, 3, 3],
        14: [4, 4, 3, 3],
        15: [4, 4, 4, 3],
        16: [4, 4, 4, 4]
    },
    // Y竖向分法（最大5）
    y: {
        6: [3, 3],
        7: [4, 3],
        8: [4, 4],
        9: [5, 4],
        10: [5, 5],
        11: [4, 4, 3],
        12: [4, 4, 4],
        13: [5, 4, 4],
        14: [5, 5, 4],
        15: [5, 5, 5],
        16: [4, 4, 4, 4],
        17: [5, 4, 4, 4],
        18: [5, 5, 4, 4],
        19: [5, 5, 5, 4],
        20: [5, 5, 5, 5],
        21: [5, 4, 4, 4, 4],
        22: [5, 5, 4, 4, 4],
        23: [5, 5, 5, 4, 4],
        24: [5, 5, 5, 5, 4],
        25: [5, 5, 5, 5, 5]
    }
};

// ==================== 全局变量 ====================
let selectedPiece = null; // 当前选中的零件
let placedCount = 0;      // 已正确放置的数量
let currentSubPuzzle = null; // 当前子拼图区域
let partitionedPieces = {};  // 分区放置状态 { globalId: true/false }
let placedPiecesData = {};   // 已放置的碎片数据 { globalId: { imageUrl: string, id: number } }
let trays = [];           // 托盘数组
let currentTrayIndex = 0; // 当前显示的托盘索引
let isDragging = false;   // 是否正在拖拽
let startX = 0;           // 拖拽起始X坐标
let startY = 0;           // 拖拽起始Y坐标
let isRightClick = false; // 是否是右键拖拽
let hintCount = 3;        // 提示次数计数
let hintTimer = null;     // 提示计时器
let isHintActive = false; // 提示是否激活

// 游戏计时器相关
let isTimerEnabled = false; // 是否启用计时
let gameTimer = null;       // 游戏计时器
let remainingTime = 0;      // 剩余时间（秒）

// ==================== 初始化函数 ====================
function initGame() {
    // 初始化显示状态：隐藏返回提示，显示返回入口
    const returnHint = document.getElementById('returnHint');
    if (returnHint) {
        returnHint.style.display = 'none';
    }
    const backToStartBtn = document.getElementById('backToStart');
    if (backToStartBtn) {
        backToStartBtn.style.display = 'flex';
    }
    
    loadProgress(); // 先尝试恢复上次进度
    createParts();    // 再创建零件
    createBoard();    // 再创建拼图区
    setupDragEvents();
    setupFullImageSwipe(); // 设置全屏图片滑动事件
    setupGapAreaEvents(); // 设置间隔区域事件
    
    // 如果启用了计时，开始或继续计时器
    if (isTimerEnabled) {
        updateGameTimerDisplay();
        startGameTimer();
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

// 创建零件区和托盘
function createParts() {
    const container = document.getElementById('partsContainer');
    container.innerHTML = '';
    
    // 生成所有碎片
    const allPieces = [];
    const totalPieces = CONFIG.currentPuzzleWidth * CONFIG.currentPuzzleHeight;
    for (let i = 0; i < totalPieces; i++) {
        // 如果已经放置了，不添加到托盘
        if (placedPiecesData[i]) {
            continue;
        }
        
        const row = Math.floor(i / CONFIG.currentPuzzleWidth);
        const col = i % CONFIG.currentPuzzleWidth;
        
        const piece = document.createElement('div');
        piece.className = 'part-item';
        piece.dataset.id = i;
        // 使用原始图片并通过背景定位实现实时碎块
        piece.style.backgroundImage = `url('${CONFIG.currentImagePath}')`;
        piece.style.backgroundSize = `${CONFIG.currentPuzzleWidth * 100}% ${CONFIG.currentPuzzleHeight * 100}%`;
        piece.style.backgroundPosition = `${(col / (CONFIG.currentPuzzleWidth - 1)) * 100}% ${(row / (CONFIG.currentPuzzleHeight - 1)) * 100}%`;
        
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

// 判断是否需要分区
function needsPartition() {
    return CONFIG.currentPuzzleWidth > 4 || CONFIG.currentPuzzleHeight > 5;
}

// 获取分区规则
function getPartitionRules(width, height) {
    const xRules = PARTITION_RULES.x[width];
    const yRules = PARTITION_RULES.y[height];
    return { x: xRules || [width], y: yRules || [height] };
}

// 创建分区网格
function createPartitionGrid(board, rules) {
    const grid = document.createElement('div');
    grid.className = 'partition-grid';
    
    let currentY = 0;
    let partitionIndex = 0;
    
    rules.y.forEach((ySize, yIdx) => {
        let currentX = 0;
        
        rules.x.forEach((xSize, xIdx) => {
            const cell = document.createElement('div');
            cell.className = 'partition-cell';
            cell.dataset.partitionIndex = partitionIndex;
            cell.dataset.xStart = currentX;
            cell.dataset.xSize = xSize;
            cell.dataset.yStart = currentY;
            cell.dataset.ySize = ySize;
            
            const cellWidthPercent = (xSize / CONFIG.currentPuzzleWidth) * 100;
            const cellHeightPercent = (ySize / CONFIG.currentPuzzleHeight) * 100;
            const cellLeftPercent = (currentX / CONFIG.currentPuzzleWidth) * 100;
            const cellTopPercent = (currentY / CONFIG.currentPuzzleHeight) * 100;
            
            cell.style.left = `${cellLeftPercent}%`;
            cell.style.top = `${cellTopPercent}%`;
            cell.style.width = `${cellWidthPercent}%`;
            cell.style.height = `${cellHeightPercent}%`;
            
            // 添加分区标签
            const label = document.createElement('div');
            label.className = 'partition-label';
            label.textContent = partitionIndex + 1;
            cell.appendChild(label);
            
            // 双击进入子拼图区
            cell.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                enterSubPuzzle(partitionIndex, cell.dataset);
            });
            
            grid.appendChild(cell);
            
            currentX += xSize;
            partitionIndex++;
        });
        
        currentY += ySize;
    });
    
    board.appendChild(grid);
}

// 进入子拼图区
function enterSubPuzzle(index, data) {
    currentSubPuzzle = {
        index,
        xStart: parseInt(data.xStart),
        xSize: parseInt(data.xSize),
        yStart: parseInt(data.yStart),
        ySize: parseInt(data.ySize)
    };
    
    // 隐藏主拼图区，显示子拼图区和间隔区域
    document.getElementById('mainBoardArea').classList.add('hidden');
    document.getElementById('subBoardArea').classList.add('active');
    document.getElementById('gapArea').classList.add('active');
    
    // 显示返回提示
    const returnHint = document.getElementById('returnHint');
    if (returnHint) {
        returnHint.style.display = 'flex';
    }
    
    // 隐藏返回入口按钮
    const backToStartBtn = document.getElementById('backToStart');
    if (backToStartBtn) {
        backToStartBtn.style.display = 'none';
    }
    
    // 创建子拼图区
    createSubBoard();
}

// 返回主拼图区
function returnToMainBoard() {
    currentSubPuzzle = null;
    
    // 隐藏子拼图区和间隔区域，显示主拼图区
    document.getElementById('mainBoardArea').classList.remove('hidden');
    document.getElementById('subBoardArea').classList.remove('active');
    document.getElementById('gapArea').classList.remove('active');
    
    // 隐藏返回提示
    const returnHint = document.getElementById('returnHint');
    if (returnHint) {
        returnHint.style.display = 'none';
    }
    
    // 显示返回入口按钮
    const backToStartBtn = document.getElementById('backToStart');
    if (backToStartBtn) {
        backToStartBtn.style.display = 'flex';
    }
    
    // 重新渲染主拼图区，显示已完成的分区
    createBoard();
}

// 创建子拼图区
function createSubBoard() {
    const board = document.getElementById('subBoard');
    board.innerHTML = '';
    
    const { xStart, xSize, yStart, ySize } = currentSubPuzzle;
    
    // 计算每个槽位的百分比位置
    const slotWidthPercent = 100 / xSize;
    const slotHeightPercent = 100 / ySize;
    
    for (let localRow = 0; localRow < ySize; localRow++) {
        for (let localCol = 0; localCol < xSize; localCol++) {
            const globalRow = yStart + localRow;
            const globalCol = xStart + localCol;
            const globalId = globalRow * CONFIG.currentPuzzleWidth + globalCol;
            
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.row = localRow;
            slot.dataset.col = localCol;
            slot.dataset.globalId = globalId;
            slot.style.left = `${localCol * slotWidthPercent}%`;
            slot.style.top = `${localRow * slotHeightPercent}%`;
            slot.style.width = `${slotWidthPercent}%`;
            slot.style.height = `${slotHeightPercent}%`;
            
            // 检查是否已放置，如果是，显示碎片
            if (placedPiecesData[globalId]) {
                slot.classList.add('filled');
                const piece = createPlacedPiece(placedPiecesData[globalId]);
                slot.appendChild(piece);
            } else {
                // 未放置时显示编号
                const slotNumber = document.createElement('div');
                slotNumber.className = 'slot-number';
                slotNumber.textContent = globalId + 1;
                slot.appendChild(slotNumber);
            }
            
            // 点击放置逻辑（只在未放置时有效）
            if (!placedPiecesData[globalId]) {
                slot.addEventListener('click', (e) => handleSubSlotClick(e, globalId));
                slot.addEventListener('mouseenter', () => {
                    if (selectedPiece) slot.classList.add('highlight');
                });
                slot.addEventListener('mouseleave', () => slot.classList.remove('highlight'));
            }
            
            board.appendChild(slot);
        }
    }
}

// 处理子拼图区的槽位点击
function handleSubSlotClick(e, globalId) {
    const targetSlot = e.currentTarget;
    if (!selectedPiece || targetSlot.classList.contains('filled')) return;
    
    const actualId = parseInt(selectedPiece.dataset.id);
    
    if (actualId === globalId) {
        // 正确位置 -> 执行放置
        placeSubPiece(selectedPiece, targetSlot, globalId);
    } else {
        // 错误位置 -> 震动提示
        targetSlot.classList.add('shake');
        setTimeout(() => targetSlot.classList.remove('shake'), 500);
    }
}

// 放置子拼图碎片
function placeSubPiece(piece, slot, globalId) {
    piece.remove();
    slot.appendChild(piece);
    slot.classList.add('filled');
    
    // 调整碎块大小
    const slotRect = slot.getBoundingClientRect();
    piece.style.width = `${slotRect.width}px`;
    piece.style.height = `${slotRect.height}px`;
    piece.style.minWidth = 'unset';
    piece.style.maxWidth = 'unset';
    
    // 保存分区放置状态和碎片数据
    partitionedPieces[globalId] = true;
    placedPiecesData[globalId] = {
        imageUrl: piece.style.backgroundImage,
        backgroundSize: piece.style.backgroundSize,
        backgroundPosition: piece.style.backgroundPosition,
        id: parseInt(piece.dataset.id)
    };
    
    // 双人模式：同步给对方
    if (isMultiplayer) {
        sendPiecePlaced(globalId, placedPiecesData[globalId]);
    }
    
    // 清除选择状态
    piece.classList.remove('selected');
    selectedPiece = null;
    
    // 检查分区是否完成
    checkPartitionComplete();
    
    saveProgress();
}

// 检查分区是否完成
function checkPartitionComplete() {
    const { xStart, xSize, yStart, ySize } = currentSubPuzzle;
    let allPlaced = true;
    
    for (let row = yStart; row < yStart + ySize; row++) {
        for (let col = xStart; col < xStart + xSize; col++) {
            const globalId = row * CONFIG.currentPuzzleWidth + col;
            if (!partitionedPieces[globalId]) {
                allPlaced = false;
                break;
            }
        }
        if (!allPlaced) break;
    }
    
    if (allPlaced) {
        // 分区完成，可以自动返回或等待用户返回
        console.log('分区完成！');
    }
}

// 创建主拼图区网格
function createBoard() {
    const board = document.getElementById('mainBoard');
    board.innerHTML = '';
    
    // 更新主图预览
    const previewImg = document.getElementById('previewImg');
    if (previewImg) {
        previewImg.src = CONFIG.currentImagePath;
    }
    
    // 先创建所有小格子
    const slotWidthPercent = 100 / CONFIG.currentPuzzleWidth;
    const slotHeightPercent = 100 / CONFIG.currentPuzzleHeight;
    
    for (let row = 0; row < CONFIG.currentPuzzleHeight; row++) {
        for (let col = 0; col < CONFIG.currentPuzzleWidth; col++) {
            const globalId = row * CONFIG.currentPuzzleWidth + col;
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.row = row;
            slot.dataset.col = col;
            slot.dataset.expectedId = globalId;
            slot.style.left = `${col * slotWidthPercent}%`;
            slot.style.top = `${row * slotHeightPercent}%`;
            slot.style.width = `${slotWidthPercent}%`;
            slot.style.height = `${slotHeightPercent}%`;
            
            // 如果已放置，显示碎片
            if (placedPiecesData[globalId]) {
                slot.classList.add('filled');
                const piece = createPlacedPiece(placedPiecesData[globalId]);
                slot.appendChild(piece);
            } else {
                // 只在未放置时显示编号
                const slotNumber = document.createElement('div');
                slotNumber.className = 'slot-number';
                slotNumber.textContent = globalId + 1;
                slot.appendChild(slotNumber);
            }
            
            board.appendChild(slot);
        }
    }
    
    // 判断是否需要分区
    if (needsPartition()) {
        const rules = getPartitionRules(CONFIG.currentPuzzleWidth, CONFIG.currentPuzzleHeight);
        
        // 创建分区网格（在小格子之上）
        createPartitionGrid(board, rules);
        
        // 渲染已完成的分区
        renderCompletedPartitions(board, rules);
    } else {
        // 不需要分区，给小格子添加点击事件
        const slots = board.querySelectorAll('.puzzle-slot');
        slots.forEach(slot => {
            slot.addEventListener('click', handleSlotClick);
            slot.addEventListener('mouseenter', () => {
                if (selectedPiece) slot.classList.add('highlight');
            });
            slot.addEventListener('mouseleave', () => slot.classList.remove('highlight'));
        });
    }
}

// 创建已放置的碎片元素
function createPlacedPiece(data) {
    const piece = document.createElement('div');
    piece.className = 'part-item';
    piece.dataset.id = data.id;
    piece.style.backgroundImage = data.imageUrl;
    // 使用保存的完整样式信息
    if (data.backgroundSize) {
        piece.style.backgroundSize = data.backgroundSize;
    }
    if (data.backgroundPosition) {
        piece.style.backgroundPosition = data.backgroundPosition;
    }
    piece.style.backgroundRepeat = 'no-repeat';
    piece.style.width = '100%';
    piece.style.height = '100%';
    piece.style.minWidth = 'unset';
    piece.style.maxWidth = 'unset';
    return piece;
}

// 渲染已完成的分区
function renderCompletedPartitions(board, rules) {
    const partitionCells = board.querySelectorAll('.partition-cell');
    
    partitionCells.forEach(cell => {
        const index = parseInt(cell.dataset.partitionIndex);
        const xStart = parseInt(cell.dataset.xStart);
        const xSize = parseInt(cell.dataset.xSize);
        const yStart = parseInt(cell.dataset.yStart);
        const ySize = parseInt(cell.dataset.ySize);
        
        let allPlaced = true;
        for (let row = yStart; row < yStart + ySize; row++) {
            for (let col = xStart; col < xStart + xSize; col++) {
                const globalId = row * CONFIG.currentPuzzleWidth + col;
                if (!partitionedPieces[globalId]) {
                    allPlaced = false;
                    break;
                }
            }
            if (!allPlaced) break;
        }
        
        if (allPlaced) {
            cell.classList.add('completed');
        }
    });
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
    // 获取全局ID
    const globalId = parseInt(slot.dataset.expectedId);
    
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
    // 保持背景定位和大小正确
    piece.style.backgroundSize = `${CONFIG.currentPuzzleWidth * 100}% ${CONFIG.currentPuzzleHeight * 100}%`;
    
    // 保存放置状态和碎片数据
    if (!needsPartition()) {
        partitionedPieces[globalId] = true;
        placedPiecesData[globalId] = {
            imageUrl: piece.style.backgroundImage,
            backgroundSize: piece.style.backgroundSize,
            backgroundPosition: piece.style.backgroundPosition,
            id: parseInt(piece.dataset.id)
        };
    }
    
    placedCount++;
    saveProgress();
    
    // 双人模式：同步给对方
    if (isMultiplayer) {
        sendPiecePlaced(globalId, placedPiecesData[globalId]);
    }
    
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
        imagePath: CONFIG.currentImagePath,
        puzzleWidth: CONFIG.currentPuzzleWidth,
        puzzleHeight: CONFIG.currentPuzzleHeight,
        placedIds: Array.from(document.querySelectorAll('.puzzle-slot.filled .part-item')).map(el => el.dataset.id),
        totalPlaced: placedCount,
        partitionedPieces: partitionedPieces,
        placedPiecesData: placedPiecesData,
        isTimerEnabled: isTimerEnabled,
        remainingTime: remainingTime
    };
    localStorage.setItem('puzzle_game_save', JSON.stringify(state));
}

function loadProgress() {
    const saved = localStorage.getItem('puzzle_game_save');
    if (!saved) return;
    
    const state = JSON.parse(saved);
    placedCount = state.totalPlaced || 0;
    partitionedPieces = state.partitionedPieces || {};
    placedPiecesData = state.placedPiecesData || {};
    isTimerEnabled = state.isTimerEnabled || false;
    remainingTime = state.remainingTime || 0;
}

// ==================== 重置游戏 ====================
function resetGame() {
    // 停止游戏计时器
    stopGameTimer();
    
    localStorage.removeItem('puzzle_game_save');
    placedCount = 0;
    selectedPiece = null;
    currentTrayIndex = 0;
    currentSubPuzzle = null;
    partitionedPieces = {};
    placedPiecesData = {};
    isTimerEnabled = false;
    remainingTime = 0;
    initGame();
}

// ==================== 胜利弹窗 ====================
function showWinModal() {
    // 停止游戏计时器
    stopGameTimer();
    
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

// 设置间隔区域事件
function setupGapAreaEvents() {
    const gapArea = document.getElementById('gapArea');
    const returnHint = document.getElementById('returnHint');
    
    if (gapArea) {
        // 双击返回
        gapArea.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (currentSubPuzzle) {
                returnToMainBoard();
            }
        });
        
        // 单击也返回（更方便）
        gapArea.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentSubPuzzle) {
                returnToMainBoard();
            }
        });
    }
    
    if (returnHint) {
        // 单击返回提示也返回
        returnHint.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentSubPuzzle) {
                returnToMainBoard();
            }
        });
        
        // 双击返回提示也返回
        returnHint.addEventListener('dblclick', (e) => {
            e.stopPropagation();
            if (currentSubPuzzle) {
                returnToMainBoard();
            }
        });
    }
}

// ==================== 提示按钮功能 ====================
function handleHintClick() {
    if (isHintActive || hintCount <= 0) return;
    
    const button = document.getElementById('hintButton');
    const countDisplay = document.getElementById('hintCount');
    const timerDisplay = document.getElementById('hintTimer');
    
    // 根据计数确定倒计时秒数
    let seconds;
    switch (hintCount) {
        case 3:
            seconds = 10;
            break;
        case 2:
            seconds = 8;
            break;
        case 1:
            seconds = 5;
            break;
        default:
            return;
    }
    
    // 激活提示状态
    isHintActive = true;
    button.classList.add('active');
    
    // 显示编号
    showPieceNumbers();
    
    // 开始倒计时
    let remaining = seconds;
    timerDisplay.textContent = remaining + 's';
    
    hintTimer = setInterval(() => {
        remaining--;
        timerDisplay.textContent = remaining + 's';
        
        if (remaining <= 0) {
            // 时间到
            clearInterval(hintTimer);
            hintTimer = null;
            isHintActive = false;
            button.classList.remove('active');
            timerDisplay.textContent = '';
            
            // 隐藏编号
            hidePieceNumbers();
            
            // 减少计数
            hintCount--;
            countDisplay.textContent = hintCount;
            
            // 如果计数为0，禁用按钮
            if (hintCount <= 0) {
                button.classList.add('disabled');
            }
        }
    }, 1000);
}

// 显示托盘碎块编号
function showPieceNumbers() {
    const numbers = document.querySelectorAll('.piece-number');
    numbers.forEach(num => {
        num.classList.add('visible');
    });
}

// 隐藏托盘碎块编号
function hidePieceNumbers() {
    const numbers = document.querySelectorAll('.piece-number');
    numbers.forEach(num => {
        num.classList.remove('visible');
    });
}

// ==================== 启动游戏 ====================
// 开始游戏函数
function startGame() {
    // 读取用户设置的参数
    const widthInput = document.getElementById('widthInput');
    const heightInput = document.getElementById('heightInput');
    const timerCheckbox = document.getElementById('timerCheckbox');
    const timerTimeInput = document.getElementById('timerTimeInput');
    
    let width = 6;
    let height = 10;
    
    if (widthInput && heightInput) {
        width = parseInt(widthInput.value) || 6;
        height = parseInt(heightInput.value) || 10;
    }
    
    // 检测是否超出范围
    if (width > 16 || height > 25) {
        showAlertModal('超出范围，无法实现切割');
        return;
    }
    
    CONFIG.currentPuzzleWidth = width;
    CONFIG.currentPuzzleHeight = height;
    
    // 更新当前图片路径
    CONFIG.currentImagePath = selectedImagePath;
    
    // 检查是否有保存的进度
    let hasExistingProgress = false;
    const saved = localStorage.getItem('puzzle_game_save');
    if (saved) {
        const state = JSON.parse(saved);
        // 检查图片和尺寸是否一致
        if (state.imagePath === CONFIG.currentImagePath && 
            state.puzzleWidth === CONFIG.currentPuzzleWidth && 
            state.puzzleHeight === CONFIG.currentPuzzleHeight) {
            hasExistingProgress = true;
        }
    }
    
    // 如果图片或尺寸变了，清除旧进度
    if (!hasExistingProgress) {
        localStorage.removeItem('puzzle_game_save');
        placedCount = 0;
        partitionedPieces = {};
        placedPiecesData = {};
        isTimerEnabled = false;
        remainingTime = 0;
    }
    
    // 读取计时设置（如果有旧进度，用旧的；否则用新的）
    if (!hasExistingProgress) {
        isTimerEnabled = timerCheckbox && timerCheckbox.checked;
        if (isTimerEnabled && timerTimeInput) {
            const minutes = parseInt(timerTimeInput.value) || 10;
            remainingTime = minutes * 60;
        } else {
            remainingTime = 0;
        }
    }
    
    // 隐藏主界面，显示游戏界面
    document.getElementById('startScreen').style.display = 'none';
    document.getElementById('gameScreen').style.display = 'block';
    
    // 初始化游戏
    initGame();
    
    // 如果有旧进度，恢复；否则如果启用了计时，开始计时器
    if (!hasExistingProgress && isTimerEnabled) {
        startGameTimer();
    }
}

// 显示提示弹窗
function showAlertModal(message) {
    // 检查是否已存在弹窗
    if (document.getElementById('alertModal')) return;
    
    const modal = document.createElement('div');
    modal.id = 'alertModal';
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 style="color: #f39c12; margin-bottom: 20px;">提示</h2>
            <p>${message}</p>
            <button class="modal-button" style="background: linear-gradient(135deg, #f39c12, #e67e22);" onclick="closeAlertModal()">知道了</button>
        </div>
    `;
    document.body.appendChild(modal);
    modal.style.display = 'flex';
}

// 关闭提示弹窗
function closeAlertModal() {
    const modal = document.getElementById('alertModal');
    if (modal) {
        modal.remove();
    }
}

// 返回入口界面函数
function backToStartScreen() {
    // 先保存进度再返回
    saveProgress();
    
    // 停止游戏计时器
    stopGameTimer();
    
    // 隐藏游戏界面，显示主界面
    document.getElementById('gameScreen').style.display = 'none';
    document.getElementById('startScreen').style.display = 'flex';
    
    // 不调用resetGame()，保留游戏状态
}

// ==================== 双人模式功能 ====================
let peerConnection = null;
let dataChannel = null;
let isMultiplayer = false;
let scannerStream = null;

// 显示双人模式弹窗
function showMultiplayerModal() {
    console.log('双人模式被点击了');
    
    const modal = document.getElementById('multiplayerModal');
    console.log('找到弹窗:', modal);
    
    if (modal) {
        modal.style.display = 'flex';
        console.log('弹窗显示状态设置为flex');
        resetMultiplayerUI();
    } else {
        console.error('找不到双人模式弹窗元素');
        showAlertModal('双人模式弹窗加载失败，请刷新页面重试');
    }
}

// 关闭双人模式弹窗
function closeMultiplayerModal() {
    document.getElementById('multiplayerModal').style.display = 'none';
    stopScanner();
    resetMultiplayerUI();
}

// 重置双人模式UI
function resetMultiplayerUI() {
    document.getElementById('multiplayerStep1').style.display = 'block';
    document.getElementById('multiplayerStep2').style.display = 'none';
    document.getElementById('multiplayerStep3').style.display = 'none';
}

// 创建房间
async function createRoom() {
    document.getElementById('multiplayerStep1').style.display = 'none';
    document.getElementById('multiplayerStep2').style.display = 'block';
    
    // 创建WebRTC连接
    peerConnection = new RTCPeerConnection({
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' }
        ]
    });
    
    // 创建数据通道
    dataChannel = peerConnection.createDataChannel('puzzle');
    setupDataChannel(dataChannel);
    
    // 创建Offer
    const offer = await peerConnection.createOffer();
    await peerConnection.setLocalDescription(offer);
    
    // 等待ICE候选收集完成
    await new Promise(resolve => {
        if (peerConnection.iceGatheringState === 'complete') {
            resolve();
        } else {
            peerConnection.addEventListener('icegatheringstatechange', () => {
                if (peerConnection.iceGatheringState === 'complete') {
                    resolve();
                }
            });
        }
    });
    
    // 显示房间码
    const roomCode = JSON.stringify(peerConnection.localDescription);
    document.getElementById('roomCodeDisplay').textContent = roomCode;
    
    // 监听连接状态
    peerConnection.addEventListener('connectionstatechange', () => {
        if (peerConnection.connectionState === 'connected') {
            document.getElementById('connectionStatus').textContent = '✅ 连接成功！';
            setTimeout(() => {
                closeMultiplayerModal();
                startMultiplayerGame();
            }, 1000);
        }
    });
}

// 复制房间码
function copyRoomCode() {
    const code = document.getElementById('roomCodeDisplay').textContent;
    navigator.clipboard.writeText(code).then(() => {
        showAlertModal('房间码已复制！');
    }).catch(() => {
        showAlertModal('复制失败，请手动复制');
    });
}

// 提交对方的房间码
async function submitPeerCode() {
    const peerCode = document.getElementById('peerCodeInput').value.trim();
    if (!peerCode) {
        showAlertModal('请输入对方的房间码');
        return;
    }
    
    console.log('收到的房间码:', peerCode.substring(0, 100) + '...');
    
    try {
        const answer = JSON.parse(peerCode);
        console.log('解析成功:', answer.type);
        await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        document.getElementById('connectionStatus').textContent = '正在连接...';
    } catch (error) {
        console.error('处理房间码失败:', error);
        showAlertModal('房间码格式错误: ' + error.message);
    }
}

// 加入房间
function joinRoom() {
    document.getElementById('multiplayerStep1').style.display = 'none';
    document.getElementById('multiplayerStep3').style.display = 'block';
}

// 提交加入房间码
async function submitJoinCode() {
    const joinCode = document.getElementById('joinCodeInput').value.trim();
    if (!joinCode) {
        showAlertModal('请输入对方的房间码');
        return;
    }
    
    try {
        const offer = JSON.parse(joinCode);
        
        // 创建WebRTC连接
        peerConnection = new RTCPeerConnection({
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' }
            ]
        });
        
        // 监听数据通道
        peerConnection.addEventListener('datachannel', (event) => {
            dataChannel = event.channel;
            setupDataChannel(dataChannel);
        });
        
        // 监听连接状态
        peerConnection.addEventListener('connectionstatechange', () => {
            if (peerConnection.connectionState === 'connected') {
                closeMultiplayerModal();
                startMultiplayerGame();
            }
        });
        
        // 设置远程描述
        await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        // 等待ICE候选收集完成
        await new Promise(resolve => {
            if (peerConnection.iceGatheringState === 'complete') {
                resolve();
            } else {
                peerConnection.addEventListener('icegatheringstatechange', () => {
                    if (peerConnection.iceGatheringState === 'complete') {
                        resolve();
                    }
                });
            }
        });
        
        // 显示Answer码，让创建者复制
        document.getElementById('multiplayerStep3').style.display = 'none';
        document.getElementById('multiplayerStep2').style.display = 'block';
        document.getElementById('roomCodeDisplay').textContent = JSON.stringify(peerConnection.localDescription);
        document.getElementById('connectionStatus').textContent = '请把你的房间码发给对方';
        document.getElementById('peerCodeInput').style.display = 'none';
        document.querySelector('button[onclick="submitPeerCode()"]').style.display = 'none';
        
    } catch (error) {
        console.error('加入房间失败:', error);
        showAlertModal('房间码格式错误，请检查');
    }
}

// 设置数据通道
function setupDataChannel(channel) {
    channel.onopen = () => {
        console.log('数据通道已打开');
        isMultiplayer = true;
    };
    
    channel.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleRemoteMessage(data);
    };
    
    channel.onclose = () => {
        console.log('数据通道已关闭');
        isMultiplayer = false;
    };
}

// 处理远程消息
function handleRemoteMessage(data) {
    switch (data.type) {
        case 'piece_placed':
            handleRemotePiecePlaced(data);
            break;
        case 'sync_state':
            handleRemoteSync(data);
            break;
    }
}

// 处理远程放置碎块
function handleRemotePiecePlaced(data) {
    const globalId = data.globalId;
    const pieceData = data.pieceData;
    
    if (!placedPiecesData[globalId]) {
        placedPiecesData[globalId] = pieceData;
        partitionedPieces[globalId] = true;
        placedCount++;
        createBoard();
        createParts();
        saveProgress();
    }
}

// 同步状态给对方
function syncStateToRemote() {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: 'sync_state',
            placedPiecesData: placedPiecesData,
            placedCount: placedCount,
            imagePath: CONFIG.currentImagePath,
            puzzleWidth: CONFIG.currentPuzzleWidth,
            puzzleHeight: CONFIG.currentPuzzleHeight
        }));
    }
}

// 处理远程同步
function handleRemoteSync(data) {
    if (data.imagePath === CONFIG.currentImagePath &&
        data.puzzleWidth === CONFIG.currentPuzzleWidth &&
        data.puzzleHeight === CONFIG.currentPuzzleHeight) {
        placedPiecesData = data.placedPiecesData || {};
        placedCount = data.placedCount || 0;
        createBoard();
        createParts();
    }
}

// 发送放置碎块消息
function sendPiecePlaced(globalId, pieceData) {
    if (dataChannel && dataChannel.readyState === 'open') {
        dataChannel.send(JSON.stringify({
            type: 'piece_placed',
            globalId: globalId,
            pieceData: pieceData
        }));
    }
}

// 取消连接
function cancelConnection() {
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }
    if (dataChannel) {
        dataChannel.close();
        dataChannel = null;
    }
    resetMultiplayerUI();
}

// 开始双人游戏
function startMultiplayerGame() {
    isMultiplayer = true;
    startGame();
    
    // 延迟同步状态
    setTimeout(() => {
        syncStateToRemote();
    }, 1000);
}
