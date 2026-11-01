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

$dbClient = new DatabaseClient();

$flatData = get_delivery_tree($dbClient);
$result = buildTree($flatData['data']);


header('Content-Type: application/json; charset=utf-8');
echo json_encode($result, JSON_UNESCAPED_UNICODE);
function buildTree(array $flatData, $parentId = null, array &$visited = []): array {
    $branch = [];

    foreach ($flatData as $item) {
        if ($item['parent_id'] === $parentId) {
            // Защита от зацикливания: не обрабатываем уже добавленные ID
            if (in_array($item['bitrix_id'], $visited, true)) {
                continue;
            }

            $visited[] = $item['bitrix_id'];

            $children = buildTree($flatData, $item['bitrix_id'], $visited);
            if ($children) {
                $item['children'] = $children;
            }

            $branch[] = $item;
        }
    }

    return $branch;
}

