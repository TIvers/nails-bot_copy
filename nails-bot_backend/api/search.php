<?php
require_once 'DatabaseClient.php';
require_once 'db_queries.php';
require_once 'cors.php';

$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    $data = $_POST;
}
header('Content-Type: application/json');

$data = json_decode(file_get_contents('php://input'), true);

 if (!isset($data['search'], $data['type'])) {
     http_response_code(400);
     echo json_encode(['error' => 'Missing search or type parameter']);
     exit;
 }

$type = $data['type'];
$search = $data['search'];

$dbClient = new DatabaseClient();

switch ($type) {
    case 'product_list':
        $result = seachProduct($search,$dbClient);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type']);
        exit;
}

echo json_encode(['data' => $result], JSON_UNESCAPED_UNICODE);

