document.addEventListener('DOMContentLoaded', function () {
    // تحميل المحاضرات من PHP
    function loadTeacherLectures() {
        fetch('get_lectures.php')
            .then(res => res.json())
            .then(data => {
                const lectures = data.lectures.filter(l => l.teacherId == 1);
                const container = document.querySelector('.lecture-list');
                container.innerHTML = '';
                lectures.forEach(lecture => {
                    const lectureElement = document.createElement('div');
                    lectureElement.className = 'lecture-item';
                    
                    // Check processing status
                    const statusIcon = getProcessingStatusIcon(lecture);
                    
                    lectureElement.innerHTML = `
                        <div>
                            <h4>${lecture.title} ${statusIcon}</h4>
                            <p>مساق: ${lecture.course} | تاريخ الرفع: ${lecture.date}</p>
                        </div>
                        <div class="lecture-actions">
                            <button class="action-btn edit-btn" data-lecture="${lecture.id}">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn stats-btn" data-lecture="${lecture.id}">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button class="action-btn delete-btn" data-lecture="${lecture.id}">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `;
                    container.appendChild(lectureElement);
                });
                document.getElementById('stat-lectures').textContent = lectures.length;

                // حذف المحاضرة
                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.onclick = function () {
                        const lectureId = this.getAttribute('data-lecture');
                        if (confirm('هل أنت متأكد من حذف هذه المحاضرة؟')) {
                            fetch('delete_lecture.php', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                                body: 'id=' + encodeURIComponent(lectureId)
                            })
                            .then(res => res.json())
                            .then(data => {
                                if (data.success) {
                                    loadTeacherLectures();
                                    loadLecturesGrid();
                                    alert('تم حذف المحاضرة بنجاح');
                                } else {
                                    alert(data.message || 'حدث خطأ أثناء الحذف');
                                }
                            });
                        }
                    };
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

    // Enhanced upload handler with auto-processing support
    document.getElementById('upload-form').addEventListener('submit', function (e) {
        e.preventDefault();

        const title = document.getElementById('lecture-title-input').value.trim();
        const course = document.getElementById('lecture-course-input').value.trim();
        const description = document.getElementById('lecture-description-input').value.trim();
        const duration = document.getElementById('lecture-duration-input').value.trim() || "45 دقيقة";
        const date = new Date().toLocaleDateString('ar-EG');
        const videoInput = document.getElementById('lecture-video-input');
        const videoFile = videoInput.files[0];

        if (!title || !course) {
            alert('الرجاء إدخال العنوان واختيار المساق');
            return;
        }
        if (!videoFile) {
            alert('يرجى اختيار ملف فيديو للمحاضرة');
            return;
        }

        // التحقق من نوع الملف
        const validTypes = ['video/mp4', 'video/webm', 'video/ogg'];
        if (!validTypes.includes(videoFile.type)) {
            alert('نوع الملف غير مدعوم. الرجاء استخدام MP4, WebM, أو OGG.');
            return;
        }

        // التحقق من حجم الملف (500MB كحد أقصى)
        const maxSize = 500 * 1024 * 1024; // 500MB
        if (videoFile.size > maxSize) {
            alert('حجم الفيديو يتجاوز الحد المسموح (500MB)');
            return;
        }

        const submitBtn = document.getElementById('upload-lecture-btn');
        const originalText = submitBtn.textContent;
        
        // Create enhanced progress elements
        const progressContainer = document.createElement('div');
        progressContainer.className = 'upload-progress';
        progressContainer.innerHTML = `
            <div class="upload-phase">
                <h4>مرحلة الرفع:</h4>
                <div class="progress-bar-container">
                    <div class="progress-bar" id="upload-progress-bar"></div>
                </div>
                <div class="progress-text" id="upload-progress-text">جاري تحضير الرفع...</div>
            </div>
            <div class="processing-phase" id="processing-phase" style="display:none;">
                <h4>مرحلة المعالجة:</h4>
                <div class="ai-processing">
                    <i class="fas fa-robot fa-spin"></i>
                    <span>جاري معالجة المحاضرة بالذكاء الاصطناعي...</span>
                </div>
            </div>
        `;
        
        // Insert progress after the submit button
        submitBtn.parentNode.insertBefore(progressContainer, submitBtn.nextSibling);
        
        submitBtn.disabled = true;
        submitBtn.textContent = 'جاري رفع المحاضرة...';

        // Prepare form data
        const formData = new FormData();
        formData.append('video', videoFile);
        formData.append('title', title);
        formData.append('course', course);
        formData.append('description', description);
        formData.append('duration', duration);
        formData.append('date', date);
        formData.append('teacherId', 1);

        // Create XMLHttpRequest for progress tracking
        const xhr = new XMLHttpRequest();
        
        // Track upload progress
        xhr.upload.addEventListener('progress', function(e) {
            if (e.lengthComputable) {
                const percentComplete = (e.loaded / e.total) * 100;
                const progressBar = document.getElementById('upload-progress-bar');
                const progressText = document.getElementById('upload-progress-text');
                
                if (progressBar && progressText) {
                    progressBar.style.width = percentComplete + '%';
                    
                    // Format file sizes
                    const uploadedMB = (e.loaded / (1024 * 1024)).toFixed(1);
                    const totalMB = (e.total / (1024 * 1024)).toFixed(1);
                    
                    progressText.textContent = `جاري الرفع: ${uploadedMB} MB / ${totalMB} MB (${Math.round(percentComplete)}%)`;
                }
            }
        });

        // Handle successful upload
        xhr.addEventListener('load', function() {
            try {
                const response = JSON.parse(xhr.responseText);
                
                if (xhr.status === 200 && response.success) {
                    const progressText = document.getElementById('upload-progress-text');
                    if (progressText) {
                        progressText.textContent = 'تم الرفع بنجاح! ✅';
                    }
                    
                    // Show AI processing phase
                    const processingPhase = document.getElementById('processing-phase');
                    if (processingPhase) {
                        processingPhase.style.display = 'block';
                    }
                    
                    // Update submit button
                    submitBtn.textContent = 'تم الرفع - جاري المعالجة...';
                    
                    // Trigger auto-processing notification
                    if (response.auto_processing && window.voxtralAI) {
                        setTimeout(() => {
                            window.voxtralAI.autoProcessNewLecture(response.lecture);
                        }, 1000);
                    }
                    
                    setTimeout(() => {
                        alert('تم رفع المحاضرة بنجاح!\n' + 
                              (response.auto_processing ? 
                               'سيتم معالجتها بالذكاء الاصطناعي خلال دقائق.' : 
                               'يمكنك الآن استخدام الذكاء الاصطناعي معها.'));
                        
                        document.getElementById('upload-form').reset();
                        loadTeacherLectures();
                        loadLecturesGrid();
                        
                        // Remove progress container
                        if (progressContainer.parentNode) {
                            progressContainer.parentNode.removeChild(progressContainer);
                        }
                    }, 2000);
                } else {
                    throw new Error(response.message || 'فشل رفع المحاضرة');
                }
            } catch (error) {
                console.error('Upload error:', error);
                alert(error.message || 'حدث خطأ أثناء معالجة الاستجابة');
            }
        });

        // Handle upload errors
        xhr.addEventListener('error', function() {
            console.error('Network error during upload');
            alert('حدث خطأ في الشبكة أثناء الرفع. تحقق من اتصال الإنترنت.');
        });

        // Handle upload timeout
        xhr.addEventListener('timeout', function() {
            console.error('Upload timeout');
            alert('انتهت مهلة الرفع. الملف كبير جداً أو الاتصال بطيء.');
        });

        // Handle upload abortion
        xhr.addEventListener('abort', function() {
            console.log('Upload aborted');
            alert('تم إلغاء الرفع.');
        });

        // Always clean up after upload completes/fails
        xhr.addEventListener('loadend', function() {
            submitBtn.disabled = false;
            submitBtn.textContent = originalText;
            
            // Remove progress container after a delay if it still exists
            setTimeout(() => {
                if (progressContainer.parentNode) {
                    progressContainer.parentNode.removeChild(progressContainer);
                }
            }, 5000);
        });

        // Set timeout for very large files (15 minutes)
        xhr.timeout = 15 * 60 * 1000; // 15 minutes

        // Start the upload
        xhr.open('POST', 'upload_lecture.php');
        xhr.send(formData);

        // Add cancel button functionality
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'إلغاء الرفع';
        cancelBtn.className = 'btn btn-danger cancel-upload-btn';
        cancelBtn.onclick = function() {
            if (confirm('هل تريد إلغاء رفع المحاضرة؟')) {
                xhr.abort();
            }
        };
        progressContainer.appendChild(cancelBtn);
    });

    // تحميل المحاضرات في الصفحة الرئيسية للمعلم
    function loadLecturesGrid() {
        fetch('get_lectures.php')
            .then(res => res.json())
            .then(data => {
                const lectures = data.lectures;
                const grid = document.getElementById('teacher-lectures-grid');
                if (!grid) return;
                grid.innerHTML = '';
                lectures.forEach(lecture => {
                    const card = document.createElement('div');
                    card.className = 'lecture-card';
                    
                    // Processing status indicator
                    const statusIcon = getProcessingStatusIcon(lecture);
                    
                    card.innerHTML = `
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
                                <button class="action-btn summary-btn ai-summary-btn" data-lecture="${lecture.id}">
                                    <i class="fas fa-robot"></i> ملخص
                                </button>
                            </div>
                        </div>
                    `;
                    grid.appendChild(card);
                    
                    // Add event for مشاهدة button
                    card.querySelector('.watch-btn').onclick = function () {
                        showLectureView(lecture);
                    };
                    
                    // Enhanced summary button handler
                    card.querySelector('.ai-summary-btn').onclick = function () {
                        console.log('🎯 طلب ملخص للمحاضرة:', lecture.id);
                        if (window.voxtralAI) {
                            window.voxtralAI.getQuickSummary(lecture.id);
                        } else if (typeof generateSummary === 'function') {
                            generateSummary(lecture.id);
                        } else {
                            alert('نظام الذكاء الاصطناعي غير متوفر حالياً');
                        }
                    };
                });
            });
    }

    // Enhanced summary button handler (global)
    document.addEventListener('click', function (e) {
        const summaryBtn = e.target.closest('.ai-summary-btn');
        if (summaryBtn) {
            e.preventDefault();
            const lectureId = parseInt(summaryBtn.getAttribute('data-lecture'));
            console.log('🎯 طلب ملخص للمحاضرة:', lectureId);
            
            if (window.voxtralAI) {
                window.voxtralAI.getQuickSummary(lectureId);
            } else if (typeof generateSummary === 'function') {
                generateSummary(lectureId);
            } else {
                alert('نظام الذكاء الاصطناعي غير متوفر حالياً');
            }
        }
    });

    // Enhanced showLectureView for teacher
    function showLectureView(lecture) {
        // Save current lecture ID
        window.currentLectureId = lecture.id;
        window.currentLectureChatId = lecture.id;
        
        // Hide other pages
        document.getElementById('home-page').style.display = 'none';
        document.getElementById('teacher-dashboard-page').style.display = 'none';
        
        // Show lecture view page
        document.getElementById('lecture-view-page').style.display = 'block';
        
        // Update lecture info
        document.getElementById('lecture-title').textContent = lecture.title;
        document.getElementById('current-lecture-title').textContent = lecture.title;
        document.getElementById('lecture-duration').textContent = lecture.duration;
        document.getElementById('lecture-date').textContent = lecture.date;
        
        // Update video
        const videoSource = document.getElementById('lecture-view-video-source');
        const video = document.getElementById('lecture-view-video');
        if (videoSource && video) {
            videoSource.src = lecture.videoPath;
            video.load();
        }
        
        // Download button
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
    }

    // Auto-refresh processing status every 30 seconds
    setInterval(function() {
        // Refresh the lectures grid to update processing status
        loadLecturesGrid();
        loadTeacherLectures();
    }, 30000); // 30 seconds

    // تحميل المحاضرات عند بدء الصفحة
    loadTeacherLectures();
    loadLecturesGrid();
});

// Add styles for enhanced progress display
const style = document.createElement('style');
style.textContent = `
    .upload-phase, .processing-phase {
        margin-bottom: 15px;
        padding: 15px;
        border-radius: 8px;
        background: #f8f9fa;
    }
    
    .processing-phase {
        background: #e8f4f8;
        border: 1px solid #bee5eb;
    }
    
    .ai-processing {
        display: flex;
        align-items: center;
        gap: 10px;
        font-weight: 500;
        color: #0c5460;
    }
    
    .ai-processing i {
        font-size: 1.2rem;
        color: #17a2b8;
    }
    
    .upload-phase h4, .processing-phase h4 {
        margin: 0 0 10px 0;
        color: #495057;
        font-size: 1rem;
    }
`;
document.head.appendChild(style);