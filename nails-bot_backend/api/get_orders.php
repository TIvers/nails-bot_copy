<?php

require_once 'DatabaseClient.php';
require_once __DIR__.'/../api_bitrix/CatalogBitrixRestApiClient.php';
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
$apiClient = new CatalogBitrixRestApiClient();
if($data['method'] == 'user'){
    $requiredFields = [
        'id_tg_user' => 'Не указан телеграмм id пользователя (id_tg_user)',
    ];

    foreach ($requiredFields as $field => $errorMessage) {
        if (!isset($data[$field])) {
            http_response_code(400);
            echo json_encode(['error' => $errorMessage]);
            exit;
        }
    }
    $query = "SELECT 
    o.id AS order_id,
    o.id_tg_user,
    o.fio,
    o.id_bitrix,
    o.payment_id,
    o.paid,
    o.date AS time,
    COUNT(otp.id_product) AS products_count,
    SUM(cp.base_price * otp.quantity) AS total_price,
    JSON_AGG(
        JSON_BUILD_OBJECT(
            'id', cp.id,
            'name', cp.name,
            'roznica_master_price', cp.roznica_master_price,
            'quantity', otp.quantity,
            'pay_method', o.paid
        )
    ) AS products
FROM 
    orders o
JOIN 
    orders_to_products otp ON o.id = otp.id_order
JOIN 
    catalog_products cp ON otp.id_product = cp.id_product
WHERE 
    o.id_tg_user = :id_tg_user
    AND (o.paid = 'Y' OR o.paid = 'D')
    AND o.payment_id IS NOT NULL 
GROUP BY 
    o.id, o.id_tg_user, o.fio, o.id_bitrix, o.date, o.payment_id
ORDER BY 
    o.date DESC;";
    $params = array(
        ":id_tg_user" => $data['id_tg_user'],
    );
    $result = $dbClient -> psqlQuery($query, $params);
    echo json_encode(['data' => $result['data']], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}
elseif ($data['method'] == 'admin'){
    $propertyValues_code_array = array(
        'HOME'=>'home',
        'ROOM'=>'flat',
        'STREET'=>'street',
        'LOCATION'=>'location',
        "CITY"=>'city',
        "ZIP"=>'index'
    );
    $query = "SELECT 
        o.id AS order_id,
        o.id_tg_user,
        o.fio,
        o.id_bitrix,
        o.paid,
        o.date AS time,
        o.payment_id,
        COUNT(otp.id_product) AS products_count,
        SUM(cp.base_price * otp.quantity) AS total_price,
        JSON_AGG(
            JSON_BUILD_OBJECT(
                'id', cp.id,
                'name', cp.name,
                'roznica_master_price', cp.roznica_master_price,
                'quantity', otp.quantity,
                'pay_method', o.paid
            )
        ) AS products
    FROM 
        orders o
    JOIN 
        orders_to_products otp ON o.id = otp.id_order
    JOIN 
        catalog_products cp ON otp.id_product = cp.id_product
    WHERE 
        (o.paid = 'Y' OR o.paid = 'D')
        AND o.payment_id IS NOT NULL 
    GROUP BY 
        o.id, o.id_tg_user, o.fio, o.id_bitrix, o.date, o.payment_id
    ORDER BY 
        o.date DESC;";
    $params = array(
    );
    $db_result = $dbClient -> psqlQuery($query, $params);
    $iter = 0;
    foreach ($db_result["data"] as $response_data) {
        $order_id = $response_data["id_bitrix"];
        $shipments = $apiClient -> sale_shipments_list_by_order_id($order_id);
        $propertyValues = $apiClient ->sale_propertyvalue_get_delivery_location($order_id)['propertyValues'];
        if ($shipments["shipments"][0]) {
            $db_result["data"][$iter] = array_merge($db_result["data"][$iter],$shipments["shipments"][0]);
        }
        foreach ($propertyValues as $propertyValue){
            if (array_key_exists($propertyValue['code'],$propertyValues_code_array) and $propertyValue['value'] != null){
                $db_result["data"][$iter][$propertyValues_code_array[$propertyValue['code']]] = $propertyValue['value'];
            }
        }
        $iter+=1;
    }
    $result = $db_result;
    echo json_encode(['data' => $db_result["data"]], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
}