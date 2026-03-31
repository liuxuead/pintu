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
    timerEnabled: false,  // 是否启用计时
    timerDuration: 60,    // 计时时间（秒）
    landscapeEnabled: false, // 是否支持横屏
    uploadedImage: null,  // 上传的图片
    piecesData: []        // 切割后的碎片数据
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
let timerInterval = null; // 计时器
let remainingTime = 0;    // 剩余时间
let countdown = 3;        // 倒计时
let selectedIcon = null;  // 选中的图标

// ==================== 初始化函数 ====================
function initApp() {
    loadIcons();
    setupEventListeners();
}

// 加载图标
function loadIcons() {
    const iconContainer = document.getElementById('iconContainer');
    if (!iconContainer) return;
    
    // 预定义的拼图列表
    const puzzles = [
        { name: 'sgj', width: 3, height: 4, displayName: '三国杀拼图' },
        { name: 'test', width: 3, height: 3, displayName: '测试拼图' }
    ];
    
    puzzles.forEach(puzzle => {
        const iconItem = document.createElement('div');
        iconItem.className = 'icon-item';
        iconItem.dataset.name = puzzle.name;
        iconItem.dataset.width = puzzle.width;
        iconItem.dataset.height = puzzle.height;
        iconItem.onclick = () => selectIcon(iconItem, puzzle);
        
        const img = document.createElement('img');
        img.src = `assets/${puzzle.name}.png`;
        img.alt = puzzle.displayName;
        
        iconItem.appendChild(img);
        iconContainer.appendChild(iconItem);
    });
}

// 选择图标
function selectIcon(iconItem, puzzle) {
    // 移除之前的选中状态
    document.querySelectorAll('.icon-item').forEach(item => item.classList.remove('selected'));
    
    // 设置新的选中状态
    iconItem.classList.add('selected');
    selectedIcon = iconItem;
    
    // 更新预览图
    const selectedImage = document.getElementById('selectedImage');
    if (selectedImage) {
        selectedImage.src = `assets/${puzzle.name}.png`;
    }
    
    // 更新输入框默认值
    document.getElementById('widthInput').value = puzzle.width;
    document.getElementById('heightInput').value = puzzle.height;
    
    // 启用确认按钮
    document.getElementById('confirm-btn').disabled = false;
    
    // 重置上传图片
    CONFIG.uploadedImage = null;
}

// 设置事件监听器
function setupEventListeners() {
    // 计时器复选框
    document.getElementById('timerCheckbox').addEventListener('change', function() {
        const timeSetting = document.getElementById('timeSetting');
        timeSetting.style.display = this.checked ? 'block' : 'none';
    });
    
    // 上传按钮
    document.getElementById('upload-btn').addEventListener('click', uploadImage);
    
    // 确认按钮
    document.getElementById('confirm-btn').addEventListener('click', startGame);
    
    // 倒计时按钮
    document.getElementById('countdown-btn').addEventListener('click', handleCountdown);
    
    // 托盘拖拽事件
    setupDragEvents();
}

// 上传图片
function uploadImage() {
    const fileInput = document.getElementById('imageUpload');
    const file = fileInput.files[0];
    
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const selectedImage = document.getElementById('selectedImage');
        if (selectedImage) {
            selectedImage.src = e.target.result;
        }
        
        // 保存上传的图片
        CONFIG.uploadedImage = e.target.result;
        
        // 启用确认按钮
        document.getElementById('confirm-btn').disabled = false;
        
        // 移除图标的选中状态
        document.querySelectorAll('.icon-item').forEach(item => item.classList.remove('selected'));
        selectedIcon = null;
    };
    reader.readAsDataURL(file);
}

// 开始游戏
function startGame() {
    // 获取参数
    const width = parseInt(document.getElementById('widthInput').value);
    const height = parseInt(document.getElementById('heightInput').value);
    const timerEnabled = document.getElementById('timerCheckbox').checked;
    const timerDuration = parseInt(document.getElementById('timeInput').value);
    const landscapeEnabled = document.getElementById('landscapeCheckbox').checked;
    
    // 更新配置
    CONFIG.currentPuzzleWidth = width;
    CONFIG.currentPuzzleHeight = height;
    CONFIG.timerEnabled = timerEnabled;
    CONFIG.timerDuration = timerDuration;
    CONFIG.landscapeEnabled = landscapeEnabled;
    
    // 生成碎片
    if (CONFIG.uploadedImage) {
        // 使用上传的图片
        generatePiecesFromUploadedImage();
    } else if (selectedIcon) {
        // 使用预定义的图片
        const puzzleName = selectedIcon.dataset.name;
        CONFIG.currentPuzzle = puzzleName;
        
        // 加载预定义图片并生成碎片
        const img = new Image();
        img.onload = function() {
            // 创建Canvas用于切割图片
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // 计算每个碎片的大小
            const pieceWidth = img.width / CONFIG.currentPuzzleWidth;
            const pieceHeight = img.height / CONFIG.currentPuzzleHeight;
            
            // 切割图片
            CONFIG.piecesData = [];
            for (let row = 0; row < CONFIG.currentPuzzleHeight; row++) {
                for (let col = 0; col < CONFIG.currentPuzzleWidth; col++) {
                    canvas.width = pieceWidth;
                    canvas.height = pieceHeight;
                    
                    ctx.drawImage(
                        img, 
                        col * pieceWidth, 
                        row * pieceHeight, 
                        pieceWidth, 
                        pieceHeight, 
                        0, 0, 
                        pieceWidth, 
                        pieceHeight
                    );
                    
                    // 保存碎片数据
                    CONFIG.piecesData.push({
                        id: row * CONFIG.currentPuzzleWidth + col,
                        row: row,
                        col: col,
                        dataUrl: canvas.toDataURL()
                    });
                }
            }
            
            // 初始化游戏
            initGame();
        };
        img.src = `assets/${puzzleName}.png`;
    }
    
    // 切换到游戏界面
    document.getElementById('mainEntry').style.display = 'none';
    document.getElementById('gameInterface').style.display = 'flex';
    
    // 初始化计时器
    if (timerEnabled) {
        remainingTime = timerDuration;
        updateTimerDisplay();
    }
}

// 从上传的图片生成碎片
function generatePiecesFromUploadedImage() {
    const img = new Image();
    img.onload = function() {
        // 创建Canvas用于切割图片
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 计算每个碎片的大小
        const pieceWidth = img.width / CONFIG.currentPuzzleWidth;
        const pieceHeight = img.height / CONFIG.currentPuzzleHeight;
        
        // 切割图片
        CONFIG.piecesData = [];
        for (let row = 0; row < CONFIG.currentPuzzleHeight; row++) {
            for (let col = 0; col < CONFIG.currentPuzzleWidth; col++) {
                canvas.width = pieceWidth;
                canvas.height = pieceHeight;
                
                ctx.drawImage(
                    img, 
                    col * pieceWidth, 
                    row * pieceHeight, 
                    pieceWidth, 
                    pieceHeight, 
                    0, 0, 
                    pieceWidth, 
                    pieceHeight
                );
                
                // 保存碎片数据
                CONFIG.piecesData.push({
                    id: row * CONFIG.currentPuzzleWidth + col,
                    row: row,
                    col: col,
                    dataUrl: canvas.toDataURL()
                });
            }
        }
        
        // 初始化游戏
        initGame();
    };
    img.src = CONFIG.uploadedImage;
}

// 初始化游戏
function initGame() {
    createParts();
    createBoard();
    loadProgress(); // 尝试恢复上次进度
    setupFullImageSwipe(); // 设置全屏图片滑动事件
    
    // 重置状态
    placedCount = 0;
    countdown = 3;
    document.getElementById('countdown-btn').textContent = countdown;
    document.getElementById('countdown-btn').classList.remove('disabled');
}

// 显示全屏图片
function showFullImage() {
    const modal = document.getElementById('fullImageModal');
    const fullImage = document.getElementById('fullImage');
    const previewImg = document.getElementById('previewImg');
    
    if (modal && fullImage && previewImg) {
        fullImage.src = previewImg.src;
        modal.classList.add('active');
    }
}

// 隐藏全屏图片
function hideFullImage() {
    const modal = document.getElementById('fullImageModal');
    const fullImage = document.getElementById('fullImage');
    
    if (modal && fullImage) {
        modal.classList.remove('active');
        fullImage.style.transform = '';
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
    });
    
    // 触摸移动
    fullImage.addEventListener('touchmove', (e) => {
        if (!isSwiping) return;
        
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        
        // 移动图片
        fullImage.style.transform = `translate(${currentX}px, ${currentY}px)`;
    });
    
    // 触摸结束
    fullImage.addEventListener('touchend', (e) => {
        if (!isSwiping) return;
        isSwiping = false;
        fullImage.classList.remove('swiping');
        
        // 计算移动距离
        const distance = Math.sqrt(currentX * currentX + currentY * currentY);
        
        // 如果移动距离超过100像素，关闭全屏图片
        if (distance > 100) {
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
    });
    
    fullImage.addEventListener('mousemove', (e) => {
        if (!isMouseDown) return;
        
        currentX = e.clientX - startX;
        currentY = e.clientY - startY;
        
        fullImage.style.transform = `translate(${currentX}px, ${currentY}px)`;
    });
    
    fullImage.addEventListener('mouseup', (e) => {
        if (!isMouseDown) return;
        isMouseDown = false;
        fullImage.classList.remove('swiping');
        
        const distance = Math.sqrt(currentX * currentX + currentY * currentY);
        
        if (distance > 100) {
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
    
    // 检测是否需要子拼图区
    const board = document.getElementById('mainBoard');
    const boardRect = board.getBoundingClientRect();
    const slotWidthPercent = 100 / CONFIG.currentPuzzleWidth;
    const slotHeightPercent = 100 / CONFIG.currentPuzzleHeight;
    const slotWidth = boardRect.width * slotWidthPercent / 100;
    const slotHeight = boardRect.height * slotHeightPercent / 100;
    const needSubPuzzle = slotWidth < 40 || slotHeight < 40;
    
    // 根据是否需要子拼图区调整碎片大小和托盘容量
    const pieceSize = needSubPuzzle ? 50 : 100;
    const trayCapacity = needSubPuzzle ? 6 : 3; // 数量翻倍
    
    for (let i = 0; i < totalPieces; i++) {
        const row = Math.floor(i / CONFIG.currentPuzzleWidth);
        const col = i % CONFIG.currentPuzzleWidth;
        
        const piece = document.createElement('div');
        piece.className = 'part-item';
        piece.dataset.id = i;
        
        // 设置背景图片
        const pieceData = CONFIG.piecesData.find(p => p.id === i);
        if (pieceData) {
            piece.style.backgroundImage = `url(${pieceData.dataUrl})`;
        }
        
        piece.style.backgroundSize = '100% 100%';
        
        // 调整碎片大小
        if (needSubPuzzle) {
            piece.style.width = `${pieceSize}px`;
            piece.style.height = `${pieceSize}px`;
            piece.style.minWidth = `${pieceSize}px`;
            piece.style.maxWidth = `${pieceSize}px`;
            piece.style.paddingBottom = '0';
        }
        
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
    for (let i = 0; i < allPieces.length; i += trayCapacity) {
        const tray = document.createElement('div');
        tray.className = 'tray';
        
        // 添加托盘编号
        const trayNumber = document.createElement('div');
        trayNumber.className = 'tray-number';
        trayNumber.textContent = Math.floor(i / trayCapacity) + 1;
        tray.appendChild(trayNumber);
        
        const trayPieces = allPieces.slice(i, i + trayCapacity);
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
        if (CONFIG.uploadedImage) {
            previewImg.src = CONFIG.uploadedImage;
        } else {
            previewImg.src = `assets/${CONFIG.currentPuzzle}.png`;
        }
    }
    
    // 计算每个槽位的百分比位置
    const slotWidthPercent = 100 / CONFIG.currentPuzzleWidth;
    const slotHeightPercent = 100 / CONFIG.currentPuzzleHeight;
    
    // 检测格子大小是否小于40像素
    const boardRect = board.getBoundingClientRect();
    const slotWidth = boardRect.width * slotWidthPercent / 100;
    const slotHeight = boardRect.height * slotHeightPercent / 100;
    
    const needSubPuzzle = slotWidth < 40 || slotHeight < 40;
    
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
            
            // 如果需要子拼图区，添加分区编号和双击事件
            if (needSubPuzzle) {
                slot.classList.add('sub-puzzle-slot');
                
                // 添加分区编号
                const partitionNumber = document.createElement('div');
                partitionNumber.className = 'partition-number';
                partitionNumber.textContent = row * CONFIG.currentPuzzleWidth + col + 1;
                slot.appendChild(partitionNumber);
                
                // 双击进入子拼图区
                slot.addEventListener('dblclick', () => {
                    enterSubPuzzle(row, col);
                });
            } else {
                // 点击放置逻辑
                slot.addEventListener('click', handleSlotClick);
                slot.addEventListener('mouseenter', () => {
                    if (selectedPiece) slot.classList.add('highlight');
                });
                slot.addEventListener('mouseleave', () => slot.classList.remove('highlight'));
            }
            
            board.appendChild(slot);
        }
    }
    
    // 如果需要子拼图区，锁死点击按钮
    if (needSubPuzzle) {
        // 锁死倒计时按钮
        document.getElementById('countdown-btn').classList.add('disabled');
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
    if (!container || !trays || trays.length === 0) return;
    
    // 检测当前是否为横屏模式
    function isLandscape() {
        return window.innerWidth > window.innerHeight;
    }
    
    if (isLandscape()) {
        // 横屏模式，垂直拖拽
        const trayHeight = trays[0].getBoundingClientRect().height + 20; // 加上间隙
        const translateY = -currentTrayIndex * trayHeight;
        
        // 强制重排，确保样式能够正确应用
        container.offsetHeight;
        container.style.transform = `translateY(${translateY}px)`;
        container.style.transition = 'transform 0.3s ease';
    } else {
        // 竖屏模式，水平拖拽
        const trayWidth = trays[0].getBoundingClientRect().width + 20; // 加上间隙
        const translateX = -currentTrayIndex * trayWidth;
        
        // 强制重排，确保样式能够正确应用
        container.offsetHeight;
        container.style.transform = `translateX(${translateX}px)`;
        container.style.transition = 'transform 0.3s ease';
    }
}

// 设置拖拽事件
function setupDragEvents() {
    const container = document.getElementById('partsContainer');
    if (!container) return;
    
    // 检测当前是否为横屏模式
    function isLandscape() {
        return window.innerWidth > window.innerHeight;
    }
    
    // 鼠标事件
    container.addEventListener('mousedown', (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        isRightClick = e.button === 2;
        e.preventDefault(); // 阻止右键菜单
    });
    
    container.addEventListener('mousemove', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            
            // 根据屏幕方向处理拖拽
            if (isLandscape()) {
                // 横屏模式，处理垂直拖拽
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    e.preventDefault();
                }
            } else {
                // 竖屏模式，处理水平拖拽
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    e.preventDefault();
                }
            }
        }
    });
    
    container.addEventListener('mouseup', (e) => {
        if (isDragging) {
            const deltaX = e.clientX - startX;
            const deltaY = e.clientY - startY;
            let delta = isLandscape() ? deltaY : deltaX;
            
            const threshold = isLandscape() ? 30 : 30;
            
            if (Math.abs(delta) > threshold) {
                if (delta > 0) {
                    // 横屏：向下拖拽，竖屏：向右拖拽，显示前一个托盘
                    if (currentTrayIndex > 0) {
                        currentTrayIndex -= isRightClick ? Math.min(2, currentTrayIndex) : 1;
                    }
                } else {
                    // 横屏：向上拖拽，竖屏：向左拖拽，显示后一个托盘
                    if (currentTrayIndex < trays.length - 1) {
                        currentTrayIndex += isRightClick ? Math.min(2, trays.length - 1 - currentTrayIndex) : 1;
                    }
                }
                updateTrayDisplay();
            } else {
                // 拖拽距离很小，认为是点击事件
                // 检查是否点击了碎片
                const clickedPiece = e.target.closest('.part-item');
                if (clickedPiece) {
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
        e.preventDefault(); // 阻止默认行为，防止页面滚动
    });
    
    container.addEventListener('touchmove', (e) => {
        if (isDragging) {
            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;
            
            // 根据屏幕方向处理拖拽
            if (isLandscape()) {
                // 横屏模式，处理垂直拖拽
                if (Math.abs(deltaY) > Math.abs(deltaX)) {
                    e.preventDefault(); // 阻止默认行为，确保流畅的拖拽
                }
            } else {
                // 竖屏模式，处理水平拖拽
                if (Math.abs(deltaX) > Math.abs(deltaY)) {
                    e.preventDefault(); // 阻止默认行为，确保流畅的拖拽
                }
            }
        }
    });
    
    container.addEventListener('touchend', (e) => {
        if (isDragging) {
            const deltaX = e.changedTouches[0].clientX - startX;
            const deltaY = e.changedTouches[0].clientY - startY;
            let delta = isLandscape() ? deltaY : deltaX;
            
            const threshold = isLandscape() ? 20 : 20;
            
            if (Math.abs(delta) > threshold) {
                if (delta > 0) {
                    // 横屏：向下拖拽，竖屏：向右拖拽，显示前一个托盘
                    if (currentTrayIndex > 0) {
                        currentTrayIndex -= 1;
                    }
                } else {
                    // 横屏：向上拖拽，竖屏：向左拖拽，显示后一个托盘
                    if (currentTrayIndex < trays.length - 1) {
                        currentTrayIndex += 1;
                    }
                }
                updateTrayDisplay();
            } else {
                // 触摸距离很小，认为是点击事件
                // 检查是否点击了碎片
                const touch = e.changedTouches[0];
                const clickedElement = document.elementFromPoint(touch.clientX, touch.clientY);
                const clickedPiece = clickedElement.closest('.part-item');
                if (clickedPiece) {
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

// 处理倒计时
function handleCountdown() {
    const countdownBtn = document.getElementById('countdown-btn');
    
    if (countdown > 0) {
        countdown--;
        countdownBtn.textContent = countdown;
        
        // 显示碎片编号
        if (countdown === 2) {
            document.querySelectorAll('.piece-number').forEach(num => {
                num.style.display = 'block';
            });
        }
        
        // 开始计时
        if (countdown === 0) {
            countdownBtn.classList.add('disabled');
            startTimer();
        }
    }
}

// 开始计时器
function startTimer() {
    if (!CONFIG.timerEnabled) return;
    
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        remainingTime--;
        updateTimerDisplay();
        
        if (remainingTime <= 0) {
            clearInterval(timerInterval);
            checkCompletion();
        }
    }, 1000);
}

// 更新计时器显示
function updateTimerDisplay() {
    const timerDisplay = document.getElementById('timerDisplay');
    if (timerDisplay) {
        timerDisplay.textContent = `时间: ${remainingTime}s`;
    }
}

// 检查是否完成
function checkCompletion() {
    const totalPieces = CONFIG.currentPuzzleWidth * CONFIG.currentPuzzleHeight;
    if (placedCount < totalPieces) {
        // 未完成，显示提示
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2 style="color: #f44336; margin-bottom: 20px;">⏰ 时间到！</h2>
                <p>很遗憾，您未能在规定时间内完成拼图。</p>
                <button class="reset-btn" onclick="this.parentElement.parentElement.remove();" style="margin-top: 20px;">
                    确定
                </button>
            </div>
        `;
        document.body.appendChild(modal);
        modal.style.display = 'flex';
    }
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
    clearInterval(timerInterval);
    initGame();
}

// ==================== 胜利弹窗 ====================
function showWinModal() {
    clearInterval(timerInterval);
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
        <div class="modal-content">
            <h2 style="color: #4CAF50; margin-bottom: 20px;">🎉 恭喜完成拼图！</h2>
            <p>您成功还原了所有碎片！</p>
            <button class="reset-btn" onclick="this.parentElement.parentElement.remove(); resetGame();" style="margin-top: 20px;">
                再来一局
            </button>
            <button class="reset-btn" onclick="backToHome();" style="margin-top: 10px; background: linear-gradient(135deg, #2196F3, #1976D2);">
                返回主页
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

// 进入子拼图区
function enterSubPuzzle(row, col) {
    // 计算子拼图的索引
    const subPuzzleIndex = row * CONFIG.currentPuzzleWidth + col;
    
    // 显示子拼图区
    const subPuzzle = document.getElementById('subPuzzle');
    subPuzzle.style.display = 'flex';
    
    // 清空子拼图区
    subPuzzle.innerHTML = '';
    
    // 创建子拼图的零件容器
    const partsContainer = document.createElement('div');
    partsContainer.className = 'parts-container';
    partsContainer.id = 'subPartsContainer';
    subPuzzle.appendChild(partsContainer);
    
    // 创建子拼图的主拼图区
    const mainBoard = document.createElement('div');
    mainBoard.className = 'main-board';
    const puzzleContainer = document.createElement('div');
    puzzleContainer.className = 'puzzle-container';
    puzzleContainer.id = 'subMainBoard';
    mainBoard.appendChild(puzzleContainer);
    subPuzzle.appendChild(mainBoard);
    
    // 创建子拼图的控件区
    const controlArea = document.createElement('div');
    controlArea.className = 'control-area';
    
    // 添加计时器显示
    const timerDisplay = document.createElement('div');
    timerDisplay.className = 'timer-display';
    timerDisplay.id = 'subTimerDisplay';
    timerDisplay.textContent = `时间: ${remainingTime}s`;
    controlArea.appendChild(timerDisplay);
    
    // 添加预览图
    const previewImg = document.createElement('img');
    previewImg.id = 'subPreviewImg';
    previewImg.className = 'preview-img';
    previewImg.onclick = showFullImage;
    previewImg.src = document.getElementById('previewImg').src;
    previewImg.alt = '主图预览';
    controlArea.appendChild(previewImg);
    
    // 添加倒计时按钮
    const countdownBtn = document.createElement('div');
    countdownBtn.className = 'countdown-btn';
    countdownBtn.id = 'subCountdownBtn';
    countdownBtn.textContent = countdown;
    countdownBtn.onclick = handleSubCountdown;
    if (countdown === 0) {
        countdownBtn.classList.add('disabled');
    }
    controlArea.appendChild(countdownBtn);
    
    // 添加退回提示
    const backHome = document.createElement('div');
    backHome.className = 'back-home';
    backHome.ondblclick = exitSubPuzzle;
    backHome.textContent = '双击此处退回';
    controlArea.appendChild(backHome);
    
    subPuzzle.appendChild(controlArea);
    
    // 生成子拼图的碎片（数量翻倍，大小减半）
    generateSubPuzzlePieces(subPuzzleIndex);
    
    // 创建子拼图的网格
    createSubPuzzleBoard();
}

// 生成子拼图的碎片
function generateSubPuzzlePieces(subPuzzleIndex) {
    const container = document.getElementById('subPartsContainer');
    if (!container) return;
    
    // 计算子拼图的行列
    const row = Math.floor(subPuzzleIndex / CONFIG.currentPuzzleWidth);
    const col = subPuzzleIndex % CONFIG.currentPuzzleWidth;
    
    // 生成所有碎片（数量翻倍）
    const allPieces = [];
    const totalPieces = 4; // 2x2子拼图
    
    for (let i = 0; i < totalPieces; i++) {
        const subRow = Math.floor(i / 2);
        const subCol = i % 2;
        
        const piece = document.createElement('div');
        piece.className = 'part-item';
        piece.dataset.id = i;
        piece.dataset.subRow = subRow;
        piece.dataset.subCol = subCol;
        piece.dataset.parentRow = row;
        piece.dataset.parentCol = col;
        
        // 设置背景图片
        if (CONFIG.uploadedImage) {
            // 使用上传图片的碎片
            const parentPiece = CONFIG.piecesData.find(p => p.id === subPuzzleIndex);
            if (parentPiece) {
                // 切割父碎片为更小的碎片
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    const pieceWidth = img.width / 2;
                    const pieceHeight = img.height / 2;
                    
                    canvas.width = pieceWidth;
                    canvas.height = pieceHeight;
                    
                    ctx.drawImage(
                        img, 
                        subCol * pieceWidth, 
                        subRow * pieceHeight, 
                        pieceWidth, 
                        pieceHeight, 
                        0, 0, 
                        pieceWidth, 
                        pieceHeight
                    );
                    
                    piece.style.backgroundImage = `url(${canvas.toDataURL()})`;
                };
                img.src = parentPiece.dataUrl;
            }
        } else {
            // 使用预定义图片的碎片
            // 这里需要根据实际情况调整路径
            piece.style.backgroundImage = `url('assets/${CONFIG.currentPuzzle}_${CONFIG.currentPuzzleWidth}_${CONFIG.currentPuzzleHeight}/pieces/${CONFIG.currentPuzzle}_${row}_${col}.png')`;
        }
        
        piece.style.backgroundSize = '100% 100%';
        piece.style.width = '50px';
        piece.style.height = '50px';
        piece.style.minWidth = '50px';
        piece.style.maxWidth = '50px';
        piece.style.paddingBottom = '0';
        
        // 添加编号显示
        const number = document.createElement('div');
        number.className = 'piece-number';
        number.textContent = i + 1;
        piece.appendChild(number);
        
        // 点击选择逻辑
        piece.addEventListener('click', handleSubPieceClick);
        
        allPieces.push(piece);
    }
    
    // 打乱碎片顺序
    shuffleArray(allPieces);
    
    // 创建托盘并分配碎片
    const tray = document.createElement('div');
    tray.className = 'tray';
    
    // 添加托盘编号
    const trayNumber = document.createElement('div');
    trayNumber.className = 'tray-number';
    trayNumber.textContent = 1;
    tray.appendChild(trayNumber);
    
    allPieces.forEach(piece => {
        tray.appendChild(piece);
    });
    
    container.appendChild(tray);
}

// 创建子拼图的网格
function createSubPuzzleBoard() {
    const board = document.getElementById('subMainBoard');
    if (!board) return;
    board.innerHTML = '';
    
    // 2x2子拼图
    const subWidth = 2;
    const subHeight = 2;
    
    // 计算每个槽位的百分比位置
    const slotWidthPercent = 100 / subWidth;
    const slotHeightPercent = 100 / subHeight;
    
    for (let row = 0; row < subHeight; row++) {
        for (let col = 0; col < subWidth; col++) {
            const slot = document.createElement('div');
            slot.className = 'puzzle-slot';
            slot.dataset.row = row;
            slot.dataset.col = col;
            slot.dataset.expectedId = row * subWidth + col;
            slot.style.left = `${col * slotWidthPercent}%`;
            slot.style.top = `${row * slotHeightPercent}%`;
            slot.style.width = `${slotWidthPercent}%`;
            slot.style.height = `${slotHeightPercent}%`;
            
            // 添加槽位编号
            const slotNumber = document.createElement('div');
            slotNumber.className = 'slot-number';
            slotNumber.textContent = row * subWidth + col + 1;
            slot.appendChild(slotNumber);
            
            // 点击放置逻辑
            slot.addEventListener('click', handleSubSlotClick);
            slot.addEventListener('mouseenter', () => {
                if (selectedSubPiece) slot.classList.add('highlight');
            });
            slot.addEventListener('mouseleave', () => slot.classList.remove('highlight'));
            
            board.appendChild(slot);
        }
    }
}

// 处理子拼图的碎片点击
let selectedSubPiece = null;
let subPlacedCount = 0;

function handleSubPieceClick(e) {
    // 清除之前的选择状态
    document.querySelectorAll('#subPartsContainer .part-item').forEach(p => p.classList.remove('selected'));
    
    // 设置新的选中项
    const clickedPiece = e.target.closest('.part-item');
    clickedPiece.classList.add('selected');
    selectedSubPiece = clickedPiece;
}

// 处理子拼图的槽位点击
function handleSubSlotClick(e) {
    const targetSlot = e.currentTarget;
    if (!selectedSubPiece || targetSlot.classList.contains('filled')) return;
    
    // 获取预期的正确位置ID
    const expectedId = parseInt(targetSlot.dataset.expectedId);
    const actualId = parseInt(selectedSubPiece.dataset.id);
    
    if (actualId === expectedId) {
        // 正确位置 -> 执行放置
        placeSubPiece(selectedSubPiece, targetSlot);
    } else {
        // 错误位置 -> 震动提示
        targetSlot.classList.add('shake');
        setTimeout(() => targetSlot.classList.remove('shake'), 500);
    }
}

// 放置子拼图的碎片
function placeSubPiece(piece, slot) {
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
    
    subPlacedCount++;
    
    // 清除选择状态
    piece.classList.remove('selected');
    selectedSubPiece = null;
    
    // 胜利检测
    if (subPlacedCount === 4) { // 2x2子拼图
        // 子拼图完成，同步数据回主区
        syncSubPuzzleData();
        exitSubPuzzle();
    }
}

// 同步子拼图数据回主区
function syncSubPuzzleData() {
    // 这里可以添加同步逻辑，例如更新主区的对应格子状态
    console.log('同步子拼图数据回主区');
}

// 退出子拼图区
function exitSubPuzzle() {
    // 隐藏子拼图区
    document.getElementById('subPuzzle').style.display = 'none';
    
    // 重置子拼图状态
    selectedSubPiece = null;
    subPlacedCount = 0;
    
    // 同步数据回主区
    syncSubPuzzleData();
}

// 处理子拼图的倒计时
function handleSubCountdown() {
    const countdownBtn = document.getElementById('subCountdownBtn');
    
    if (countdown > 0) {
        countdown--;
        countdownBtn.textContent = countdown;
        
        // 显示碎片编号
        if (countdown === 2) {
            document.querySelectorAll('#subPartsContainer .piece-number').forEach(num => {
                num.style.display = 'block';
            });
        }
        
        // 开始计时
        if (countdown === 0) {
            countdownBtn.classList.add('disabled');
            startTimer();
        }
    }
}

// ==================== 返回主页 ====================
function backToHome() {
    // 清除当前拼板数据
    localStorage.removeItem('puzzle_game_save');
    clearInterval(timerInterval);
    
    // 切换到主进入界面
    document.getElementById('gameInterface').style.display = 'none';
    document.getElementById('mainEntry').style.display = 'grid';
    
    // 重置状态
    placedCount = 0;
    selectedPiece = null;
    currentTrayIndex = 0;
    countdown = 3;
    selectedIcon = null;
    CONFIG.uploadedImage = null;
    CONFIG.piecesData = [];
    
    // 重置输入框
    document.getElementById('widthInput').value = 3;
    document.getElementById('heightInput').value = 3;
    document.getElementById('timerCheckbox').checked = false;
    document.getElementById('timeSetting').style.display = 'none';
    document.getElementById('timeInput').value = 60;
    document.getElementById('landscapeCheckbox').checked = false;
    document.getElementById('confirm-btn').disabled = true;
    document.getElementById('selectedImage').src = '';
    document.getElementById('imageUpload').value = '';
    
    // 移除图标的选中状态
    document.querySelectorAll('.icon-item').forEach(item => item.classList.remove('selected'));
}

// ==================== 启动应用 ====================
window.addEventListener('DOMContentLoaded', initApp);
