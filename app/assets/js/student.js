document.addEventListener('DOMContentLoaded', function () {
    // تحميل المحاضرات المتاحة
    function loadAvailableLectures() {
        fetch('get_lectures.php')
            .then(res => res.json())
            .then(data => {
                const lectures = data.lectures;
                const container = document.querySelector('.lectures-grid');
                container.innerHTML = '';
                // Get current student (assume id=1 for demo)
                const student = universityStorage.getStudentById(1);
                const myLectureIds = student ? student.courses : [];
                lectures.forEach(lecture => {
                    const lectureCard = document.createElement('div');
                    lectureCard.className = 'lecture-card';
                    // Check if registered
                    const isRegistered = myLectureIds.includes(lecture.id);
                    
                    // Processing status indicator
                    const statusIcon = getProcessingStatusIcon(lecture);
                    
                    lectureCard.innerHTML = `
                        <div class="lecture-thumbnail">
                            <i class="fas fa-laptop-code"></i>
                        </div>
                        <div class="lecture-info">
                            <h3>${lecture.title} ${statusIcon}</h3>
                            <div class="lecture-meta">
                                <span><i class="far fa-clock"></i> ${lecture.duration}</span>
                                <span><i class="far fa-calendar"></i> ${lecture.date}</span>
                            </div>
                            <p>${lecture.description}</p>
                            <div class="lecture-actions">
                                <button class="action-btn watch-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-play"></i> مشاهدة
                                </button>
                                <button class="action-btn summary-btn ai-summary-btn" data-lecture="${lecture.id}" ${!isProcessingReady(lecture) ? 'disabled title="المحاضرة قيد المعالجة"' : ''}>
                                    <i class="fas fa-robot"></i> ملخص
                                </button>
                                ${!isRegistered ? `
                                <button class="action-btn register-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-plus"></i> التسجيل
                                </button>
                                ` : `
                                <button class="action-btn remove-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-minus"></i> إزالة من محاضراتي
                                </button>
                                `}
                            </div>
                        </div>
                    `;
                    container.appendChild(lectureCard);
                });
            });
    }

    // Get processing status icon
    function getProcessingStatusIcon(lecture) {
        const status = lecture.processing_status || 'unknown';
        switch (status) {
            case 'completed':
                return '<i class="fas fa-check-circle" style="color: green;" title="جاهز للاستخدام"></i>';
            case 'processing':
                return '<i class="fas fa-spinner fa-spin" style="color: orange;" title="قيد المعالجة"></i>';
            case 'pending':
                return '<i class="fas fa-clock" style="color: gray;" title="في انتظار المعالجة"></i>';
            case 'error':
                return '<i class="fas fa-exclamation-triangle" style="color: red;" title="خطأ في المعالجة"></i>';
            default:
                return '<i class="fas fa-question-circle" style="color: gray;" title="حالة غير معروفة"></i>';
        }
    }

    // Check if processing is ready for AI features
    function isProcessingReady(lecture) {
        const status = lecture.processing_status || 'unknown';
        return status === 'completed';
    }

    function loadMyLectures() {
        // Use get_lectures.php for consistency
        fetch('get_lectures.php')
            .then(res => res.json())
            .then(data => {
                const allLectures = data.lectures;
                const student = universityStorage.getStudentById(1);
                const myLectureIds = student ? student.courses : [];
                const myLectures = allLectures.filter(l => myLectureIds.includes(l.id));
                const container = document.querySelector('.lectures-container');
                if (!container) return;
                container.innerHTML = '';
                myLectures.forEach(lecture => {
                    const lectureCard = document.createElement('div');
                    lectureCard.className = 'lecture-card';
                    
                    // Processing status indicator
                    const statusIcon = getProcessingStatusIcon(lecture);
                    const isReady = isProcessingReady(lecture);
                    
                    lectureCard.innerHTML = `
                        <div class="lecture-thumbnail">
                            <i class="fas fa-laptop-code"></i>
                        </div>
                        <div class="lecture-info">
                            <h3>${lecture.title} ${statusIcon}</h3>
                            <div class="lecture-meta">
                                <span><i class="far fa-clock"></i> ${lecture.duration}</span>
                                <span><i class="far fa-calendar"></i> ${lecture.date}</span>
                            </div>
                            <p>${lecture.description}</p>
                            <div class="lecture-actions">
                                <button class="action-btn watch-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-play"></i> مشاهدة
                                </button>
                                <button class="action-btn summary-btn ai-summary-btn" data-lecture="${lecture.id}" ${!isReady ? 'disabled title="المحاضرة قيد المعالجة"' : ''}>
                                    <i class="fas fa-robot"></i> ملخص
                                </button>
                                <button class="action-btn download-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-download"></i> تحميل
                                </button>
                                <button class="action-btn remove-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-minus"></i> إزالة من محاضراتي
                                </button>
                            </div>
                        </div>
                    `;
                    container.appendChild(lectureCard);
                });
            });
    }

    // تشغيل المحاضرة
    document.addEventListener('click', function (e) {
        const watchBtn = e.target.closest('.watch-btn');
        if (watchBtn) {
            const lectureId = parseInt(watchBtn.getAttribute('data-lecture'));
            fetch('get_lectures.php')
                .then(res => res.json())
                .then(data => {
                    const lecture = data.lectures.find(l => l.id == lectureId);
                    if (lecture && lecture.videoPath) {
                        showLectureView(lecture);
                    } else {
                        alert('الفيديو غير متوفر حالياً');
                    }
                });
        }
        // تحميل المحاضرة
        const downloadBtn = e.target.closest('.download-btn');
        if (downloadBtn) {
            const lectureId = parseInt(downloadBtn.getAttribute('data-lecture'));
            fetch('get_lectures.php')
                .then(res => res.json())
                .then(data => {
                    const lecture = data.lectures.find(l => l.id == lectureId);
                    if (lecture && lecture.videoPath) {
                        const a = document.createElement('a');
                        a.href = lecture.videoPath;
                        a.download = lecture.title + ".mp4";
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    } else {
                        alert('الفيديو غير متوفر حالياً');
                    }
                });
        }
    });

    function showLectureView(lecture) {
        // Save current lecture ID - enhanced
        window.currentLectureId = lecture.id;
        window.currentLectureChatId = lecture.id;
        
        document.getElementById('lecture-view-video-source').src = lecture.videoPath;
        document.getElementById('lecture-view-video').load();
        document.getElementById('lecture-title').textContent = lecture.title;
        document.getElementById('current-lecture-title').textContent = lecture.title;
        document.getElementById('lecture-duration').textContent = lecture.duration;
        document.getElementById('lecture-date').textContent = lecture.date;
        document.getElementById('lecture-view-page').style.display = 'block';
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('lectures-page').style.display = 'none';
        
        // Enhanced download button
        document.getElementById('download-lecture-btn').onclick = function () {
            const a = document.createElement('a');
            a.href = lecture.videoPath;
            a.download = lecture.title + ".mp4";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        };

        // Initialize AI chat for this lecture if processing is ready
        if (isProcessingReady(lecture) && window.voxtralAI) {
            const aiChatContent = document.getElementById('ai-chat-content');
            if (aiChatContent && aiChatContent.children.length <= 1) {
                // Add welcome message specific to this lecture
                const welcomeMsg = document.createElement('div');
                welcomeMsg.className = 'message ai-message';
                welcomeMsg.innerHTML = `
                    <p>مرحباً! أنا هنا لمساعدتك في فهم محاضرة "${lecture.title}". يمكنك سؤالي عن أي مفهوم أو طلب تلخيص جزء معين.</p>
                    <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                `;
                aiChatContent.appendChild(welcomeMsg);
            }
        }
    }

    // تسجيل المحاضرة وإزالتها
    document.addEventListener('click', function (e) {
        const registerBtn = e.target.closest('.register-btn');
        if (registerBtn) {
            const lectureId = parseInt(registerBtn.getAttribute('data-lecture'));
            const success = universityStorage.enrollStudent(1, lectureId);
            if (success) {
                alert('تم إضافة المحاضرة إلى محاضراتي!');
                loadAvailableLectures();
                loadMyLectures();
            } else {
                alert('أنت مسجل بالفعل في هذه المحاضرة.');
            }
        }
        const removeBtn = e.target.closest('.remove-btn');
        if (removeBtn) {
            const lectureId = parseInt(removeBtn.getAttribute('data-lecture'));
            const success = universityStorage.unenrollStudent(1, lectureId);
            if (success) {
                alert('تم إزالة المحاضرة من محاضراتي!');
                loadAvailableLectures();
                loadMyLectures();
            } else {
                alert('حدث خطأ أثناء الإزالة.');
            }
        }
    });

    // Enhanced summary button handler
    document.addEventListener('click', function (e) {
        const summaryBtn = e.target.closest('.ai-summary-btn');
        if (summaryBtn && !summaryBtn.disabled) {
            e.preventDefault();
            const lectureId = parseInt(summaryBtn.getAttribute('data-lecture'));
            console.log('🎯 طلب ملخص للمحاضرة:', lectureId);
            
            // Check if voxtralAI is available (enhanced system)
            if (window.voxtralAI) {
                window.voxtralAI.getQuickSummary(lectureId);
            } else if (typeof generateSummary === 'function') {
                // Fallback to legacy system
                generateSummary(lectureId);
            } else {
                alert('نظام الذكاء الاصطناعي غير متوفر حالياً');
            }
        } else if (summaryBtn && summaryBtn.disabled) {
            alert('المحاضرة قيد المعالجة بالذكاء الاصطناعي. يرجى المحاولة لاحقاً.');
        }
    });

    // Auto-refresh processing status every 30 seconds
    setInterval(function() {
        // Refresh the lectures to update processing status
        loadAvailableLectures();
        loadMyLectures();
    }, 30000); // 30 seconds

    // Enhanced AI assistant integration
    const aiAssistantBtn = document.getElementById('aiAssistantBtn');
    if (aiAssistantBtn) {
        aiAssistantBtn.addEventListener('click', function() {
            const aiSection = document.getElementById('aiSection');
            if (aiSection) {
                aiSection.classList.add('active');
                
                // Add processing status info to AI section if first time
                const aiChat = document.getElementById('aiChat');
                if (aiChat && aiChat.children.length <= 2) {
                    const infoMsg = document.createElement('div');
                    infoMsg.className = 'message ai-message';
                    infoMsg.innerHTML = `
                        <p>💡 <strong>نصيحة:</strong> المحاضرات التي تحمل علامة <i class="fas fa-check-circle" style="color: green;"></i> جاهزة للتفاعل الكامل معي. المحاضرات قيد المعالجة <i class="fas fa-spinner fa-spin" style="color: orange;"></i> ستكون جاهزة قريباً!</p>
                        <div class="message-info">مساعد جامعة, ${new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</div>
                    `;
                    aiChat.appendChild(infoMsg);
                }
            }
        });
    }

    // تحميل المحاضرات عند بدء الصفحة
    loadAvailableLectures();
    loadMyLectures();
});

// Add styles for disabled buttons
const style = document.createElement('style');
style.textContent = `
    .action-btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        background-color: #6c757d !important;
    }
    
    .action-btn:disabled:hover {
        transform: none !important;
        opacity: 0.5 !important;
    }
    
    .processing-status-icon {
        margin-left: 5px;
        font-size: 0.9rem;
    }
`;
document.head.appendChild(style);