<?php

class CatalogBitrixRestApiClient {
    private $apiUrl;
    private $defaultHeaders;
    function __construct() {
        $apiUrl = getenv('BITRIX_REST_URL');
        if ($apiUrl === false || $apiUrl === '') {
            throw new RuntimeException('Missing required setting: BITRIX_REST_URL');
        }
        $this->apiUrl = rtrim($apiUrl, '/') . '/';
        $this->defaultHeaders = [
            'Content-Type: application/json',
        ];
    }

    function makeRequest($endpoint, $data = [], $method = 'POST') {
        $curl = curl_init();
        $options = [
            CURLOPT_URL => $this->apiUrl . $endpoint,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_HTTPHEADER => $this->defaultHeaders,
            CURLOPT_CUSTOMREQUEST => $method,
        ];

        if ($method === 'POST' && !empty($data)) {
            $options[CURLOPT_POSTFIELDS] = json_encode($data);
        }

        curl_setopt_array($curl, $options);

        $response = curl_exec($curl);
        $error = curl_error($curl);
        $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

        curl_close($curl);

        if ($error) {
            throw new Exception("CURL Error: " . $error);
        }
        $decodedResponse = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception("JSON decode error: " . json_last_error_msg());
        }
//        if ($httpCode >= 400) {
//            throw new Exception("API request failed with HTTP code $httpCode", $httpCode);
//        }
        return $decodedResponse;
    }

    function getCatalogProducts($iblockId, $iblockSectionId, $select = ['id', 'iblockId', 'name','detailText','purchasingPrice','xmlId','active','sort']) {
        $queryData = [
            'filter' => array(
                'iblockId' => $iblockId,
                'iblockSectionId' => $iblockSectionId,
                'active' => 'Y',
            ),
            'select' => $select
        ];
        try {
            $response = $this->makeRequest('catalog.product.list', $queryData);
            return $response['result']['products'] ?? [];
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            return [];
        }
    }

    function getCatalogProduct($productId, $select = []) {
        $queryData = [
            'id' => $productId,
            'select' => $select
        ];
        try {
            $response = $this->makeRequest('catalog.product.get', $queryData);
            return $response['result']['product'] ?? [];
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            return [];
        }
    }

    function getCatalogSections($iblock_id, $select = ['id', 'name']) {
        $queryData = array(
            'filter' => array(
                'iblock_id' => $iblock_id
            ),
            'select' => $select,
        );
        try {
            $response = $this->makeRequest('catalog.section.list', $queryData);
            return $response['result']['sections'] ?? [];
//            return $response;
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            return [];
        }
    }
    function getCatalogSection($sectionId, $select = ['id', 'name']) {
        $queryData = array(
            'id' => $sectionId,
            'select' => $select,
        );
        try {
            $response = $this->makeRequest('catalog.section.get', $queryData);
            return $response['result']['section'] ?? [];
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            return [];
        }
    }
    function getSectionsTree($iblock_id, $parentSectionId = null) {
        $queryData = [
            'filter' => array(
                'iblock_id' => $iblock_id,
                'iblockSectionId' => $parentSectionId,
                'active' => 'Y',
            ),
            'select' => ['id', 'name','code','active','sort'],
        ];
        try {
            $response = $this->makeRequest('catalog.section.list', $queryData);
            $sections = $response['result']['sections'] ?? [];
            foreach ($sections as &$section) {
                $childSections = $this->getSectionsTree($iblock_id, $section['id']);
                $section['is_last_level_depth'] = empty($childSections);
                $section['children'] = $childSections;
            }
            return $sections;
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage() . ', parentSectionId: ' . $parentSectionId . ' iblock_id: ' . $iblock_id);
            return [];
        }
    }

    function getProductImage($productId, $select = ['id', 'type', 'detailUrl']){
        $queryData = [
            'productId' => $productId,
            'select' => $select,
        ];
        try {
            $response = $this->makeRequest('catalog.productImage.list', $queryData);
            $images = $response['result']['productImages'] ?? [];
            return $images;
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            return [];
        }
    }
    function getProductPrice($productId){
        $queryData = array(
            'select' => array('id'),
            'filter' => array('productId' => $productId),
            'order' => array('id' => 'ASC'),
        );
        try {
            $response = $this->makeRequest('catalog.price.list', $queryData);
            $prices = $response['result']['prices'] ?? [];
            $priceList = [];
            foreach ($prices as $price) {
                $queryData = array(
                    'id' => $price['id'],
                );
                $result = $this->makeRequest('catalog.price.get', $queryData)['result']['price'];

                $number = $result['catalogGroupId']; // Здесь можно изменить значение переменной (1, 2, 3 или 4)
                $catalogGroupName = '';

                switch ($number) {
                    case 1:
                        $catalogGroupName = 'BASE_PRICE';
                        break;
                    case 2:
                        $catalogGroupName = 'OPT_PRICE';
                        break;
                    case 3:
                        $catalogGroupName = 'MASTER_PRICE';
                        break;
                    case 4:
                        $catalogGroupName = 'ROZNICA/MASTER_PRICE';
                        break;
                    default:
                        $catalogGroupName = 'nonePrice';
                        break;
                }
                $priceList[$catalogGroupName] = $result['price'];
            }
            $requiredKeys = [
                'BASE_PRICE',
                'OPT_PRICE',
                'MASTER_PRICE',
                'ROZNICA/MASTER_PRICE'
            ];

            foreach ($requiredKeys as $key) {
                if (!array_key_exists($key, $priceList)) {
                    $priceList[$key] = null;
                }
            }
            return $priceList ?? [];
        } catch (Exception $e) {
            error_log('API Error: ' . $e->getMessage());
            return [];
        }
    }
    function getPriceType(){
        $queryData = array(
            'select' => array('id', 'name'),
        );
        $response = $this->makeRequest('catalog.priceType.list', $queryData);
        $priceTypes = $response['result'] ?? [];
        return $priceTypes;
    }

    function sale_paysystem_list(){
        $queryData = array(
        );
        $response = $this->makeRequest('sale.paysystem.list', $queryData);
        $priceTypes = $response['result'] ?? [];
        return $priceTypes;
    }
    function sale_order_add($price){
        $queryData = array(
            'fields' => array(
                'lid' => 's1',
                'personTypeId' => 1,
                'currency' => 'RUB',
                'price' => $price,
                'userId' => 13701,
            )
        );
        $response = $this->makeRequest('sale.order.add', $queryData);
        return $response['result'] ?? [];
    }
    function sale_delivery_list(){
        $queryData = array(
            'filter' => array(
                'ACTIVE' => 'Y',
            ),
        );
        $response = $this->makeRequest('sale.delivery.getlist', $queryData);
        return $response['result'] ?? [];
    }
    function sale_shipments_list_by_order_id($orderId)
    {
        $queryData = array(
            'filter' => array(
                'orderId' => $orderId,
            ),
            "select" => array(
                'deliveryId',
                'deliveryName',
            ),
        );
        $response = $this->makeRequest('sale.shipment.list', $queryData);
        return $response['result'] ?? [];
    }
    function sale_basketitem_add($orderId,$productid,$quantity,$price,$name){
        $queryData = array(
            'fields' => array(
                'orderId' => $orderId,
                'productId' => $productid,
                'currency' => 'RUB',
                'customPrice' => 'N',
                'quantity' => $quantity,
                'basePrice' => $price,
                'name' => $name,
            ),
        );
        $response = $this->makeRequest('sale.basketitem.addCatalogProduct', $queryData);
        return $response ?? [];
    }
    function sale_payment_add($orderId,$paySystemId){
        $queryData = array(
            'fields' => array(
                'orderId' => $orderId,
                'paySystemId' => $paySystemId,
                'paid' => 'N',
            ),
        );
        $response = $this->makeRequest('sale.payment.add', $queryData);
        return $response['result'] ?? [];
    }
    function sale_propertyvalue_get_delivery_location($orderId){
        $queryData = array(
            'filter' => array(
                "orderId" => $orderId,
            )
        );
        $response = $this->makeRequest('sale.propertyvalue.list', $queryData);
        return $response['result'] ?? [];
    }
    function sale_propertyvalue_modify_delivery_location($orderId,$location,$index,$street,$home,$flat)
    {
        $queryData = array(
            'fields' => array(
                'order' => array(
                    'id' => $orderId,
                    "propertyValues" => array(
                        array(
                            "orderPropsId" => 6,
                            "value" => $location,
                        ),
                        array(
                            "orderPropsId" => 4,
                            "value" => $index,
                        ),
                        array(
                            "orderPropsId" => 29,
                            "value" => $street,
                        ),
                        array(
                            "orderPropsId" => 27,
                            "value" => $home,
                        ),
                        array(
                            "orderPropsId" => 28,
                            "value" => $flat,
                        ),
                    ),
                ),
            ),
        );
        $response = $this->makeRequest('sale.propertyvalue.modify', $queryData);
        return $response ?? [];
    }
    function sale_propertyvalue_modify_personal_info($orderId,$fio,$phone,$email,$city)
    {
        $queryData = array(
            'fields' => array(
                'order' => array(
                    'id' => $orderId,
                    "propertyValues" => array(
                        array(
                            "orderPropsId" => 1,
                            "value" => $fio,
                        ),
                        array(
                            "orderPropsId" => 2,
                            "value" => $email,
                        ),
                        array(
                            "orderPropsId" => 3,
                            "value" => $phone,
                        ),
                        array(
                            "orderPropsId" => 5,
                            "value" => $city,
                        ),
                    ),
                ),
            ),
        );
        $response = $this->makeRequest('sale.propertyvalue.modify', $queryData);
        return $response ?? [];
    }
    function sale_propertyvalue_modify_personal_and_delivery($orderId,$fio,$phone,$email,$city,$location,$index,$street,$home,$flat)
    {
        $queryData = array(
            'fields' => array(
                'order' => array(
                    'id' => $orderId,
                    "propertyValues" => array(
                        array(
                            "orderPropsId" => 1,
                            "value" => $fio,
                        ),
                        array(
                            "orderPropsId" => 2,
                            "value" => $email,
                        ),
                        array(
                            "orderPropsId" => 3,
                            "value" => $phone,
                        ),
                        array(
                            "orderPropsId" => 5,
                            "value" => $city,
                        ),
                        array(
                            "orderPropsId" => 6,
                            "value" => $location,
                        ),
                        array(
                            "orderPropsId" => 4,
                            "value" => $index,
                        ),
                        array(
                            "orderPropsId" => 29,
                            "value" => $street,
                        ),
                        array(
                            "orderPropsId" => 27,
                            "value" => $home,
                        ),
                        array(
                            "orderPropsId" => 28,
                            "value" => $flat,
                        ),
                    ),
                ),
            ),
        );
        $response = $this->makeRequest('sale.propertyvalue.modify', $queryData);
        return $response ?? [];
    }
    function sale_shipment_add($orderId,$deliveryId)
    {
        $queryData = array(
            'fields' => array(
                'orderId' => $orderId,
                'allowDelivery' => 'N',
                'deducted' => 'N',
                'deliveryId' => $deliveryId,
            ),
        );
        $response = $this->makeRequest('sale.shipment.add', $queryData);
        return $response['result'] ?? [];
    }
    function sale_shipmentitem_add($orderId){
        $queryData = array(
            'id' => $orderId,
        );
        $response = $this->makeRequest('sale.order.get', $queryData);
        $orderDeliveryId = $response['result']['order']['shipments'][0]['id'];
        $basketitems = $response['result']['order']['basketItems'];
        foreach($basketitems as $basketitem){
            $reservations = $basketitem['reservations'];
            foreach ($reservations as $reservation){
                $basketId = $reservation['basketId'];
                $quantity = $reservation['quantity'];
                $fields = array(
                    "orderDeliveryId" => $orderDeliveryId,
                    "basketId" => $basketId,
                    "quantity" => $quantity,
                );
                $queryData = array(
                    'fields' => $fields,
                );
                $response = $this->makeRequest('sale.shipmentitem.add', $queryData);
            }
        }
        return $response['result'] ?? [];
    }

    function sale_order_list($filter){
        $queryData = array(
            'filter' => $filter,
        );
        $response = $this->makeRequest('sale.propertyvalue.list', $queryData);
        return $response['result'] ?? [];
    }
    function sale_payment_update_paid($paymentId,$sum)
    {
        $queryData = array(
            'id' => $paymentId,
            'fields' => array(
                'paySystemId' => 24,
                'paid' => 'Y',
                'sum' => $sum,
            )
        );
        $response = $this->makeRequest('sale.payment.update', $queryData);
        return $response ?? [];
    }
    function sale_payment_list_by_orderId($orderId){
        $queryData = array(
            'select' => array(
                'id'
            ),
            'filter' => array(
                'orderId' => $orderId,
            ),
        );
        $response = $this->makeRequest('sale.payment.list', $queryData);
        return $response['result']['payments'][0]['id'] ?? [];
    }

    function sale_propertyvalue_list($select,$filter)
    {
        $queryData = array(
            'select' => $select,
            'filter' => $filter,
        );
        $response = $this->makeRequest('sale.propertyvalue.list', $queryData);
        return $response['result'] ?? [];
    }

}
?>
