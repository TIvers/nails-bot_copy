<?php

require_once __DIR__.'/../api_bitrix/CatalogBitrixRestApiClient.php';
require_once 'cors.php';

$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    $data = $_POST;
}
$apiClient = new CatalogBitrixRestApiClient();require_once 'DatabaseClient.php';

$product = $apiClient -> getCatalogProduct($data['id_product']);
if ($product['available'] === 'Y' and $product['active'] === 'Y' and $product['quantity'] != null) {
    echo json_encode(['success' => true, 'data' => $data['id_product'],'active' => 'Y','quantity' => $product['quantity']]);
}
else {
    echo json_encode(['success' => true, 'data' => $product,'active' => 'N']);
}

?>