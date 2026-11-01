<?php
require_once 'DatabaseClient.php';
require_once 'cors.php';

$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    $data = $_POST;
}
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);
// Подключение к базе данных
$dbClient = new DatabaseClient();
$params = [];

// Запрос к базе данных
$query = "SELECT * FROM payment_methods WHERE active = 'Y';";
$result = $dbClient->psqlQuery($query, $params);
header('Content-Type: application/json; charset=utf-8');
echo json_encode($result, JSON_UNESCAPED_UNICODE);
?>