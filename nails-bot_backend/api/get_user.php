<?php
include 'cors.php';
include 'db.php';
header('Content-Type: application/json');

// Получаем данные POST-запроса
$json = file_get_contents('php://input');
$data = json_decode($json, true);

if ($data && isset($data['id_tg'])) {
    $userId = $data['id_tg'];
    $username = isset($data['username']) ? $data['username'] : '';

    try {
        // Подключение к базе данных
        $pdo = getDbConnection();

        // Проверка наличия пользователя в базе данных
        $stmt = $pdo->prepare("SELECT * FROM users WHERE id_tg = :userId");
        $stmt->bindParam(':userId', $userId);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($user) {
            // Если передан username и он не пустой, обновляем его
            if (!empty($username)) {
                $updateStmt = $pdo->prepare("UPDATE users SET username = :username WHERE id_tg = :userId");
                $updateStmt->bindParam(':username', $username);
                $updateStmt->bindParam(':userId', $userId);
                $updateStmt->execute();
                $user['username'] = $username; // Обновляем локально для ответа
            }

            // Пользователь найден, возвращаем его данные
            $response = [
                'success' => true,
                'user' => [
                    'id_tg' => $user['id_tg'],
                    'username' => $user['username'],
                    'admin' => $user['admin']
                ],
                'message' => 'User found'
            ];
        } else {
            $admin = false;
            // Пользователь не найден, создаём нового
            $insertStmt = $pdo->prepare("INSERT INTO users (id_tg, username, admin) VALUES (:userId, :username, :admin)");
            $insertStmt->bindParam(':userId', $userId);
            $insertStmt->bindParam(':username', $username);
            $insertStmt->bindParam(':admin', $admin, PDO::PARAM_BOOL);
            $insertStmt->execute();

            // Получаем данные нового пользователя
            $newUserStmt = $pdo->prepare("SELECT * FROM users WHERE id_tg = :userId");
            $newUserStmt->bindParam(':userId', $userId);
            $newUserStmt->execute();
            $newUser = $newUserStmt->fetch(PDO::FETCH_ASSOC);

            // Возвращаем успешный ответ с информацией о новом пользователе
            $response = [
                'success' => true,
                'user' => [
                    'id_tg' => $newUser['id_tg'],
                    'username' => $newUser['username'],
                    'admin' => $newUser['admin']
                ],
                'message' => 'User created successfully'
            ];
        }

        echo json_encode($response);
    } catch (PDOException $e) {
        // Обработка ошибок базы данных
        $response = [
            'success' => false,
            'message' => 'Database error: ' . $e->getMessage()
        ];
        echo json_encode($response);
    }
} else {
    // Ошибка, если не указаны id_tg
    $response = [
        'success' => false,
        'message' => 'Missing id_tg'
    ];
    echo json_encode($response);
}
?>
