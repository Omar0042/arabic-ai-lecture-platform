<?php
// delete_lecture.php — removes a lecture record and its associated video file.

header('Content-Type: application/json');

$dbFile = __DIR__ . '/lectures.json';
$lectures = [];
if (file_exists($dbFile)) {
    $lectures = json_decode(file_get_contents($dbFile), true) ?: [];
}

$response = ['success' => false];

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['id'])) {
    $id = intval($_POST['id']);
    $found = false;
    foreach ($lectures as $idx => $lecture) {
        if ($lecture['id'] == $id) {
            $found = true;
            // Remove video file
            if (!empty($lecture['videoPath'])) {
                $videoFile = __DIR__ . '/' . $lecture['videoPath'];
                if (file_exists($videoFile)) {
                    unlink($videoFile);
                }
            }
            // Remove lecture from array
            array_splice($lectures, $idx, 1);
            break;
        }
    }
    if ($found) {
        file_put_contents($dbFile, json_encode($lectures, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
        $response['success'] = true;
    } else {
        $response['message'] = 'لم يتم العثور على المحاضرة.';
    }
} else {
    $response['message'] = 'طلب غير صالح.';
}

echo json_encode($response);
