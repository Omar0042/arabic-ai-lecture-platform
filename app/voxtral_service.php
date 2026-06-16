<?php
// voxtral_service.php - Fixed with simple Arabic output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// API key is read from the environment. Copy .env.example to .env and set AI_API_KEY,
// or export AI_API_KEY in your shell / hosting environment.
define('API_KEY', getenv('AI_API_KEY') ?: ($_ENV['AI_API_KEY'] ?? ''));

if (!API_KEY) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'AI_API_KEY is not configured. See README / .env.example.']);
    exit;
}
const BASE_URL = 'https://api.mistral.ai/v1';

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

class VoxtralService {
    private $transcripts_dir;

    public function __construct() {
        $this->transcripts_dir = __DIR__ . '/lecture_transcripts/';
        if (!is_dir($this->transcripts_dir)) {
            mkdir($this->transcripts_dir, 0755, true);
        }
    }

    // Get quick summary from saved transcript
    public function getQuickSummary($lectureId) {
        $filePath = $this->transcripts_dir . "lecture_{$lectureId}.json";

        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            $summary = $data['summary'] ?? 'الملخص غير متوفر';

            // تنظيف الملخص من أي رموز متبقية
            $summary = cleanTextOutput($summary);

            return [
                'success' => true,
                'summary' => $summary,
                'processed_at' => $data['processed_at'] ?? '',
                'length' => $data['length'] ?? 0,
                'ready' => true
            ];
        }

        return [
            'success' => false, 
            'error' => 'المحاضرة لم يتم معالجتها بعد',
            'ready' => false
        ];
    }

    // Answer question based on saved transcript
    public function answerQuestion($lectureId, $question) {
        $filePath = $this->transcripts_dir . "lecture_{$lectureId}.json";

        if (!file_exists($filePath)) {
            return ['success' => false, 'error' => 'المحاضرة لم يتم معالجتها بعد'];
        }

        $data = json_decode(file_get_contents($filePath), true);
        $transcript = $data['transcript'] ?? '';

        if (empty($transcript)) {
            return ['success' => false, 'error' => 'النص غير متوفر'];
        }

        $curl = curl_init();

        curl_setopt_array($curl, [
            CURLOPT_URL => BASE_URL . '/chat/completions',
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . API_KEY,
                'Content-Type: application/json'
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'model' => 'mistral-large-latest',
                'messages' => [
                    [
                        'role' => 'system', 
                        'content' => 'أنت مساعد ذكي متخصص في التعليم. أجب على الأسئلة بناءً فقط على محتوى المحاضرة المرفقة. لا تضيف معلومات من خارج النص. 

مهم جداً في كتابة الإجابة:
- اكتب بالعربية البسيطة والواضحة فقط
- لا تستخدم أي رموز رياضية معقدة أو رموز LaTeX
- لا تستخدم تنسيق Markdown مثل ** أو #### أو ***
- اكتب المعادلات والقوانين بالكلمات العربية البسيطة
- مثال: بدلاً من f(x) = x² اكتب "دالة س تساوي س تربيع"
- بدلاً من sin(x) اكتب "جيب س"
- بدلاً من cos(x) اكتب "جيب تمام س"
- بدلاً من df/dx اكتب "مشتقة د بالنسبة لـ س"
- كن مفيداً وواضحاً في إجاباتك
- اكتب بصيغة طبيعية ومفهومة للطلاب'
                    ],
                    [
                        'role' => 'user', 
                        'content' => "محتوى المحاضرة:\n$transcript\n\nسؤال الطالب: $question\n\nأجب بناءً على محتوى المحاضرة فقط باستخدام العربية البسيطة بدون أي رموز معقدة:"
                    ]
                ],
                'temperature' => 0.3
            ])
        ]);

        $response = curl_exec($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        if ($httpCode === 200) {
            $result = json_decode($response, true);
            $answer = $result['choices'][0]['message']['content'] ?? 'لم أتمكن من الإجابة';

            // تنظيف النص من أي رموز متبقية
            $answer = cleanTextOutput($answer);

            return [
                'success' => true,
                'answer' => $answer
            ];
        }

        return ['success' => false, 'error' => 'فشل في الحصول على الإجابة'];
    }

    // Get transcript data
    public function getTranscript($lectureId) {
        $filePath = $this->transcripts_dir . "lecture_{$lectureId}.json";

        if (file_exists($filePath)) {
            $data = json_decode(file_get_contents($filePath), true);
            return [
                'success' => true,
                'transcript' => $data['transcript'] ?? '',
                'summary' => cleanTextOutput($data['summary'] ?? ''),
                'processed_at' => $data['processed_at'] ?? '',
                'length' => $data['length'] ?? 0
            ];
        }

        return ['success' => false, 'error' => 'المحاضرة غير موجودة'];
    }

    // Get processing status
    public function getProcessingStatus($lectureId) {
        $resultFile = $this->transcripts_dir . "lecture_{$lectureId}.json";

        if (file_exists($resultFile)) {
            return ['status' => 'completed', 'ready' => true];
        } else {
            return ['status' => 'pending', 'ready' => false];
        }
    }

    // Manual processing (if needed)
    public function processLecture($lectureId) {
        return ['success' => false, 'error' => 'المعالجة تتم تلقائياً أثناء الرفع'];
    }
}

// Handle requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $voxtral = new VoxtralService();
    $action = $_POST['action'] ?? '';

    try {
        switch ($action) {
            case 'get_quick_summary':
                $lectureId = $_POST['lecture_id'] ?? '';
                $result = $voxtral->getQuickSummary($lectureId);
                echo json_encode($result);
                break;

            case 'ask_question':
                $lectureId = $_POST['lecture_id'] ?? '';
                $question = $_POST['question'] ?? '';

                if (empty($question)) {
                    echo json_encode(['success' => false, 'error' => 'السؤال فارغ']);
                    break;
                }

                $result = $voxtral->answerQuestion($lectureId, $question);
                echo json_encode($result);
                break;

            case 'get_transcript':
                $lectureId = $_POST['lecture_id'] ?? '';
                $result = $voxtral->getTranscript($lectureId);
                echo json_encode($result);
                break;

            case 'get_status':
                $lectureId = $_POST['lecture_id'] ?? '';
                $result = $voxtral->getProcessingStatus($lectureId);
                echo json_encode(['success' => true, 'status' => $result]);
                break;

            case 'process_lecture':
                $lectureId = $_POST['lecture_id'] ?? '';
                $result = $voxtral->processLecture($lectureId);
                echo json_encode($result);
                break;

            default:
                echo json_encode(['success' => false, 'error' => 'إجراء غير معروف']);
        }

    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'error' => 'يجب استخدام POST']);
}
?>