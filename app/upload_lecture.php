<?php
// upload_lecture.php - Fixed with simple Arabic output
set_time_limit(0);
ini_set('memory_limit', '1G');

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json');

// API key is read from the environment. Copy .env.example to .env and set AI_API_KEY,
// or export AI_API_KEY in your shell / hosting environment.
define('API_KEY', getenv('AI_API_KEY') ?: ($_ENV['AI_API_KEY'] ?? ''));

if (!API_KEY) {
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'AI_API_KEY is not configured. See README / .env.example.']);
    exit;
}

function logMessage($message) {
    $logFile = __DIR__ . '/upload_log.txt';
    $timestamp = date('Y-m-d H:i:s');
    file_put_contents($logFile, "[$timestamp] $message\n", FILE_APPEND | LOCK_EX);
}

// دالة تنظيف النص من الرموز غير المرغوبة
function cleanTextOutput($text) {
    // إزالة رموز LaTeX
    $text = preg_replace('/\\\\\(.*?\\\\\)/', '', $text);
    $text = preg_replace('/\\\\\[.*?\\\\\]/', '', $text);
    $text = preg_replace('/\$.*?\$/', '', $text);

    // إزالة علامات Markdown
    $text = str_replace('####', '', $text);
    $text = str_replace('###', '', $text);
    $text = str_replace('##', '', $text);
    $text = preg_replace('/\*\*(.*?)\*\*/', '$1', $text);
    $text = preg_replace('/\*(.*?)\*/', '$1', $text);

    // تنظيف الأسطر الفارغة الزائدة
    $text = preg_replace('/\n{3,}/', "\n\n", $text);

    // استبدال الرموز الرياضية بالعربية
    $replacements = [
        'f(x)' => 'دالة س',
        'g(x)' => 'دالة ج',
        'h(x)' => 'دالة هـ',
        'sin(x)' => 'جيب س',
        'cos(x)' => 'جيب تمام س',
        'tan(x)' => 'ظل س',
        'x²' => 'س تربيع',
        'x³' => 'س تكعيب',
        '²' => ' تربيع',
        '³' => ' تكعيب',
        'df/dx' => 'مشتقة د بالنسبة لـ س',
        '∫' => 'تكامل',
        '∑' => 'مجموع',
        '≤' => 'أصغر من أو يساوي',
        '≥' => 'أكبر من أو يساوي',
        '≠' => 'لا يساوي',
        '→' => 'يؤول إلى',
        '∞' => 'مالانهاية',
        'π' => 'باي',
        '√' => 'جذر',
        'lim' => 'نهاية',
        'log' => 'لوغاريتم'
    ];

    foreach ($replacements as $symbol => $arabic) {
        $text = str_replace($symbol, $arabic, $text);
    }

    return trim($text);
}

function processLectureVideo($lectureId, $videoPath) {
    logMessage("Starting AI processing for lecture $lectureId");

    $transcriptsDir = __DIR__ . '/lecture_transcripts/';
    if (!is_dir($transcriptsDir)) {
        mkdir($transcriptsDir, 0755, true);
    }

    try {
        // 1. Extract audio
        logMessage("Extracting audio from $videoPath");
        $audioPath = tempnam(sys_get_temp_dir(), 'audio_') . '.mp3';

        $ffmpegCmd = "ffmpeg -i \"$videoPath\" -vn -acodec mp3 -ar 16000 -y \"$audioPath\" 2>&1";
        logMessage("FFmpeg command: $ffmpegCmd");

        $ffmpegOutput = shell_exec($ffmpegCmd);
        logMessage("FFmpeg output: $ffmpegOutput");

        if (!file_exists($audioPath) || filesize($audioPath) < 1000) {
            throw new Exception("Audio extraction failed");
        }

        logMessage("Audio extracted successfully: " . filesize($audioPath) . " bytes");

        // 2. Transcribe with Voxtral
        logMessage("Starting transcription with Voxtral");
        $transcript = transcribeWithVoxtral($audioPath);

        // Clean up audio file
        unlink($audioPath);

        if (empty($transcript)) {
            throw new Exception("Transcription failed - empty result");
        }

        logMessage("Transcription successful: " . strlen($transcript) . " characters");

        // 3. Generate summary
        logMessage("Generating summary");
        $summary = generateSummary($transcript);

        // 4. Save results
        $data = [
            'lecture_id' => $lectureId,
            'transcript' => $transcript,
            'summary' => $summary,
            'processed_at' => date('Y-m-d H:i:s'),
            'length' => strlen($transcript)
        ];

        $transcriptFile = $transcriptsDir . "lecture_$lectureId.json";
        file_put_contents($transcriptFile, json_encode($data, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        logMessage("Processing completed successfully for lecture $lectureId");
        return true;

    } catch (Exception $e) {
        logMessage("Processing failed for lecture $lectureId: " . $e->getMessage());
        return false;
    }
}

function transcribeWithVoxtral($audioPath) {
    $models = ['voxtral-mini-2507', 'voxtral-small', 'voxtral-mini', 'whisper-large-v3'];

    foreach ($models as $model) {
        logMessage("Trying transcription with model: $model");

        $curl = curl_init();
        curl_setopt_array($curl, [
            CURLOPT_URL => 'https://api.mistral.ai/v1/audio/transcriptions',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer ' . API_KEY],
            CURLOPT_POSTFIELDS => [
                'file' => new CURLFile($audioPath),
                'model' => $model,
                'language' => 'ar',
                'response_format' => 'json'
            ],
            CURLOPT_TIMEOUT => 300
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        logMessage("Transcription API response code: $httpCode for model: $model");

        if ($httpCode === 200) {
            $result = json_decode($response, true);
            $text = $result['text'] ?? '';
            if (!empty($text)) {
                logMessage("Transcription successful with model: $model");
                return trim($text);
            }
        }

        logMessage("Model $model failed, trying next...");
    }

    return '';
}

function generateSummary($transcript) {
    $curl = curl_init();

    $prompt = "أنت مساعد تعليمي متخصص. لخص هذه المحاضرة بشكل شامل ومفيد للطلاب بالعربية البسيطة:

$transcript

اكتب ملخصاً منظماً يتضمن:
1. الموضوع الرئيسي
2. النقاط الأساسية  
3. المفاهيم المهمة
4. الأمثلة المذكورة

مهم جداً في كتابة الملخص:
- اكتب بالعربية البسيطة والواضحة فقط
- لا تستخدم أي رموز رياضية معقدة أو رموز خاصة
- اكتب المعادلات والقوانين بالكلمات العربية البسيطة
- مثال: بدلاً من (f(x) = x²) اكتب: دالة س تساوي س تربيع
- بدلاً من sin(x) اكتب: جيب س 
- بدلاً من cos(x) اكتب: جيب تمام س
- لا تستخدم رموز LaTeX مثل \\( أو \\[ أو \$
- لا تستخدم علامات Markdown مثل #### أو ** أو ***
- اكتب النص بصيغة عادية ومفهومة للطلاب";

    curl_setopt_array($curl, [
        CURLOPT_URL => 'https://api.mistral.ai/v1/chat/completions',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST => true,
        CURLOPT_HTTPHEADER => [
            'Authorization: Bearer ' . API_KEY,
            'Content-Type: application/json'
        ],
        CURLOPT_POSTFIELDS => json_encode([
            'model' => 'mistral-large-latest',
            'messages' => [
                ['role' => 'system', 'content' => 'أنت مساعد تعليمي متخصص. اكتب دائماً بالعربية البسيطة بدون أي رموز رياضية معقدة أو تنسيق خاص. اكتب المعادلات بالكلمات العربية البسيطة. لا تستخدم LaTeX أو Markdown أبداً.'],
                ['role' => 'user', 'content' => $prompt]
            ],
            'temperature' => 0.7
        ])
    ]);

    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);

    if ($httpCode === 200) {
        $result = json_decode($response, true);
        $summary = $result['choices'][0]['message']['content'] ?? 'فشل في إنشاء الملخص';

        // تنظيف إضافي للنص
        $summary = cleanTextOutput($summary);

        return $summary;
    }

    return 'فشل في إنشاء الملخص';
}

// Main upload logic (unchanged)
$videosDir = __DIR__ . '/video/';
$dbFile = __DIR__ . '/lectures.json';

if (!is_dir($videosDir)) {
    mkdir($videosDir, 0755, true);
}

$lectures = [];
if (file_exists($dbFile)) {
    $lectures = json_decode(file_get_contents($dbFile), true) ?: [];
}

$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['video'])) {
    $video = $_FILES['video'];
    $allowedTypes = ['video/mp4', 'video/webm', 'video/ogg'];
    $maxSize = 500 * 1024 * 1024; // 500MB

    logMessage("Upload attempt - File: {$video['name']}, Size: {$video['size']} bytes");

    // Validation
    if ($video['error'] !== UPLOAD_ERR_OK) {
        $response['message'] = 'خطأ أثناء رفع الملف: ' . $video['error'];
        echo json_encode($response);
        exit;
    }

    if (!in_array($video['type'], $allowedTypes)) {
        $response['message'] = 'صيغة الفيديو غير مدعومة';
        echo json_encode($response);
        exit;
    }

    if ($video['size'] > $maxSize) {
        $response['message'] = 'حجم الفيديو كبير جداً';
        echo json_encode($response);
        exit;
    }

    // Save video file
    $ext = pathinfo($video['name'], PATHINFO_EXTENSION) ?: 'mp4';
    $uniqueName = 'lecture_' . time() . '_' . rand(1000, 9999) . '.' . $ext;
    $targetPath = $videosDir . $uniqueName;

    if (move_uploaded_file($video['tmp_name'], $targetPath)) {
        logMessage("File uploaded successfully to: $targetPath");

        // Save lecture info
        $lectureId = count($lectures) > 0 ? max(array_column($lectures, 'id')) + 1 : 1;
        $lecture = [
            'id' => $lectureId,
            'title' => $_POST['title'] ?? '',
            'course' => $_POST['course'] ?? '',
            'description' => $_POST['description'] ?? '',
            'duration' => $_POST['duration'] ?? '',
            'date' => $_POST['date'] ?? '',
            'teacherId' => $_POST['teacherId'] ?? '',
            'videoPath' => 'video/' . $uniqueName,
            'fileSize' => filesize($targetPath),
            'uploadDate' => date('Y-m-d H:i:s'),
            'processing_status' => 'processing'
        ];

        $lectures[] = $lecture;
        file_put_contents($dbFile, json_encode($lectures, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        logMessage("Lecture data saved, starting AI processing...");

        // Start AI processing immediately
        $processingSuccess = processLectureVideo($lectureId, $targetPath);

        if ($processingSuccess) {
            // Update processing status to completed
            foreach ($lectures as &$l) {
                if ($l['id'] == $lectureId) {
                    $l['processing_status'] = 'completed';
                    $l['ai_ready'] = true;
                    break;
                }
            }
            file_put_contents($dbFile, json_encode($lectures, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

            $response['success'] = true;
            $response['lecture'] = $lecture;
            $response['message'] = 'تم رفع المحاضرة ومعالجتها بالذكاء الاصطناعي بنجاح!';
            $response['ai_ready'] = true;
        } else {
            // Mark as error but still consider upload successful
            foreach ($lectures as &$l) {
                if ($l['id'] == $lectureId) {
                    $l['processing_status'] = 'error';
                    $l['ai_ready'] = false;
                    break;
                }
            }
            file_put_contents($dbFile, json_encode($lectures, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

            $response['success'] = true;
            $response['lecture'] = $lecture;
            $response['message'] = 'تم رفع المحاضرة بنجاح ولكن فشلت المعالجة بالذكاء الاصطناعي. يمكنك المحاولة لاحقاً.';
            $response['ai_ready'] = false;
        }

    } else {
        $response['message'] = 'تعذر حفظ الفيديو على الخادم';
    }
} else {
    $response['message'] = 'طلب غير صالح';
}

echo json_encode($response);
?>