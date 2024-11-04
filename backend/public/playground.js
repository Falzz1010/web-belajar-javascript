class JavaScriptPlayground {
    constructor() {
        this.initializeState();
        this.initializeEditor();
        this.initializeComponents();
        this.setupEventListeners();
        this.setupConsoleOverride();
        this.loadExampleSnippets();
        this.setupThemeHandling();
        this.handleResize();
        this.initializeDesktopLayout();
        this.initializeLayout();
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => this.updateLayoutHeights(), 100);
        });
    }

    initializeState() {
        this.autorunEnabled = false;
        this.autorunTimeout = null;
        this.savedSnippets = JSON.parse(localStorage.getItem('savedSnippets')) || {};
        
        // Define comprehensive theme sets
        this.themeSets = {
            light: {
                'monokai': 'eclipse',
                'nord': 'eclipse',
                'material': 'eclipse',
                'dracula': 'eclipse',
                'github-dark': 'eclipse',
                'ayu-dark': 'eclipse',
                'ambiance': 'eclipse',
                'cobalt': 'eclipse',
                'material-darker': 'eclipse',
                'material-palenight': 'eclipse',
                'material-ocean': 'eclipse',
                'gruvbox-dark': 'eclipse',
                'lucario': 'eclipse',
                'twilight': 'eclipse',
                'tomorrow-night-bright': 'eclipse',
                'tomorrow-night-eighties': 'eclipse',
                'solarized': 'solarized',
                'eclipse': 'eclipse',
                'xq-light': 'xq-light',
                'idea': 'idea',
                'neat': 'neat',
                'neo': 'neo'
            },
            dark: {
                'monokai': 'monokai',
                'nord': 'nord',
                'material': 'material',
                'dracula': 'dracula',
                'github-dark': 'github-dark',
                'ayu-dark': 'ayu-dark',
                'ambiance': 'ambiance',
                'cobalt': 'cobalt',
                'material-darker': 'material-darker',
                'material-palenight': 'material-palenight',
                'material-ocean': 'material-ocean',
                'gruvbox-dark': 'gruvbox-dark',
                'lucario': 'lucario',
                'twilight': 'twilight',
                'tomorrow-night-bright': 'tomorrow-night-bright',
                'tomorrow-night-eighties': 'tomorrow-night-eighties',
                'solarized': 'solarized dark',
                'eclipse': 'eclipse',
                'xq-light': 'xq-light',
                'idea': 'idea',
                'neat': 'neat',
                'neo': 'neo'
            }
        };
        
        const currentAppTheme = document.documentElement.getAttribute('data-theme') || 'light';
        const savedEditorTheme = localStorage.getItem('editorTheme') || 'monokai';
        this.currentTheme = this.getThemeForMode(savedEditorTheme, currentAppTheme);
    }

    getThemeForMode(editorTheme, appTheme) {
        // Jika tema tidak ditemukan dalam set, gunakan default untuk mode tersebut
        const defaultTheme = appTheme === 'light' ? 'eclipse' : 'monokai';
        return this.themeSets[appTheme][editorTheme] || defaultTheme;
    }

    initializeEditor() {
        // Initialize CodeMirror with advanced configuration
        this.editor = CodeMirror.fromTextArea(document.getElementById('code-editor'), {
            mode: 'javascript',
            theme: this.currentTheme,
            lineNumbers: true,
            matchBrackets: true,
            autoCloseBrackets: true,
            foldGutter: true,
            gutters: ['CodeMirror-linenumbers', 'CodeMirror-foldgutter'],
            foldCode: true,
            indentUnit: 4,
            tabSize: 4,
            indentWithTabs: false,
            lineWrapping: true,
            extraKeys: {
                'Ctrl-Space': 'autocomplete',
                'Ctrl-Enter': () => this.runCode(),
                'Cmd-Enter': () => this.runCode(),
                'Tab': 'indentMore',
                'Shift-Tab': 'indentLess',
                'Ctrl-/': 'toggleComment',
                'Cmd-/': 'toggleComment'
            }
        });

        // Set initial content
        this.editor.setValue(`// Welcome to JavaScript Playground!\n// Try writing some code here or choose from example snippets below.\n\nconsole.log('Hello, World!');\n`);
    }

    initializeComponents() {
        // Get all DOM elements
        this.components = {
            output: document.getElementById('output-container'),
            runButton: document.getElementById('run-code'),
            clearCodeButton: document.getElementById('clear-code'),
            clearOutputButton: document.getElementById('clear-output'),
            formatButton: document.getElementById('format-code'),
            saveButton: document.getElementById('save-code'),
            loadButton: document.getElementById('load-code'),
            themeSelect: document.getElementById('editor-theme'),
            consoleInput: document.getElementById('console-input'),
            runConsoleButton: document.getElementById('run-console'),
            snippetsContainer: document.getElementById('snippets-container'),
            toggleLineNumbersButton: document.getElementById('toggle-line-numbers'),
            toggleAutoCompleteButton: document.getElementById('toggle-auto-complete'),
            toggleLiveAutorunButton: document.getElementById('toggle-live-autorun'),
            storageModal: document.getElementById('storage-modal'),
            savedSnippetsList: document.getElementById('saved-snippets-list')
        };
    }

    setupEventListeners() {
        // Button click handlers
        this.components.runButton.addEventListener('click', () => this.runCode());
        this.components.clearCodeButton.addEventListener('click', () => this.clearEditor());
        this.components.clearOutputButton.addEventListener('click', () => this.clearOutput());
        this.components.formatButton.addEventListener('click', () => this.formatCode());
        this.components.saveButton.addEventListener('click', () => this.showSaveDialog());
        this.components.loadButton.addEventListener('click', () => this.showStorageModal());

        // Theme handling
        this.components.themeSelect.addEventListener('change', (e) => this.changeEditorTheme(e.target.value));

        // Console input handling
        this.components.consoleInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.executeConsoleCommand();
            }
        });
        this.components.runConsoleButton.addEventListener('click', () => this.executeConsoleCommand());

        // Toggle features
        this.components.toggleLineNumbersButton.addEventListener('click', () => this.toggleLineNumbers());
        this.components.toggleAutoCompleteButton.addEventListener('click', () => this.toggleAutoComplete());
        this.components.toggleLiveAutorunButton.addEventListener('click', () => this.toggleLiveAutorun());

        // Editor change handler for autorun
        this.editor.on('change', () => {
            if (this.autorunEnabled) {
                clearTimeout(this.autorunTimeout);
                this.autorunTimeout = setTimeout(() => this.runCode(), 1000);
            }
        });

        // Tab handling for snippets
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.switchSnippetCategory(e));
        });

        // Window resize handler
        window.addEventListener('resize', () => this.handleResize());
    }

    setupConsoleOverride() {
        const originalConsole = { ...console };
        const output = this.components.output;

        // Override console methods
        const consoleTypes = {
            log: { class: 'output-log', prefix: '' },
            error: { class: 'output-error', prefix: 'Error: ' },
            warn: { class: 'output-warning', prefix: 'Warning: ' },
            info: { class: 'output-info', prefix: 'Info: ' }
        };

        Object.entries(consoleTypes).forEach(([type, config]) => {
            console[type] = (...args) => {
                originalConsole[type](...args);
                const formattedArgs = args.map(arg => 
                    this.formatConsoleOutput(arg)
                ).join(' ');
                
                output.innerHTML += `
                    <div class="${config.class}">
                        ${config.prefix}${formattedArgs}
                    </div>
                `;
                output.scrollTop = output.scrollHeight;
            };
        });
    }

    formatConsoleOutput(arg) {
        if (arg === null) return 'null';
        if (arg === undefined) return 'undefined';
        if (typeof arg === 'object') {
            try {
                return JSON.stringify(arg, null, 2);
            } catch (e) {
                return arg.toString();
            }
        }
        return String(arg);
    }

    async runCode() {
        this.clearOutput();
        try {
            // Create a new Function to run the code in a separate scope
            const code = this.editor.getValue();
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction(code);
            await fn();
        } catch (error) {
            console.error(error.message);
            this.showToast('Error executing code', 'error');
        }
    }

    executeConsoleCommand() {
        const command = this.components.consoleInput.value.trim();
        if (!command) return;

        this.components.output.innerHTML += `
            <div class="output-command">> ${command}</div>
        `;

        try {
            const result = eval(command);
            if (result !== undefined) {
                console.log(result);
            }
        } catch (error) {
            console.error(error.message);
        }

        this.components.consoleInput.value = '';
    }

    formatCode() {
        try {
            const formatted = prettier.format(this.editor.getValue(), {
                parser: 'babel',
                plugins: prettierPlugins,
                singleQuote: true,
                tabWidth: 4
            });
            this.editor.setValue(formatted);
        } catch (error) {
            console.error('Format error:', error.message);
        }
    }

    clearEditor() {
        this.editor.setValue('');
    }

    clearOutput() {
        this.components.output.innerHTML = '';
    }

    saveCode() {
        const code = this.editor.getValue();
        const name = prompt('Enter a name for this code snippet:');
        if (name) {
            this.savedSnippets = JSON.parse(localStorage.getItem('savedSnippets')) || {};
            this.savedSnippets[name] = code;
            localStorage.setItem('savedSnippets', JSON.stringify(this.savedSnippets));
            this.showToast('Code saved successfully!', 'success');
            if (document.getElementById('storage-modal').classList.contains('active')) {
                this.loadSavedSnippets();
            }
        }
    }

    loadSavedSnippets() {
        const list = document.getElementById('saved-snippets-list');
        list.innerHTML = '';
        
        this.savedSnippets = JSON.parse(localStorage.getItem('savedSnippets')) || {};
        
        if (Object.keys(this.savedSnippets).length === 0) {
            list.innerHTML = '<div class="p-4 text-center text-gray-500">No saved snippets found</div>';
            return;
        }
        
        Object.entries(this.savedSnippets).forEach(([name, code]) => {
            const item = document.createElement('div');
            item.className = 'saved-snippet-item flex justify-between items-center p-2 hover:bg-base-200 rounded';
            
            const escapedName = name.replace(/[&<>"']/g, char => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            })[char]);
            
            item.innerHTML = `
                <span class="flex-1 truncate pr-2">${escapedName}</span>
                <div class="flex gap-2">
                    <button class="btn btn-sm btn-ghost load-btn" title="Load snippet">
                        <i class="fas fa-code"></i>
                    </button>
                    <button class="btn btn-sm btn-ghost delete-btn text-error" title="Delete snippet">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            `;
            
            item.querySelector('.load-btn').addEventListener('click', () => this.loadSnippet(name));
            item.querySelector('.delete-btn').addEventListener('click', () => this.deleteSnippet(name));
            
            list.appendChild(item);
        });
    }

    loadSnippet(name) {
        if (this.savedSnippets[name]) {
            this.editor.setValue(this.savedSnippets[name]);
            this.closeStorageModal();
            this.showToast('Snippet loaded successfully!', 'success');
        }
    }

    deleteSnippet(name) {
        if (confirm(`Are you sure you want to delete "${name}"?`)) {
            delete this.savedSnippets[name];
            localStorage.setItem('savedSnippets', JSON.stringify(this.savedSnippets));
            this.loadSavedSnippets();
            this.showToast('Snippet deleted successfully!', 'success');
        }
    }

    showStorageModal() {
        const modal = document.getElementById('storage-modal');
        modal.classList.add('active');
        this.loadSavedSnippets();
    }

    closeStorageModal() {
        const modal = document.getElementById('storage-modal');
        modal.classList.remove('active');
    }

    changeEditorTheme(theme) {
        const currentAppTheme = document.documentElement.getAttribute('data-theme');
        const appropriateTheme = this.getThemeForMode(theme, currentAppTheme);
        this.editor.setOption('theme', appropriateTheme);
        localStorage.setItem('editorTheme', theme);
    }

    toggleLineNumbers() {
        const current = this.editor.getOption('lineNumbers');
        this.editor.setOption('lineNumbers', !current);
    }

    toggleAutoComplete() {
        const current = this.editor.getOption('extraKeys')['Ctrl-Space'] === 'autocomplete';
        this.editor.setOption('extraKeys', {
            ...this.editor.getOption('extraKeys'),
            'Ctrl-Space': current ? null : 'autocomplete'
        });
    }

    toggleLiveAutorun() {
        this.autorunEnabled = !this.autorunEnabled;
        this.components.toggleLiveAutorunButton.innerHTML = 
            `${this.autorunEnabled ? 'Disable' : 'Enable'} Live Autorun`;
    }

    setupThemeHandling() {
        const themeToggle = document.getElementById('theme-toggle');
        themeToggle.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            
            // Update editor theme
            const savedEditorTheme = localStorage.getItem('editorTheme') || 'monokai';
            const appropriateTheme = this.getThemeForMode(savedEditorTheme, newTheme);
            this.editor.setOption('theme', appropriateTheme);
            
            this.updateThemeIcon(newTheme);
        });

        // Set initial theme
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', savedTheme);
        const savedEditorTheme = localStorage.getItem('editorTheme') || 'monokai';
        const appropriateTheme = this.getThemeForMode(savedEditorTheme, savedTheme);
        this.editor.setOption('theme', appropriateTheme);
        this.updateThemeIcon(savedTheme);
    }

    updateThemeIcon(theme) {
        const icon = document.querySelector('#theme-toggle i');
        icon.className = theme === 'light' ? 'fas fa-moon' : 'fas fa-sun';
    }

    loadExampleSnippets() {
        const snippets = {
            basics: [
                {
                    title: 'Variables & Data Types',
                    description: 'Basic variable declarations and data types in JavaScript',
                    code: `// Variables and Data Types
let name = "John";
const age = 25;
let isStudent = true;
let hobbies = ["reading", "coding", "gaming"];
let person = {
    name: "John",
    age: 25,
    city: "New York"
};

console.log("Name:", name);
console.log("Age:", age);
console.log("Is Student?", isStudent);
console.log("Hobbies:", hobbies);
console.log("Person:", person);`
                },
                {
                    title: 'Control Flow',
                    description: 'If statements, loops, and switch cases',
                    code: `// Control Flow Examples
let score = 85;

// If-else statement
if (score >= 90) {
    console.log("Grade: A");
} else if (score >= 80) {
    console.log("Grade: B");
} else {
    console.log("Grade: C");
}

// For loop
console.log("\\nCounting from 1 to 5:");
for (let i = 1; i <= 5; i++) {
    console.log(i);
}

// While loop
console.log("\\nEven numbers up to 10:");
let num = 2;
while (num <= 10) {
    console.log(num);
    num += 2;
}

// Switch case
let day = "Monday";
switch (day) {
    case "Monday":
        console.log("Start of work week");
        break;
    case "Friday":
        console.log("Weekend is coming!");
        break;
    default:
        console.log("Regular day");
}`
                }
            ],
            arrays: [
                {
                    title: 'Array Methods',
                    description: 'Common array manipulation methods',
                    code: `// Array Methods Example
const numbers = [1, 2, 3, 4, 5];

// Map - multiply each number by 2
const doubled = numbers.map(num => num * 2);
console.log("Doubled numbers:", doubled);

// Filter - get even numbers
const evenNumbers = numbers.filter(num => num % 2 === 0);
console.log("Even numbers:", evenNumbers);

// Reduce - sum all numbers
const sum = numbers.reduce((acc, curr) => acc + curr, 0);
console.log("Sum of numbers:", sum);

// Find - get first number greater than 3
const firstGreaterThanThree = numbers.find(num => num > 3);
console.log("First number > 3:", firstGreaterThanThree);

// Array manipulation
const fruits = ["apple", "banana", "orange"];
fruits.push("grape");           // Add to end
fruits.unshift("strawberry");   // Add to start
console.log("Fruits:", fruits);

// Slice and Splice
console.log("Sliced fruits:", fruits.slice(1, 3));
fruits.splice(2, 1, "mango");   // Replace element
console.log("After splice:", fruits);`
                },
                {
                    title: 'Advanced Array Operations',
                    description: 'Complex array manipulations and transformations',
                    code: `// Advanced Array Operations
const users = [
    { id: 1, name: "John", age: 25 },
    { id: 2, name: "Jane", age: 30 },
    { id: 3, name: "Bob", age: 20 }
];

// Complex mapping
const userSummaries = users.map(user => ({
    ...user,
    summary: \`\${user.name} is \${user.age} years old\`
}));
console.log("User summaries:", userSummaries);

// Chaining methods
const youngUserNames = users
    .filter(user => user.age < 30)
    .map(user => user.name)
    .sort();
console.log("Young users:", youngUserNames);

// Array destructuring
const [first, second, ...rest] = users;
console.log("First user:", first);
console.log("Rest users:", rest);

// Array from and spread operator
const numbers = Array.from({ length: 5 }, (_, i) => i + 1);
console.log("Generated numbers:", numbers);
console.log("Spread example:", [...numbers, 6, 7, 8]);`
                }
            ],
            objects: [
                {
                    title: 'Object Basics',
                    description: 'Object creation and manipulation',
                    code: `// Object Manipulation Examples
const person = {
    name: "John Doe",
    age: 30,
    address: {
        street: "123 Main St",
        city: "New York",
        country: "USA"
    },
    hobbies: ["reading", "coding"],
    greet() {
        console.log(\`Hello, I'm \${this.name}\`);
    }
};

// Accessing properties
console.log(person.name);
console.log(person["age"]);

// Adding/modifying properties
person.email = "john@example.com";
person.age = 31;

// Object methods
person.greet();

// Object destructuring
const { name, age, address: { city } } = person;
console.log(\`\${name} is \${age} years old and lives in \${city}\`);

// Object spread operator
const updatedPerson = {
    ...person,
    age: 32,
    occupation: "Developer"
};
console.log("Updated person:", updatedPerson);`
                }
            ],
            functions: [
                {
                    title: 'Function Types',
                    description: 'Different ways to define and use functions',
                    code: `// Function Types and Usage
// Function Declaration
function greet(name) {
    return \`Hello, \${name}!\`;
}

// Function Expression
const add = function(a, b) {
    return a + b;
};

// Arrow Function
const multiply = (a, b) => a * b;

// Higher Order Function
const operate = (a, b, operation) => {
    return operation(a, b);
};

// Callback Function
const calculate = (operation) => {
    console.log(\`Result: \${operation(5, 3)}\`);
};

// Using the functions
console.log(greet("John"));
console.log("Sum:", add(5, 3));
console.log("Product:", multiply(4, 2));
console.log("Operation result:", operate(6, 2, (a, b) => a / b));

calculate(add);
calculate(multiply);`
                }
            ],
            async: [
                {
                    title: 'Async/Await',
                    description: 'Asynchronous programming examples',
                    code: `// Async/Await Examples
// Simulated API call
function fetchUser(id) {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            const users = {
                1: { id: 1, name: "John", email: "john@example.com" },
                2: { id: 2, name: "Jane", email: "jane@example.com" }
            };
            const user = users[id];
            if (user) resolve(user);
            else reject(new Error("User not found"));
        }, 1000);
    });
}

// Using async/await
async function getUserData(id) {
    try {
        console.log("Fetching user data...");
        const user = await fetchUser(id);
        console.log("User found:", user);
        return user;
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Multiple async operations
async function getAllUsers() {
    try {
        const [user1, user2] = await Promise.all([
            fetchUser(1),
            fetchUser(2)
        ]);
        console.log("All users:", { user1, user2 });
    } catch (error) {
        console.error("Error:", error.message);
    }
}

// Execute async functions
getUserData(1);
setTimeout(() => getAllUsers(), 2000);`
                }
            ],
            dom: [
                {
                    title: 'DOM Manipulation',
                    description: 'Working with the Document Object Model',
                    code: `// DOM Manipulation Examples
// Create elements
const container = document.createElement('div');
container.id = 'demo-container';
container.style.padding = '10px';
container.style.border = '1px solid #ccc';
container.style.margin = '10px';

const title = document.createElement('h3');
title.textContent = 'DOM Demo';
container.appendChild(title);

const button = document.createElement('button');
button.textContent = 'Click me!';
button.style.margin = '10px 0';
container.appendChild(button);

const list = document.createElement('ul');
container.appendChild(list);

// Add event listener
let clickCount = 0;
button.addEventListener('click', () => {
    clickCount++;
    const item = document.createElement('li');
    item.textContent = \`Button clicked \${clickCount} time\${clickCount === 1 ? '' : 's'}\`;
    list.appendChild(item);
});

// Add to output container
document.getElementById('output-container').appendChild(container);`
                }
            ]
        };

        // Initial render of basics category
        this.renderSnippets('basics', snippets.basics);

        // Add click handlers for category tabs
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', () => {
                const category = tab.dataset.category;
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('tab-active'));
                tab.classList.add('tab-active');
                this.renderSnippets(category, snippets[category] || []);
            });
        });
    }

    renderSnippets(category, snippets) {
        this.components.snippetsContainer.innerHTML = '';
        snippets.forEach(snippet => {
            const card = document.createElement('div');
            card.className = 'card bg-base-100 shadow-xl snippet-card';
            card.innerHTML = `
                <div class="card-body">
                    <h3 class="card-title text-sm">${snippet.title}</h3>
                    <p class="text-sm opacity-70">${snippet.description}</p>
                    <button class="btn btn-sm btn-primary mt-2">Load Example</button>
                </div>
            `;

            card.querySelector('button').addEventListener('click', () => {
                this.editor.setValue(snippet.code);
                this.showToast('Example code loaded!', 'success');
            });

            this.components.snippetsContainer.appendChild(card);
        });
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type} fixed bottom-4 right-4 p-4 rounded shadow-lg`;
        toast.style.zIndex = '9999';
        toast.innerHTML = message;
        
        document.body.appendChild(toast);
        
        // Hapus toast setelah 3 detik
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    handleResize() {
        // Get viewport dimensions
        const viewportHeight = window.innerHeight;
        const viewportWidth = window.innerWidth;
        
        // Desktop-specific adjustments
        if (viewportWidth >= 1024) {
            const editorHeight = Math.max(500, viewportHeight - 400);
            this.editor.setSize(null, editorHeight);
            
            // Match output container height to editor
            const outputContainer = this.components.output;
            outputContainer.style.height = `${editorHeight}px`;
            
            // Refresh CodeMirror after resize
            setTimeout(() => this.editor.refresh(), 100);
        } else {
            // Mobile/tablet sizing
            const editorHeight = Math.max(300, Math.min(500, viewportHeight - 400));
            this.editor.setSize(null, editorHeight);
            this.components.output.style.height = `${editorHeight}px`;
        }
    }

    initializeDesktopLayout() {
        if (window.innerWidth >= 1024) {
            // Set initial sizes
            this.handleResize();
            
            // Optimize editor performance
            this.editor.setOption('viewportMargin', Infinity);
            this.editor.setOption('lineWrapping', true);
            
            // Better tab handling
            this.editor.setOption('extraKeys', {
                ...this.editor.getOption('extraKeys'),
                'Tab': (cm) => {
                    if (cm.somethingSelected()) {
                        cm.indentSelection('add');
                    } else {
                        cm.replaceSelection('    ', 'end');
                    }
                }
            });
        }
    }

    initializeLayout() {
        // Set initial heights
        this.updateLayoutHeights();
        
        // Initialize ResizeObserver for dynamic height adjustments
        this.setupResizeObserver();
    }

    updateLayoutHeights() {
        const viewportHeight = window.innerHeight;
        const navbarHeight = document.querySelector('nav').offsetHeight;
        const containerPadding = 32; // 2rem top + 2rem bottom
        
        // Calculate available height
        const availableHeight = viewportHeight - navbarHeight - containerPadding;
        
        // Set minimum height for editor and output
        const minHeight = Math.max(400, availableHeight * 0.6);
        
        // Update CodeMirror height
        this.editor.setSize(null, minHeight);
        
        // Update output container height
        const outputContainer = this.components.output;
        outputContainer.style.height = `${minHeight}px`;
    }

    setupResizeObserver() {
        const resizeObserver = new ResizeObserver(entries => {
            for (let entry of entries) {
                if (entry.target.classList.contains('editor-console-container')) {
                    this.updateLayoutHeights();
                    this.editor.refresh();
                }
            }
        });

        // Observe the container
        const container = document.querySelector('.editor-console-container');
        resizeObserver.observe(container);
    }
}

// Initialize playground when DOM is loaded
let playground;
document.addEventListener('DOMContentLoaded', () => {
    playground = new JavaScriptPlayground();
});

// Make playground accessible globally for the storage modal
window.playground = playground;