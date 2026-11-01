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

// if (!isset($data['type'], $data['id'])) {
//     http_response_code(400);
//     echo json_encode(['error' => 'Missing type or id']);
//     exit;
// }

$type = $data['type'];
$id = $data['id'];

$dbClient = new DatabaseClient();

switch ($type) {
    case 'category':
        $result = get_by_id_parent($id,$dbClient);
        break;

    case 'item':
        $result = get_by_id_product($id,$dbClient);
        break;
    case 'catalog':
        if ($id == "NULL"){
            $data = get_catalog($dbClient)['data'];
            $result = buildTree($data);
            break;
        }
        else{
            echo 'id must be null';
            break;
        }
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type']);
        exit;
}

echo json_encode(['data' => $result], JSON_UNESCAPED_UNICODE);

function buildTree(array $flatData, $parentId = null): array {
    $branch = [];
    foreach ($flatData as $item) {
        if ($item['id_parent'] === $parentId) {
            $children = buildTree($flatData, $item['id_section']);
            if (!empty($children)) {
                $item['children'] = $children;
            }
            $branch[] = $item;
        }
    }

    return $branch;
}

?>