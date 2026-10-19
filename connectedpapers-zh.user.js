// ==UserScript==
// @name         Connected Papers 中文化
// @namespace    https://github.com/yourname/connectedpapers-chinese
// @version      1.0.0
// @description  汉化 Connected Papers 界面的按钮、菜单及部分提示文本。
// @author       cqk
// @match        https://www.connectedpapers.com/*
// @run-at       document-start
// @grant        GM_addStyle
// @grant        GM_registerMenuCommand
// ==/UserScript==

(function() {
    'use strict';

    // =========================== 词库配置 ===========================
    // 静态词典：精确匹配
    const staticDict = {
        // 顶部导航
        "About": "关于",
        "Home": "首页",
        "Sign in": "登录",
        "Sign up": "注册",
        "Log out": "退出登录",
        "Share": "分享",
        "Follow": "关注",
        "Pricing": "价格",

        //一、首页
        "Build a graph": "构建关系图",

        //二、搜索结果页面
        "Choose a paper to build a graph:": "选择一篇论文来构建关系图：",
        "Search powered by Semantic Scholar": "搜索由 Semantic Scholar 提供支持",
        "Save": "保存",
        "Saved": "已保存",

        "Show more": "显示更多",

        "Tip: hold": "小提示：按住",
        "while clicking a paper to build it in the background.": "并选中一篇论文将在新标签页中创建一个关系图",

        //图表页面

        //1.顶部工具栏
        "Prior works": "先前工作",
        "Derivative works": "衍生工作",
        "List view": "列表视图",
        "Filters": "筛选",
        "More": "更多",

        //1.1先前工作
        "These are papers that were most commonly cited by the papers in the graph.": "这些是图谱中最常被引用的论文。",
        "This usually means that they are": "这通常意味着它们是",
        "important seminal works": "重要的开创性工作", // 这个词被加粗了，独立提取
        "for this field and it could be a good idea to get familiar with them.": "在该领域中，熟悉它们是个好主意。",
        "Selecting a prior work will highlight all graph papers referencing it, and selecting a graph paper will highlight all referenced prior work.": "选择一篇先前工作将高亮显示所有引用它的图谱论文，而选择一篇图谱论文将高亮显示所有被引用的先前工作。",

        //1.2衍生工作
        "These are papers that cited many of the papers in the graph.": "这些是引用了图谱中许多论文的论文。",
        "This usually means that they are": "这通常意味着它们是",
        "either surveys of the field or recent relevant works": "要么是该领域的综述，要么是近期的相关工作",
        "which were inspired by many papers in the graph.": "这些工作受到了图谱中许多论文的启发。",
        "Selecting a derived work will highlight all graph papers cited by it, and selecting a graph paper will highlight all derivative works citing it.": "选择一项衍生工作将高亮显示所有被其引用的图谱论文，而选择一篇图谱论文将高亮显示所有引用它的衍生工作。",

        //1.3列表视图
        "Title": "标题",
        "Authors": "作者",
        "Year": "年份",
        "Citations": "引用次数",
        "References": "参考文献",
        "Similarity": "相似度",
        "to origin": " ",

        //1.4筛选
        "Filter by year": "按年份筛选",

        //1.5更多
        "Graph versions": "图表版本",

        //2左侧侧边栏
        "Origin paper": "原始论文",

        //3右侧侧边栏
        "Open in:": "在以下平台打开：",
        "Open graph": "构建关系图",
        "Add origin": "同时作为原始论文",

        //构建页面
        "Waiting for a server": "等待服务",












    };

    // 正则规则：处理带有动态内容的文本
    const regexpRules = [
        // 处理带有动态论文标题的提示
        // 将 Showing paper suggestions for "标题". 翻译为 显示 "标题" 的论文建议。
        [/Showing paper suggestions for "(.*)"\./i, '显示 "$1" 的论文建议。'],

        // 处理数字+References (例如 "12 References" -> "12 篇参考文献")
        [/(\d+) References/i, "$1 篇参考文献"],
        // 例如 "Showing 50 papers" -> "显示 50 篇论文"
        [/Showing (\d+) papers?/i, "显示 $1 篇论文"],
        // 例如 "5 citations" -> "5 次引用"
        [/(\d+) citations?/i, "$1 次引用"],
        [/(\d+) Citations?/i, "$1 次引用"],

    ];

    // =========================== 选择器配置 ===========================
    // 需要翻译的文本节点选择器（基于常见的 React 类名和语义标签）
    const TEXT_SELECTORS = [
        'button',
        '[role="button"]',
        'a',
        'h1', 'h2', 'h3', 'h4',
        'span', 'div', 'p', 'label',
        '.paper-title',
        '.paper-authors',
        '.paper-year',
        '.paper-citations',
        '.paper-venue',
        '[data-testid="search-result"]',
        '.paper-search-result'
    ].join(', ');

    // 需要翻译的属性
    const ATTRS_TO_TRANSLATE = ['placeholder', 'title', 'aria-label', 'data-tooltip'];

    // 忽略翻译的标签（避免破坏图表 SVG 等）
    const IGNORE_TAGS = ['SCRIPT', 'STYLE', 'SVG', 'PATH', 'CIRCLE', 'CANVAS', 'CODE', 'PRE'];

    // =========================== 核心翻译逻辑 ===========================

    /**
     * 查找翻译：优先静态词典，其次正则规则
     * @param {string} text
     * @returns {string|null}
     */
    function getTranslation(text) {
        const trimmed = text.trim();
        if (!trimmed) return null;

        // 1. 静态词典精确匹配
        if (staticDict[trimmed]) {
            return staticDict[trimmed];
        }

        // 2. 正则规则匹配
        for (const [pattern, replacement] of regexpRules) {
            const result = trimmed.replace(pattern, replacement);
            if (result !== trimmed) {
                return result;
            }
        }

        return null;
    }

    /**
     * 翻译单个文本节点
     * @param {Node} node
     */
    function translateTextNode(node) {
        const original = node.textContent;
        if (!original || original.trim().length < 2) return; // 跳过极短文本

        const translated = getTranslation(original);
        if (translated && translated !== original) {
            // 保留前后空白
            node.textContent = original.replace(original.trim(), translated);
        }
    }

    /**
     * 翻译元素的指定属性
     * @param {Element} element
     */
    function translateAttributes(element) {
        ATTRS_TO_TRANSLATE.forEach(attr => {
            const value = element.getAttribute(attr);
            if (!value) return;
            const translated = getTranslation(value);
            if (translated && translated !== value) {
                element.setAttribute(attr, translated);
            }
        });
    }

    /**
     * 遍历并翻译一个根节点下的所有内容
     * @param {Node} root
     */
    function traverseAndTranslate(root) {
        if (!root) return;

        // 如果是文本节点直接处理
        if (root.nodeType === Node.TEXT_NODE) {
            translateTextNode(root);
            return;
        }

        if (root.nodeType !== Node.ELEMENT_NODE) return;

        const element = root;
        // 跳过忽略的标签
        if (IGNORE_TAGS.includes(element.tagName)) return;

        // 翻译属性
        translateAttributes(element);

        // 如果元素本身匹配选择器，翻译其文本内容（若为叶子节点或短文本）
        if (element.matches(TEXT_SELECTORS) && element.children.length === 0) {
            translateTextNode({ textContent: element.textContent, nodeType: Node.TEXT_NODE, ...{} });
            // 上面的写法有点绕，直接操作 element.textContent 更简单
            const original = element.textContent;
            const translated = getTranslation(original);
            if (translated && translated !== original) {
                element.textContent = original.replace(original.trim(), translated);
            }
        }

        // 递归处理子节点
        const walker = document.createTreeWalker(
            element,
            NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
            {
                acceptNode(node) {
                    if (node.nodeType === Node.ELEMENT_NODE && IGNORE_TAGS.includes(node.tagName)) {
                        return NodeFilter.FILTER_REJECT;
                    }
                    return NodeFilter.FILTER_ACCEPT;
                }
            }
        );

        let node;
        while ((node = walker.nextNode())) {
            if (node.nodeType === Node.TEXT_NODE) {
                translateTextNode(node);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                translateAttributes(node);
                if (node.matches(TEXT_SELECTORS) && node.children.length === 0) {
                    const original = node.textContent;
                    const translated = getTranslation(original);
                    if (translated && translated !== original) {
                        node.textContent = original.replace(original.trim(), translated);
                    }
                }
            }
        }
    }

    // =========================== 动态内容监听 ===========================

    function setupMutationObserver() {
        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            traverseAndTranslate(node);
                        }
                    }
                } else if (mutation.type === 'attributes') {
                    translateAttributes(mutation.target);
                } else if (mutation.type === 'characterData') {
                    translateTextNode(mutation.target);
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true,
            characterData: true,
            attributes: true,
            attributeFilter: ATTRS_TO_TRANSLATE
        });
    }

    // =========================== 初始化 ===========================

    function init() {
        // 首次翻译
        traverseAndTranslate(document.body);
        // 设置观察器，处理动态加载的内容
        setupMutationObserver();
        console.log('[Connected Papers 汉化] 已启动');
    }

    // 根据文档加载状态决定执行时机
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // =========================== 菜单命令（可选） ===========================
    // 手动重新翻译当前页面
    GM_registerMenuCommand('🔄 重新翻译页面', () => {
        traverseAndTranslate(document.body);
        alert('页面已重新翻译');
    });

})();