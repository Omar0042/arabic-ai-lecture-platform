// Common functions used by both teacher and student dashboards

// Navigation between pages
document.addEventListener('DOMContentLoaded', function () {
    console.log('🚀 Common JS loading...');
    
    // Show home page by default
    const mainContent = document.querySelector('.main-content');
    if (mainContent) mainContent.style.display = 'flex';

    // Return to index when clicking user profile
    document.addEventListener('click', function (e) {
        const profile = e.target.closest('.user-profile');
        if (profile) {
            window.location.href = 'index.html';
        }
    });

    // Navigation between pages (header nav links)
    document.addEventListener('click', function (e) {
        const navLink = e.target.closest('.nav-link');
        if (navLink) {
            e.preventDefault();
            const navLinks = document.querySelectorAll('.nav-link');
            navLinks.forEach(l => l.classList.remove('active'));
            navLink.classList.add('active');

            // Hide all pages
            const pages = document.querySelectorAll('.pages-container, .main-content');
            pages.forEach(page => page.style.display = 'none');

            // Show the selected page
            const pageId = navLink.getAttribute('data-page');
            if (pageId === 'home') {
                if (mainContent) mainContent.style.display = 'flex';
            } else {
                const page = document.getElementById(pageId + '-page');
                if (page) page.style.display = 'block';
            }
        }
    });

    // AI Assistant toggle
    document.addEventListener('click', function (e) {
        if (e.target.id === 'aiAssistantBtn' || (e.target.closest && e.target.closest('#aiAssistantBtn'))) {
            const aiSection = document.getElementById('aiSection');
            if (aiSection) aiSection.classList.toggle('active');
        }
        if (e.target.classList.contains('close-ai')) {
            const aiSection = document.getElementById('aiSection');
            if (aiSection) aiSection.classList.remove('active');
        }
    });

    // Enhanced Summary button (delegated) - integrated with voxtral
    document.addEventListener('click', function (e) {
        const summaryBtn = e.target.closest('.ai-summary-btn');
        if (summaryBtn && !summaryBtn.disabled) {
            e.preventDefault();
            const lectureId = summaryBtn.getAttribute('data-lecture');
            
            // Check if enhanced voxtral system is available
            if (window.voxtralAI) {
                console.log('🤖 Using enhanced Voxtral system');
                window.voxtralAI.getQuickSummary(lectureId);
            } else {
                console.log('📋 Using fallback summary system');
                generateSummary(lectureId);
            }
        } else if (summaryBtn && summaryBtn.disabled) {
            alert('المحاضرة قيد المعالجة بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.');
        }
    });

    // Watch button (delegated) - enhanced
    document.addEventListener('click', function (e) {
        const watchBtn = e.target.closest('.watch-btn');
        if (watchBtn) {
            const lectureId = watchBtn.getAttribute('data-lecture');
            const isTeacher = document.body.classList.contains('teacher-page') || 
                             window.location.pathname.includes('teacher');
            openLectureView(lectureId, isTeacher ? 'teacher' : 'student');
        }
    });

    // Back button in lecture view (delegated)
    document.addEventListener('click', function (e) {
        const backBtn = e.target.closest('.back-btn');
        if (backBtn) {
            document.getElementById('lecture-view-page').style.display = 'none';
            const lecturesPage = document.getElementById('lectures-page');
            if (lecturesPage) {
                lecturesPage.style.display = 'block';
                // Update nav
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const lecturesLink = document.querySelector('.nav-link[data-page="lectures"]');
                if (lecturesLink) lecturesLink.classList.add('active');
            } else if (mainContent) {
                mainContent.style.display = 'flex';
                // Update nav
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                const homeLink = document.querySelector('.nav-link[data-page="home"]');
                if (homeLink) homeLink.classList.add('active');
            }
        }
    });

    // Play button in video player (delegated)
    document.addEventListener('click', function (e) {
        const playBtn = e.target.closest('.play-btn');
        if (playBtn) {
            const icon = playBtn.querySelector('i');
            if (icon) {
                if (icon.classList.contains('fa-play')) {
                    icon.classList.remove('fa-play');
                    icon.classList.add('fa-pause');
                } else {
                    icon.classList.remove('fa-pause');
                    icon.classList.add('fa-play');
                }
            }
        }
    });

    // Initialize chat functionality
    initChat();
    
    console.log('✅ Common JS initialized successfully!');
});

// Initialize chat functionality
function initChat() {
    // Chat tabs
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('chat-tab')) {
            const tab = e.target;
            const chatType = tab.getAttribute('data-chat');
            const chatTabs = document.querySelectorAll('.chat-tab');

            // Remove active class from all tabs
            chatTabs.forEach(t => t.classList.remove('active'));

            // Add active to current tab
            tab.classList.add('active');

            // Hide all chat contents
            document.querySelectorAll('.chat-content').forEach(content => {
                content.classList.remove('active');
            });

            // Show selected chat content
            const chatContent = document.getElementById(`${chatType}-chat-content`);
            if (chatContent) {
                chatContent.classList.add('active');
            }
        }
    });

    // Chat send button
    document.addEventListener('click', function (e) {
        if (e.target.id === 'chat-send' || e.target.closest('#chat-send')) {
            const activeTab = document.querySelector('.chat-tab.active');
            if (activeTab && activeTab.getAttribute('data-chat') === 'ai') {
                // Handle AI chat via voxtral
                sendAIChatMessage();
            } else {
                // Handle regular chat
                sendChatMessage();
            }
        }
    });

    // Chat input enter key
    document.addEventListener('keypress', function (e) {
        if (e.target.id === 'chat-input' && e.key === 'Enter') {
            const activeTab = document.querySelector('.chat-tab.active');
            if (activeTab && activeTab.getAttribute('data-chat') === 'ai') {
                sendAIChatMessage();
            } else {
                sendChatMessage();
            }
        }
    });

    // AI input handlers
    document.addEventListener('click', function (e) {
        if (e.target.id === 'aiSendBtn' || e.target.closest('#aiSendBtn')) {
            sendAIMainMessage();
        }
    });

    document.addEventListener('keypress', function (e) {
        if (e.target.id === 'aiInput' && e.key === 'Enter') {
            sendAIMainMessage();
        }
    });
}

// Enhanced AI message sending for main AI section
function sendAIMainMessage() {
    const input = document.getElementById('aiInput');
    if (!input || !input.value.trim()) return;
    
    const question = input.value.trim();
    const chat = document.getElementById('aiChat');
    
    // Add user message
    const userMessage = document.createElement('div');
    userMessage.classList.add('message', 'user-message');
    userMessage.innerHTML = `
        <p>${question}</p>
        <div class="message-info">أنت, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chat.appendChild(userMessage);
    
    input.value = '';
    chat.scrollTop = chat.scrollHeight;
    
    // Get AI response
    if (window.voxtralAI && window.currentLectureId) {
        window.voxtralAI.askQuestion(window.currentLectureId, question)
            .then(answer => {
                const aiMessage = document.createElement('div');
                aiMessage.classList.add('message', 'ai-message');
                aiMessage.innerHTML = `
                    <p>${answer}</p>
                    <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                `;
                chat.appendChild(aiMessage);
                chat.scrollTop = chat.scrollHeight;
            });
    } else {
        // Fallback response
        const aiMessage = document.createElement('div');
        aiMessage.classList.add('message', 'ai-message');
        aiMessage.innerHTML = `
            <p>عذراً، أحتاج أولاً إلى تحديد المحاضرة التي تريد السؤال عنها. يرجى الضغط على زر "ملخص" في إحدى المحاضرات أولاً.</p>
            <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        chat.appendChild(aiMessage);
        chat.scrollTop = chat.scrollHeight;
    }
}

// Enhanced AI message sending for lecture view
function sendAIChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    
    const question = input.value.trim();
    const activeContent = document.querySelector('.chat-content.active');
    
    if (!activeContent) return;
    
    // Add user message to chat
    addChatMessage('user', question);
    input.value = '';
    
    // Get AI response
    if (window.voxtralAI && window.currentLectureId) {
        // Show typing indicator
        const typingId = addChatMessage('ai', '🤖 جاري التفكير...', true);
        
        window.voxtralAI.askQuestion(window.currentLectureId, question)
            .then(answer => {
                // Remove typing indicator
                removeChatMessage(typingId);
                // Add real answer
                addChatMessage('ai', answer);
            });
    } else {
        addChatMessage('ai', 'عذراً، نظام الذكاء الاصطناعي غير متوفر حالياً.');
    }
}

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

    messageDiv.innerHTML = `
        <p>${message}</p>
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

// Enhanced generate lecture summary with real PHP integration
function generateSummary(lectureId) {
    console.log('📋 Generating summary for lecture:', lectureId);
    
    // Open AI section if closed
    const aiSection = document.getElementById('aiSection');
    if (!aiSection.classList.contains('active')) {
        aiSection.classList.add('active');
    }

    const chat = document.getElementById('aiChat');
    
    // Show loading message
    const loadingMessage = document.createElement('div');
    loadingMessage.classList.add('message', 'ai-message', 'loading-message');
    loadingMessage.innerHTML = `
        <p>🔄 جاري إنشاء ملخص المحاضرة ${lectureId}...</p>
        <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
    `;
    chat.appendChild(loadingMessage);
    chat.scrollTop = chat.scrollHeight;

    // Try to get summary from voxtral service
    fetch('voxtral_service.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `action=get_quick_summary&lecture_id=${lectureId}`
    })
    .then(response => response.json())
    .then(data => {
        // Remove loading message
        chat.removeChild(loadingMessage);
        
        let summary;
        if (data.success && data.summary) {
            summary = `📋 ملخص المحاضرة ${lectureId}:\n\n${data.summary}`;
        } else {
            // Fallback to hardcoded summaries
            const summaries = {
                1: "📋 ملخص المحاضرة: قوانين التفاضل\n\n" +
                    "• التعريف الأساسي للمشتقة: نهاية النسبة عندما تؤول إلى الصفر\n" +
                    "• قاعدة القوة: مشتقة س أس ن تساوي ن في س أس ن ناقص واحد\n" +
                    "• قاعدة المجموع: مشتقة مجموع دالتين تساوي مجموع مشتقتيهما\n" +
                    "• قاعدة الضرب: مشتقة حاصل ضرب دالتين\n" +
                    "• قاعدة القسمة: مشتقة خارج قسمة دالتين\n" +
                    "• قاعدة السلسلة: مشتقة الدالة المركبة",
                2: "📋 ملخص المحاضرة: الدوال الحقيقية\n\n" +
                    "• تعريف الدالة: علاقة تربط كل عنصر في المجال بعنصر واحد في المدى\n" +
                    "• أنواع الدوال: الخطية، التربيعية، التكعيبية، الجذرية\n" +
                    "• خصائص الدوال: المجال والمدى\n" +
                    "• العمليات على الدوال: الجمع، الطرح، الضرب، القسمة\n" +
                    "• الدالة المركبة: تطبيق دالة على نتيجة دالة أخرى\n" +
                    "• الدالة العكسية: إيجاد الدالة التي تعكس تأثير الدالة الأصلية",
                3: "📋 ملخص المحاضرة: التكامل\n\n" +
                    "• التكامل كعكس التفاضل: العملية العكسية للاشتقاق\n" +
                    "• التكامل غير المحدود: إيجاد الدالة الأصلية\n" +
                    "• التكامل المحدود: حساب المساحة تحت المنحنى\n" +
                    "• قواعد التكامل الأساسية: تكامل القوى والدوال المثلثية\n" +
                    "• طرق التكامل: التعويض والتكامل بالأجزاء\n" +
                    "• تطبيقات التكامل: حساب المساحات والأحجام"
            };
            summary = summaries[lectureId] || "عذراً، لم أتمكن من العثور على ملخص لهذه المحاضرة. يرجى المحاولة لاحقاً.";
        }

        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message', 'ai-message');
        messageDiv.innerHTML = `
            <p>${summary.replace(/\n/g, '<br>')}</p>
            <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
        `;

        chat.appendChild(messageDiv);
        chat.scrollTop = chat.scrollHeight;
        
        // Set current lecture ID for follow-up questions
        window.currentLectureId = lectureId;
    })
    .catch(error => {
        console.error('Error fetching summary:', error);
        // Remove loading message
        if (chat.contains(loadingMessage)) {
            chat.removeChild(loadingMessage);
        }
        
        // Show error message
        const errorMessage = document.createElement('div');
        errorMessage.classList.add('message', 'ai-message');
        errorMessage.innerHTML = `
            <p>❌ عذراً، حدث خطأ أثناء إنشاء الملخص. يرجى المحاولة لاحقاً.</p>
            <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
        `;
        chat.appendChild(errorMessage);
        chat.scrollTop = chat.scrollHeight;
    });
}

// Store current chat context
let currentLectureChatId = null;
let currentLectureChatRole = null;

// Shared chat logic for teacher-student communication
function getLectureChatMessages(lectureId) {
    const key = 'lecture_chat_' + lectureId;
    return JSON.parse(localStorage.getItem(key) || '[]');
}

function addLectureChatMessage(lectureId, sender, text) {
    const key = 'lecture_chat_' + lectureId;
    const messages = getLectureChatMessages(lectureId);
    messages.push({
        sender: sender,
        text: text,
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    });
    localStorage.setItem(key, JSON.stringify(messages));
}

// WhatsApp-like chat rendering: student is always blue/left, teacher is always white/right, both visible on both sides
function renderLectureChat(lectureId) {
    const messages = getLectureChatMessages(lectureId);

    function renderChat(chatContent) {
        if (!chatContent) return;
        chatContent.innerHTML = '';
        
        // Add initial message if no messages
        if (messages.length === 0) {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'message ai-message';
            welcomeDiv.innerHTML = `
                <div class="msg-bubble">
                    <p>يمكنك هنا التواصل مع الدكتور حول هذه المحاضرة</p>
                    <div class="message-info">النظام, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
            `;
            chatContent.appendChild(welcomeDiv);
        } else {
            messages.forEach(msg => {
                const isStudent = msg.sender === 'student';
                const div = document.createElement('div');
                div.className = 'message ' + (isStudent ? 'chat-student-msg' : 'chat-teacher-msg');
                div.innerHTML = `
                    <div class="msg-bubble">
                        <p>${msg.text}</p>
                        <div class="message-info">
                            ${isStudent ? 'طالب' : 'دكتور'}, ${msg.time}
                        </div>
                    </div>
                `;
                chatContent.appendChild(div);
            });
        }
        chatContent.scrollTop = chatContent.scrollHeight;
    }

    // Student chat tab (shows as "محادثة مع الدكتور")
    const studentChat = document.getElementById('doctor-chat-content');
    if (studentChat) renderChat(studentChat);

    // Teacher chat tab (shows as "أسئلة الطلاب")
    const teacherChat = document.getElementById('questions-chat-content');
    if (teacherChat) renderChat(teacherChat);
}

function sendLectureChatMessage() {
    if (!currentLectureChatId || !currentLectureChatRole) return;
    const input = document.getElementById('chat-input');
    if (!input || !input.value.trim()) return;
    const text = input.value.trim();
    // Store sender as 'student' or 'teacher' based on current role
    addLectureChatMessage(
        currentLectureChatId,
        currentLectureChatRole === 'teacher' ? 'teacher' : 'student',
        text
    );
    renderLectureChat(currentLectureChatId);
    input.value = '';
}

// Regular chat message sending (non-AI)
function sendChatMessage() {
    const activeTab = document.querySelector('.chat-tab.active');
    if (!activeTab) return;
    
    const chatType = activeTab.getAttribute('data-chat');
    
    if (chatType === 'doctor' || chatType === 'questions') {
        // Teacher-Student chat
        sendLectureChatMessage();
    }
}

// Enhanced open lecture view function
function openLectureView(lectureId, role = 'student') {
    console.log('🎥 Opening lecture view:', lectureId, 'Role:', role);
    
    // Hide all pages
    const pages = document.querySelectorAll('.pages-container, .main-content');
    pages.forEach(page => page.style.display = 'none');

    // Show lecture view page
    const lectureViewPage = document.getElementById('lecture-view-page');
    if (lectureViewPage) {
        lectureViewPage.style.display = 'block';
    }

    // Set current lecture ID globally
    window.currentLectureId = lectureId;

    // Try to get lecture from PHP first
    fetch('get_lectures.php')
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                const lecture = data.lectures.find(l => l.id == lectureId);
                if (lecture) {
                    updateLectureViewInfo(lecture);
                    setupVideoPlayer(lecture);
                } else {
                    console.error('Lecture not found:', lectureId);
                }
            }
        })
        .catch(error => {
            console.error('Error loading lecture:', error);
            // Fallback to localStorage
            const lecture = universityStorage?.getLectureById(parseInt(lectureId));
            if (lecture) {
                updateLectureViewInfo(lecture);
                setupVideoPlayer(lecture);
            }
        });

    // Set current chat context
    currentLectureChatId = lectureId;
    currentLectureChatRole = role;
    renderLectureChat(lectureId);

    // Setup chat handlers
    const sendBtn = document.getElementById('chat-send');
    if (sendBtn) {
        sendBtn.onclick = function() {
            const activeTab = document.querySelector('.chat-tab.active');
            if (activeTab && activeTab.getAttribute('data-chat') === 'ai') {
                sendAIChatMessage();
            } else {
                sendLectureChatMessage();
            }
        };
    }
    
    const chatInput = document.getElementById('chat-input');
    if (chatInput) {
        chatInput.onkeypress = function (e) {
            if (e.key === 'Enter') {
                const activeTab = document.querySelector('.chat-tab.active');
                if (activeTab && activeTab.getAttribute('data-chat') === 'ai') {
                    sendAIChatMessage();
                } else {
                    sendLectureChatMessage();
                }
            }
        };
    }
}

// Update lecture view information
function updateLectureViewInfo(lecture) {
    const elements = {
        'lecture-title': lecture.title,
        'current-lecture-title': lecture.title,
        'lecture-duration': lecture.duration,
        'lecture-date': lecture.date,
        'video-time': lecture.duration
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    });
}

// Setup video player
function setupVideoPlayer(lecture) {
    // Try real video path first
    if (lecture.videoPath) {
        const videoSource = document.getElementById('lecture-view-video-source');
        const video = document.getElementById('lecture-view-video');
        
        if (videoSource && video) {
            videoSource.src = lecture.videoPath;
            video.load();
        }
        
        // Setup download button
        const downloadBtn = document.getElementById('download-lecture-btn');
        if (downloadBtn) {
            downloadBtn.onclick = function () {
                const a = document.createElement('a');
                a.href = lecture.videoPath;
                a.download = lecture.title + ".mp4";
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
            };
        }
    } else {
        // Fallback to localStorage video
        let videoContainer = document.querySelector('#lecture-view-page .video-player');
        if (!videoContainer) {
            videoContainer = document.getElementById('lecture-video');
        }
        
        const videoData = universityVideoStorage?.getVideo(lecture.id);
        if (videoContainer && videoData) {
            if (videoContainer.tagName === 'VIDEO') {
                videoContainer.innerHTML = `
                    <source src="${videoData.data}" type="${videoData.type}">
                    متصفحك لا يدعم تشغيل الفيديو.
                `;
                videoContainer.load();
            } else {
                videoContainer.innerHTML = `
                    <video id="lecture-video-player" controls style="width:100%;height:100%;">
                        <source src="${videoData.data}" type="${videoData.type}">
                        متصفحك لا يدعم تشغيل الفيديو.
                    </video>
                `;
            }
        } else if (videoContainer) {
            videoContainer.innerHTML = `
                <div class="video-player-content">
                    <i class="fas fa-play-circle fa-5x"></i>
                    <div style="margin-top: 20px; font-size: 1.2rem;">الفيديو غير متوفر حالياً</div>
                </div>
            `;
        }
    }
}

// Global utility functions
window.openLectureView = openLectureView;
window.generateSummary = generateSummary;

// Make functions available for external access
window.commonJS = {
    openLectureView,
    generateSummary,
    addChatMessage,
    removeChatMessage
};