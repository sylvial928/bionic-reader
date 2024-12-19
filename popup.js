// 获取设置元素
const enabledToggle = document.getElementById('enabled');
const boldPercentageInput = document.getElementById('boldPercentage');
const boldPercentageValue = document.getElementById('boldPercentageValue');
const minWordLengthInput = document.getElementById('minWordLength');
const minWordLengthValue = document.getElementById('minWordLengthValue');
const previewText = document.getElementById('previewText');

// 更新预览文本
function updatePreview() {
    const text = "The quick brown fox jumps over the lazy dog.";
    const boldPercentage = parseFloat(boldPercentageInput.value);
    const minWordLength = parseInt(minWordLengthInput.value);
    
    const bionicText = text.replace(/\b[a-zA-Z]+\b/g, word => {
        if (word.length < minWordLength) return word;
        
        const boldLength = Math.ceil(word.length * boldPercentage);
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
        
        return `<strong>${boldPart}</strong>${normalPart}`;
    });
    
    previewText.innerHTML = enabledToggle.checked ? bionicText : text;
}

// 保存设置
function saveSettings() {
    const settings = {
        enabled: enabledToggle.checked,
        boldPercentage: parseFloat(boldPercentageInput.value),
        minWordLength: parseInt(minWordLengthInput.value)
    };
    
    chrome.storage.sync.set(settings);
    updatePreview();
}

// 加载设置
async function loadSettings() {
    const defaults = {
        enabled: true,
        boldPercentage: 0.5,
        minWordLength: 3
    };
    
    const settings = await chrome.storage.sync.get(defaults);
    
    enabledToggle.checked = settings.enabled;
    boldPercentageInput.value = settings.boldPercentage;
    boldPercentageValue.textContent = `${Math.round(settings.boldPercentage * 100)}%`;
    minWordLengthInput.value = settings.minWordLength;
    minWordLengthValue.textContent = `${settings.minWordLength} characters`;
    
    updatePreview();
}

// 添加事件监听器
enabledToggle.addEventListener('change', saveSettings);

boldPercentageInput.addEventListener('input', () => {
    boldPercentageValue.textContent = `${Math.round(boldPercentageInput.value * 100)}%`;
    updatePreview();
});

boldPercentageInput.addEventListener('change', saveSettings);

minWordLengthInput.addEventListener('input', () => {
    minWordLengthValue.textContent = `${minWordLengthInput.value} characters`;
    updatePreview();
});

minWordLengthInput.addEventListener('change', saveSettings);

// 初始化
loadSettings();
