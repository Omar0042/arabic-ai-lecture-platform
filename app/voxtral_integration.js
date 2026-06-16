// voxtral_integration.js - Enhanced with loading indicator and fixed duplication

class EnhancedVoxtral {
    constructor() {
        this.currentLectureId = null;
        this.isProcessing = false;
    }

    // Auto-process lecture immediately after upload
    async autoProcessNewLecture(lectureData) {
        console.log('🚀 Auto-processing new lecture:', lectureData.id);

        this.showMessage(`🔄 جاري معالجة المحاضرة الجديدة "${lectureData.title}" تلقائياً...`);

        try {
            const formData = new FormData();
            formData.append('action', 'process_new_lecture');
            formData.append('lecture_id', lectureData.id);

            const response = await fetch('voxtral_service.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.showMessage(`✅ تم تحليل المحاضرة "${lectureData.title}" بنجاح وهي جاهزة للاستخدام!`);
                console.log('✅ Auto-processing completed for lecture:', lectureData.id);
            } else {
                this.showMessage(`⚠️ لم يتم تحليل المحاضرة تلقائياً: ${result.error}`);
                console.warn('Auto-processing failed:', result.error);
            }

        } catch (error) {
            console.error('Auto-processing error:', error);
            this.showMessage(`❌ خطأ في المعالجة التلقائية: ${error.message}`);
        }
    }

    // Show typing indicator
    showTypingIndicator() {
        const chat = document.getElementById('aiChat');
        if (!chat) return null;

        const typingDiv = document.createElement('div');
        typingDiv.classList.add('message', 'ai-message', 'typing-indicator');
        typingDiv.id = 'typing-indicator';

        typingDiv.innerHTML = `
            <div class="typing-animation">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
                <span class="typing-text">🤖 جاري التفكير...</span>
            </div>
            <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        chat.appendChild(typingDiv);
        chat.scrollTop = chat.scrollHeight;
        return typingDiv;
    }

    // Remove typing indicator
    removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Get quick summary (no processing needed)
    async getQuickSummary(lectureId) {
        // Prevent multiple simultaneous requests
        if (this.isProcessing) {
            this.showMessage('⚠️ يجب الانتظار حتى انتهاء العملية الحالية...');
            return;
        }

        this.isProcessing = true;
        this.currentLectureId = lectureId;

        // Show AI section
        const aiSection = document.getElementById('aiSection');
        if (aiSection) {
            aiSection.classList.add('active');
        }

        // Show single loading message
        this.showMessage(`📋 جاري استرجاع ملخص المحاضرة ${lectureId}...`);

        try {
            const formData = new FormData();
            formData.append('action', 'get_quick_summary');
            formData.append('lecture_id', lectureId);

            const response = await fetch('voxtral_service.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                if (result.summary) {
                    // Only show summary, no transcript
                    this.showMessage(`📋 ملخص المحاضرة ${lectureId}:\n\n${result.summary}`);
                    this.showMessage(`✅ يمكنك الآن طرح أسئلة حول المحاضرة ${lectureId}`);
                } else {
                    this.showMessage(`⚠️ الملخص غير متوفر للمحاضرة ${lectureId}.`);
                }
            } else {
                this.showMessage(`❌ ${result.error || 'فشل في استرجاع الملخص'}`);
            }

        } catch (error) {
            console.error('Error:', error);
            this.showMessage(`❌ خطأ في الاتصال: ${error.message}`);
        } finally {
            this.isProcessing = false;
        }
    }

    // Ask question about current lecture
    async askQuestion(lectureId, question) {
        if (!question.trim()) {
            return 'يرجى كتابة سؤال';
        }

        // Show typing indicator
        const typingIndicator = this.showTypingIndicator();

        try {
            const formData = new FormData();
            formData.append('action', 'ask_question');
            formData.append('lecture_id', lectureId);
            formData.append('question', question);

            const response = await fetch('voxtral_service.php', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            // Remove typing indicator
            this.removeTypingIndicator();

            if (result.success) {
                return result.answer;
            } else {
                return `❌ ${result.error}`;
            }

        } catch (error) {
            console.error('Error:', error);
            // Remove typing indicator on error
            this.removeTypingIndicator();
            return `❌ خطأ في الاتصال: ${error.message}`;
        }
    }

    // Show message in AI chat
    showMessage(message) {
        const chat = document.getElementById('aiChat');
        if (!chat) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'ai-message');

        const formattedMessage = message
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

        messageDiv.innerHTML = `
            <p>${formattedMessage}</p>
            <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    // Add user message to chat
    showUserMessage(message) {
        const chat = document.getElementById('aiChat');
        if (!chat) return;

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'user-message');
        messageDiv.innerHTML = `
            <p>${message}</p>
            <div class="message-info">أنت, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
    }

    // Get current lecture ID
    getCurrentLectureId() {
        return this.currentLectureId || 
               window.currentLectureId || 
               document.querySelector('[data-lecture]')?.getAttribute('data-lecture') || 
               '1';
    }
}

// Create global instance
const voxtral = new EnhancedVoxtral();

// Set up event handlers when page loads
document.addEventListener('DOMContentLoaded', function() {

    // Handle summary buttons (updated to use quick summary)
    document.addEventListener('click', function(e) {
        const summaryBtn = e.target.closest('.ai-summary-btn');
        if (summaryBtn) {
            e.preventDefault();
            const lectureId = summaryBtn.getAttribute('data-lecture');
            if (lectureId) {
                voxtral.getQuickSummary(lectureId);
            }
        }
    });

    // Handle AI assistant button (main page)
    const aiSendBtn = document.getElementById('aiSendBtn');
    const aiInput = document.getElementById('aiInput');

    if (aiSendBtn && aiInput) {
        aiSendBtn.onclick = async function() {
            const question = aiInput.value.trim();
            if (!question) return;

            voxtral.showUserMessage(question);
            aiInput.value = '';

            const lectureId = voxtral.getCurrentLectureId();
            const answer = await voxtral.askQuestion(lectureId, question);
            voxtral.showMessage(answer);
        };

        aiInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                aiSendBtn.click();
            }
        };
    }

    // Handle chat in lecture view page
    const chatSendBtn = document.getElementById('chat-send');
    const chatInput = document.getElementById('chat-input');

    if (chatSendBtn && chatInput) {
        chatSendBtn.onclick = async function() {
            const activeTab = document.querySelector('.chat-tab.active');
            if (!activeTab) return;

            const chatType = activeTab.getAttribute('data-chat');

            if (chatType === 'ai') {
                const question = chatInput.value.trim();
                if (!question) return;

                // Add message to lecture view chat
                addChatMessage('user', question);
                chatInput.value = '';

                // Show typing in lecture view
                const typingId = addChatMessage('ai', '🤖 جاري التفكير...', true);

                const lectureId = voxtral.getCurrentLectureId();
                const answer = await voxtral.askQuestion(lectureId, question);

                // Remove typing and add real answer
                removeChatMessage(typingId);
                addChatMessage('ai', answer);
            }
        };

        chatInput.onkeypress = function(e) {
            if (e.key === 'Enter') {
                chatSendBtn.click();
            }
        };
    }
});

// Helper function for lecture view chat
function addChatMessage(sender, message, isTyping = false) {
    const activeContent = document.querySelector('.chat-content.active');
    if (!activeContent) return null;

    const messageDiv = document.createElement('div');
    const senderClass = sender === 'user' ? 'user-message' : 'ai-message';
    messageDiv.className = `message ${senderClass}`;

    if (isTyping) {
        messageDiv.id = 'typing-msg-' + Date.now();
        messageDiv.classList.add('typing-indicator');
    }

    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const senderName = sender === 'user' ? 'أنت' : 'مساعد جامعة';

    const formattedMessage = message
        .replace(/\n/g, '<br>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    messageDiv.innerHTML = `
        <p>${formattedMessage}</p>
        <div class="message-info">${senderName}, ${time}</div>
    `;

    activeContent.appendChild(messageDiv);
    activeContent.scrollTop = activeContent.scrollHeight;

    return isTyping ? messageDiv.id : null;
}

// Remove specific chat message
function removeChatMessage(messageId) {
    if (messageId) {
        const msg = document.getElementById(messageId);
        if (msg) msg.remove();
    }
}

// Global functions for backward compatibility
function generateSummary(lectureId) {
    voxtral.getQuickSummary(lectureId);
}

// Make voxtral globally available for upload success handler
window.voxtralAI = voxtral;

console.log('🚀 Enhanced Voxtral system with loading indicators loaded successfully!');