<?php
// check_system.php - فحص سريع للنظام
header('Content-Type: text/html; charset=utf-8');
?>
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="UTF-8">
    <title>فحص النظام للذكاء الاصطناعي</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
        .warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
        .error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
        .info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }
        h1 { color: #333; text-align: center; }
        h2 { color: #666; border-bottom: 2px solid #eee; padding-bottom: 10px; }
        code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🤖 فحص النظام للذكاء الاصطناعي</h1>
        
        <h2>🔧 إعدادات PHP الأساسية</h2>
        <?php
        echo "<div class='info'>";
        echo "<strong>إصدار PHP:</strong> " . phpversion() . "<br>";
        echo "<strong>نظام التشغيل:</strong> " . PHP_OS . "<br>";
        echo "<strong>معالج الطلبات:</strong> " . php_sapi_name() . "<br>";
        echo "</div>";
        ?>
        
        <h2>📊 إعدادات الرفع والذاكرة</h2>
        <?php
        $upload_max = ini_get('upload_max_filesize');
        $post_max = ini_get('post_max_size');
        $memory = ini_get('memory_limit');
        $max_time = ini_get('max_execution_time');
        
        echo "<div class='status " . (((int)$upload_max >= 100) ? "success" : "warning") . "'>";
        echo "📁 <strong>أقصى حجم ملف:</strong> $upload_max";
        echo "</div>";
        
        echo "<div class='status " . (((int)$post_max >= 100) ? "success" : "warning") . "'>";
        echo "📤 <strong>أقصى حجم POST:</strong> $post_max";
        echo "</div>";
        
        echo "<div class='status " . (((int)$memory >= 512) ? "success" : "warning") . "'>";
        echo "🧠 <strong>ذاكرة PHP:</strong> $memory";
        echo "</div>";
        
        echo "<div class='status " . (($max_time >= 300) ? "success" : "warning") . "'>";
        echo "⏱️ <strong>وقت التنفيذ الأقصى:</strong> {$max_time}s";
        echo "</div>";
        ?>
        
        <h2>🔗 فحص الإضافات المطلوبة</h2>
        <?php
        $required_extensions = [
            'curl' => 'مطلوب للذكاء الاصطناعي',
            'json' => 'مطلوب لمعالجة البيانات',
            'openssl' => 'مطلوب للاتصال الآمن',
            'fileinfo' => 'مطلوب لتحليل الملفات',
            'mbstring' => 'مطلوب للنصوص العربية'
        ];
        
        foreach ($required_extensions as $ext => $desc) {
            $loaded = extension_loaded($ext);
            $statusClass = $loaded ? 'success' : 'error';
            $icon = $loaded ? '✅' : '❌';
            
            echo "<div class='status $statusClass'>";
            echo "$icon <strong>$ext:</strong> " . ($loaded ? 'مُفعل' : 'غير مُفعل') . " - $desc";
            echo "</div>";
        }
        ?>
        
        <h2>🌐 اختبار اتصال cURL</h2>
        <?php
        if (function_exists('curl_init')) {
            echo "<div class='status success'>✅ <strong>cURL متوفر!</strong> جاري اختبار الاتصال...</div>";
            
            // اختبار اتصال بسيط
            $curl = curl_init();
            curl_setopt($curl, CURLOPT_URL, 'https://httpbin.org/get');
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($curl, CURLOPT_TIMEOUT, 10);
            curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);
            
            $response = curl_exec($curl);
            $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
            $error = curl_error($curl);
            curl_close($curl);
            
            if ($error) {
                echo "<div class='status error'>❌ <strong>خطأ في cURL:</strong> $error</div>";
            } elseif ($httpCode == 200) {
                echo "<div class='status success'>🌐 <strong>اختبار الإنترنت نجح!</strong> HTTP $httpCode</div>";
                
                // اختبار Mistral API
                echo "<div class='info'>🤖 <strong>اختبار Mistral API...</strong></div>";
                
                $curl = curl_init();
                curl_setopt($curl, CURLOPT_URL, 'https://api.mistral.ai/v1/models');
                curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
                curl_setopt($curl, CURLOPT_HTTPHEADER, [
                    'Authorization: Bearer ' . (getenv('AI_API_KEY') ?: ($_ENV['AI_API_KEY'] ?? '')),
                    'Accept: application/json'
                ]);
                curl_setopt($curl, CURLOPT_TIMEOUT, 15);
                curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, true);
                
                $response = curl_exec($curl);
                $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
                $error = curl_error($curl);
                curl_close($curl);
                
                if ($error) {
                    echo "<div class='status error'>❌ <strong>خطأ في Mistral API:</strong> $error</div>";
                } elseif ($httpCode == 200) {
                    echo "<div class='status success'>🎉 <strong>Mistral API يعمل بشكل مثالي!</strong></div>";
                    $models = json_decode($response, true);
                    if (isset($models['data'])) {
                        echo "<div class='info'>📋 عدد النماذج المتاحة: " . count($models['data']) . "</div>";
                    }
                } elseif ($httpCode == 401) {
                    echo "<div class='status warning'>🔑 <strong>مفتاح API يحتاج تحديث</strong> (HTTP 401)</div>";
                } else {
                    echo "<div class='status warning'>⚠️ <strong>Mistral API:</strong> HTTP $httpCode</div>";
                }
            } else {
                echo "<div class='status warning'>⚠️ <strong>اختبار الإنترنت:</strong> HTTP $httpCode</div>";
            }
        } else {
            echo "<div class='status error'>❌ <strong>cURL غير متوفر!</strong> يجب تفعيله أولاً.</div>";
        }
        ?>
        
        <h2>📋 التوصيات</h2>
        <?php
        echo "<div class='info'>";
        
        if (!function_exists('curl_init')) {
            echo "<strong>🔧 لتفعيل cURL:</strong><br>";
            echo "• على Windows: أضف <code>extension=curl</code> في php.ini<br>";
            echo "• على Linux: <code>sudo apt install php-curl</code><br>";
            echo "• أو شغل مع: <code>php -d extension=curl -S localhost:8000</code><br><br>";
        }
        
        if (function_exists('curl_init')) {
            echo "<strong>🚀 النظام جاهز للذكاء الاصطناعي!</strong><br>";
            echo "• يمكنك الآن استخدام النظام الحقيقي<br>";
            echo "• جرب الضغط على زر 'ملخص' في أي محاضرة<br>";
        }
        
        echo "</div>";
        ?>
        
        <h2>🎯 أوامر التشغيل المقترحة</h2>
        <div class="info">
            <strong>للتشغيل العادي:</strong><br>
            <code>php -c custom-php.ini -S localhost:8000</code><br><br>
            
            <strong>مع تفعيل cURL:</strong><br>
            <code>php -c custom-php.ini -d extension=curl -S localhost:8000</code><br><br>
            
            <strong>للتطوير المتقدم:</strong><br>
            <code>php -c custom-php.ini -d extension=curl -d extension=openssl -d memory_limit=2G -S localhost:8000</code>
        </div>
    </div>
</body>
</html>