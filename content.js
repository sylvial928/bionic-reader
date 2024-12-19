// 全局设置
let settings = {
    enabled: true,
    boldPercentage: 0.5,  // 加粗单词前半部分的比例
    minWordLength: 3      // 最小处理单词长度
};

// 将文本转换为 Bionic Reading 格式
function toBionicText(text) {
    if (!text || typeof text !== 'string') return text;
    
    return text.replace(/\b[a-zA-Z]+\b/g, word => {
        if (word.length < settings.minWordLength) return word;
        
        const boldLength = Math.ceil(word.length * settings.boldPercentage);
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);
        
        return `<span class="bionic-word"><strong>${boldPart}</strong>${normalPart}</span>`;
    });
}

// 处理文本节点
function processTextNode(textNode) {
    if (!textNode || !textNode.textContent.trim()) return;
    
    // 跳过已处理的节点
    const parent = textNode.parentElement;
    if (parent && (parent.processed || parent.classList?.contains('bionic-word'))) {
        return;
    }
    
    // 创建新的包装元素
    const wrapper = document.createElement('span');
    wrapper.className = 'bionic-text';
    wrapper.innerHTML = toBionicText(textNode.textContent);
    wrapper.processed = true;
    
    // 替换原始节点
    textNode.parentNode.replaceChild(wrapper, textNode);
}

// 批量处理文本节点
function processTextNodes(nodes, deadline) {
    while (nodes.length > 0 && deadline.timeRemaining() > 0) {
        const node = nodes.shift();
        processTextNode(node);
    }
    
    if (nodes.length > 0) {
        requestIdleCallback(deadline => processTextNodes(nodes, deadline));
    }
}

// 处理页面内容
function processContent() {
    if (!settings.enabled) return;
    
    const walker = document.createTreeWalker(
        document.body,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode: function(node) {
                if (!node || !node.parentElement) return NodeFilter.FILTER_REJECT;
                
                const parent = node.parentElement;
                const tagName = parent.tagName.toLowerCase();
                
                // 跳过特定元素
                if (tagName === 'script' || tagName === 'style' || 
                    tagName === 'noscript' || tagName === 'iframe' || 
                    tagName === 'svg' || tagName === 'math' ||
                    tagName === 'code' || tagName === 'pre') {
                    return NodeFilter.FILTER_REJECT;
                }
                
                // 跳过已处理的节点
                if (parent.processed || parent.classList?.contains('bionic-word')) {
                    return NodeFilter.FILTER_REJECT;
                }
                
                // 跳过空文本节点
                if (!node.textContent.trim()) {
                    return NodeFilter.FILTER_REJECT;
                }
                
                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
        textNodes.push(node);
    }
    
    if (textNodes.length > 0) {
        requestIdleCallback(deadline => processTextNodes(textNodes, deadline));
    }
}

// 监听设置变更
chrome.storage.onChanged.addListener((changes, namespace) => {
    if (namespace === 'sync') {
        for (let [key, { newValue }] of Object.entries(changes)) {
            if (settings.hasOwnProperty(key)) {
                settings[key] = newValue;
            }
        }
        
        if (changes.enabled) {
            if (settings.enabled) {
                processContent();
            } else {
                // 移除所有 bionic 效果
                document.querySelectorAll('.bionic-text').forEach(el => {
                    const text = el.textContent;
                    const textNode = document.createTextNode(text);
                    el.parentNode.replaceChild(textNode, el);
                });
            }
        }
    }
});

// 初始化
(async function() {
    try {
        // 等待 DOM 加载
        if (document.readyState === 'loading') {
            await new Promise(resolve => {
                document.addEventListener('DOMContentLoaded', resolve);
            });
        }
        
        // 加载设置
        const stored = await chrome.storage.sync.get(settings);
        Object.assign(settings, stored);
        
        // 处理内容
        processContent();
        
        // 监听 DOM 变化
        const observer = new MutationObserver(() => {
            if (settings.enabled) {
                requestIdleCallback(processContent);
            }
        });
        
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
        
    } catch (error) {
        console.error('Error initializing Bionic Reader:', error);
    }
})();
