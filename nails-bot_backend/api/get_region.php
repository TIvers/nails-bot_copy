<?php
require_once __DIR__.'/../api/DatabaseClient.php';
require_once 'cors.php';

$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    $data = $_POST;
}
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

$dbClient = new DatabaseClient();

$search=$data['search'];

$query = "
    SELECT name, region
    FROM cities
    WHERE LOWER(name) LIKE LOWER(:search)
    ORDER BY name
    LIMIT 7;
";

$params = array(
    'search' => "%$search%"
);

$result = $dbClient->psqlQuery($query, $params);

// Возвращаем результат в JSON
header('Content-Type: application/json');
echo json_encode($result);
