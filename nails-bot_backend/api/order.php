<?php
require_once __DIR__.'/../api_bitrix/CatalogBitrixRestApiClient.php';
require_once __DIR__.'/../api/DatabaseClient.php';
require_once 'cors.php';

ini_set('error_log', '/var/www/nails-bot/logs/bitrix.log');

$contentType = $_SERVER["CONTENT_TYPE"] ?? '';
if (strpos($contentType, 'application/json') !== false) {
    $data = json_decode(file_get_contents('php://input'), true);
} else {
    $data = $_POST;
}
header('Content-Type: application/json');

$requiredFields = [
    'type' => 'Не указан тип (type)',
    'products' => "Не указаны продукты заказов",
    'price' => 'Не указана цена (price)',
    'paySystemId' => 'Не указана платежная система (paySystemId)',
    'deliveryId' => 'Не указана система выдачи заказа (deliveryId)',
    'fio' => 'Не указано имя заказчика (fio)',
    'phone' => 'Не указан телефон заказчика (phone)',
    'email' => 'Не указан email заказчика  (email)',
    'city' => 'Не указан город заказчика (city)',
    'id_tg_user' => 'Не указан телеграмм id пользователя (id_tg_user)',
];
foreach ($requiredFields as $field => $errorMessage) {
    if (!isset($data[$field])) {
        http_response_code(400);
        echo json_encode(['error' => $errorMessage]);
        exit;
    }
}
$requiredFields = [
    0 => 'location',
    1 => 'index',
    2 => 'street',
    3 => 'home',
    4 => 'flat'];

foreach ($requiredFields as $key => $field) {
    if (!isset($data[$field])) {
        $data[$field] = "не указан";
    }
}
$location = 'Россия, Сибирь, '.$data['location'].', '.$data['city'];

$apiClient = new CatalogBitrixRestApiClient();
$dbClient = new DatabaseClient();

switch ($data['type']) {
    case 'new_order_and_delivery':
        $result = add_order_and_delivery($apiClient,$data['products'],$data['price'],$data['paySystemId'],$data['fio'],$data['phone'],$data['email'],$data['city'],$location,$data['index'],$data['street'],$data['home'],$data['flat'],$data['deliveryId']);
        $id_bitrix = $result['order_id'];
        add_order_to_db($dbClient,$id_bitrix,$data['fio'],$data['id_tg_user'],$data['products']);
        break;
    case 'new_order':
        $result = add_order($apiClient,$data['products'],$data['price'],$data['paySystemId'],$data['fio'],$data['phone'],$data['email'],$data['city'],$data['deliveryId']);
        $id_bitrix = $result['order_id'];
        add_order_to_db($dbClient,$id_bitrix,$data['fio'],$data['id_tg_user'],$data['products']);
        break;
    default:
        http_response_code(400);
        echo json_encode(['error' => 'Invalid type']);
        exit;
}
echo json_encode(['data' => $result], JSON_UNESCAPED_UNICODE);
function add_order($apiClient,$products,$price,$paySystemId,$fio,$phone,$email,$city,$deliveryId){
    $result = $apiClient -> sale_order_add($price);
    $orderId = $result['order']['id'];

    foreach ($products as $product) {
        if (isset($product['productId']) and isset($product['quantity']) and isset($product['price']) and isset($product['name'])){
            $productId = $product['productId'];
            $quantity = $product['quantity'];
            $price = $product['price'];
            $name = $product['name'];
            $result1 = $apiClient -> sale_basketitem_add($result['order']['id'],$productId,$quantity,$price,$name);
            if (isset($result1['error'])){
                $result = "Ошибка в добавлении продукта к заказу: " . $result1['error'];
                break;
            }
        }
        else{
            http_response_code(400);
            echo json_encode(['error' => 'Ошибка массива products']);
            exit;
        }

    }
    $result2 = $apiClient -> sale_payment_add($result['order']['id'],$paySystemId);
    $result3 = $apiClient -> sale_propertyvalue_modify_personal_info($result['order']['id'],$fio,$phone,$email,$city);
    if (isset($result3['error'])) {
        $errorDescription = $result3['error_description'] ?? 'unknown error';
        error_log('Bitrix property update error (personal): ' . $errorDescription);
    }
    $result4 = $apiClient -> sale_shipment_add($result['order']['id'],$deliveryId);
    switch (true) {
        case isset($result['error']):
            $result =  "Ошибка в добавлении заказа: " . $result['error'];
            break;
        case isset($result1['error']):
            $result = "Ошибка в добавлении продукта к заказу: " . $result1['error'];
            break;
        case isset($result2['error']):
            $result = "Ошибка в добавлении оплаты: " . $result2['error'];
            break;
        case isset($result3['error']):
            $result = "Ошибка в добавлении данных пользователя: " . $result3['error'];
            break;
        case isset($result4['error']):
            $result = "Ошибка в добавлении данных системы выдачи: " . $result4['error'];
            break;
        default:
            $result = "success";
            break;
    }
    return array('order_id' => $orderId,'result' => $result);
}
function add_order_and_delivery($apiClient,$products,$price,$paySystemId,$fio,$phone,$email,$city,$location,$index,$street,$home,$flat,$deliveryId){
    $result = $apiClient -> sale_order_add($price);
    $orderId = $result['order']['id'];
    foreach ($products as $product) {
        if (isset($product['productId']) and isset($product['quantity']) and isset($product['price']) and isset($product['name'])){
            $productId = $product['productId'];
            $quantity = $product['quantity'];
            $price = $product['price'];
            $name = $product['name'];
            $result1 = $apiClient -> sale_basketitem_add($result['order']['id'],$productId,$quantity,$price,$name);
            if (isset($result1['error'])){
                $result = "Ошибка в добавлении продукта к заказу: " . $result1['error'];
                break;
            }
        }
        else{
            http_response_code(400);
            echo json_encode(['error' => 'Ошибка массива products']);
            exit;
        }

    }
    $result2 = $apiClient -> sale_payment_add($result['order']['id'],$paySystemId);
    $result3 = $apiClient -> sale_propertyvalue_modify_personal_and_delivery($result['order']['id'],$fio,$phone,$email,$city,$location,$index,$street,$home,$flat);
    if (isset($result3['error'])) {
        $errorDescription = $result3['error_description'] ?? 'unknown error';
        error_log('Bitrix property update error (personal+delivery): ' . $errorDescription);
    }
    $result4 = $apiClient -> sale_shipment_add($result['order']['id'],$deliveryId);
    switch (true) {
        case isset($result['error']):
            $result =  "Ошибка в добавлении заказа: " . $result['error'];
            break;
        case isset($result2['error']):
            $result = "Ошибка в добавлении оплаты: " . $result2['error'];
            break;
        case isset($result3['error']):
            $result = "Ошибка в добавлении данных пользователя и доставки: " . $result3['error'];
            break;
        case isset($result4['error']):
            $result = "Ошибка в добавлении системы выдачи: " . $result4['error'];
            break;
        default:
            $result = "success";
            break;
    }
    return array('order_id' => $orderId,'result' => $result);
}
function add_order_to_db($dbClient,$id_bitrix,$fio,$id_tg_user,$products){
    $params = array(
        ':id_bitrix' => $id_bitrix,
        ':id_tg_user' => $id_tg_user,
        ':fio' => $fio,
    );
    $query = "INSERT INTO orders (id_bitrix, fio, id_tg_user)
    VALUES (:id_bitrix, :fio, :id_tg_user);";

    $result = $dbClient->psqlQuery($query, $params);
    $id_order = $result['lastInsertId'];
    print_r($id_order);
    foreach ($products as $product) {
        $params = array(
            ':id_order' => $id_order,
            ':id_product' => $product['productId'],
            ':quantity' => $product['quantity'],
        );
        $query = "INSERT INTO orders_to_products (id_order, id_product, quantity)
        VALUES (:id_order, :id_product, :quantity);";
        $result = $dbClient->psqlQuery($query, $params);
    }
    return;
}
?>
