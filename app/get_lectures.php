<?php
// get_lectures.php - Fixed processing status display
header('Content-Type: application/json');

$dbFile = __DIR__ . '/lectures.json';
$transcriptsDir = __DIR__ . '/lecture_transcripts/';

$lectures = [];
if (file_exists($dbFile)) {
    $lectures = json_decode(file_get_contents($dbFile), true) ?: [];
}

// Update processing status for each lecture
foreach ($lectures as &$lecture) {
    $lectureId = $lecture['id'];
    $transcriptFile = $transcriptsDir . "lecture_{$lectureId}.json";
    
    if (file_exists($transcriptFile)) {
        // Processing completed
        $lecture['processing_status'] = 'completed';
        $lecture['ai_ready'] = true;
        
        // Get processing details
        $transcriptData = json_decode(file_get_contents($transcriptFile), true);
        if ($transcriptData) {
            $lecture['processed_at'] = $transcriptData['processed_at'] ?? null;
            $lecture['transcript_length'] = $transcriptData['length'] ?? 0;
        }
    } else {
        // Check if it was marked as processing or error in the original data
        if (!isset($lecture['processing_status'])) {
            $lecture['processing_status'] = 'pending';
        }
        
        // If it's older than 1 hour and still processing, mark as error
        if (isset($lecture['uploadDate'])) {
            $uploadTime = strtotime($lecture['uploadDate']);
            if ($lecture['processing_status'] === 'processing' && (time() - $uploadTime) > 3600) {
                $lecture['processing_status'] = 'error';
            }
        }
        
        $lecture['ai_ready'] = false;
    }
}

// Count ready lectures
$readyCount = count(array_filter($lectures, function($l) { 
    return isset($l['ai_ready']) && $l['ai_ready']; 
}));

echo json_encode([
    'success' => true, 
    'lectures' => $lectures,
    'timestamp' => date('Y-m-d H:i:s'),
    'total_lectures' => count($lectures),
    'ready_for_ai' => $readyCount
]);
?>