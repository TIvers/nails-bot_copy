    <?php
    // Включаем вывод всех ошибок для отладки
    error_reporting(E_ALL);
    ini_set('display_errors', 1);

    // Устанавливаем заголовок JSON
    header('Content-Type: application/json; charset=utf-8');

    // Данные для запроса
    $url = 'https://nails.nilit2.ru:8000/check_item.php';
    $data = [
        'id_product' => 12895,
    ];

    try {
        // Инициализация cURL
        $ch = curl_init();

        // Настройки cURL
        $options = [
            CURLOPT_URL => $url,
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => http_build_query($data),
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false, // Только для разработки!
            CURLOPT_SSL_VERIFYHOST => false,  // Только для разработки!
            CURLOPT_FOLLOWLOCATION => false,  // Запрещаем редиректы
            CURLOPT_HTTPHEADER => [
                'Accept: application/json',
                'Cache-Control: no-cache'
            ],
            CURLOPT_TIMEOUT => 30
        ];

        curl_setopt_array($ch, $options);

        // Выполнение запроса
        $response = curl_exec($ch);

        // Проверка ошибок
        if (curl_errno($ch)) {
            throw new Exception('Ошибка cURL: ' . curl_error($ch));
        }

        // Проверка HTTP-кода
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        if ($httpCode >= 400) {
            throw new Exception("HTTP ошибка: $httpCode");
        }

        curl_close($ch);

        // Пытаемся декодировать JSON
        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("Невалидный JSON в ответе: " . json_last_error_msg());
        }

        // Возвращаем успешный ответ
        echo json_encode([
            'success' => true,
            'data' => $decoded
        ], JSON_UNESCAPED_UNICODE);

    } catch (Exception $e) {
        // Возвращаем ошибку
        echo json_encode([
            'success' => false,
            'error' => $e->getMessage(),
            'response' => $response ?? null,
            'http_code' => $httpCode ?? null
        ], JSON_UNESCAPED_UNICODE);
    }
    ?>