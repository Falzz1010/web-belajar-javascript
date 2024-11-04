document.addEventListener('DOMContentLoaded', async function() {
    const isServerConnected = await testConnection();
    if (!isServerConnected) {
        console.error('Could not connect to server');
        // Tambahkan notifikasi ke UI jika diperlukan
    }
    
    // Get DOM elements
    const chatbotToggle = document.getElementById('chatbot-toggle');
    const chatbotWindow = document.getElementById('chatbot-window');
    const chatbotClose = document.getElementById('chatbot-close');
    const chatMessages = document.getElementById('chat-messages');
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');

    const API_URL = 'http://localhost:3000/api/chat';

    async function getAIResponse(message) {
        try {
            const response = await fetch('http://localhost:3000/api/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ message }),
                credentials: 'include'
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Network response was not ok');
            }

            const data = await response.json();
            return data.response;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }

    // Toggle chatbot function
    function toggleChatbot() {
        const isHidden = chatbotWindow.classList.contains('hidden');
        
        if (isHidden) {
            // Show chatbot window
            chatbotWindow.classList.remove('hidden');
            setTimeout(() => {
                chatbotWindow.classList.add('active');
                // Hide toggle button
                chatbotToggle.classList.add('hidden');
            }, 0);
        } else {
            // Hide chatbot window
            chatbotWindow.classList.remove('active');
            setTimeout(() => {
                chatbotWindow.classList.add('hidden');
                // Show toggle button
                chatbotToggle.classList.remove('hidden');
            }, 300); // Match transition duration
        }
    }

    // Event Listeners
    if (chatbotToggle) {
        chatbotToggle.addEventListener('click', function(e) {
            e.preventDefault();
            toggleChatbot();
        });
    }

    if (chatbotClose) {
        chatbotClose.addEventListener('click', function(e) {
            e.preventDefault();
            toggleChatbot();
        });
    }

    // Close with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && !chatbotWindow.classList.contains('hidden')) {
            toggleChatbot();
        }
    });

    // Chat form submission
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const message = chatInput.value.trim();
            if (!message) return;

            // Add user message
            addMessageToChat('user', message);
            chatInput.value = '';
            chatInput.disabled = true;

            try {
                // Show typing indicator
                showTypingIndicator();
                
                const response = await getAIResponse(message);
                
                // Remove typing indicator
                removeTypingIndicator();
                
                // Add AI response
                addMessageToChat('ai', response);
            } catch (error) {
                console.error('Error in sendMessage:', error);
                removeTypingIndicator();
                addMessageToChat('ai', 'Maaf, terjadi kesalahan. Silakan coba lagi.', true);
            }

            chatInput.disabled = false;
            chatInput.focus();
        });
    }

    // Helper functions
    function addMessageToChat(role, message, isError = false) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `chat-message ${role}`;
        
        let formattedMessage = message;
        
        // Check for code blocks and format them
        if (message.includes('```')) {
            formattedMessage = marked.parse(message);
        }

        messageDiv.innerHTML = `
            <div class="message-bubble ${isError ? 'error' : ''}">
                ${formattedMessage}
            </div>
        `;
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;

        // Highlight code blocks if any
        messageDiv.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
    }

    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-message ai';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    function getWelcomeMessage() {
        return `Halo! 👋 Saya adalah JavaScript Assistant.
               Saya siap membantu Anda belajar JavaScript. 
               Silakan ajukan pertanyaan Anda!`;
    }

    // Theme Toggle Handler
    function initializeTheme() {
        // Check for saved theme preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
        }
    }

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
        if (!localStorage.getItem('theme')) {
            document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
        }
    });

    // Initialize theme when page loads
    document.addEventListener('DOMContentLoaded', initializeTheme);

    // Add theme toggle function (if you have a theme toggle button)
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    }

    // Tambahkan fungsi untuk test koneksi
    async function testConnection() {
        try {
            const response = await fetch('/test');
            const data = await response.json();
            console.log('Server test response:', data);
            return true;
        } catch (error) {
            console.error('Server connection test failed:', error);
            return false;
        }
    }
});
