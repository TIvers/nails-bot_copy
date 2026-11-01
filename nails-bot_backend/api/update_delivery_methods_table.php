<?php

require_once __DIR__.'/../api_bitrix/CatalogBitrixRestApiClient.php';
require_once 'DatabaseClient.php';
require_once 'db_queries.php';

$apiClient = new CatalogBitrixRestApiClient();
$dbClient = new DatabaseClient();

$shipments = $apiClient -> sale_delivery_list();

print_r($shipments);